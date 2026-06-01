# Pro CV Builder - File Upload & Extract Feature - Setup Guide

## ✅ Implementation Complete!

All backend and frontend components have been successfully implemented. Your project now supports:
- **PDF extraction** with structured text parsing
- **Word document extraction** (DOCX format)
- **Image extraction** with OCR & Vision API support
- **Smart conflict detection** between extracted and current CV data
- **Dual import UI** (in chat + in form)
- **Section-by-section merge preview** with user control

---

## 🚀 Quick Start

### 1. Install Python Dependencies

Open terminal in the backend directory and run:

```bash
cd backend
pip install -r requirements.txt
```

**Required packages** (in requirements.txt):
- `django==5.2.7` - Web framework
- `google-genai==0.4.0` - Gemini API client
- `pdfplumber==0.10.3` - PDF extraction
- `python-docx==1.2.4` - Word document extraction
- `Pillow==10.1.0` - Image processing
- `pytesseract==0.3.10` - OCR for images
- `python-multipart==0.0.6` - File upload handling

### 2. Install Tesseract (for Image OCR - Optional)

If you want OCR support for image files:

**Windows**:
- Download installer: https://github.com/UB-Mannheim/tesseract/wiki
- Install to: `C:\Program Files\Tesseract-OCR` (or custom path)
- Set environment variable: `TESSDATA_PREFIX=C:\Program Files\Tesseract-OCR\tessdata`

**macOS**:
```bash
brew install tesseract
```

**Linux**:
```bash
sudo apt-get install tesseract-ocr
```

### 3. Run the Application

Start the Django backend:

```bash
cd backend
python manage.py runserver
```

Start the Vite frontend:

```bash
# In project root
npm run dev
```

---

## 📋 What Was Implemented

### Backend Changes

#### New Endpoint: `/api/ai/extract-resume/` (POST)

**Purpose**: Upload and extract resume data from files

**Request**:
```
POST /api/ai/extract-resume/
Content-Type: multipart/form-data

file: (binary) PDF, DOCX, or image file
max size: 5 MB
```

**Response**:
```json
{
  "success": true,
  "extracted_data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1 234 567 8900",
    "experiences": [...],
    "education": [...],
    "objective": "...",
    ...
  },
  "raw_text": "full extracted text",
  "file_type": "pdf|word|image",
  "extraction_method": "code_based",
  "confidence_score": 0.7,
  "filename": "resume.pdf"
}
```

#### New Endpoint: `/api/ai/validate-and-merge/` (POST)

**Purpose**: Validate extracted data and detect conflicts with current CV

**Request**:
```json
{
  "extracted_data": {...},
  "current_data": {...},
  "merge_choices": {
    "field_name": "keep|extracted|value"
  },
  "raw_text": "raw extracted text for AI validation"
}
```

**Response**:
```json
{
  "success": true,
  "validated_data": {...merged CV...},
  "conflicts": [
    {
      "field": "objective",
      "extracted": "extracted version",
      "current": "current version",
      "recommendation": "keep"
    }
  ],
  "applied_changes": [...],
  "summary": "Merged successfully"
}
```

### Backend Files

**New File**: `backend/cv_ai/extractors.py`
- `PDFExtractor` - Extracts text from PDF files
- `WordExtractor` - Extracts text from DOCX files
- `ImageExtractor` - Extracts text from images using OCR
- `get_extractor()` - Factory function to select appropriate extractor
- `validate_resume_data()` - Validates extracted data against schema

**Modified**: `backend/cv_ai/views.py`
- Added `/api/ai/extract-resume/` endpoint
- Added `/api/ai/validate-and-merge/` endpoint
- Generates AI prompts for validation and conflict detection

**Modified**: `backend/cv_ai/urls.py`
- Registered new endpoints

**Modified**: `backend/config/settings.py`
- File upload size configuration (5 MB limit)
- Temporary upload directory creation

**New File**: `backend/requirements.txt`
- All Python dependencies

### Frontend Changes

#### New Component: `FileUploader.jsx`

Handles file selection and upload with:
- Drag-and-drop support
- File type/size validation
- Progress indicator
- Error messages
- Two modes: compact (icon button) & full (drop zone)

#### New Component: `MergePreview.jsx`

Displays conflict resolution UI with:
- Side-by-side extracted vs current data
- Per-field merge choices (keep current / use extracted)
- AI recommendations
- Organized by resume sections
- Modal support for standalone use

#### Modified: `AIAssistant.jsx`

Added file upload feature:
- Upload button (📎) in header
- FileUploader modal
- Extraction result shown in chat
- Interactive merge preview
- Undo support after merge

#### Modified: `CVEditor.jsx`

Added import section:
- "📥 Import Resume from File" section at top
- Direct FileUploader component
- Merge preview modal
- Success/error handling

#### Modified: `index.css`

Added styles for:
- Upload modal overlay and content
- Modal header, body, close button

### Data Flow

```
User uploads file (PDF/DOCX/Image)
          ↓
Frontend FileUploader
          ↓
Backend /extract-resume/ endpoint
          ↓
Select appropriate extractor (PDF/Word/Image)
          ↓
Extract text & structure, validate schema
          ↓
Return extracted_data + raw_text
          ↓
Frontend sends to /validate-and-merge/ for AI validation
          ↓
Gemini reviews, detects conflicts, provides recommendations
          ↓
Show MergePreview with conflicts organized by section
          ↓
User selects merge choices (keep/extracted per field)
          ↓
Backend applies choices + AI validation
          ↓
Frontend updates CV with merged data
          ↓
Undo available for 7 seconds
```

---

## 🧪 Testing

### Test 1: Extract from PDF

