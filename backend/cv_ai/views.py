import json
import os
import re
import traceback
from google import genai
from google.genai import types as genai_types
from django.http import StreamingHttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .extractors import get_extractor, validate_resume_data

SYSTEM_PROMPT = """You are an expert CV/resume writing assistant having a real conversation with a user about their CV.

═══════════════════════════════════════════════
RESPONSE FORMAT — ALWAYS return valid JSON
═══════════════════════════════════════════════
{"message": "your reply to the user", "patch": { CV fields you changed }}

- "message" (required): Your conversational reply. Be helpful, natural, and concise.
- "patch" (optional): Include ONLY when actually modifying CV content. Omit the key entirely if just reading/explaining/chatting.

═══════════════════════════════════════════════
UNDERSTANDING USER INTENT
═══════════════════════════════════════════════
You understand anything the user types — formal or informal:

Read/Show intent (no patch, put content in message):
  "what does my summary say", "read my experience", "show education",
  "what's in my certifications", "tell me my tagline", "list my projects"

Improve/Update intent (provide patch):
  "improve my summary", "make it shorter", "stronger verbs",
  "rewrite experience bullets", "update that section", "fix it",
  "make it more professional", "enhance", "polish", "rephrase",
  "tweak", "revise", "change", "update it", "redo", "clean it up"

Context inference — use conversation history:
  If user says "it" / "that" / "this section" → infer from recent messages what they mean
  If user says "make it shorter" after you improved their objective → shorten the objective
  If ambiguous, make a reasonable assumption and state it in your message

You can also: answer questions about CV writing, suggest what to improve,
explain why something reads a certain way, compare before/after, etc.

═══════════════════════════════════════════════
PATCH RULES (when you do return a patch)
═══════════════════════════════════════════════
- Include ONLY the keys you actually changed — never return the full CV
- Preserve all facts: company names, job titles, schools, dates, URLs, ISBNs
- Same array length and structure as source for any array you return
- Never modify sectionTitles
- String fields: objective, tagline, interests, competencies, technologies
- Array fields: experiences, education, highlights, projects, books, certifications, volunteering

Array schemas:
  experiences:   [{role, company, location, dateRange, bullets:[], focus}]
  education:     [{school, degree, dateRange, advisor, areas, awards, gpa}]
  highlights:    [{title, status, description, linkLabel, linkUrl}]
  projects:      [{name, bullets:[], linkLabel, linkUrl}]
  books:         [{title, isbn, description, linkLabel, linkUrl}]

═══════════════════════════════════════════════
WRITING QUALITY (when improving)
═══════════════════════════════════════════════
- Strong verbs: architected, spearheaded, engineered, delivered, optimised,
  automated, mentored, orchestrated, accelerated, reduced, established
- Quantify where source data has numbers
- Remove filler: "responsible for", "helped with", "worked on", "assisted in"
- Keep similar length unless asked otherwise

═══════════════════════════════════════════════
CURRENT CV DATA
═══════════════════════════════════════════════
{cv_data_json}
"""


@csrf_exempt
@require_POST
def improve_cv(request):
    """
    POST /api/ai/improve-cv/
    Body: { "command": string, "cvData": object, "history": [{role, text}] }
    Returns: SSE stream — JSON {"message": "...", "patch": {...}|null}
    """
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Invalid JSON body.'}, status=400)

    command = body.get('command', '').strip()
    cv_data = body.get('cvData')
    history = body.get('history', [])

    if not command:
        return JsonResponse({'error': 'Missing "command" field.'}, status=400)
    if not cv_data or not isinstance(cv_data, dict):
        return JsonResponse({'error': 'Missing or invalid "cvData" field.'}, status=400)

    use_mock = os.environ.get('GEMINI_MOCK', '').strip().lower() in ('1', 'true', 'yes')
    api_key = os.environ.get('GEMINI_API_KEY', '')
    gemini_model = (os.environ.get('GEMINI_MODEL') or 'gemini-2.5-flash').strip()
    if not use_mock and not api_key:
        return JsonResponse({'error': 'GEMINI_API_KEY is not configured on the server.'}, status=500)

    system_prompt = SYSTEM_PROMPT.replace(
        '{cv_data_json}',
        json.dumps(cv_data, indent=2, ensure_ascii=False),
    )

    # Build multi-turn contents list from conversation history
    def build_contents(hist, current_command):
        contents = []
        for msg in (hist or [])[-20:]:
            role = msg.get('role')
            text = str(msg.get('text', '')).strip()
            if role in ('user', 'model') and text:
                contents.append({'role': role, 'parts': [{'text': text}]})
        contents.append({'role': 'user', 'parts': [{'text': current_command}]})
        return contents

    def event_stream():
        if use_mock:
            mock_text = os.environ.get(
                'GEMINI_MOCK_RESPONSE',
                '{"message": "[MOCK] The AI pipeline is working. Add a real GEMINI_API_KEY to get actual CV improvements. As a demo, I updated your professional profile.", "patch": {"objective": "[MOCK] Seasoned security professional with expertise in SIEM/SOAR architecture, digital forensics, and penetration testing. Spearheads detection engineering, automates alert triage, and delivers actionable threat intelligence to enterprise stakeholders."}}',
            )
            chunk_size = max(1, int(os.environ.get('GEMINI_MOCK_CHUNK', '64')))
            for i in range(0, len(mock_text), chunk_size):
                yield f'data: {mock_text[i : i + chunk_size]}\n\n'
            yield 'data: [DONE]\n\n'
            return
        try:
            client = genai.Client(api_key=api_key)
            contents = build_contents(history, command)
            stream = client.models.generate_content_stream(
                model=gemini_model,
                contents=contents,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    max_output_tokens=8192,
                    temperature=0.4,
                    response_mime_type='application/json',
                ),
            )
            for chunk in stream:
                text = chunk.text if chunk.text else ''
                if text:
                    yield f'data: {text}\n\n'
            yield 'data: [DONE]\n\n'
        except Exception as e:
            err_json = json.dumps({'message': f'[ERROR] {str(e)}', 'patch': None})
            yield f'data: {err_json}\n\n'
            yield 'data: [DONE]\n\n'

    response = StreamingHttpResponse(
        event_stream(),
        content_type='text/event-stream',
    )
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response


