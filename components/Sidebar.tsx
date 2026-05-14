'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard, Package, MessageSquare, LogOut, ChevronRight, Boxes
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: '概览' },
  { href: '/dashboard/products', icon: Package, label: '产品管理' },
  { href: '/dashboard/inquiries', icon: MessageSquare, label: '询盘管理' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex flex-col h-screen w-64 shrink-0" style={{
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
    }}>
      {/* Brand */}
      <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
        }}>
          <Boxes size={16} color="white" />
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>米彩包装</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>管理后台</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group"
              style={{
                background: active ? 'var(--accent-glow)' : 'transparent',
                color: active ? 'var(--accent-2)' : 'var(--text-muted)',
                border: active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
              }}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} style={{ opacity: 0.6 }} />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="px-3 py-2 mb-2 rounded-xl" style={{ background: 'var(--surface-2)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user?.name}</div>
          <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
          <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-1" style={{
            background: 'rgba(99,102,241,0.15)',
            color: 'var(--accent-2)',
          }}>
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <LogOut size={16} />
          退出登录
        </button>
      </div>
    </aside>
  );
}
