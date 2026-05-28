'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

const FIELDS = [
  { key: 'contact_address', label: '工厂地址', icon: MapPin, placeholder: '浙江省温州市龙港市物流大道1588号' },
  { key: 'contact_phone', label: '联系电话', icon: Phone, placeholder: '+86 0577 - XXXX XXXX' },
  { key: 'contact_email', label: '电子邮箱', icon: Mail, placeholder: 'sales@micai-packaging.com' },
  { key: 'contact_wechat', label: 'WeChat / WhatsApp', icon: MessageCircle, placeholder: '扫码添加业务顾问' },
];

export default function ContactSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.get('/api/settings').then(res => {
      setValues(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const payload = Object.fromEntries(FIELDS.map(f => [f.key, values[f.key] || '']));
      await api.put('/api/settings', payload);
      setMsg({ type: 'success', text: '保存成功' });
    } catch {
      setMsg({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>联系信息</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>修改网站联系我们页面的信息</p>
      </div>

      <div className="max-w-lg">
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl shimmer" />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
                <div key={key}>
                  <label className="text-xs mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Icon size={12} />
                    {label}
                  </label>
                  <input
                    type="text"
                    value={values[key] || ''}
                    onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
              ))}
            </div>
          )}

          {msg && (
            <div className="mt-4 flex items-center gap-2 text-sm px-4 py-3 rounded-xl" style={{
              background: msg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: msg.type === 'success' ? '#10b981' : '#ef4444',
            }}>
              {msg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {msg.text}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="mt-5 w-full py-2.5 rounded-xl text-sm font-medium transition-opacity"
            style={{ background: 'var(--accent)', color: '#fff', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  );
}
