[日本語版のREADMEはこちらです。](./README.ja.md)

# Markdown Grid Editor

Create and edit Markdown tables in Visual Studio Code with an Excel-like graphical interface.

As a Markdown table grows, manually maintaining its pipes, delimiter row, and spacing becomes increasingly difficult. Markdown Grid Editor keeps the Markdown source on the left and an interactive grid on the right, allowing you to edit tables without manually reformatting the Markdown syntax.

## Features

- Detect GFM Markdown tables
- Show an `Edit in GUI` CodeLens above each table
- Edit existing tables or insert new tables from the Markdown editor context menu
- Use a virtualized grid in both VS Code Desktop and VS Code for the Web
- Select individual cells, rectangular ranges, disjoint ranges, rows, and columns
- Copy, cut, and paste TSV data, automatically expanding the destination table when necessary
- Add, delete, and drag rows or columns, with quick-add controls at the table edges
- Set column alignment, perform stable sorting, resize columns by dragging, and auto-fit widths
- Render sanitized inline Markdown inside cells
- Synchronize edits to the source immediately while using VS Code's standard Save, Undo, and Redo
- Use the interface in English or Japanese, with light, dark, high-contrast theme, and ARIA grid support

## Usage

### Edit an existing table

1. Open a Markdown file in VS Code.
2. Select `Edit in GUI` above the target table. If CodeLens is disabled, right-click inside the table and select `Edit Table in GUI`.
3. The Markdown source remains on the left and the graphical grid opens on the right.
4. Confirming a cell edit immediately updates the source on the left.
5. Save the file normally with Ctrl/Cmd+S.

### Insert a new table

1. Right-click in the Markdown editor and select `Insert Markdown Table`.
2. Choose a size from 1–8 columns and 1–8 rows in the Quick Pick. The row count includes the header row.
3. An empty table is inserted and its top-left header cell opens in edit mode in the grid.

When the cursor is inside an existing table, the new table is inserted after that complete table. Otherwise, it is inserted after the line containing the cursor.

## Basic operations

| Action | Keyboard or UI |
| --- | --- |
| Move between cells | Arrow keys |
| Extend a selection | Shift+Arrow, Shift+Click, or drag |
| Create a disjoint selection | Ctrl/Cmd+Click |
| Edit the existing value | Enter, F2, or double-click |
| Replace the value and edit | Type while a cell is selected |
| Confirm an edit | Enter, Tab, or move focus |
| Cancel an edit | Esc |
| Clear cell contents | Delete, Backspace, or the toolbar's delete-cell-content action |
| Select the complete table | Ctrl/Cmd+A |
| Copy or cut | Ctrl/Cmd+C or X, or the toolbar |
| Paste | Ctrl/Cmd+V |
| Undo or redo | Ctrl/Cmd+Z or Y, or the toolbar |
| Add or delete rows and columns | Top toolbar; use the `+` controls at the right and bottom edges to append |
| Align or sort a column | Menu in each column heading |
| Resize a column | Drag the right edge of its heading; double-click to auto-fit that column |
| Pan a large table | Hold the middle mouse button and drag over the grid |

Copying a disjoint selection is not supported. When pasting with a disjoint selection active, the primary cell is used as the paste origin.

Cell contents wrap automatically when they exceed the column width. A row expands only as much as required by its tallest cell.

The toolbar changes with the available width: one labeled row at 1500px or wider, two labeled rows from 800px to 1499px, and one icon-only row at 799px or narrower. In the two-row layout, column actions appear directly below row actions, and the toolbar never introduces a scrollbar. Action groups use spacing and dividers, while Undo, Redo, and Auto Fit Widths remain together. Copy, cut, and clear-cell actions are also available from the toolbar. The `more_horiz` menu in each column heading provides alignment and sorting, closes after an action or an outside click, stays within the visible grid area, and marks the current alignment. Left, center, and right alignment is reflected immediately in the Markdown source and in header, body, and active editor cells. Columns without an explicit Markdown alignment are displayed left-aligned.

The vertical `+` control at the right edge appends a column, and the horizontal `+` control at the bottom appends a row. Each control follows the actual table dimensions, and the bottom-right intersection remains empty.

Dragging a row or column heading makes the source translucent and shows a drag preview and insertion line. A drop position can be selected over either a heading or its corresponding cells, with the first and second halves representing insertion before and after.

## Supported Markdown

The extension targets the common GFM Table syntax recognized by both VS Code's built-in Markdown preview and GitHub. It supports optional outer pipes, empty cells, alignment, escaped pipes, and common inline Markdown. Table-like text inside fenced code blocks or indented code beginning with four spaces or a tab is ignored.

Opening the GUI does not rewrite the source. If body rows have uneven column counts, missing cells are added only when the first edit is confirmed.

## Development

### Requirements

- Visual Studio Code
- Node.js 22 or later
- npm

```bash
npm install
npm run compile
```

| Command | Purpose |
| --- | --- |
| `npm run compile` | Type-check, lint, and build the Desktop, Web, and Webview development bundles |
| `npm run check-types` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run test:unit` | Test the pure Markdown table and grid logic |
| `npm test` | Run Desktop extension integration tests |
| `npm run test:web` | Run Web extension integration tests |
| `npm run benchmark` | Measure parsing, serialization, and table operations at the guaranteed and oversized table sizes |
| `npm run package` | Create production bundles |
| `npm run package:vsix` | Generate a distributable VSIX in `artifacts/` |
| `npm run watch` | Watch TypeScript and esbuild during development |

Open this repository in VS Code and start `Run Extension` with F5 to launch an Extension Development Host.

Distributable packages are written to `artifacts/md-table-editor-<version>.vsix`. The `dist`, `out`, `out-unit`, and `artifacts` directories contain generated files only.

## Supported environments and limitations

- VS Code `1.125.0` or later
- Windows, macOS, Linux, vscode.dev, and github.dev
- Performance is guaranteed for tables up to 50 columns × 500 rows; larger tables remain editable without truncation
- Filters, formulas, autofill, merged cells, multiline cells, and raw HTML rendering are not supported
- No telemetry is collected

## License

[MIT License](./LICENSE)

The UI includes local copies of SVG paths from Google's official Material Symbols Outlined 24px set at Weight 400 and Fill 0. Icon shapes do not change with the VS Code theme, while their colors follow VS Code theme colors. Third-party license information is available in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
