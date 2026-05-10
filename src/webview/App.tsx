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
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const message = event.data;
      if (message.type !== 'update') {
        return;
      }

      // Cancel any pending save to avoid overwriting the incoming content
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }

      isInternalUpdate.current = true;
      try {
        const blocks = await editor.tryParseMarkdownToBlocks(message.content as string);
        editor.replaceBlocks(editor.document, blocks);
      } finally {
        // Keep the flag true briefly to absorb the onChange BlockNote fires
        // after replaceBlocks before clearing it
        setTimeout(() => {
          isInternalUpdate.current = false;
        }, 150);
      }
    };

    window.addEventListener('message', handleMessage);

    // Tell the extension we're mounted and ready to receive content
    vscode.postMessage({ type: 'ready' });

    return () => window.removeEventListener('message', handleMessage);
  }, [editor]);

  const handleChange = useCallback(async () => {
    if (isInternalUpdate.current) {
      return;
    }

    // Debounce: wait for the user to pause typing before saving
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(async () => {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      vscode.postMessage({ type: 'save', content: markdown });
    }, 300);
  }, [editor]);

  return (
    <BlockNoteView
      editor={editor}
      onChange={handleChange}
      theme="dark"
    />
  );
}