1. Open the app, click AI Assistant upload button (📎)
2. Select a PDF resume
3. Check that data appears in chat message
4. Click "Apply Merge" to test conflict resolution

### Test 2: Extract from Word Document

1. Use same upload flow with a .DOCX file
2. Verify field extraction

### Test 3: Extract from Image

1. Upload a screenshot or image of a resume
2. If Tesseract is installed, OCR text will be extracted
3. Otherwise, shows message to use Vision API mode

### Test 4: CVEditor Import

1. Click "📥 Import Resume from File" section
2. Upload file
3. MergePreview opens directly
4. Select merge choices
5. Click "Apply Merge"
6. Verify CV updated with success message

### Test 5: From-Scratch Scenario

1. Clear all CV data
2. Upload resume file via either entry point
3. Extracted data populates empty CV
4. Apply merge

### Test 6: Conflict Resolution

1. Fill in current CV with some data (e.g., objective)
2. Upload file with different objective
3. In MergePreview, should show conflict
4. Can choose to keep current, use extracted, or edit
5. Verify final merged result

### Test 7: Error Handling

1. Upload non-supported file type (e.g., .txt)
2. Upload file >5MB
3. Upload corrupted file
4. Network error during upload

---

## 🔧 Configuration

### Environment Variables

In `backend/.env`, ensure you have:

```env
GEMINI_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_MOCK=false
```

### File Upload Limits

Configured in `backend/config/settings.py`:
```python
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5 MB
```

To increase, modify the values.

### Supported File Types

- **PDF**: `.pdf`
- **Word**: `.docx`, `.doc`
- **Images**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`

---

## 🎯 How to Use

### Via AI Assistant Chat

1. Open AI Assistant (magic wand icon)
2. Click upload button (📎) in header
3. Select resume file
4. AI extracts and shows in chat
5. Review extracted sections
6. Click "Merge" button
7. Select merge choices in popup
8. Click "Apply Merge"
9. Done! CV updated

### Via CVEditor Form

1. Scroll to "📥 Import Resume from File" section
2. Drag & drop or click to select file
3. Merge preview opens automatically
4. Select merge choices by field
5. Click "Apply Merge"
6. CV updates, success message

---

## 🐛 Troubleshooting

### "File too large" error
- Reduce file size or increase limit in settings.py
- PDFs with many images tend to be larger

### "Unsupported file type" error
- Only PDF, DOCX, and images are supported
- Re-save Word document as DOCX format

### OCR not working on images
- Tesseract may not be installed
- Install via instructions above
- Or rely on Gemini Vision API (fallback)

### Extraction has errors/missing fields
- Complex layouts may not parse perfectly
- Review extracted data in merge preview
- Manually edit if needed before merge

### "GEMINI_API_KEY not configured"
- Ensure `.env` file exists in backend directory
- Set valid GEMINI_API_KEY value
- Restart Django server

### Merge preview doesn't show
- Check browser console for errors
- Ensure backend is running and `/api/ai/validate-and-merge/` endpoint is accessible
- Try manual refresh

---

## 📝 Notes

- **Extraction quality**: Code-based extraction works well for structured resumes. Complex layouts may need manual adjustment.
- **AI validation**: Gemini runs secondary validation to catch errors and suggest best practices.
- **Conflict detection**: Only shows conflicts for fields that exist in both current and extracted data.
- **Undo**: 7-second window to undo merged changes via button in toast notification.
- **Batch operations**: Single file at a time; multiple extractions can be done sequentially.

---

## 🎓 Architecture Overview

### Extraction Pipeline

```
File Upload
    ↓
File Type Detection (extension-based)
    ↓
Select Extractor Class
    ├─ PDFExtractor (pdfplumber)
    ├─ WordExtractor (python-docx)
    └─ ImageExtractor (pytesseract)
    ↓
Extract Raw Text & Attempt Structure Parsing
    ↓
Validate Against Resume Schema
    ↓
Return: extracted_data + raw_text
```

### AI Validation Pipeline

```
Extracted Data + Current Data
    ↓
Build Validation Prompt with:
  - Extracted data
  - Current CV data
  - Raw text for context
    ↓
Call Gemini with JSON response mode
    ↓
Parse Response (conflicts, recommendations, merged data)
    ↓
Return: {validated_data, conflicts, summary}
```

### Merge Resolution

```
User Selects Choices per Field
    ↓
Build Merge Request with:
  - Extracted data
  - Current data
  - User's merge_choices
    ↓
Send to /validate-and-merge/
    ↓
AI applies merge logic + user choices
    ↓
Return: Final merged CV
    ↓
Frontend applies to central state
    ↓
UI updates + success toast
```

---

## 🚀 Future Enhancements

Possible improvements for future iterations:

1. **Batch Processing**: Handle multiple file uploads at once
2. **Format Preservation**: Maintain styling/formatting from uploaded resume
3. **Template Mapping**: Auto-map unknown resume fields to closest match
4. **Training**: Learn user preferences over time for smarter merges
5. **Async Processing**: Handle large files without blocking UI
6. **Preview Before Merge**: Show final merged result before confirming
7. **Field-level Versioning**: Keep history of merges per field
8. **Custom Extractors**: Allow users to train extractors for custom fields

---

## ✨ Summary

Your CV builder now has a professional resume import feature! Users can:
- ✅ Upload PDF, Word, or Image resumes
- ✅ Automatically extract structured data
- ✅ Review AI-detected conflicts
- ✅ Merge with intelligent conflict resolution
- ✅ Build resume from scratch via upload
- ✅ Maintain control with field-by-field merge choices

All while keeping your existing AI writing assistant fully functional!

---

**Need help?** Check logs in browser console (F12) and Django server output for error details.
