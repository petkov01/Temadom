"""Stripe payment routes for TemaDom subscriptions"""
from fastapi import APIRouter, Depends, Request, HTTPException
from datetime import datetime, timezone
import uuid
import os

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
)
from config import db, get_current_user, STRIPE_API_KEY

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Subscription plans — amounts defined server-side only for security
SUBSCRIPTION_PACKAGES = {
    "basic_1": {"amount": 15.00, "currency": "eur", "name": "БАЗОВ — 1 месец", "months": 1},
    "basic_3": {"amount": 39.00, "currency": "eur", "name": "БАЗОВ — 3 месеца", "months": 3},
    "basic_6": {"amount": 69.00, "currency": "eur", "name": "БАЗОВ — 6 месеца", "months": 6},
    "basic_12": {"amount": 119.00, "currency": "eur", "name": "БАЗОВ — 12 месеца", "months": 12},
    "pro_1": {"amount": 35.00, "currency": "eur", "name": "ПРО — 1 месец", "months": 1},
    "pro_3": {"amount": 89.00, "currency": "eur", "name": "ПРО — 3 месеца", "months": 3},
    "pro_6": {"amount": 159.00, "currency": "eur", "name": "ПРО — 6 месеца", "months": 6},
    "pro_12": {"amount": 269.00, "currency": "eur", "name": "ПРО — 12 месеца", "months": 12},
    "premium_1": {"amount": 75.00, "currency": "eur", "name": "PREMIUM — 1 месец", "months": 1},
    "premium_3": {"amount": 189.00, "currency": "eur", "name": "PREMIUM — 3 месеца", "months": 3},
    "premium_6": {"amount": 339.00, "currency": "eur", "name": "PREMIUM — 6 месеца", "months": 6},
    "premium_12": {"amount": 569.00, "currency": "eur", "name": "PREMIUM — 12 месеца", "months": 12},
    "design_1room": {"amount": 69.00, "currency": "eur", "name": "3D Дизайн — 1 стая", "months": 0},
    "design_2room": {"amount": 129.00, "currency": "eur", "name": "3D Дизайн — 2 стаи", "months": 0},
    "design_5room": {"amount": 199.00, "currency": "eur", "name": "3D Дизайн — 5 стаи", "months": 0},
}


@router.get("/packages")
async def list_packages():
    """List available payment packages (public)"""
    return {"packages": {k: {"name": v["name"], "amount": v["amount"], "currency": v["currency"], "months": v["months"]} for k, v in SUBSCRIPTION_PACKAGES.items()}}


@router.post("/checkout")
async def create_checkout(request: Request, user: dict = Depends(get_current_user)):
    """Create Stripe checkout session"""
    data = await request.json()
    package_id = data.get("package_id", "")
    origin_url = data.get("origin_url", "")

    if package_id not in SUBSCRIPTION_PACKAGES:
        raise HTTPException(status_code=400, detail="Невалиден пакет")
    if not origin_url:
        raise HTTPException(status_code=400, detail="Липсва origin_url")

    pkg = SUBSCRIPTION_PACKAGES[package_id]
    success_url = f"{origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/profile"

    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    checkout_req = CheckoutSessionRequest(
        amount=pkg["amount"],
        currency=pkg["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "user_email": user.get("email", ""),
            "package_id": package_id,
            "package_name": pkg["name"],
            "months": str(pkg["months"]),
        }
    )

    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_req)

    # Create payment transaction record BEFORE redirect
    tx = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": user["id"],
        "user_email": user.get("email", ""),
        "package_id": package_id,
        "package_name": pkg["name"],
        "amount": pkg["amount"],
        "currency": pkg["currency"],
        "months": pkg["months"],
        "payment_status": "pending",
        "status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_transactions.insert_one(tx)

    return {"url": session.url, "session_id": session.session_id}


@router.get("/checkout/status/{session_id}")
async def check_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Poll checkout session status"""
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)

    # Update payment transaction
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if tx and tx.get("payment_status") != "paid":
        update = {"payment_status": status.payment_status, "status": status.status}
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update}
        )

        # If paid, activate subscription
        if status.payment_status == "paid":
            months = int(tx.get("months", 0))
            if months > 0:
                from datetime import timedelta
                await db.users.update_one(
                    {"id": tx["user_id"]},
                    {"$set": {
                        "subscription_active": True,
                        "subscription_plan": tx["package_id"],
                        "subscription_start": datetime.now(timezone.utc).isoformat(),
                        "subscription_end": (datetime.now(timezone.utc) + timedelta(days=months * 30)).isoformat(),
                    }}
                )

    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
    }


@router.get("/history")
async def payment_history(user: dict = Depends(get_current_user)):
    """Get user payment history"""
    txs = await db.payment_transactions.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    return {"transactions": txs}
