'use client';
import { createPortal } from 'react-dom';
import { useState, useRef } from 'react';
import {
  X, Upload, Loader2, ImageIcon, Plus, Trash2,
  ChevronDown, ChevronUp, GripVertical,
} from 'lucide-react';
import api from '@/lib/api';

interface Translation {
  lang: string;
  name: string;
  description: string;
  bulletPoints?: string[];
  detail?: string;
}
interface ProductVariant {
  id?: string;
  label: string;
  sku: string;
  price: string;
  stock: number;
  visible: boolean;
}
interface Product {
  id?: string;
  slug?: string;
  icon?: string;
  imageUrl?: string;
  images?: string[];
  sort?: number;
  visible?: boolean;
  translations?: Translation[];
  price?: string;
  originalPrice?: string;
  sku?: string;
  stock?: number;
  variants?: ProductVariant[];
}
interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

const LANGS = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
];

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  outline: 'none',
};
const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm';

function Section({ title, children, collapsible = false }: {
  title: string; children: React.ReactNode; collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      <button type="button" onClick={() => collapsible && setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3"
        style={{ background: 'var(--surface-2)', borderBottom: open ? '1px solid var(--border)' : 'none', cursor: collapsible ? 'pointer' : 'default', color: 'var(--text)' }}>
        <span className="text-sm font-semibold">{title}</span>
        {collapsible && (open
          ? <ChevronUp size={15} style={{ color: 'var(--text-muted)' }} />
          : <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />)}
      </button>
      {open && <div className="px-5 py-4 space-y-4">{children}</div>}
    </div>
  );
}

export default function ProductForm({ product, onClose, onSaved }: ProductFormProps) {
  const isEdit = !!product?.id;
  const [icon, setIcon] = useState(product?.icon || '');
  const [categoryName, setCategoryName] = useState<{zh:string,en:string,de:string}>((product as any)?.categoryName || {zh:'',en:'',de:''});
  const [sort, setSort] = useState(product?.sort ?? 0);
  const [visible, setVisible] = useState(product?.visible ?? true);
  const [sku, setSku] = useState(product?.sku || '');
  const [price, setPrice] = useState(product?.price || '');
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice || '');
  const [stock, setStock] = useState(product?.stock ?? 0);
  const [images, setImages] = useState<string[]>(
    product?.images?.length ? product.images
      : product?.imageUrl ? [product.imageUrl, '', '', '', '', '']
      : ['', '', '', '', '', '']
  );
  const [translations, setTranslations] = useState<Translation[]>(
    LANGS.map(l => ({
      lang: l.code,
      name: product?.translations?.find(t => t.lang === l.code)?.name || '',
      description: product?.translations?.find(t => t.lang === l.code)?.description || '',
      bulletPoints: product?.translations?.find(t => t.lang === l.code)?.bulletPoints || ['', '', ''],
      detail: product?.translations?.find(t => t.lang === l.code)?.detail || '',
    }))
  );
  const [activeLang, setActiveLang] = useState('zh');
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [newVariantLabel, setNewVariantLabel] = useState('');
  const [uploading, setUploading] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const activeTrans = translations.find(t => t.lang === activeLang)!;

  const updateTrans = <K extends keyof Translation>(lang: string, field: K, value: Translation[K]) =>
    setTranslations(prev => prev.map(t => t.lang === lang ? { ...t, [field]: value } : t));

  const updateBullet = (lang: string, idx: number, val: string) => {
    const bullets = [...(translations.find(t => t.lang === lang)?.bulletPoints || [])];
    bullets[idx] = val;
    updateTrans(lang, 'bulletPoints', bullets);
  };
  const addBullet = (lang: string) => {
    const bullets = [...(translations.find(t => t.lang === lang)?.bulletPoints || [])];
    if (bullets.length >= 10) return;
    updateTrans(lang, 'bulletPoints', [...bullets, '']);
  };
  const removeBullet = (lang: string, idx: number) => {
    const bullets = [...(translations.find(t => t.lang === lang)?.bulletPoints || [])];
    bullets.splice(idx, 1);
    updateTrans(lang, 'bulletPoints', bullets);
  };

  const setImage = (idx: number, url: string) =>
    setImages(prev => { const next = [...prev]; next[idx] = url; return next; });

  const handleImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(idx);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/api/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImage(idx, res.data.url);
    } catch {
      setError('图片上传失败，请直接输入图片 URL');
    } finally {
      setUploading(null);
    }
  };

  const addVariant = () => {
    if (!newVariantLabel.trim()) return;
    setVariants(prev => [...prev, { label: newVariantLabel.trim(), sku: '', price, stock: 0, visible: true }]);
    setNewVariantLabel('');
  };
  const updateVariant = <K extends keyof ProductVariant>(idx: number, field: K, val: ProductVariant[K]) =>
    setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: val } : v));
  const removeVariant = (idx: number) =>
    setVariants(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const zhName = translations.find(t => t.lang === 'zh')?.name;
    if (!zhName) { setError('请填写中文产品名称'); return; }
    const cleanedImages = images.filter(Boolean);
    setSaving(true);
    try {
      const payload = { icon, imageUrl: cleanedImages[0] || '', images: cleanedImages, sort, visible, sku, price, originalPrice, stock, variants, translations, categoryName };
      if (isEdit) {
        await api.put(`/api/products/${product!.id}`, payload);
      } else {
        await api.post('/api/products', payload);
      }
      onSaved();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || '保存失败';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const discountPct = (() => {
    const s = parseFloat(price), o = parseFloat(originalPrice);
    if (s > 0 && o > s) return Math.round((1 - s / o) * 100);
    return null;
  })();

  const focusAccent = (e: React.FocusEvent<HTMLElement>) => (e.target as HTMLElement & { style: CSSStyleDeclaration }).style.borderColor = 'var(--accent)';
  const blurBorder = (e: React.FocusEvent<HTMLElement>) => (e.target as HTMLElement & { style: CSSStyleDeclaration }).style.borderColor = 'var(--border)';

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: 'var(--bg)', paddingTop: 0, paddingBottom: 0 }}>
      <div className="w-full mx-auto fade-in"
        style={{ maxWidth: '100%', borderRadius: 0, background: 'var(--surface)', border: 'none', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
              {isEdit ? '编辑产品' : '新增产品'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>亚马逊风格 · 多图 · 卖点 · 详情页</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">

            {/* 1. 产品图片 */}
            <Section title="📷 产品图片">
              <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: -8 }}>
                第一张为主图，建议白底正方形 1000×1000px 以上
              </p>
              <div className="grid gap-3" style={{ gridTemplateColumns: '160px repeat(5, 1fr)' }}>
                {/* 主图 */}
                <div>
                  <div className="rounded-xl overflow-hidden flex flex-col items-center justify-center relative"
                    style={{ height: 160, background: 'var(--surface-2)', border: '2px dashed var(--accent)', cursor: 'pointer' }}
                    onClick={() => fileRefs.current[0]?.click()}>
                    {images[0] ? (
                      <>
                        <img src={images[0]} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(0,0,0,0.5)' }}>
                          <Upload size={20} color="white" />
                        </div>
                      </>
                    ) : uploading === 0 ? (
                      <Loader2 size={22} className="animate-spin" style={{ color: 'var(--accent)' }} />
                    ) : (
                      <>
                        <ImageIcon size={28} style={{ color: 'var(--accent)' }} />
                        <span className="text-xs mt-1.5 font-medium" style={{ color: 'var(--accent)' }}>主图</span>
                      </>
                    )}
                    <input ref={el => { fileRefs.current[0] = el; }} type="file" accept="image/*" className="hidden"
                      onChange={e => handleImageUpload(0, e)} />
                  </div>
                  <input type="text" value={images[0]} onChange={e => setImage(0, e.target.value)}
                    placeholder="主图 URL" className="mt-1.5 w-full px-2 py-1.5 rounded-lg text-xs"
                    style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
                </div>
                {/* 副图 1-5 */}
                {[1, 2, 3, 4, 5].map(idx => (
                  <div key={idx}>
                    <div className="rounded-xl overflow-hidden flex flex-col items-center justify-center relative"
                      style={{ height: 80, background: 'var(--surface-2)', border: '1px dashed var(--border)', cursor: 'pointer' }}
                      onClick={() => fileRefs.current[idx]?.click()}>
                      {images[idx] ? (
                        <>
                          <img src={images[idx]} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                            style={{ background: 'rgba(0,0,0,0.5)' }}>
                            <Upload size={14} color="white" />
                          </div>
                        </>
                      ) : uploading === idx ? (
                        <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                      ) : (
                        <>
                          <Plus size={16} style={{ color: 'var(--text-muted)' }} />
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>图{idx + 1}</span>
                        </>
                      )}
                      <input ref={el => { fileRefs.current[idx] = el; }} type="file" accept="image/*" className="hidden"
                        onChange={e => handleImageUpload(idx, e)} />
                    </div>
                    <input type="text" value={images[idx] || ''} onChange={e => setImage(idx, e.target.value)}
                      placeholder={`图${idx + 1} URL`} className="mt-1.5 w-full px-2 py-1.5 rounded-lg text-xs"
                      style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
                  </div>
                ))}
              </div>
            </Section>

            {/* 2. 多语言内容 */}
            <Section title="✍️ 产品内容（多语言）">
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                {LANGS.map(l => (
                  <button key={l.code} type="button" onClick={() => setActiveLang(l.code)}
                    className="flex-1 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: activeLang === l.code ? 'var(--surface)' : 'transparent',
                      color: activeLang === l.code ? 'var(--text)' : 'var(--text-muted)',
                      boxShadow: activeLang === l.code ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
                    }}>{l.label}</button>
                ))}
              </div>

              {/* 标题 */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  产品标题 <span style={{ color: '#f87171' }}>*</span>
                  <span className="ml-1" style={{ fontWeight: 400 }}>({activeTrans.name.length}/200)</span>
                </label>
                <input type="text" maxLength={200} value={activeTrans.name}
                  onChange={e => updateTrans(activeLang, 'name', e.target.value)}
                  placeholder="清晰完整的产品标题，包含品牌、型号、核心特征"
                  className={inputCls} style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
              </div>

              {/* 简短描述 */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>简短描述（列表页摘要）</label>
                <textarea value={activeTrans.description}
                  onChange={e => updateTrans(activeLang, 'description', e.target.value)}
                  placeholder="一两句话概括产品价值" rows={2}
                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                  style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
              </div>

              {/* 核心卖点 */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  核心卖点（Bullet Points）
                  <span className="ml-1" style={{ fontWeight: 400 }}>建议 3–5 条</span>
                </label>
                <div className="space-y-2">
                  {(activeTrans.bulletPoints || []).map((bp, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <GripVertical size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                      <input type="text" value={bp}
                        onChange={e => updateBullet(activeLang, idx, e.target.value)}
                        placeholder={`卖点 ${idx + 1}`}
                        className="flex-1 px-3 py-2 rounded-xl text-sm"
                        style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
                      <button type="button" onClick={() => removeBullet(activeLang, idx)}
                        className="p-1.5 rounded-lg flex-shrink-0"
                        style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                {(activeTrans.bulletPoints?.length || 0) < 10 && (
                  <button type="button" onClick={() => addBullet(activeLang)}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                    style={{ border: '1px dashed var(--border)', color: 'var(--text-muted)', cursor: 'pointer', background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                    <Plus size={12} /> 添加卖点
                  </button>
                )}
              </div>

              {/* 详情页 */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  产品详情页
                  <span className="ml-1" style={{ fontWeight: 400 }}>支持 HTML，可图文混排</span>
                </label>
                <textarea value={activeTrans.detail || ''}
                  onChange={e => updateTrans(activeLang, 'detail', e.target.value)}
                  placeholder={'详细描述产品材质、规格、使用方法、注意事项...\n\n支持 HTML：<h2>标题</h2><ul><li>列表</li></ul>'}
                  rows={8} className="w-full px-3 py-2.5 rounded-xl text-sm resize-y"
                  style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }}
                  onFocus={focusAccent} onBlur={blurBorder} />
              </div>
            </Section>

            {/* 3. 价格与库存 */}
            <Section title="💰 价格与库存">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    销售价格 <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>¥</span>
                    <input type="text" value={price} onChange={e => setPrice(e.target.value)}
                      placeholder="0.00" className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm"
                      style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    划线原价
                    {discountPct && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-md text-xs font-semibold"
                        style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>
                        -{discountPct}%
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>¥</span>
                    <input type="text" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)}
                      placeholder="0.00" className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm"
                      style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>SKU / 商品编号</label>
                  <input type="text" value={sku} onChange={e => setSku(e.target.value)}
                    placeholder="SKU-001" className={inputCls} style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>库存数量</label>
                  <input type="number" value={stock} onChange={e => setStock(Number(e.target.value))}
                    min={0} className={inputCls} style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
                </div>
              </div>
            </Section>

            {/* 4. 产品变体 */}
            <Section title="🎨 产品变体（颜色/规格）" collapsible>
              {variants.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <div className="grid px-3 py-2 text-xs font-medium"
                    style={{ gridTemplateColumns: '1fr 100px 80px 70px 60px 32px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
                    <span>变体名称</span><span>SKU</span><span>价格</span><span>库存</span><span>状态</span><span />
                  </div>
                  {variants.map((v, idx) => (
                    <div key={idx} className="grid items-center px-3 py-2 gap-2"
                      style={{ gridTemplateColumns: '1fr 100px 80px 70px 60px 32px', borderBottom: idx < variants.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <input type="text" value={v.label} onChange={e => updateVariant(idx, 'label', e.target.value)}
                        className="px-2 py-1.5 rounded-lg text-xs" style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
                      <input type="text" value={v.sku} onChange={e => updateVariant(idx, 'sku', e.target.value)}
                        placeholder="SKU" className="px-2 py-1.5 rounded-lg text-xs" style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
                      <input type="text" value={v.price} onChange={e => updateVariant(idx, 'price', e.target.value)}
                        placeholder="¥" className="px-2 py-1.5 rounded-lg text-xs" style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
                      <input type="number" value={v.stock} onChange={e => updateVariant(idx, 'stock', Number(e.target.value))}
                        min={0} className="px-2 py-1.5 rounded-lg text-xs" style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
                      <button type="button" onClick={() => updateVariant(idx, 'visible', !v.visible)}
                        className="px-2 py-1 rounded-lg text-xs font-medium"
                        style={{ background: v.visible ? 'rgba(16,185,129,0.12)' : 'var(--surface-2)', color: v.visible ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer' }}>
                        {v.visible ? '上架' : '下架'}
                      </button>
                      <button type="button" onClick={() => removeVariant(idx)}
                        className="p-1 rounded-lg flex items-center justify-center"
                        style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" value={newVariantLabel} onChange={e => setNewVariantLabel(e.target.value)}
                  placeholder="变体名称，例：红色 / XL"
                  className="flex-1 px-3 py-2 rounded-xl text-sm" style={inputStyle}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVariant())}
                  onFocus={focusAccent} onBlur={blurBorder} />
                <button type="button" onClick={addVariant}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  <Plus size={14} /> 添加
                </button>
              </div>
            </Section>

            {/* 5. 基础设置 */}
            <Section title="⚙️ 基础设置" collapsible>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>图标（emoji）</label>
                  <input type="text" value={icon} onChange={e => setIcon(e.target.value)}
                    placeholder="📦" className={inputCls} style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    前台分类名称 <span style={{fontWeight:400}}>(留空则使用默认名称)</span>
                  </label>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                    {(['zh','en','de'] as const).map(lang => (
                      <div key={lang}>
                        <div className="text-xs mb-1" style={{color:'var(--text-muted)'}}>{lang==='zh'?'中文':lang==='en'?'English':'Deutsch'}</div>
                        <input type="text" value={categoryName[lang]} onChange={e => setCategoryName(prev => ({...prev,[lang]:e.target.value}))}
                          placeholder={lang==='zh'?'如：天地盖礼盒':lang==='en'?'e.g. Rigid Box':'z.B. Starre Box'}
                          className={inputCls} style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>排序权重</label>
                  <input type="number" value={sort} onChange={e => setSort(Number(e.target.value))}
                    className={inputCls} style={inputStyle} onFocus={focusAccent} onBlur={blurBorder} />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button type="button" onClick={() => setVisible(!visible)}
                  className="relative rounded-full transition-all"
                  style={{ width: 40, height: 22, background: visible ? 'var(--accent)' : 'var(--surface-2)', border: '1px solid var(--border)', flexShrink: 0, cursor: 'pointer' }}>
                  <div className="absolute top-0.5 rounded-full bg-white transition-all"
                    style={{ width: 16, height: 16, left: visible ? 20 : 2 }} />
                </button>
                <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
                  {visible ? '前台显示' : '隐藏（草稿）'}
                </span>
              </div>
            </Section>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex justify-end gap-3 sticky bottom-0"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            <button type="button" onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer' }}>
              取消
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{
                background: saving ? 'var(--surface-2)' : 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                color: 'white', cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 4px 20px var(--accent-glow)',
              }}>
              {saving ? <><Loader2 size={14} className="animate-spin" />保存中...</> : (isEdit ? '保存更改' : '创建产品')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
