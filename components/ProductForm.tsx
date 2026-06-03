'use client';
import { createPortal } from 'react-dom';

import { useState, useRef } from 'react';
import { X, Upload, Loader2, ImageIcon } from 'lucide-react';
import api from '@/lib/api';

interface Translation { lang: string; name: string; description: string; }
interface Product {
  id?: string;
  slug?: string;
  icon?: string;
  imageUrl?: string;
  sort?: number;
  visible?: boolean;
  translations?: Translation[];
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

export default function ProductForm({ product, onClose, onSaved }: ProductFormProps) {
  const isEdit = !!product?.id;
  const [icon, setIcon] = useState(product?.icon || '');
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
  const [sort, setSort] = useState(product?.sort ?? 0);
  const [visible, setVisible] = useState(product?.visible ?? true);
  const [translations, setTranslations] = useState<Translation[]>(
    LANGS.map(l => ({
      lang: l.code,
      name: product?.translations?.find(t => t.lang === l.code)?.name || '',
      description: product?.translations?.find(t => t.lang === l.code)?.description || '',
    }))
  );
  const [activeLang, setActiveLang] = useState('zh');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const updateTranslation = (lang: string, field: 'name' | 'description', value: string) => {
    setTranslations(prev => prev.map(t => t.lang === lang ? { ...t, [field]: value } : t));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/api/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(res.data.url);
    } catch {
      // fallback: try direct URL input
      setError('图片上传失败，请直接输入图片URL');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const zhName = translations.find(t => t.lang === 'zh')?.name;
    if (!zhName) { setError('请填写中文名称'); return; }
    setSaving(true);
    try {
      const payload = { icon, imageUrl, sort, visible, translations };
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

  const activeTrans = translations.find(t => t.lang === activeLang)!;

  return createPortal(
    <div className="fixed inset-0 z-50 p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', overflowY: 'auto', alignItems: 'flex-start', paddingTop: '60px' }}>
      <div className="w-full max-w-2xl rounded-2xl fade-in overflow-hidden mx-auto my-4" style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            {isEdit ? '编辑产品' : '新增产品'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-6">
            {/* Image */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-dim)' }}>产品图片</label>
              <div className="flex gap-4 items-start">
                <div className="w-24 h-24 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                }}>
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="图片URL"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-dim)',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    {uploading ? '上传中...' : '上传图片'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
              </div>
            </div>

            {/* Icon & Sort */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-dim)' }}>图标（emoji/字符）</label>
                <input
                  type="text"
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  placeholder="📦"
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-dim)' }}>排序</label>
                <input
                  type="number"
                  value={sort}
                  onChange={e => setSort(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            {/* Visible */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setVisible(!visible)}
                className="relative w-10 h-5.5 rounded-full transition-all"
                style={{ background: visible ? 'var(--accent)' : 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{
                  transform: visible ? 'translateX(16px)' : 'translateX(0)',
                }} />
              </button>
              <label className="text-sm" style={{ color: 'var(--text-dim)' }}>
                {visible ? '显示在前台' : '隐藏'}
              </label>
            </div>

            {/* Translations */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-dim)' }}>多语言内容</label>
              {/* Lang tabs */}
              <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                {LANGS.map(l => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setActiveLang(l.code)}
                    className="flex-1 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: activeLang === l.code ? 'var(--surface)' : 'transparent',
                      color: activeLang === l.code ? 'var(--text)' : 'var(--text-muted)',
                      boxShadow: activeLang === l.code ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={activeTrans.name}
                  onChange={e => updateTranslation(activeLang, 'name', e.target.value)}
                  placeholder={`产品名称（${LANGS.find(l => l.code === activeLang)?.label}）`}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <textarea
                  value={activeTrans.description}
                  onChange={e => updateTranslation(activeLang, 'description', e.target.value)}
                  placeholder={`产品描述（${LANGS.find(l => l.code === activeLang)?.label}）`}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171',
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer' }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{
                background: saving ? 'var(--surface-2)' : 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                color: 'white',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? <><Loader2 size={14} className="animate-spin" />保存中...</> : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  , document.body);
}
