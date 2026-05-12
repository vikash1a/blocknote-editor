# BlockNote Editor

A Notion-like rich markdown editor for VS Code, powered by [BlockNote](https://www.blocknotejs.org).

Opens `.md` files as a visual block editor with inline preview — no split panes, no raw markdown. Edits are saved back to disk as standard markdown so your files stay portable.

## Features

### Editing
- WYSIWYG block editing — see formatted output as you type
- Slash command menu (`/`) to insert any block type
- Drag-and-drop to reorder blocks
- Headings (H1–H3), paragraphs, bullet & numbered lists, tables, quotes, dividers

### Code Blocks
- Syntax highlighting powered by [Shiki](https://shiki.matsu.io) with the `github-light` theme
- 13 supported languages: JavaScript, TypeScript, Python, Bash, Go, Rust, Java, SQL, HTML, CSS, JSON, YAML, Plain Text
- Language selector in the block toolbar

### Mermaid Diagrams
- Insert diagrams via `/Mermaid Diagram` slash command
- Supported diagram types: flowcharts, sequence diagrams, ER diagrams, class diagrams, state machines, Gantt charts, Git graphs, and more
- Diagram renders automatically as you type the source
- Source editor hidden by default — click **✎ Edit source** to expand, **▲ Hide source** to collapse
- Saves as standard ` ```mermaid ` fenced code blocks — renders on GitHub and other markdown tools

### Date Insertion
- Insert today's or tomorrow's date via `/Today` or `/Tomorrow`
- Pick any date with `/Pick a Date` — opens a date picker

## Usage

After installing, open any `.md` file — it opens in BlockNote automatically.

To switch to the standard text editor for a file: right-click the tab → **Reopen Editor With** → **Text Editor**.

To make BlockNote the default for all markdown files, add to `settings.json`:

```json
"workbench.editorAssociations": {
  "*.md": "blocknote-editor.markdownEditor"
}
```

## Install

Download the `.vsix` from [Releases](https://github.com/vikash1a/blocknote-editor/releases) and install via:

`Cmd+Shift+P` → **Extensions: Install from VSIX...**

## Development

```bash
npm install
npm run watch         # incremental dev build with file watching
npm run install-local # production build + install into local VS Code
```

Press **F5** in VS Code (with this project open) to launch an Extension Development Host for rapid iteration — no `.vsix` install needed.

## Caveats

Markdown serialization is lossy — complex syntax like raw HTML, footnotes, or deeply nested structures may not round-trip perfectly. Standard content (headings, lists, bold, italic, code blocks, tables, mermaid diagrams) works correctly.
