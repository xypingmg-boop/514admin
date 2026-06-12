'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import ProductForm from '@/components/ProductForm';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Search, ImageIcon, Loader2, RefreshCw, Check, X
} from 'lucide-react';

interface Translation { lang: string; name: string; description: string; }
interface Product {
  id: string;
  slug: string;
  icon?: string;
  imageUrl?: string;
  sort: number;
  visible: boolean;
  translations: Translation[];
  categoryName?: { zh: string; en: string; de: string };
  createdAt: string;
}

function InlineEdit({ value, onSave, type = 'text' }: {
  value: string;
  onSave: (v: string) => void;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => { setVal(value); }, [value]);

  const save = () => { setEditing(false); if (val !== value) onSave(val); };
  const cancel = () => { setEditing(false); setVal(value); };

  if (!editing) return (
    <div
      onClick={() => setEditing(true)}
      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, minWidth: 40 }}
    >
      <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{value || '—'}</span>
      <Pencil size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <input
        ref={inputRef}
        type={type}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
        style={{
          width: type === 'number' ? 60 : 120,
          padding: '2px 6px', fontSize: 13, borderRadius: 6,
          border: '1px solid var(--accent)',
          background: 'var(--surface-2)', color: 'var(--text)', outline: 'none',
        }}
      />
      <button onClick={save} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: 2 }}><Check size={13} /></button>
      <button onClick={cancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}><X size={13} /></button>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/products?lang=zh');
      setProducts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api.delete(`/api/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const handleInlineSave = async (id: string, field: string, value: string) => {
    try {
      const payload: Record<string, unknown> = {};
      if (field === 'sort') payload.sort = Number(value);
      else if (field === 'categoryName_zh') {
        const product = products.find(p => p.id === id);
        payload.categoryName = { ...(product?.categoryName || { zh: '', en: '', de: '' }), zh: value };
      }
      await api.put(`/api/products/${id}`, payload);
      setProducts(prev => prev.map(p => {
        if (p.id !== id) return p;
        if (field === 'sort') return { ...p, sort: Number(value) };
        if (field === 'categoryName_zh') return { ...p, categoryName: { ...(p.categoryName || { zh: '', en: '', de: '' }), zh: value } };
        return p;
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = products.filter(p => {
    if (!search) return true;
    const zhName = p.translations?.find(t => t.lang === 'zh')?.name || '';
    return zhName.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase());
  });

  return (
    <div className="p-8 fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>产品管理</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>共 {products.length} 个产品</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-2 rounded-xl transition-all" style={{
            background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer',
          }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setEditProduct(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
              color: 'white', cursor: 'pointer', boxShadow: '0 4px 20px var(--accent-glow)',
            }}
          >
            <Plus size={16} /> 新增产品
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜索产品名称或 slug..."
          className="w-full max-w-sm pl-10 pr-4 py-2.5 rounded-xl text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="grid items-center px-4 py-3 text-xs font-medium" style={{
          gridTemplateColumns: '48px 1fr 160px 80px 80px 120px',
          borderBottom: '1px solid var(--border)', color: 'var(--text-muted)',
        }}>
          <span>图片</span>
          <span>名称 / Slug</span>
          <span>分类名称（中文）</span>
          <span>排序</span>
          <span>状态</span>
          <span className="text-right">操作</span>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center" style={{ color: 'var(--text-muted)' }}>
            {search ? '未找到匹配产品' : '暂无产品，点击新增'}
          </div>
        ) : (
          filtered.map((product, idx) => {
            const zhName = product.translations?.find(t => t.lang === 'zh')?.name || '';
            const catName = product.categoryName?.zh || '';
            return (
              <div
                key={product.id}
                className="grid items-center px-4 py-3 transition-colors"
                style={{
                  gridTemplateColumns: '48px 1fr 160px 80px 80px 120px',
                  borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center" style={{
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                }}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : product.icon ? (
                    <span className="text-lg">{product.icon}</span>
                  ) : (
                    <ImageIcon size={14} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>

                <div className="min-w-0 pr-4">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{zhName || '(未命名)'}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{product.slug}</div>
                </div>

                <div className="pr-4">
                  <InlineEdit
                    value={catName}
                    onSave={v => handleInlineSave(product.id, 'categoryName_zh', v)}
                  />
                </div>

                <div>
                  <InlineEdit
                    value={String(product.sort)}
                    type="number"
                    onSave={v => handleInlineSave(product.id, 'sort', v)}
                  />
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full" style={{
                    background: product.visible ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                    color: product.visible ? 'var(--success)' : 'var(--text-muted)',
                  }}>
                    {product.visible ? <Eye size={10} /> : <EyeOff size={10} />}
                    {product.visible ? '显示' : '隐藏'}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => { setEditProduct(product); setShowForm(true); }}
                    className="p-1.5 rounded-lg transition-all" title="编辑"
                    style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = 'var(--accent-2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <Pencil size={14} />
                  </button>

                  {confirmDelete === product.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDelete(product.id)} disabled={!!deleting}
                        className="px-2 py-1 rounded-lg text-xs font-medium"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer' }}
                      >
                        {deleting === product.id ? <Loader2 size={12} className="animate-spin" /> : '确认'}
                      </button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 rounded-lg text-xs"
                        style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(product.id)}
                      className="p-1.5 rounded-lg transition-all" title="删除"
                      style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editProduct}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
          onSaved={() => { setShowForm(false); setEditProduct(null); load(); }}
        />
      )}
    </div>
  );
}
