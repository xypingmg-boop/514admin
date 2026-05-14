'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
  ChevronLeft, ChevronRight, Trash2, RefreshCw, Loader2,
  Search, Filter, User, Phone, Mail, Building2, Package, MessageSquare
} from 'lucide-react';

interface Inquiry {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  productType?: string;
  message?: string;
  lang: string;
  status: string;
  ipAddress?: string;
  createdAt: string;
}

const STATUSES = ['', 'NEW', 'CONTACTED', 'QUOTED', 'CLOSED'];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  NEW:       { label: '新询盘',  color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
  CONTACTED: { label: '已联系',  color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
  QUOTED:    { label: '已报价',  color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
  CLOSED:    { label: '已完成',  color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
};

const LANG_LABEL: Record<string, string> = { zh: '中文', en: 'EN', de: 'DE' };

export default function InquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/api/inquiries?${params}`);
      setItems(res.data.items);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingStatus(id);
    try {
      const res = await api.patch(`/api/inquiries/${id}`, { status });
      setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      if (selected?.id === id) setSelected({ ...selected, status });
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api.delete(`/api/inquiries/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const filtered = items.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return i.name.toLowerCase().includes(q) ||
           (i.company || '').toLowerCase().includes(q) ||
           (i.phone || '').includes(q) ||
           (i.email || '').toLowerCase().includes(q);
  });

  return (
    <div className="p-8 fade-in flex gap-6" style={{ minHeight: '100vh' }}>
      {/* Left: list */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>询盘管理</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>共 {total} 条询盘</p>
          </div>
          <button onClick={load} className="p-2 rounded-xl" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索姓名、公司、邮箱..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          {/* Status filter */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {STATUSES.map(s => (
              <button
                key={s || 'all'}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: statusFilter === s ? (s ? STATUS_META[s].bg : 'var(--surface-2)') : 'transparent',
                  color: statusFilter === s ? (s ? STATUS_META[s].color : 'var(--text)') : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {s ? STATUS_META[s].label : '全部'}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center" style={{ color: 'var(--text-muted)' }}>暂无数据</div>
          ) : (
            filtered.map((inq, idx) => {
              const meta = STATUS_META[inq.status] || STATUS_META.NEW;
              const isSelected = selected?.id === inq.id;
              return (
                <div
                  key={inq.id}
                  onClick={() => setSelected(isSelected ? null : inq)}
                  className="px-5 py-4 cursor-pointer transition-all"
                  style={{
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    background: isSelected ? 'var(--accent-glow)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-2)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0" style={{
                      background: meta.bg, color: meta.color,
                    }}>
                      {inq.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{inq.name}</span>
                        {inq.company && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {inq.company}</span>}
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                          {LANG_LABEL[inq.lang] || inq.lang}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{inq.phone}</span>
                        {inq.productType && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{inq.productType}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(inq.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              第 {page} / {pages} 页
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl"
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: page === 1 ? 'var(--border)' : 'var(--text-muted)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-2 rounded-xl"
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: page === pages ? 'var(--border)' : 'var(--text-muted)',
                  cursor: page === pages ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: detail panel */}
      {selected && (
        <div className="w-80 shrink-0 slide-in">
          <div className="rounded-2xl overflow-hidden" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            position: 'sticky',
            top: 32,
          }}>
            {/* Panel header */}
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>询盘详情</h3>
                <button onClick={() => setSelected(null)} className="text-xs" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>关闭</button>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Contact info */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <User size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: 'var(--text)' }}>{selected.name}</span>
                </div>
                {selected.company && (
                  <div className="flex items-center gap-2.5">
                    <Building2 size={13} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>{selected.company}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                  <a href={`tel:${selected.phone}`} className="text-sm" style={{ color: 'var(--accent-2)' }}>{selected.phone}</a>
                </div>
                {selected.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                    <a href={`mailto:${selected.email}`} className="text-sm truncate" style={{ color: 'var(--accent-2)' }}>{selected.email}</a>
                  </div>
                )}
                {selected.productType && (
                  <div className="flex items-center gap-2.5">
                    <Package size={13} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>{selected.productType}</span>
                  </div>
                )}
              </div>

              {/* Message */}
              {selected.message && (
                <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MessageSquare size={12} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>留言</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{selected.message}</p>
                </div>
              )}

              {/* Meta */}
              <div className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                <div>提交时间：{new Date(selected.createdAt).toLocaleString('zh-CN')}</div>
                <div>语言：{LANG_LABEL[selected.lang] || selected.lang}</div>
                {selected.ipAddress && <div>IP：{selected.ipAddress}</div>}
              </div>

              {/* Status update */}
              <div>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>更新状态</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['NEW', 'CONTACTED', 'QUOTED', 'CLOSED'] as const).map(s => {
                    const meta = STATUS_META[s];
                    const active = selected.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus(selected.id, s)}
                        disabled={active || updatingStatus === selected.id}
                        className="py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1"
                        style={{
                          background: active ? meta.bg : 'var(--surface-2)',
                          color: active ? meta.color : 'var(--text-muted)',
                          border: active ? `1px solid ${meta.color}40` : '1px solid var(--border)',
                          cursor: active ? 'default' : 'pointer',
                        }}
                      >
                        {updatingStatus === selected.id && active ? <Loader2 size={10} className="animate-spin" /> : null}
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delete */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                {confirmDelete === selected.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(selected.id)}
                      disabled={!!deleting}
                      className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer' }}
                    >
                      {deleting ? <Loader2 size={12} className="animate-spin" /> : null}
                      确认删除
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="flex-1 py-2 rounded-xl text-xs"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(selected.id)}
                    className="w-full py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                    style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <Trash2 size={12} />
                    删除此询盘
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
