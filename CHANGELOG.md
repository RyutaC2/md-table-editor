# Change Log

All notable changes to Markdown Grid Editor are documented in this file.

## [0.1.11] - 2026-08-11

- Expand pure unit coverage from 16 to 50 tests across parsing, serialization, operations, Unicode width, selection geometry, TSV, and pointer interactions.
- Add Desktop integration coverage for CodeLens arguments and Webview panel reuse, plus the equivalent Web edit-command path where tab enumeration is unavailable.
- Stop parsing four-space or tab-indented code lines as Markdown table delimiters or body rows.
- Correct display widths for flag and keycap emoji, cache grapheme segmentation, and add an ASCII fast path.
- Reject non-finite operation widths and safely normalize non-finite insertion indexes and counts.
- Keep Webview selection messages bound to the latest table snapshot after rows or columns are added.
- Avoid applying the same optimistic GUI operation twice and improve large row/column calculations.
- Add a reproducible `npm run benchmark` command for guaranteed and oversized tables.

## [0.1.10] - 2026-08-11

- Apply each column's left, center, or right Markdown alignment immediately to header cells, body cells, and active cell inputs in the GUI.
- Display columns without an explicit Markdown alignment as left-aligned in the grid.

## [0.1.9] - 2026-08-11

- Keep the labeled two-row toolbar down to 800px and switch to icon-only controls at 799px and below.
- Add middle-button drag panning for navigating tables that overflow in either direction.
- Use Google's official Material Symbols Outlined `more_horiz` icon for the column menu trigger.
- Stabilize single-click cell selection with a drag threshold, left-button filtering, latest-request selection syncing, and redundant source-event suppression.

## [0.1.8] - 2026-08-11

- Stop reselecting the complete cell input after every character, allowing continuous half-width and IME text entry.
- Extend the append-column control along the complete table height and stop the append-row control at the table width.
- Keep the bottom-right intersection between the row and column append controls empty.
- Remove the divider between Undo, Redo, and the global width-fit action.

## [0.1.7] - 2026-08-11

- Replace simplified icon drawings with the official Material Symbols Outlined 24px SVG paths from Google.
- Move the global width-fit action next to Undo and Redo.
- Switch to the icon-only toolbar at 899px and below, and add clearer spacing between action groups.

## [0.1.6] - 2026-08-11

- Close an open column menu when clicking elsewhere or scrolling the grid.
- Keep column menus inside the visible grid viewport, including the first column.
- Add slim plus buttons at the right and bottom table edges for appending columns and rows.

## [0.1.5] - 2026-08-11

- Add toolbar buttons to copy, cut, and delete the contents of selected cells.
- Keep Markdown source values in the custom clipboard format when the Webview supports it, with TSV as the interoperable fallback.
- Place row operations directly above column operations in the labeled two-row toolbar layout.
- Adjust responsive toolbar breakpoints for the additional clipboard controls without introducing a scrollbar.

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
