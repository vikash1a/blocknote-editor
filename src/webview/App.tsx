import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  useCreateBlockNote,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
} from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  createCodeBlockSpec,
} from '@blocknote/core';
import { createHighlighter, createJavaScriptRegexEngine } from 'shiki';
import { mermaidBlockSpec } from './MermaidBlock';
import '@blocknote/mantine/style.css';
import './styles.css';

const schema = BlockNoteSchema.create({
  blockSpecs: {
    mermaid: mermaidBlockSpec(),
    ...defaultBlockSpecs,
    codeBlock: createCodeBlockSpec({
      defaultLanguage: 'text',
      supportedLanguages: {
        text: { name: 'Plain Text', aliases: ['txt', 'plaintext'] },
        javascript: { name: 'JavaScript', aliases: ['js'] },
        typescript: { name: 'TypeScript', aliases: ['ts'] },
        python: { name: 'Python', aliases: ['py'] },
        bash: { name: 'Bash', aliases: ['sh', 'shell'] },
        html: { name: 'HTML' },
        css: { name: 'CSS' },
        json: { name: 'JSON' },
        go: { name: 'Go', aliases: ['golang'] },
        rust: { name: 'Rust', aliases: ['rs'] },
        java: { name: 'Java' },
        sql: { name: 'SQL' },
        yaml: { name: 'YAML', aliases: ['yml'] },
      },
      createHighlighter: () =>
        createHighlighter({
          themes: ['github-light'],
          langs: [
            'javascript', 'typescript', 'python', 'bash',
            'html', 'css', 'json', 'go', 'rust', 'java', 'sql', 'yaml',
          ],
          engine: createJavaScriptRegexEngine(),
        }),
    }),
  },
});

declare function acquireVsCodeApi(): {
  postMessage: (message: unknown) => void;
};

const vscode = acquireVsCodeApi();

const formatDate = (date: Date): string =>
  `📅 ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

export default function App() {
  const editor = useCreateBlockNote({ schema });
  const isInternalUpdate = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickedDate, setPickedDate] = useState('');

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const message = event.data;
      if (message.type !== 'update') {
        return;
      }
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      isInternalUpdate.current = true;
      try {
        const blocks = await editor.tryParseMarkdownToBlocks(message.content as string);
        editor.replaceBlocks(editor.document, blocks);
      } finally {
        setTimeout(() => { isInternalUpdate.current = false; }, 150);
      }
    };

    window.addEventListener('message', handleMessage);
    vscode.postMessage({ type: 'ready' });
    return () => window.removeEventListener('message', handleMessage);
  }, [editor]);

  const handleChange = useCallback(async () => {
    if (isInternalUpdate.current) {
      return;
    }
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(async () => {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      vscode.postMessage({ type: 'save', content: markdown });
    }, 300);
  }, [editor]);

  // Ref to remember which block was active when "Pick a Date" was opened
  const savedBlock = useRef<ReturnType<typeof editor.getTextCursorPosition>['block'] | null>(null);

  const insertDateInline = useCallback((dateStr: string) => {
    editor.insertInlineContent([{ type: 'text', text: dateStr, styles: {} }]);
  }, [editor]);

  const insertDateIntoBlock = useCallback((block: NonNullable<typeof savedBlock.current>, dateStr: string) => {
    editor.updateBlock(block, {
      content: [{ type: 'text', text: dateStr, styles: {} }],
    });
  }, [editor]);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const mermaidSlashItem = {
    title: 'Mermaid Diagram',
    onItemClick: () => {
      const current = editor.getTextCursorPosition().block;
      editor.insertBlocks([{ type: 'mermaid' as const }], current, 'after');
    },
    group: 'Diagram',
    icon: <span style={{ fontSize: 16 }}>📊</span>,
    subtext: 'Insert a Mermaid diagram',
  };

  const dateSlashItems = [
    {
      title: 'Today',
      onItemClick: () => insertDateInline(formatDate(today)),
      group: 'Date',
      icon: <span style={{ fontSize: 16 }}>📅</span>,
      subtext: formatDate(today),
    },
    {
      title: 'Tomorrow',
      onItemClick: () => insertDateInline(formatDate(tomorrow)),
      group: 'Date',
      icon: <span style={{ fontSize: 16 }}>📅</span>,
      subtext: formatDate(tomorrow),
    },
    {
      title: 'Pick a Date',
      onItemClick: () => {
        // Save block reference before the modal steals focus
        savedBlock.current = editor.getTextCursorPosition().block;
        setShowDatePicker(true);
      },
      group: 'Date',
      icon: <span style={{ fontSize: 16 }}>🗓️</span>,
      subtext: 'Choose a specific date',
    },
  ];

  const handleInsertPickedDate = () => {
    if (pickedDate && savedBlock.current) {
      const [y, m, d] = pickedDate.split('-').map(Number);
      insertDateIntoBlock(savedBlock.current, formatDate(new Date(y, m - 1, d)));
      savedBlock.current = null;
    }
    setShowDatePicker(false);
    setPickedDate('');
  };

  return (
    <>
      <BlockNoteView editor={editor} onChange={handleChange} theme="light">
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) => [
            ...getDefaultReactSlashMenuItems(editor),
            mermaidSlashItem,
            ...dateSlashItems,
          ].filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          )}
        />
      </BlockNoteView>

      {showDatePicker && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <p style={{ margin: '0 0 12px 0', fontWeight: 600, fontSize: 15 }}>Pick a Date</p>
            <input
              type="date"
              value={pickedDate}
              onChange={(e) => setPickedDate(e.target.value)}
              autoFocus
              style={dateInputStyle}
            />
            <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowDatePicker(false); setPickedDate(''); }}
                style={cancelBtnStyle}
              >
                Cancel
              </button>
              <button
                onClick={handleInsertPickedDate}
                disabled={!pickedDate}
                style={insertBtnStyle(!!pickedDate)}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.25)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 10,
  padding: '20px 24px',
  minWidth: 280,
  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
};

const dateInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 14,
  border: '1px solid #ddd',
  borderRadius: 6,
  boxSizing: 'border-box',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '7px 16px',
  borderRadius: 6,
  border: '1px solid #ddd',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 13,
};

const insertBtnStyle = (enabled: boolean): React.CSSProperties => ({
  padding: '7px 16px',
  borderRadius: 6,
  border: 'none',
  background: enabled ? '#2563eb' : '#93c5fd',
  color: '#fff',
  cursor: enabled ? 'pointer' : 'not-allowed',
  fontSize: 13,
});
