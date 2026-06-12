'use client';
import { useEffect, useRef } from 'react';

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
      // import quill css
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css';
      document.head.appendChild(link);

      const quill = new Quill(containerRef.current!, {
        theme: 'snow',
        placeholder: placeholder || '产品详情，支持图文混排...',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ color: [] }, { background: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['link', 'image', 'video'],
            ['clean'],
          ],
        },
      });

      // set initial value
      if (value) quill.clipboard.dangerouslyPasteHTML(value);

      quill.on('text-change', () => {
        const html = containerRef.current?.querySelector('.ql-editor')?.innerHTML || '';
        onChangeRef.current(html === '<p><br></p>' ? '' : html);
      });

      quillRef.current = quill;
    });

    return () => {
      quillRef.current = null;
    };
  }, []);

  // sync external value changes
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
        .ql-container { background: var(--surface-2); border: none !important; min-height: 200px; font-size: 14px; }
        .ql-editor { color: var(--text); min-height: 200px; line-height: 1.8; }
        .ql-editor.ql-blank::before { color: var(--text-muted); font-style: normal; }
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
