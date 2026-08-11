[日本語版のREADMEはこちらです。](./README.ja.md)

# Markdown Table GUI

Create and edit Markdown tables in Visual Studio Code with an Excel-like graphical interface.

As a Markdown table grows, manually maintaining its pipes, delimiter row, and spacing becomes increasingly difficult. Markdown Table GUI keeps the Markdown source on the left and an interactive grid on the right, allowing you to edit tables without manually reformatting the Markdown syntax.

## Installation

Install [Markdown Table GUI from Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=RyutaC2.markdown-table-gui), or open the Extensions view in VS Code and search for `@id:RyutaC2.markdown-table-gui`.

## Features

- Detect GFM Markdown tables
- Show an `Edit Table` CodeLens above each table
- Edit existing tables or insert new tables from the Markdown editor context menu
- Use a virtualized grid in both VS Code Desktop and VS Code for the Web
- Select individual cells, rectangular ranges, disjoint ranges, rows, and columns
- Move a single cell or continuous multi-cell rectangle by dragging its selection border without allowing data to cross table edges
- Copy, cut, and paste TSV data, automatically expanding the destination table when necessary
- Import or export the complete current table as UTF-8 CSV or XLSX, with worksheet selection for multi-sheet workbooks
- Add, delete, and drag rows or columns, with quick-add controls at the table edges
- Set column alignment, perform stable sorting, resize columns by dragging, and auto-fit widths
- Render sanitized inline Markdown inside cells
- Synchronize edits to the source immediately while using VS Code's standard Save, Undo, and Redo
- Use the interface in English or Japanese, with light, dark, high-contrast theme, and ARIA grid support

## Usage

### Edit an existing table

1. Open a Markdown file in VS Code.
2. Select `Edit Table` above the target table. If CodeLens is disabled, right-click inside the table and select the same command.
3. The Markdown source remains on the left and the graphical grid opens on the right.
4. Confirming a cell edit immediately updates the source on the left.
5. Save the file normally with Ctrl/Cmd+S.

The editor tab is named `table: <filename>` so it remains tied to the source document even when header cells change.

### Insert a new table

1. Right-click in the Markdown editor.
2. Select `Quick Insert Markdown Table (2 × 2)` to immediately create a two-column table with a header and one data row. Alternatively, select `Insert Markdown Table`, then choose 1–20 rows followed by 1–20 columns. The row count includes the header row.
3. The empty table is inserted and its top-left header cell opens in edit mode in the grid.

When the cursor is inside an existing table, the new table is inserted after that complete table. Otherwise, it is inserted after the line containing the cursor.

## Basic operations

| Action | Keyboard or UI |
| --- | --- |
| Select and edit a cell | Click, Enter, F2, or an unmodified Arrow key |
| Extend a selection | Shift+Arrow, Shift+Click, or drag |
| Move selected cells | Drag the border around a single cell or continuous multi-cell selection |
| Create a disjoint selection | Ctrl/Cmd+Click |
| Replace the value and edit | Type while a cell is selected |
| Confirm, move, and continue editing | Enter: down; Shift+Enter: up; Tab: right; Shift+Tab: left |
| Cancel an edit | Esc |
| Clear cell contents | Delete, Backspace, or the toolbar's delete-cell-content action |
| Select the complete table | Ctrl/Cmd+A or click the top-left corner |
| Copy or cut | Ctrl/Cmd+C or X, or the toolbar |
| Paste | Ctrl/Cmd+V |
| Import or export | Toolbar; CSV and XLSX only |
| Zoom the grid | Toolbar; 50%, 75%, 100%, 125%, 150%, 175%, or 200% |
| Undo or redo | Ctrl/Cmd+Z or Y, or the toolbar |
| Add or delete rows and columns | Top toolbar; use the `+` controls at the right and bottom edges to append |
| Align or sort a column | Menu in each column heading |
| Resize a column | Drag the right edge of its heading; double-click to auto-fit that column |
| Fit column widths | Use `Fit all column widths` at the toolbar's far right or `Fit column width` in a column menu |
| Pan a large table | Hold the middle mouse button and drag over the grid |

Copying a disjoint selection is not supported. When pasting with a disjoint selection active, the primary cell is used as the paste origin.

