'use client';

import { useState, useEffect } from 'react';
import { Lock, CheckCircle2, AlertCircle, User } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) setProfileForm({ name: user.name || '', email: user.email || '' });
  }, [user]);

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await api.patch('/api/auth/profile', profileForm);
      setUser(res.data);
      setProfileMsg({ type: 'success', text: '账号信息已更新' });
    } catch (e: any) {
      setProfileMsg({ type: 'error', text: e?.response?.data?.error || '更新失败，请重试' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: '新密码不能少于8位' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await api.post('/api/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMsg({ type: 'success', text: '密码修改成功' });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      setPasswordMsg({ type: 'error', text: e?.response?.data?.error || '修改失败，请重试' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const MsgBox = ({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) => msg ? (
    <div className="mt-4 flex items-center gap-2 text-sm px-4 py-3 rounded-xl" style={{
      background: msg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
      color: msg.type === 'success' ? '#10b981' : '#ef4444',
    }}>
      {msg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {msg.text}
    </div>
  ) : null;

  return (
    <div className="p-8 fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>个人设置</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>管理你的账号信息</p>
      </div>

      <div className="max-w-lg space-y-6">
        {/* 账号信息 */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <User size={16} style={{ color: 'var(--text-muted)' }} />
            账号信息
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>姓名</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>邮箱</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
          </div>
          <MsgBox msg={profileMsg} />
          <button
            onClick={handleSaveProfile}
            disabled={profileLoading}
            className="mt-5 w-full py-2.5 rounded-xl text-sm font-medium transition-opacity"
            style={{ background: 'var(--accent)', color: '#fff', opacity: profileLoading ? 0.6 : 1 }}
          >
            {profileLoading ? '保存中...' : '保存账号信息'}
          </button>
        </div>

        {/* 修改密码 */}
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
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  placeholder={field === 'newPassword' ? '至少8位' : ''}
                />
              </div>
            ))}
          </div>
          <MsgBox msg={passwordMsg} />
          <button
            onClick={handleChangePassword}
            disabled={passwordLoading}
            className="mt-5 w-full py-2.5 rounded-xl text-sm font-medium transition-opacity"
            style={{ background: 'var(--accent)', color: '#fff', opacity: passwordLoading ? 0.6 : 1 }}
          >
            {passwordLoading ? '保存中...' : '保存密码'}
          </button>
        </div>
      </div>
    </div>
  );
}
