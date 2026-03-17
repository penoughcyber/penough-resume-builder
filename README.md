# Professional CV Builder (Offline)

This project builds a **professional CV** using **React** and **@react-pdf/renderer** for programmatic PDF generation. The format closely matches the original template structure (single-column, serif typography, section hierarchy, compact spacing).

## What is included

- Fully offline static app (no backend, no internet required)
- Live CV preview with embedded PDF viewer
- Professional section structure
- **Download PDF** – direct PDF generation via @react-pdf/renderer (no browser print)
- Local autosave in browser storage
- JSON import/export of CV data

## Tech Stack

- React 18
- Vite
- @react-pdf/renderer

## Files

- `src/App.jsx` – Main app, PDFViewer, toolbar, persistence
- `src/components/CVEditor.jsx` – Collapsible form editor
- `src/components/CVDocument.jsx` – PDF document (Document, Page, View, Text, Link)
- `src/data/sampleData.js` – Sample CV data and default section titles
- `src/utils/parsers.js` – Parsing helpers for pipe-delimited blocks
- `src/utils/storage.js` – localStorage persistence

## Use

1. Run `npm install` then `npm run dev`
2. Open http://localhost:5173
3. Fill details in the left panel
4. Use **Download PDF** to get your CV as a PDF file

## Build

```bash
npm run build
npm run preview
```

## Notes

- The layout, spacing, and section flow mirror the original template
- Font sizes are tuned to PDF point values (10pt body, 12pt headings, 24pt name)
- PDF uses Times-Roman (built-in) for compatibility; custom fonts can be registered via `Font.register()` if needed
