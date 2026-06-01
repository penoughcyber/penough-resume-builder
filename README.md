# ProCV Builder

A professional, ATS-friendly CV builder with live preview, PDF export, and an **AI Writing Assistant** powered by Claude (Anthropic).

---

## Features

- 📝 Live CV preview (edits reflect instantly)
- 📄 One-click PDF download via `@react-pdf/renderer`
- 💾 Auto-save to browser localStorage
- 📦 JSON import / export
- ✨ **AI Writing Assistant** — Claude improves your CV writing on command, with streaming output, apply/discard, and undo

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| PDF generation | `@react-pdf/renderer` |
| AI backend | Django 5 + Anthropic SDK |
| AI model | Claude Sonnet (via Anthropic API) |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- An **Anthropic API key** — get one free at [console.anthropic.com](https://console.anthropic.com)

---

### 1 — Frontend

```bash
# From the project root
npm install
npm run dev
```

Opens at **http://localhost:5173**

---

### 2 — Backend (AI Assistant)

```bash
cd backend

# Install Python dependencies (first time only)
pip install django anthropic

# Add your API key
# Edit backend/.env and paste your key:
#   ANTHROPIC_API_KEY=sk-ant-...

# Start the Django server
python manage.py runserver 8000
```

The backend runs at **http://127.0.0.1:8000** — the Vite dev server automatically proxies `/api/*` there.

---

### 3 — Using the AI Assistant

1. Open http://localhost:5173
2. Click the purple **✨ AI Assistant** button (bottom-right)
3. Pick a quick suggestion or type your own instruction
4. Click **Send** — see Claude improve your CV in real time
5. Click **Apply** to update your CV, or **Discard** to cancel
6. An **Undo** toast appears for 6 seconds if you change your mind

> **Note:** The frontend works without the backend running. The AI button and panel will show an error state if the backend is offline — everything else works normally.

---

## Project Structure

```
pro-cv-builder/
├── src/
│   ├── components/
│   │   ├── AIAssistant.jsx     # Floating AI panel (streaming, apply, undo)
│   │   ├── CVEditor.jsx        # Collapsible form editor
│   │   ├── CVPreview.jsx       # Live HTML preview
│   │   └── CVDocument.jsx      # PDF layout (@react-pdf/renderer)
│   ├── utils/
│   │   ├── aiHelper.js         # SSE streaming, JSON patch, undo helpers
│   │   ├── storage.js          # localStorage persistence
│   │   └── parsers.js          # Pipe-delimited text parsers
│   └── data/
│       └── sampleData.js       # Demo CV + empty template
├── backend/
│   ├── .env                    # ← paste ANTHROPIC_API_KEY here
│   ├── manage.py
│   ├── config/                 # Django project settings & URLs
│   └── cv_ai/                  # AI proxy app (views.py, urls.py)
├── vite.config.js              # Vite + /api proxy to Django
└── package.json
```

---

## Build for Production

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build locally
```

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `ANTHROPIC_API_KEY` | `backend/.env` | Your Anthropic API key (`sk-ant-...`) |
