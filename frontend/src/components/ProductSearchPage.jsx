import React, { useState, useRef } from 'react';
import { Search, X, ExternalLink, ShoppingCart, Loader2, Camera, Tag, Store,
  Sparkles, Share2, MessageCircle, Phone, Facebook, Copy, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const SITE_URL = process.env.REACT_APP_BACKEND_URL;

const ROOM_TYPES = [
  { id: '', label: 'Без уточнение' },
  { id: 'bathroom', label: 'Баня' },
  { id: 'kitchen', label: 'Кухня' },
  { id: 'bedroom', label: 'Спалня' },
  { id: 'living', label: 'Хол' },
  { id: 'office', label: 'Офис' },
  { id: 'kids', label: 'Детска' },
  { id: 'corridor', label: 'Коридор' },
];

const ProductCard = ({ product }) => (
  <a href={product.url} target="_blank" rel="noopener noreferrer"
    className="block rounded-xl p-4 transition-all hover:scale-[1.02] hover:shadow-lg group"
    style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}
    data-testid={`product-card-${product.name?.slice(0, 20)}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate group-hover:text-[#F97316] transition-colors"
          style={{ color: 'var(--theme-text)' }}>{product.name}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
            style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316' }}>
            <Store className="h-2.5 w-2.5" /> {product.store}
          </span>
          {product.search_query && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px]"
              style={{ background: 'var(--theme-bg-surface)', color: 'var(--theme-text-muted)' }}>
              <Tag className="h-2.5 w-2.5" /> {product.search_query}
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        {product.price_eur > 0 ? (
          <>
            <p className="text-lg font-black text-[#F97316]">{product.price_eur} <span className="text-xs">EUR</span></p>
            {product.price_bgn > 0 && (
              <p className="text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>{product.price_bgn} лв.</p>
            )}
          </>
        ) : (
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Виж цена</p>
        )}
      </div>
    </div>
    <div className="flex items-center gap-1 mt-2 text-[10px] font-medium text-[#F97316] opacity-0 group-hover:opacity-100 transition-opacity">
      <ExternalLink className="h-3 w-3" /> Отвори в магазина
    </div>
  </a>
);

/* Share Results Panel */
const ShareResults = ({ results }) => {
  const [copied, setCopied] = useState(false);
  const shareText = `Намерих ${results.total_products} продукта в ${results.stores_count} магазина чрез TemaDom AI!\n\n` +
    (results.queries || []).slice(0, 3).map(q => `- ${q}`).join('\n') +
    `\n\nОпитай и ти: ${SITE_URL}/product-search`;

  const copy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success('Копирано!');
    setTimeout(() => setCopied(false), 2000);
  };

  const links = [
    { name: 'WhatsApp', icon: MessageCircle, color: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(shareText)}` },
    { name: 'Viber', icon: Phone, color: '#7360F2', url: `viber://forward?text=${encodeURIComponent(shareText)}` },
    { name: 'Facebook', icon: Facebook, color: '#1877F2', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL + '/product-search')}&quote=${encodeURIComponent(shareText)}` },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="share-results">
      {links.map(l => (
        <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium hover:opacity-90 transition-opacity"
          style={{ background: l.color }} data-testid={`share-${l.name.toLowerCase()}`}>
          <l.icon className="h-3.5 w-3.5" /> {l.name}
        </a>
      ))}
      <button onClick={copy}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
        style={{ background: 'var(--theme-bg-surface)', color: 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
        data-testid="share-copy">
        {copied ? <CheckCircle className="h-3.5 w-3.5 text-[#10B981]" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Копирано' : 'Копирай'}
      </button>
    </div>
  );
};

export const ProductSearchPage = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [roomType, setRoomType] = useState('');
  const [textQuery, setTextQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const imgRef = useRef(null);

  const handleImage = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Макс. 10MB'); return; }
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview(null);
  };

  const handleSearch = async () => {
    if (!image && !textQuery.trim()) {
      toast.error('Качете снимка или въведете търсене');
      return;
    }
    setLoading(true);
    setResults(null);

    try {
      let imageB64 = '';
      if (image) {
        imageB64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(image);
        });
      }

      const res = await axios.post(`${API}/scrape/ai-search`, {
        image_base64: imageB64,
        room_type: roomType,
        query: textQuery.trim(),
      });

      setResults(res.data);
      if (res.data.total_products === 0) {
        toast.info('Не бяха намерени продукти. Опитайте с друга снимка.');
      } else {
        toast.success(`Намерени ${res.data.total_products} продукта от ${res.data.stores_count} магазина`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при търсене');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen py-6 px-3 md:px-6" style={{ background: 'var(--theme-bg)' }} data-testid="product-search-page">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <Sparkles className="h-4 w-4 text-[#F97316]" />
            <span className="text-xs font-bold text-[#F97316]">AI-powered</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black" style={{ color: 'var(--theme-text)' }}>
            Търси продукти по снимка
          </h1>
          <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: 'var(--theme-text-muted)' }}>
            Качете снимка на стая или интериор. AI ще разпознае материалите и ще ги потърси в 21 български магазина.
          </p>
        </div>

        {/* Upload + Search */}
        <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
          <CardContent className="p-5">
            {!imagePreview ? (
              <div
                onClick={() => imgRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleImage(e.dataTransfer.files?.[0]); }}
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-[#F97316] hover:bg-[#F97316]/5"
                style={{ borderColor: 'var(--theme-border)' }}
                data-testid="upload-zone">
                <Camera className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--theme-text-subtle)' }} />
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--theme-text)' }}>Качете снимка на стая</p>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Плъзнете или кликнете (JPEG, PNG, до 10MB)</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden mb-4" data-testid="image-preview">
                <img src={imagePreview} alt="Preview" className="w-full max-h-72 object-contain rounded-xl" style={{ background: '#000' }} />
                <button onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                  data-testid="remove-image-btn">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={e => handleImage(e.target.files?.[0])} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>Тип стая (по избор)</label>
                <select value={roomType} onChange={e => setRoomType(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  style={{ background: 'var(--theme-bg-surface)', color: 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
                  data-testid="room-type-select">
                  {ROOM_TYPES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>Допълнително търсене</label>
                <input value={textQuery} onChange={e => setTextQuery(e.target.value)}
                  placeholder="напр. бойлер 80 литра"
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  style={{ background: 'var(--theme-bg-surface)', color: 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  data-testid="text-query-input" />
              </div>
            </div>

            <Button className="w-full mt-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold py-3 text-base"
              onClick={handleSearch} disabled={loading || (!image && !textQuery.trim())}
              data-testid="search-btn">
              {loading ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> AI анализира...</>
              ) : (
                <><Search className="h-5 w-5 mr-2" /> Търси в 21 магазина</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {loading && (
          <div className="mt-6 text-center py-12">
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-[#F97316] mb-3" />
            <p className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>AI разпознава продукти...</p>
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>Търсене в 21 магазина, моля изчакайте</p>
          </div>
        )}

        {results && !loading && (
          <div className="mt-6 space-y-4" data-testid="search-results">
            {/* Summary + Share */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
              <p className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>
                <ShoppingCart className="inline h-4 w-4 text-[#F97316] mr-1.5" />
                {results.total_products} продукта от {results.stores_count} магазина
              </p>
              <ShareResults results={results} />
            </div>

            {/* Query tags */}
            {results.queries?.length > 0 && (
              <div className="flex gap-1 flex-wrap px-1">
                {results.queries.slice(0, 6).map((q, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                    style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316' }}>
                    {q}
                  </span>
                ))}
              </div>
            )}

            {/* Grouped by query */}
            {results.results_by_query && Object.entries(results.results_by_query).map(([query, products]) => (
              products.length > 0 && (
                <div key={query}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Tag className="h-3.5 w-3.5 text-[#F97316]" />
                    <span className="text-xs font-bold" style={{ color: 'var(--theme-text)' }}>"{query}"</span>
                    <span className="text-[10px]" style={{ color: 'var(--theme-text-subtle)' }}>({products.length})</span>
                  </div>
                  <div className="space-y-2">
                    {products.map((p, i) => <ProductCard key={`${query}-${i}`} product={p} />)}
                  </div>
                </div>
              )
            ))}

            {results.total_products === 0 && (
              <Card style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--theme-text-subtle)' }} />
                  <p className="font-bold" style={{ color: 'var(--theme-text)' }}>Не бяха намерени продукти</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>Опитайте с различна снимка или ключова дума</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSearchPage;
