# Change Log

All notable changes to Markdown Grid Editor are documented in this file.

## [0.1.4] - 2026-08-11

- Output packaged VSIX files to the dedicated `artifacts/` directory.
- Generate the VSIX filename from the current package version.
- Upload VSIX files from `artifacts/` in GitHub Actions.

## [0.1.3] - 2026-08-11

- Render an open column menu above the sticky corner and row headers.
- Switch the toolbar between one labeled row, two labeled rows, and one icon-only row based on the Webview width.
- Reorder toolbar actions as history, rows, columns, and width adjustment.
- Use the requested Material Symbols for row and column insertion, deletion, undo, and redo.
- Show row and column deletion icons in the VS Code error color.

## [0.1.2] - 2026-08-11

- Fix single-column auto-fit being reverted by a competing no-op resize update.
- Split the toolbar into two rows and keep readable labels without a toolbar scrollbar.
- Replace ambiguous row and column icons with direction-specific icons.
- Add translucent drag previews, source highlighting, precise before/after drop targets, and full-cell drop areas.
- Close the column menu after alignment or sorting and reflect the active alignment in its trigger.

## [0.1.1] - 2026-08-11

- Double-click a column resize handle to automatically fit that column to its Markdown content width.
- Keep the previous global auto-fit action available from the toolbar.

## [0.1.0] - 2026-08-11

- Detect GFM Markdown tables and open an editor from CodeLens or the editor context menu.
- Insert blank tables without writing an initial Markdown template.
- Edit cells in an Excel-like virtualized grid beside the Markdown source.
- Support keyboard and range selection, TSV clipboard operations, rows, columns, alignment, sorting, and widths.
- Apply each confirmed GUI operation to the source immediately while leaving file saving to VS Code.
- Support Desktop and Web extension hosts, Japanese and English UI, VS Code themes, and accessible grid semantics.