A plain click selects the cell and immediately opens its editor. Clicking another cell while editing confirms the current value and starts editing the clicked cell in the same action. Enter and Tab also keep the destination cell in edit mode. Drag, Shift, and Ctrl/Cmd gestures remain selection operations and do not start editing. At a table edge, keyboard confirmation remains on the nearest valid cell.

Import replaces the complete table currently open in the GUI. When an XLSX workbook has multiple worksheets, select one in the VS Code Quick Pick. Export writes the complete current table to one CSV file or one `Table` worksheet. Cell values are imported as strings; spreadsheet formatting, formulas, images, and merged-cell structure are not reproduced.

Cell contents wrap automatically when they exceed the column width. A row expands only as much as required by its tallest rendered cell. Cell padding, wrap estimation, and auto-fit width use one compact sizing model, while hidden Markdown link destinations do not add blank vertical space.

Grid zoom scales the table, row and column headings, cells, resize increments, selection border, and edge-add controls. The toolbar remains at the VS Code UI size so its controls stay usable. Alignment icon tooltips identify that the action applies to every column and describe the resulting alignment.

The left-aligned toolbar follows the requested action order. At 1440px or wider it uses one labeled row; from 960px to 1439px it keeps that order in one icon-only row. From 600px to 959px it uses two icon-only rows grouped as clipboard/history/rows/zoom above alignment/files/columns/auto-fit. At 599px or narrower, import, export, zoom, and whole-table auto-fit move into a compound menu, and whole-table alignment uses a separate menu. The compound menu, alignment menu, Undo, and Redo form a four-control group directly below the four clipboard controls. No layout adds a toolbar scrollbar. The direct and compound zoom controls share the same design, and all popup lists use VS Code context-menu colors for light, dark, and high-contrast themes. All operations remain available at every width. Row or column insertion repeats by the number of selected rows or columns. The `more_horiz` menu in each column heading provides per-column alignment, auto-fit, and sorting, closes after an action or an outside click, stays within the visible grid area, and marks the current alignment. Alignment is reflected immediately in the Markdown source and in header, body, and active editor cells.

The vertical `+` control at the right edge appends a column, and the horizontal `+` control at the bottom appends a row. Each control follows the actual table dimensions, and the bottom-right intersection remains empty.

The bottom status bar shows the active cell in `A0` notation and the current table size as columns × rows.

The Markdown header is row `0`; data rows begin at `1`, separated by a persistent 2px rule. Dragging unselected row or column headings selects a continuous range on that axis; the gesture continues if the pointer enters the adjacent cells. Selected headings use selection fill without an extra blue outline, while the selected cell range keeps a clear 2px border. Drag the selected headings again to reorder the block. During reordering, the source becomes translucent and a drag preview and insertion line appear. A drop position can be selected over either a heading or its corresponding cells, with the first and second halves representing insertion before and after.

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
| `npm run benchmark` | Measure Markdown operations plus CSV/XLSX conversion at the guaranteed and oversized table sizes |
| `npm run package` | Create production bundles |
| `npm run package:vsix` | Generate a distributable VSIX in `artifacts/` |
| `npm run watch` | Watch TypeScript and esbuild during development |

Open this repository in VS Code and start `Run Extension` with F5 to launch an Extension Development Host.

Distributable packages are written to `artifacts/markdown-table-gui-<version>.vsix`. The `dist`, `out`, `out-unit`, and `artifacts` directories contain generated files only.

For release verification and publishing, follow the concise manual scenarios in [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) and the [Marketplace publishing guide](./PUBLISHING.md).

## Supported environments and limitations

- VS Code `1.125.0` or later
- Windows, macOS, Linux, vscode.dev, and github.dev
- Restricted Mode and virtual workspaces are fully supported; the extension does not execute workspace code or use Node.js file-system APIs
- Performance is guaranteed for tables up to 50 columns × 500 rows; larger tables remain editable without truncation
- Filters, formulas, autofill, merged cells, multiline cells, and raw HTML rendering are not supported
- No telemetry is collected

## License

[MIT License](./LICENSE)

The UI includes local copies of SVG paths from Google's official Material Symbols Outlined 24px set at Weight 400 and Fill 0. Icon shapes do not change with the VS Code theme, while their colors follow VS Code theme colors. Package names, versions, copyright notices, and complete bundled license texts are available in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
