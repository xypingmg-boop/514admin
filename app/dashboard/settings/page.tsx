'use client';

import { useState } from 'react';
import { User, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

export default function SettingsPage() {
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: '新密码不能少于8位' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/api/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage({ type: 'success', text: '密码修改成功' });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.response?.data?.error || '修改失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>个人设置</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>管理你的账号信息</p>
      </div>

      <div className="max-w-lg">
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Lock size={16} style={{ color: 'var(--text-muted)' }} />
            修改密码
          </h2>

          <div className="space-y-4">
            {(['oldPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
              <div key={field}>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  {field === 'oldPassword' ? '当前密码' : field === 'newPassword' ? '新密码' : '确认新密码'}
                </label>
                <input
                  type="password"
                  value={passwordForm[field]}
                  onChange={e => setPasswordForm(prev => ({ ...prev, [field]: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  placeholder={field === 'oldPassword' ? '输入当前密码' : field === 'newPassword' ? '至少8位' : '再次输入新密码'}
                />
              </div>
            ))}
          </div>

          {message && (
            <div className="mt-4 flex items-center gap-2 text-sm px-4 py-3 rounded-xl" style={{
              background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: message.type === 'success' ? '#10b981' : '#ef4444',
            }}>
              {message.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {message.text}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="mt-5 w-full py-2.5 rounded-xl text-sm font-medium transition-opacity"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  );
}
