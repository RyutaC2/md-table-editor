# Change Log

All notable changes to Markdown Table GUI are documented in this file.

## [1.0.0] - 2026-08-11

- Publish the first stable release as `Markdown Table GUI` with the Marketplace identifier `RyutaC2.markdown-table-gui`.
- Detect, insert, and edit GFM Markdown tables through an Excel-like virtualized grid in VS Code Desktop and Web.
- Synchronize cell, row, column, alignment, sorting, and width operations to the Markdown source with standard Save and Undo/Redo behavior.
- Support continuous keyboard editing, rectangular and disjoint selection, safe cell and row/column movement, responsive themed controls, and CSV/XLSX import and export.
- Include English and Japanese interfaces, local Material Symbols, a Marketplace icon, accessibility metadata, release documentation, and Desktop/Web verification.

## [0.2.8] - 2026-08-11

- Enter edit mode automatically after a plain single-cell click or keyboard move, while preserving drag, Shift, and Ctrl/Cmd range selection.
- Keep editing continuously after Enter, Shift+Enter, Tab, or Shift+Tab confirms and moves to the next cell.
- Add the 256 × 256 PNG Marketplace icon derived from the supplied SVG artwork.

## [0.2.7] - 2026-08-11

- Move to the next row with Enter, previous row with Shift+Enter, next column with Tab, and previous column with Shift+Tab after confirming a cell edit.
- Confirm the active edit and select another cell with the same click instead of requiring a second click.
- Match the calculated Markdown header height to its 2px title separator.

## [0.2.6] - 2026-08-11

- Fix regular table insertion so every advertised size from 1×1 through 20×20 is created without being truncated to 8×8.
- Localize the initial loading message and active cell editor label, including the A0-style cell reference for screen readers.
- Declare full support for Restricted Mode and virtual workspaces, and validate complete bundled dependency license notices during production packaging.
- Extend the repeatable performance benchmark with CSV and XLSX import/export measurements at the guaranteed table size.
- Add concise v1 user-acceptance, Marketplace publishing, and vulnerability-reporting documentation.
- Slightly reduce the blue active-selection frame and normalize the row 0 title separator to a clear 2px rule.

## [0.2.5] - 2026-08-11

- Add a persistent bottom status bar showing the active cell reference and current table dimensions.
- Allow a single selected cell to be moved by dragging the same selection border used for rectangular ranges.
- Adjust responsive toolbar thresholds to give labeled controls more margin while retaining the icon-only single row at narrower widths.
- Reduce excess space below wrapped text and to the right of auto-fitted content by aligning row estimates with compact cell padding and column geometry.

## [0.2.4] - 2026-08-11

- Remove the unused leading space from the zoom control while retaining a stable width for every zoom level.
- Give whole-table alignment icons explicit hover and accessibility labels that describe both the scope and resulting alignment.
- Remove blue outlines from selected row, column, and corner headings while retaining selection fill and cell-range borders.
- Rename the table-opening CodeLens and context command to `Edit Table` / `テーブルを編集`, and shorten width actions to `Fit column width` / `列幅を調整` and their all-column equivalents.
- Localize the two Japanese editor context commands as `テーブルをクイック挿入（2 × 2）` and `テーブルを挿入`.

## [0.2.3] - 2026-08-11

- Restore whole-table auto-fit with the official `fit_width` Material Symbol at the far right of one-row toolbars, below zoom in two-row toolbars, and inside the compound menu at the narrowest width.
- Add a `fit_width` auto-fit action for the current column to every column menu.
- Name editor tabs `table: <filename>` so the source document remains identifiable regardless of table headers.
- Calculate wrapped row heights from rendered Markdown text and explicit grid line-height metrics, preventing hidden link destinations and accumulated line-height drift from adding empty vertical space.

## [0.2.2] - 2026-08-11

- Keep the fuller toolbar layouts visible at narrower widths by moving the responsive breakpoints to 1400px, 1000px, and 600px.
- Replace the four direct alignment controls in the narrowest layout with one alignment menu, matching the combined width of its file/zoom, Undo, and Redo controls to the four clipboard controls above.
- Replace the native zoom select with one shared themed menu for direct and compound layouts, preventing unreadable foreground/background combinations and square nested focus rings.
- Style toolbar, zoom, alignment, and column menu surfaces like VS Code context menus using menu, selection, focus, contrast, light, dark, and forced-color theme tokens.
- Add Desktop integration coverage that keeps an open table Webview alive while switching through built-in light, dark, dark high-contrast, and light high-contrast themes.

## [0.2.1] - 2026-08-11

- Refine the toolbar into four responsive layouts: labeled one-row, icon-only one-row, icon-only two-row, and partially collapsed two-row.
- Keep the requested action groups together at intermediate widths and remove the stray divider at the start of the second row.
- Widen the compound menu for translated labels and replace the plain zoom select with a compact, rounded control using the official `expand_more` Material Symbol.
- Continue row and column range selection when the pointer leaves the narrow heading and enters the grid, without retaining the reorder cursor during selection.
- Strengthen selection borders, separate selected-cell fill from its frame, distinguish axis and title surfaces, and keep a visible divider below row 0.

## [0.2.0] - 2026-08-11

- Add a no-dialog 2 × 2 quick insert command and change custom insertion to separate 1–20 row and column choices.
- Number the Markdown header as row 0, select continuous row or column ranges on the first heading drag, and reorder the selected block on a second drag.
- Select the complete table by clicking the top-left grid corner.
- Show a draggable border around continuous multi-cell selections and move their raw Markdown values without crossing table edges or losing overlapping data.
- Import and replace the complete current table from UTF-8 CSV or XLSX, choose from multiple XLSX worksheets, and export the complete table to CSV or XLSX.
- Zoom the complete virtualized grid from 50% to 200% at seven fixed levels while keeping the toolbar at a stable UI size.
- Rebuild the toolbar in the requested action order with responsive direct and menu layouts, toolbar paste, whole-table alignment, and selection-count row or column insertion.
- Use the official `content_paste` and `format_align_*` Material Symbols paths alongside the specified import and export icons.

## [0.1.13] - 2026-08-11

- Grow the Markdown header row as well as body rows when rendered cell content wraps.
- Tighten the character-to-pixel width model and auto-fit columns from visible text rather than Markdown decoration or link targets.
- Keep every toolbar layout left-aligned and use two rows for the narrow icon-only layout.
- Keep the column-resize cursor stable for the complete pointer gesture.
- Render sticky selected header cells over an opaque surface and allow a selection to restart without native content dragging.

## [0.1.12] - 2026-08-11

- Fix excessive body-row heights when narrow Markdown widths are rendered at the grid's minimum column width.
- Share the effective pixel-width calculation between column virtualization and wrapped-line estimation.
- Add regression coverage for minimum-width wrapping and tallest-cell row sizing.
- Publish the default README in English and provide a complete Japanese README through the link at the top.
- Add a severity-based user acceptance checklist and explicit release criteria for the v1 release candidate.

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
