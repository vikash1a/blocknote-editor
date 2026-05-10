import React, { useEffect, useRef, useCallback } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';

declare function acquireVsCodeApi(): {
  postMessage: (message: unknown) => void;
};

const vscode = acquireVsCodeApi();

export default function App() {
  const editor = useCreateBlockNote();
  const isInternalUpdate = useRef(false);

  // Receive file content from extension host and load into editor
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'update') {
        isInternalUpdate.current = true;
        try {
          const blocks = await editor.tryParseMarkdownToBlocks(message.content as string);
          editor.replaceBlocks(editor.document, blocks);
        } finally {
          isInternalUpdate.current = false;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [editor]);

  // Send updated markdown back to extension host on every change
  const handleChange = useCallback(async () => {
    if (isInternalUpdate.current) {
      return;
    }
    const markdown = await editor.blocksToMarkdownLossy(editor.document);
    vscode.postMessage({ type: 'save', content: markdown });
  }, [editor]);

  return (
    <BlockNoteView
      editor={editor}
      onChange={handleChange}
      theme="dark"
    />
  );
}
