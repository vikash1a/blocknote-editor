import React, { useEffect, useRef, useState } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'base',
  themeVariables: {
    primaryColor: '#e0e7ff',
    primaryTextColor: '#1e1b4b',
    primaryBorderColor: '#818cf8',
    lineColor: '#6366f1',
    secondaryColor: '#fce7f3',
    tertiaryColor: '#f0fdf4',
    tertiaryBorderColor: '#86efac',
    edgeLabelBackground: '#ffffff',
    clusterBkg: '#f8fafc',
    clusterBorder: '#cbd5e1',
    titleColor: '#0f172a',
    nodeBorder: '#818cf8',
    mainBkg: '#e0e7ff',
  },
});

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
      const [showSource, setShowSource] = useState(false);
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

          <div style={toolbarStyle}>
            <button
              onClick={() => setShowSource((v) => !v)}
              style={toggleBtnStyle}
            >
              {showSource ? '▲ Hide source' : '✎ Edit source'}
            </button>
          </div>

          {showSource && (
            <textarea
              value={localSource}
              onChange={(e) => setLocalSource(e.target.value)}
              onBlur={handleBlur}
              style={textareaStyle}
              spellCheck={false}
              rows={Math.max(3, localSource.split('\n').length)}
              autoFocus
            />
          )}
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
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  padding: '4px 8px',
  background: '#f9f9f9',
  borderTop: '1px solid #e0e0e0',
};

const toggleBtnStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#666',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '2px 6px',
  borderRadius: 4,
};

const errorStyle: React.CSSProperties = {
  padding: '8px 12px',
  color: '#c0392b',
  fontSize: 12,
  background: '#fef0f0',
  borderTop: '1px solid #e0e0e0',
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
  borderTop: '1px solid #e0e0e0',
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
  color: '#333',
};