# ═══════════════════════════════════════════════════════════════════════════
# FILE UPLOAD & EXTRACTION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.gif', '.bmp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


EXTRACT_AI_PROMPT = """You are a resume parsing engine.

You will receive:
- a plain-text resume (extracted from PDF/DOCX/image OCR)
- a target JSON schema template (keys + shapes)

Your job:
- Return ONLY valid JSON matching the schema exactly.
- Fill as many fields as possible from the resume.
- Do not invent facts. If unknown, use empty string "" or empty array [].
- Normalize:
  - experiences: list of roles with company/location/dateRange and bullets (array of strings)
  - education: list with school/degree/dateRange and optional gpa/advisor/areas/awards
  - projects/highlights/books similarly
- Prefer keeping URLs in website/linkedin/github fields if present.
- For skills: map into interests/competencies/technologies where reasonable.
- Keep bullets concise (1 line each). No leading bullet symbols in strings.

Return JSON only. No markdown. No commentary.

TEMPLATE:
{template_json}

RESUME TEXT:
{raw_text}
"""


def _parse_json_lenient(text: str):
    """
    Robust JSON parser for AI responses. Handles common issues Gemini may
    introduce despite response_mime_type='application/json':
      - Markdown code fences
      - Leading/trailing commentary
      - Trailing commas before } or ]
      - JavaScript-style // and /* */ comments
      - Truncated JSON when output hits max_output_tokens
    """
    if not text:
        raise ValueError("Empty AI response")

    t = text.strip()
    t = re.sub(r"^```(?:json)?\s*", "", t, flags=re.IGNORECASE).strip()
    t = re.sub(r"\s*```$", "", t).strip()

    start = t.find("{")
    end = t.rfind("}")
    if start != -1 and end != -1 and end > start:
        t = t[start : end + 1]

    # Attempt 1: strict parse
    try:
        return json.loads(t)
    except json.JSONDecodeError as first_err:
        pass

    # Attempt 2: clean common AI mistakes and retry
    cleaned = t
    cleaned = re.sub(r"//[^\n]*", "", cleaned)
    cleaned = re.sub(r"/\*.*?\*/", "", cleaned, flags=re.DOTALL)
    cleaned = re.sub(r",(\s*[}\]])", r"\1", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Attempt 3: response was truncated — close any open braces/brackets
    repaired = _repair_truncated_json(cleaned)
    if repaired:
        try:
            return json.loads(repaired)
        except json.JSONDecodeError:
            pass

    # Give up — raise the original (most informative) error with a snippet
    snippet = t[:300].replace("\n", " ")
    raise ValueError(
        f"Could not parse AI JSON response: {first_err.msg} "
        f"(line {first_err.lineno}, col {first_err.colno}). "
        f"Snippet: {snippet}..."
    )


def _repair_truncated_json(text: str) -> str:
    """
    Best-effort repair for JSON that was cut off mid-stream.
    Walks the string and closes any open arrays/objects.
    """
    if not text:
        return ""

    # Drop a trailing partial token (incomplete string, partial number, etc.)
    # Find the last definitive structural character we can trust.
    in_string = False
    escape = False
    stack = []
    last_safe_idx = -1

    for i, ch in enumerate(text):
        if escape:
            escape = False
            continue
        if ch == "\\" and in_string:
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            if not in_string:
                last_safe_idx = i
            continue
        if in_string:
            continue
        if ch in "{[":
            stack.append(ch)
        elif ch in "}]":
            if stack:
                stack.pop()
                last_safe_idx = i
        elif ch in ",":
            last_safe_idx = i

    if last_safe_idx < 0:
        return ""

    truncated = text[: last_safe_idx + 1].rstrip().rstrip(",")

    # Close any still-open structures
    closing = []
    in_string = False
    escape = False
    stack2 = []
    for ch in truncated:
        if escape:
            escape = False
            continue
        if ch == "\\" and in_string:
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch in "{[":
            stack2.append(ch)
        elif ch in "}]":
            if stack2:
                stack2.pop()

    while stack2:
        opener = stack2.pop()
        closing.append("}" if opener == "{" else "]")

    return truncated + "".join(closing)


def _ai_map_raw_text_to_cv(raw_text: str) -> dict:
    use_mock = os.environ.get('GEMINI_MOCK', '').strip().lower() in ('1', 'true', 'yes')
    api_key = os.environ.get('GEMINI_API_KEY', '')
    # Default to flash-lite for extraction — much faster, still accurate enough
    # for structured-output tasks. Override with GEMINI_EXTRACT_MODEL if needed.
    gemini_model = (
        os.environ.get('GEMINI_EXTRACT_MODEL')
        or os.environ.get('GEMINI_MODEL')
        or 'gemini-2.5-flash'
    ).strip()
    if not use_mock and not api_key:
        raise RuntimeError('GEMINI_API_KEY is not configured on the server.')

    template = validate_resume_data({})  # empty schema template
    # Cap raw text — most resumes are 2-4 pages (~5-10k chars). 15k is plenty
    # and keeps the request fast.
    prompt = EXTRACT_AI_PROMPT.format(
        template_json=json.dumps(template, ensure_ascii=False, indent=2),
        raw_text=(raw_text or "")[:15000],
    )

    if use_mock:
        return template

    client = genai.Client(api_key=api_key)
    resp = client.models.generate_content(
        model=gemini_model,
        contents=[{'role': 'user', 'parts': [{'text': prompt}]}],
        config=genai_types.GenerateContentConfig(
            # Bumped to give headroom for detailed CVs; prevents mid-JSON truncation.
            max_output_tokens=16384,
            temperature=0.2,
            response_mime_type='application/json',
        ),
    )

    raw = resp.text if resp else ""
    try:
        obj = _parse_json_lenient(raw)
    except Exception:
        # Log a snippet so the issue is debuggable from the Django console.
        print(f"[extract_resume_ai] JSON parse failed. Raw response preview:\n{raw[:600]}\n...")
        raise

    if not isinstance(obj, dict):
        raise ValueError("AI response was not a JSON object")
    return validate_resume_data(obj)


@csrf_exempt
@require_POST
def extract_resume(request):
    """
    POST /api/ai/extract-resume/
    Multipart form: single file upload (PDF, DOCX, PNG, JPG, etc.)
    Returns: {
        "extracted_data": {...resume schema...},
        "raw_text": "full text extracted",
        "file_type": "pdf|word|image",
        "extraction_method": "code_based",
        "confidence_score": 0.0-1.0
    }
    """
    if 'file' not in request.FILES:
        return JsonResponse({'error': 'No file provided in request.'}, status=400)
    
    uploaded_file = request.FILES['file']
    
    # File size validation
    if uploaded_file.size > MAX_FILE_SIZE:
        return JsonResponse({
            'error': f'File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024):.0f} MB.'
        }, status=400)
    
    # File type validation
    file_name = uploaded_file.name
    file_ext = '.' + file_name.split('.')[-1].lower() if '.' in file_name else ''
    
    if file_ext not in ALLOWED_EXTENSIONS:
        return JsonResponse({
            'error': f'Unsupported file type: {file_ext}. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'
        }, status=400)
    
    try:
        # Read file content
        file_content = uploaded_file.read()
        
        # Select and run appropriate extractor
        try:
            extractor = get_extractor(file_content, file_name)
            extracted_data, raw_text = extractor.extract()
        except ValueError as ve:
            return JsonResponse({
                'error': f'Unsupported file type: {str(ve)}'
            }, status=400)
        
        # Validate and normalize extracted data
        extracted_data = validate_resume_data(extracted_data)
        
        # Determine file type for frontend
        if file_ext == '.pdf':
            file_type = 'pdf'
        elif file_ext in ('.docx', '.doc'):
            file_type = 'word'
        else:
            file_type = 'image'
        
        return JsonResponse({
            'success': True,
            'extracted_data': extracted_data,
            'raw_text': raw_text[:1000],  # Limit raw_text to 1000 chars for response
            'file_type': file_type,
            'extraction_method': 'code_based',
            'confidence_score': 0.7,
            'filename': file_name
        })
        
    except Exception as e:
        import traceback
        return JsonResponse({
            'error': f'Extraction failed: {str(e)}',
            'trace': traceback.format_exc()[:200]
        }, status=500)


@csrf_exempt
@require_POST
def extract_resume_ai(request):
    """
    POST /api/ai/extract-resume-ai/
    Multipart form: single file upload (PDF, DOCX, image)

    Pipeline:
      1) code-based extraction (pdfplumber/docx/ocr) -> raw_text
      2) Gemini maps raw_text -> CV schema JSON

    Returns: { extracted_data, raw_text_preview, file_type, extraction_method }
    """
    if 'file' not in request.FILES:
        return JsonResponse({'error': 'No file provided in request.'}, status=400)

    uploaded_file = request.FILES['file']
    if uploaded_file.size > MAX_FILE_SIZE:
        return JsonResponse({
            'error': f'File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024):.0f} MB.'
        }, status=400)

    file_name = uploaded_file.name
    file_ext = '.' + file_name.split('.')[-1].lower() if '.' in file_name else ''
    if file_ext not in ALLOWED_EXTENSIONS:
        return JsonResponse({
            'error': f'Unsupported file type: {file_ext}. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'
        }, status=400)

    try:
        file_content = uploaded_file.read()
        extractor = get_extractor(file_content, file_name)
        extracted_data, raw_text = extractor.extract()

        # Determine file type for frontend
        if file_ext == '.pdf':
            file_type = 'pdf'
        elif file_ext in ('.docx', '.doc'):
            file_type = 'word'
        else:
            file_type = 'image'

        # AI mapping step (this is the main value)
        ai_data = _ai_map_raw_text_to_cv(raw_text or "")

        return JsonResponse({
            'success': True,
            'extracted_data': ai_data,
            'raw_text': (raw_text or "")[:2000],
            'file_type': file_type,
            'extraction_method': 'ai_mapped',
            'confidence_score': 0.85,
            'filename': file_name
        })
    except Exception as e:
        return JsonResponse({
            'error': f'AI extraction failed: {str(e)}',
            'trace': traceback.format_exc()[:400]
        }, status=500)




@csrf_exempt
@require_POST
def validate_and_merge(request):
    """
    POST /api/ai/validate-and-merge/
    Lightweight conflict detection and merge (no AI needed).
    """
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Invalid JSON body.'}, status=400)
    
    extracted_data = body.get('extracted_data')
    current_data = body.get('current_data')
    merge_choices = body.get('merge_choices', {})
    
    if not extracted_data or not isinstance(extracted_data, dict):
        return JsonResponse({'error': 'Missing or invalid extracted_data'}, status=400)
    if not current_data or not isinstance(current_data, dict):
        return JsonResponse({'error': 'Missing or invalid current_data'}, status=400)
    
    try:
        # Detect conflicts between extracted and current data
        conflicts = []
        for field, extracted_value in extracted_data.items():
            current_value = current_data.get(field)
            
            # Skip empty values and arrays/dicts
            if not extracted_value or isinstance(extracted_value, (list, dict)):
                continue
            if not current_value or isinstance(current_value, (list, dict)):
                continue
            
            # Compare string values
            ext_str = str(extracted_value).strip()
            curr_str = str(current_value).strip()
            
            if ext_str and curr_str and ext_str.lower() != curr_str.lower():
                conflicts.append({
                    'field': field,
                    'extracted': ext_str[:200],
                    'current': curr_str[:200],
                    'recommendation': 'keep'
                })
        
        # Apply merge choices
        merged_data = {**current_data}
        applied_changes = []
        
        for field, extracted_value in extracted_data.items():
            current_value = current_data.get(field)
            choice = merge_choices.get(field, 'keep')
            
            # Apply choice
            if choice == 'extracted' and extracted_value:
                merged_data[field] = extracted_value
                applied_changes.append({
                    'field': field,
                    'action': 'updated',
                    'reason': 'user selected extracted'
                })
            elif isinstance(choice, str) and choice not in ('keep', 'extracted') and choice:
                # Manual value
                merged_data[field] = choice
                applied_changes.append({
                    'field': field,
                    'action': 'updated',
                    'reason': 'user entered custom'
                })
            elif not current_value and extracted_value:
                # Current empty, auto-use extracted
                merged_data[field] = extracted_value
                applied_changes.append({
                    'field': field,
                    'action': 'added',
                    'reason': 'current was empty'
                })
        
        return JsonResponse({
            'success': True,
            'validated_data': merged_data,
            'conflicts': conflicts,
            'applied_changes': applied_changes,
            'summary': f'Merged {len(applied_changes)} fields with {len(conflicts)} conflicts.'
        })
        
    except Exception as e:
        return JsonResponse({
            'error': f'Merge failed: {str(e)}',
        }, status=500)

