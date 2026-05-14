'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Package, MessageSquare, TrendingUp, Clock, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';

interface Stats {
  totalProducts: number;
  totalInquiries: number;
  newInquiries: number;
  inquiriesByStatus: { status: string; count: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  NEW: '新询盘',
  CONTACTED: '已联系',
  QUOTED: '已报价',
  CLOSED: '已完成',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: '#6366f1',
  CONTACTED: '#f59e0b',
  QUOTED: '#3b82f6',
  CLOSED: '#10b981',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<{ id: string; name: string; company?: string; productType?: string; createdAt: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [productsRes, inquiriesRes] = await Promise.all([
          api.get('/api/products?lang=zh'),
          api.get('/api/inquiries?page=1&limit=5'),
        ]);

        const allInquiriesRes = await api.get('/api/inquiries?limit=1000');
        const all = allInquiriesRes.data.items || [];

        const byStatus = ['NEW', 'CONTACTED', 'QUOTED', 'CLOSED'].map(s => ({
          status: s,
          count: all.filter((i: { status: string }) => i.status === s).length,
        }));

        setStats({
          totalProducts: productsRes.data.length,
          totalInquiries: allInquiriesRes.data.total,
          newInquiries: all.filter((i: { status: string }) => i.status === 'NEW').length,
          inquiriesByStatus: byStatus,
        });

        setRecentInquiries(inquiriesRes.data.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = stats ? [
    { label: '产品总数', value: stats.totalProducts, icon: Package, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: '询盘总数', value: stats.totalInquiries, icon: MessageSquare, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: '新询盘', value: stats.newInquiries, icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: '转化率', value: stats.totalInquiries > 0 ? `${Math.round((stats.inquiriesByStatus.find(s => s.status === 'CLOSED')?.count || 0) / stats.totalInquiries * 100)}%` : '0%', icon: BarChart3, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  ] : [];

  return (
    <div className="p-8 fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>概览</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl shimmer" style={{ border: '1px solid var(--border)' }} />
          ))
        ) : cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl p-5" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <div className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Inquiries */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}>
          <h2 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Clock size={16} style={{ color: 'var(--text-muted)' }} />
            最新询盘
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl shimmer" />
              ))}
            </div>
          ) : recentInquiries.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>暂无询盘</div>
          ) : (
            <div className="space-y-2">
              {recentInquiries.map(inq => (
                <div key={inq.id} className="flex items-center gap-4 px-4 py-3 rounded-xl" style={{
                  background: 'var(--surface-2)',
                }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{
                    background: 'var(--accent-glow)',
                    color: 'var(--accent-2)',
                  }}>
                    {inq.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{inq.name}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {inq.company || inq.productType || '—'}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{
                    background: `${STATUS_COLORS[inq.status]}20`,
                    color: STATUS_COLORS[inq.status],
                  }}>
                    {STATUS_LABELS[inq.status]}
                  </span>
                  <div className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {new Date(inq.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="rounded-2xl p-6" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}>
          <h2 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--text-muted)' }} />
            询盘状态
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded-xl shimmer" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.inquiriesByStatus.map(({ status, count }) => {
                const total = stats.totalInquiries || 1;
                const pct = Math.round(count / total * 100);
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{STATUS_LABELS[status]}</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'var(--surface-2)' }}>
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${pct}%`,
                        background: STATUS_COLORS[status],
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!loading && stats?.totalInquiries === 0 && (
            <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              <AlertCircle size={14} />
              暂无询盘数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
