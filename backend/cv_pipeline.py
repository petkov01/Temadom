"""
CV/OCR Pipeline for AI Sketch
Converts hand-drawn sketches into 3D geometry using OpenCV + Tesseract.
"""

import cv2
import numpy as np
import pytesseract
import base64
import io
import re
import trimesh
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)


def decode_base64_image(b64_str: str) -> np.ndarray:
    """Decode base64 string to OpenCV image."""
    img_bytes = base64.b64decode(b64_str)
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img


def preprocess_image(img: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Step 1: Preprocess - normalize, denoise, edge detection."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray, h=15)

    # Adaptive threshold for line extraction
    binary = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 11, 2
    )

    # Morphological close to connect broken lines
    kernel = np.ones((3, 3), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)

    # Canny edges for finer detail
    edges = cv2.Canny(denoised, 50, 150, apertureSize=3)

    return binary, edges


def detect_lines(binary: np.ndarray, edges: np.ndarray, img_shape: tuple) -> List[Dict]:
    """Step 2: Detect structural lines using HoughLinesP."""
    h, w = img_shape[:2]
    min_line_length = max(30, int(min(h, w) * 0.05))
    max_line_gap = max(10, int(min(h, w) * 0.02))

    # Detect on both binary and edges, merge results
    lines_binary = cv2.HoughLinesP(
        binary, 1, np.pi / 180, threshold=50,
        minLineLength=min_line_length, maxLineGap=max_line_gap
    )
    lines_edges = cv2.HoughLinesP(
        edges, 1, np.pi / 180, threshold=40,
        minLineLength=min_line_length, maxLineGap=max_line_gap
    )

    raw_lines = []
    for source in [lines_binary, lines_edges]:
        if source is not None:
            for line in source:
                x1, y1, x2, y2 = line[0]
                raw_lines.append((x1, y1, x2, y2))

    # Classify lines as horizontal, vertical, or diagonal
    classified = []
    for x1, y1, x2, y2 in raw_lines:
        length_px = np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        if length_px < min_line_length * 0.5:
            continue

        angle = np.degrees(np.arctan2(abs(y2 - y1), abs(x2 - x1)))

        if angle < 10:
            orientation = "horizontal"
        elif angle > 80:
            orientation = "vertical"
        else:
            orientation = "diagonal"

        classified.append({
            "x1": int(x1), "y1": int(y1),
            "x2": int(x2), "y2": int(y2),
            "length_px": float(length_px),
            "angle": float(angle),
            "orientation": orientation
        })

    # Merge nearby parallel lines (dedup)
    merged = merge_nearby_lines(classified)
    return merged


def merge_nearby_lines(lines: List[Dict], threshold: int = 15) -> List[Dict]:
    """Merge lines that are close and parallel."""
    if not lines:
        return []

    used = [False] * len(lines)
    merged = []

    for i, l1 in enumerate(lines):
        if used[i]:
            continue
        group = [l1]
        used[i] = True

        for j, l2 in enumerate(lines):
            if used[j] or i == j:
                continue
            if l1["orientation"] != l2["orientation"]:
                continue

            # Check proximity
            mid1 = ((l1["x1"] + l1["x2"]) / 2, (l1["y1"] + l1["y2"]) / 2)
            mid2 = ((l2["x1"] + l2["x2"]) / 2, (l2["y1"] + l2["y2"]) / 2)
            dist = np.sqrt((mid1[0] - mid2[0]) ** 2 + (mid1[1] - mid2[1]) ** 2)

            if dist < threshold:
                group.append(l2)
                used[j] = True

        # Take the longest from group
        best = max(group, key=lambda x: x["length_px"])
        merged.append(best)

    return merged


