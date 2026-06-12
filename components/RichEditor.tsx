'use client';
import { useEffect, useRef } from 'react';
import api from '@/lib/api';

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    if (quillRef.current) return;

    import('quill').then(({ default: Quill }) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css';
      document.head.appendChild(link);

      const quill = new Quill(containerRef.current!, {
        theme: 'snow',
        placeholder: placeholder || '产品详情，支持图文视频混排...',
        modules: {
          toolbar: {
            container: [
              [{ header: [1, 2, 3, false] }],
              ['bold', 'italic', 'underline'],
              [{ color: [] }, { background: [] }],
              [{ list: 'ordered' }, { list: 'bullet' }],
              [{ align: [] }],
              ['link', 'image', 'video'],
              ['clean'],
            ],
            handlers: {
              image: () => handleUpload(quill, 'image/*', 'image'),
              video: () => handleUpload(quill, 'video/*', 'video'),
            },
          },
        },
      });

      if (value) quill.clipboard.dangerouslyPasteHTML(value);

      quill.on('text-change', () => {
        const html = containerRef.current?.querySelector('.ql-editor')?.innerHTML || '';
        onChangeRef.current(html === '<p><br></p>' ? '' : html);
      });

      quillRef.current = quill;
    });

    return () => { quillRef.current = null; };
  }, []);

  useEffect(() => {
    if (!quillRef.current) return;
    const current = containerRef.current?.querySelector('.ql-editor')?.innerHTML || '';
    if (value !== current) {
      quillRef.current.clipboard.dangerouslyPasteHTML(value || '');
    }
  }, [value]);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <style>{`
        .ql-toolbar { background: var(--surface-2); border: none !important; border-bottom: 1px solid var(--border) !important; }
        .ql-container { background: var(--surface-2); border: none !important; min-height: 220px; font-size: 14px; }
        .ql-editor { color: var(--text); min-height: 220px; line-height: 1.8; }
        .ql-editor.ql-blank::before { color: var(--text-muted); font-style: normal; }
        .ql-editor img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
        .ql-editor video { max-width: 100%; width: 100%; border-radius: 8px; margin: 8px 0; display: block; }
        .ql-editor .ql-video { width: 100%; aspect-ratio: 16/9; border-radius: 8px; margin: 8px 0; display: block; }
        .ql-snow .ql-stroke { stroke: var(--text-muted); }
        .ql-snow .ql-fill { fill: var(--text-muted); }
        .ql-snow .ql-picker { color: var(--text-muted); }
        .ql-snow .ql-picker-options { background: var(--surface); border-color: var(--border); }
        .ql-toolbar button:hover .ql-stroke { stroke: var(--accent); }
        .ql-toolbar button:hover .ql-fill { fill: var(--accent); }
      `}</style>
      <div ref={containerRef} />
    </div>
  );
}

async function handleUpload(quill: any, accept: string, type: 'image' | 'video') {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.click();
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/api/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.url;
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, type, url);
      quill.setSelection(range.index + 1, 0);
    } catch (e) {
      alert(type === 'image' ? '图片上传失败，请重试' : '视频上传失败，请重试');
    }
  };
}
