# BlockNote Editor

A Notion-like markdown editor for VS Code, powered by [BlockNote](https://www.blocknotejs.org).

Opens `.md` files as a rich block editor with inline preview — no split panes. Edits are saved back to disk as standard markdown.

## Features

- Inline WYSIWYG editing (renders as you type)
- Slash commands for inserting blocks
- Headings, lists, code blocks, tables, and more
- Reads and writes standard `.md` files

## Install

Download the `.vsix` from [Releases](https://github.com/vikash1a/blocknote-editor/releases) and install via:

`Cmd+Shift+P` → **Extensions: Install from VSIX...**

## Usage

After installing, open any `.md` file — it will open in BlockNote automatically.

To make it the default editor for all markdown files, add this to your VS Code `settings.json`:

```json
"workbench.editorAssociations": {
  "*.md": "blocknote-editor.markdownEditor"
}
```

To open a specific file with BlockNote: right-click → **Open With** → **BlockNote Editor**.

## Development

```bash
npm install
npm run compile    # development build
npm run package    # production build + .vsix
```

## Caveats

Markdown conversion is lossy — complex syntax like raw HTML, footnotes, or unusual nesting may not round-trip perfectly. Standard content (headings, lists, bold, italic, code blocks, tables) works fine.
