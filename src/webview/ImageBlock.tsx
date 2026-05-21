import React, { useState, useEffect } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import { vscode } from './vscodeApi';

function isRemoteUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:');
}

function useResolvedUrl(originalUrl: string): string {
  const [displayUrl, setDisplayUrl] = useState(originalUrl);

  useEffect(() => {
    if (!originalUrl || isRemoteUrl(originalUrl)) {
      setDisplayUrl(originalUrl);
      return;
    }

    // Local path — ask the extension to convert it to a webview-safe URI
    const handler = (event: MessageEvent) => {
      if (event.data.type === 'resolvedImagePath' && event.data.original === originalUrl) {
        window.removeEventListener('message', handler);
        setDisplayUrl(event.data.uri);
      }
    };
    window.addEventListener('message', handler);
    vscode.postMessage({ type: 'resolveImagePath', path: originalUrl });

    return () => window.removeEventListener('message', handler);
  }, [originalUrl]);

  return displayUrl;
}

export const imageBlockSpec = createReactBlockSpec(
  {
    type: 'image' as const,
    propSchema: {
      url: { default: '' },
      alt: { default: '' },
    },
    content: 'none',
  },
  {
    render: ({ block, editor }) => {
      const [editing, setEditing] = useState(!block.props.url);
      const [inputUrl, setInputUrl] = useState(block.props.url);
      const [inputAlt, setInputAlt] = useState(block.props.alt);
      const [imgError, setImgError] = useState(false);

      const displayUrl = useResolvedUrl(block.props.url);

      // Reset error when the resolved URL changes
      useEffect(() => { setImgError(false); }, [displayUrl]);

      const openEdit = () => {
        setInputUrl(block.props.url);
        setInputAlt(block.props.alt);
        setEditing(true);
      };

      const handleSave = () => {
        editor.updateBlock(block, { props: { url: inputUrl.trim(), alt: inputAlt.trim() } });
        setImgError(false);
        setEditing(false);
      };

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') setEditing(false);
      };

      return (
        <div contentEditable={false} style={containerStyle}>
          {displayUrl && !editing && !imgError && (
            <div style={imageWrapperStyle}>
              <img
                src={displayUrl}
                alt={block.props.alt || 'image'}
                style={imgStyle}
                onError={() => setImgError(true)}
              />
              {block.props.alt && <p style={captionStyle}>{block.props.alt}</p>}
            </div>
          )}

          {(!block.props.url || imgError) && !editing && (
            <div style={placeholderStyle} onClick={openEdit}>
              {imgError ? '⚠️ Failed to load — click to edit path' : '🖼 Click to add image path or URL'}
            </div>
          )}

          <div style={toolbarStyle}>
            <button onClick={editing ? () => setEditing(false) : openEdit} style={toggleBtnStyle}>
              {editing ? '▲ Cancel' : '✎ Edit'}
            </button>
          </div>

          {editing && (
            <div style={editPanelStyle}>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="./image.png or https://example.com/image.png"
                style={inputStyle}
                autoFocus
              />
              <input
                type="text"
                value={inputAlt}
                onChange={(e) => setInputAlt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Alt text / caption (optional)"
                style={inputStyle}
              />
              <button
                onClick={handleSave}
                disabled={!inputUrl.trim()}
                style={saveBtnStyle(!inputUrl.trim())}
              >
                Insert
              </button>
            </div>
          )}
        </div>
      );
    },

    parse: (el) => {
      if (el.tagName === 'IMG') {
        return {
          url: el.getAttribute('src') ?? '',
          alt: el.getAttribute('alt') ?? '',
        };
      }
      return undefined;
    },

    toExternalHTML: ({ block }) => (
      <img src={block.props.url} alt={block.props.alt} />
    ),
  }
);

const containerStyle: React.CSSProperties = {
  border: '1px solid #e0e0e0',
  borderRadius: 6,
  overflow: 'hidden',
  width: '100%',
};

const imageWrapperStyle: React.CSSProperties = {
  background: '#fafafa',
  padding: 12,
  textAlign: 'center',
};

const imgStyle: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: 400,
  borderRadius: 4,
  display: 'block',
  margin: '0 auto',
};

const captionStyle: React.CSSProperties = {
  margin: '8px 0 0',
  fontSize: 12,
  color: '#666',
  fontStyle: 'italic',
};

const placeholderStyle: React.CSSProperties = {
  padding: '24px 16px',
  textAlign: 'center',
  color: '#999',
  fontSize: 13,
  cursor: 'pointer',
  background: '#fafafa',
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

const editPanelStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: '#f5f5f5',
  borderTop: '1px solid #e0e0e0',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  fontSize: 13,
  border: '1px solid #ddd',
  borderRadius: 5,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'monospace',
  color: '#333',
  background: '#fff',
};

const saveBtnStyle = (disabled: boolean): React.CSSProperties => ({
  alignSelf: 'flex-end',
  padding: '6px 16px',
  fontSize: 12,
  borderRadius: 5,
  border: 'none',
  background: disabled ? '#93c5fd' : '#2563eb',
  color: '#fff',
  cursor: disabled ? 'not-allowed' : 'pointer',
});