def detect_dimensions_ocr(img: np.ndarray) -> List[Dict]:
    """Step 3: Use Tesseract OCR to detect dimensions on the drawing."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Try multiple configs for best OCR results
    configs = [
        '--oem 3 --psm 11',
        '--oem 3 --psm 6',
    ]

    all_dimensions = []
    seen = set()

    for config in configs:
        try:
            data = pytesseract.image_to_data(
                gray, config=config, output_type=pytesseract.Output.DICT
            )

            for i, text in enumerate(data['text']):
                text = text.strip()
                if not text:
                    continue

                # Match patterns like: 10m, 5.2m, 3,5m, 10м, 2700, 10.5, 4x3
                patterns = [
                    r'(\d+[.,]?\d*)\s*[mмМM]',
                    r'(\d+[.,]?\d*)\s*(?:cm|см|СМ)',
                    r'(\d{3,5})',  # e.g. 2700mm
                    r'(\d+[.,]\d+)',  # decimal numbers
                    r'(\d+)\s*[xXхХ]\s*(\d+)',  # AxB format
                ]

                for pat in patterns:
                    match = re.search(pat, text)
                    if match:
                        raw = match.group(0)
                        if raw in seen:
                            continue
                        seen.add(raw)

                        # Parse the numeric value
                        value = _parse_dimension(match, pat, text)
                        if value and 0.1 < value < 500:
                            conf = int(data['conf'][i]) if data['conf'][i] != '-1' else 0
                            x = data['left'][i]
                            y = data['top'][i]
                            w = data['width'][i]
                            h = data['height'][i]

                            all_dimensions.append({
                                "raw_text": raw,
                                "value_m": round(value, 2),
                                "confidence": conf,
                                "position": {"x": x, "y": y, "w": w, "h": h}
                            })
                        break
        except Exception as e:
            logger.warning(f"OCR config {config} failed: {e}")

    # Sort by confidence
    all_dimensions.sort(key=lambda d: d["confidence"], reverse=True)
    return all_dimensions


def _parse_dimension(match, pattern, text):
    """Parse a numeric dimension value from regex match."""
    try:
        if 'xXхХ' in pattern:
            # AxB format - return the first value
            val = match.group(1).replace(',', '.')
            return float(val)

        val_str = match.group(1).replace(',', '.')
        val = float(val_str)

        if 'cm' in text.lower() or 'см' in text.lower():
            return val / 100.0

        if val > 100:
            # Likely millimeters
            return val / 1000.0

        return val
    except (ValueError, IndexError):
        return None


def vectorize_geometry(
    lines: List[Dict],
    dimensions: List[Dict],
    img_shape: tuple
) -> Dict:
    """Step 4: Convert detected lines + dimensions into structural geometry."""
    h, w = img_shape[:2]

    # Determine scale: use OCR dimensions if available
    scale = _estimate_scale(lines, dimensions, w, h)

    walls = []
    for line in lines:
        if line["orientation"] in ("horizontal", "vertical"):
            length_m = round(line["length_px"] * scale, 2)
            if length_m < 0.3:
                continue

            walls.append({
                "type": "wall",
                "start": [round(line["x1"] * scale, 2), round(line["y1"] * scale, 2)],
                "end": [round(line["x2"] * scale, 2), round(line["y2"] * scale, 2)],
                "length_m": length_m,
                "orientation": line["orientation"],
                "thickness_m": 0.2
            })

    # Detect potential stairs (diagonal lines)
    stairs = []
    for line in lines:
        if line["orientation"] == "diagonal" and line["length_px"] * scale > 1.0:
            stairs.append({
                "type": "stairs",
                "start": [round(line["x1"] * scale, 2), round(line["y1"] * scale, 2)],
                "end": [round(line["x2"] * scale, 2), round(line["y2"] * scale, 2)],
                "length_m": round(line["length_px"] * scale, 2),
                "angle": round(line["angle"], 1)
            })

    # Detect floor slab (bounding box of all walls)
    if walls:
        all_x = []
        all_y = []
        for wall in walls:
            all_x.extend([wall["start"][0], wall["end"][0]])
            all_y.extend([wall["start"][1], wall["end"][1]])

        floor_width = round(max(all_x) - min(all_x), 2)
        floor_depth = round(max(all_y) - min(all_y), 2)
        floor = {
            "type": "slab",
            "width_m": floor_width,
            "depth_m": floor_depth,
            "area_sqm": round(floor_width * floor_depth, 2),
            "origin": [round(min(all_x), 2), round(min(all_y), 2)]
        }
    else:
        floor = None

    # Mark unknowns
    unknowns = []
    for line in lines:
        if line["orientation"] == "diagonal" and line["length_px"] * scale <= 1.0:
            unknowns.append({
                "type": "unknown",
                "description": "Неразпознат елемент (диагонална линия)",
                "position": [round(line["x1"] * scale, 2), round(line["y1"] * scale, 2)]
            })

    return {
        "walls": walls,
        "stairs": stairs,
        "slab": floor,
        "unknowns": unknowns,
        "scale_m_per_px": round(scale, 6),
        "detected_dimensions": [
            {"value_m": d["value_m"], "raw": d["raw_text"], "confidence": d["confidence"]}
            for d in dimensions
        ],
        "image_size_px": {"width": w, "height": h}
    }


def _estimate_scale(lines, dimensions, img_w, img_h):
    """Estimate meters-per-pixel scale from OCR dimensions."""
    if dimensions:
        # Find the longest line and match it to the largest dimension
        longest_line = max(lines, key=lambda ln: ln["length_px"]) if lines else None
        largest_dim = max(dimensions, key=lambda d: d["value_m"])

        if longest_line and largest_dim["value_m"] > 0:
            return largest_dim["value_m"] / longest_line["length_px"]

    # Default: assume the image width represents ~10m
    return 10.0 / max(img_w, img_h)


def generate_glb(geometry: Dict) -> bytes:
    """Step 5: Generate .glb 3D model from vectorized geometry."""
    meshes = []
    wall_height = 2.7  # Default wall height in meters

    # Generate floor slab
    slab = geometry.get("slab")
    if slab:
        origin = slab.get("origin", [0, 0])
        w = slab["width_m"]
        d = slab["depth_m"]

        floor_mesh = trimesh.creation.box(
            extents=[w, 0.15, d],
            transform=trimesh.transformations.translation_matrix([
                origin[0] + w / 2, -0.075, origin[1] + d / 2
            ])
        )
        floor_mesh.visual.face_colors = [200, 200, 200, 255]
        meshes.append(floor_mesh)

    # Generate walls
    for wall in geometry.get("walls", []):
        sx, sy = wall["start"]
        ex, ey = wall["end"]
        length = wall["length_m"]
        thickness = wall.get("thickness_m", 0.2)

        if length < 0.3:
            continue

        # Calculate wall center and rotation
        cx = (sx + ex) / 2
        cy = (sy + ey) / 2
        dx = ex - sx
        dy = ey - sy
        angle = np.arctan2(dy, dx)

        wall_mesh = trimesh.creation.box(
            extents=[length, wall_height, thickness]
        )

        # Rotation around Y axis
        rotation = trimesh.transformations.rotation_matrix(angle, [0, 1, 0])
        translation = trimesh.transformations.translation_matrix([cx, wall_height / 2, cy])
        wall_mesh.apply_transform(rotation)
        wall_mesh.apply_transform(translation)
        wall_mesh.visual.face_colors = [230, 230, 230, 255]
        meshes.append(wall_mesh)

    # Generate stairs
    for stair in geometry.get("stairs", []):
        sx, sy = stair["start"]
        ex, ey = stair["end"]
        length = stair["length_m"]

        num_steps = max(3, int(length / 0.3))
        step_width = 1.0
        step_depth = length / num_steps
        step_height = 0.18

        for i in range(num_steps):
            step_mesh = trimesh.creation.box(
                extents=[step_width, step_height, step_depth]
            )
            t = i / max(1, num_steps - 1)
            px = sx + (ex - sx) * t
            py = sy + (ey - sy) * t
            step_mesh.apply_transform(
                trimesh.transformations.translation_matrix([
                    px, step_height * (i + 0.5), py
                ])
            )
            step_mesh.visual.face_colors = [180, 160, 140, 255]
            meshes.append(step_mesh)

    if not meshes:
        # Create a default placeholder floor
        placeholder = trimesh.creation.box(extents=[5, 0.1, 5])
        placeholder.visual.face_colors = [200, 200, 200, 255]
        meshes.append(placeholder)

    scene = trimesh.Scene(meshes)
    glb_bytes = scene.export(file_type='glb')
    return glb_bytes


def process_sketch(b64_image: str) -> Dict[str, Any]:
    """Full pipeline: image → preprocess → lines → OCR → vectorize → GLB."""
    img = decode_base64_image(b64_image)
    if img is None:
        return {"error": "Could not decode image"}

    h, w = img.shape[:2]

    # Step 1: Preprocess
    binary, edges = preprocess_image(img)

    # Step 2: Detect lines
    lines = detect_lines(binary, edges, img.shape)

    # Step 3: OCR dimensions
    dimensions = detect_dimensions_ocr(img)

    # Step 4: Vectorize
    geometry = vectorize_geometry(lines, dimensions, img.shape)

    # Step 5: Generate GLB
    glb_bytes = generate_glb(geometry)
    glb_b64 = base64.b64encode(glb_bytes).decode('utf-8')

    # Summary
    wall_count = len(geometry["walls"])
    stair_count = len(geometry["stairs"])
    unknown_count = len(geometry["unknowns"])

    summary = {
        "walls_detected": wall_count,
        "stairs_detected": stair_count,
        "unknowns": unknown_count,
        "dimensions_found": len(dimensions),
        "total_lines": len(lines),
    }

    if geometry["slab"]:
        summary["floor_area_sqm"] = geometry["slab"]["area_sqm"]
        summary["floor_width_m"] = geometry["slab"]["width_m"]
        summary["floor_depth_m"] = geometry["slab"]["depth_m"]

    return {
        "geometry": geometry,
        "glb_base64": glb_b64,
        "summary": summary
    }
