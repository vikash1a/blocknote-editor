import React, { useEffect, useRef, useState } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' });

export const mermaidBlockSpec = createReactBlockSpec(
  {
    type: 'mermaid' as const,
    propSchema: {
      source: { default: 'graph LR\n  A --> B' },
    },
    content: 'none',
  },
  {
    render: ({ block, editor }) => {
      const [svg, setSvg] = useState('');
      const [error, setError] = useState('');
      const [localSource, setLocalSource] = useState(block.props.source);
      const diagramRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        setLocalSource(block.props.source);
      }, [block.props.source]);

      useEffect(() => {
        if (!localSource.trim()) { setSvg(''); setError(''); return; }
        const id = `mn${block.id.replace(/-/g, '')}`;
        mermaid.render(id, localSource)
          .then(({ svg: s, bindFunctions }) => {
            setSvg(s);
            setError('');
            if (bindFunctions && diagramRef.current) bindFunctions(diagramRef.current);
          })
          .catch((e: unknown) => {
            setError(e instanceof Error ? e.message : String(e));
            setSvg('');
          });
      }, [localSource, block.id]);

      const handleBlur = () => {
        if (localSource !== block.props.source) {
          editor.updateBlock(block, { props: { source: localSource } });
        }
      };

      return (
        <div contentEditable={false} style={containerStyle}>
          {svg && (
            <div
              ref={diagramRef}
              dangerouslySetInnerHTML={{ __html: svg }}
              style={diagramStyle}
            />
          )}
          {error && <div style={errorStyle}>{error}</div>}
          <textarea
            value={localSource}
            onChange={(e) => setLocalSource(e.target.value)}
            onBlur={handleBlur}
            style={textareaStyle}
            spellCheck={false}
            rows={Math.max(3, localSource.split('\n').length)}
          />
        </div>
      );
    },

    parse: (el) => {
      if (el.tagName !== 'PRE') return undefined;
      const code = el.firstElementChild;
      if (!code || code.tagName !== 'CODE') return undefined;
      const lang =
        code.getAttribute('data-language') ||
        Array.from(code.classList).find((c) => c.startsWith('language-'))?.replace('language-', '');
      if (lang !== 'mermaid') return undefined;
      return { source: code.textContent ?? '' };
    },

    toExternalHTML: ({ block }) => (
      <pre>
        <code className="language-mermaid" data-language="mermaid">
          {block.props.source}
        </code>
      </pre>
    ),
  }
);

const containerStyle: React.CSSProperties = {
  border: '1px solid #e0e0e0',
  borderRadius: 6,
  overflow: 'hidden',
  width: '100%',
};

const diagramStyle: React.CSSProperties = {
  padding: '16px',
  background: '#fff',
  textAlign: 'center',
  borderBottom: '1px solid #e0e0e0',
};

const errorStyle: React.CSSProperties = {
  padding: '8px 12px',
  color: '#c0392b',
  fontSize: 12,
  background: '#fef0f0',
  borderBottom: '1px solid #e0e0e0',
  fontFamily: 'monospace',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  display: 'block',
  fontFamily: 'monospace',
  fontSize: 12,
  padding: '8px 12px',
  background: '#f5f5f5',
  border: 'none',
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
  color: '#333',
};
