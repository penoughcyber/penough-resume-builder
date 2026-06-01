/**
 * aiHelper.js — AI CV assistant utilities (multi-turn chat edition)
 */

const AI_ENDPOINT = '/api/ai/improve-cv/';

/**
 * Stream an AI improvement request via SSE.
 * @param {string} command           - User's latest message
 * @param {object} cvData            - Current CV data object
 * @param {Array}  history           - Prior messages [{role:'user'|'model', text:string}]
 * @param {function} onChunk         - Called with each SSE text delta (string)
 * @param {function} onDone          - Called with full accumulated text when stream ends
 * @param {function} onError         - Called with an Error on failure
 * @returns {function} abort         - Call to cancel the stream
 */
export function streamImproveCV(command, cvData, history, onChunk, onDone, onError) {
    const controller = new AbortController();

    (async () => {
        try {
            const res = await fetch(AI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command, cvData, history: history || [] }),
                signal: controller.signal,
            });

            if (!res.ok) {
                let msg = `Server error ${res.status}`;
                try {
                    const j = await res.json();
                    if (j.error) msg = j.error;
                } catch (_) { /* ignore */ }
                throw new Error(msg);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let accumulated = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const payload = line.slice(6).trim();
                    if (payload === '[DONE]') {
                        onDone(accumulated);
                        return;
                    }
                    accumulated += payload;
                    onChunk(payload);
                }
            }
            onDone(accumulated);
        } catch (err) {
            if (err.name !== 'AbortError') onError(err);
        }
    })();

    return () => controller.abort();
}

/**
 * Parse the structured AI chat response: {"message": "...", "patch": {...}|null}
 * Falls back gracefully when JSON is malformed.
 * @param {string} rawText
 * @returns {{ message: string, patch: object|null }}
 */
export function parseAiChatResponse(rawText) {
    if (!rawText || typeof rawText !== 'string') {
        return { message: 'No response received.', patch: null };
    }

    let cleaned = rawText.trim();
    // Strip markdown fences
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    // Take outermost { ... }
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
        cleaned = cleaned.slice(start, end + 1);
    }

    try {
        const obj = JSON.parse(cleaned);
        const message =
            typeof obj.message === 'string' && obj.message.trim()
                ? obj.message.trim()
                : typeof obj.error === 'string'
                  ? obj.error
                  : 'Done.';
        const patch =
            obj.patch && typeof obj.patch === 'object' && !Array.isArray(obj.patch)
                ? obj.patch
                : null;
        return { message, patch };
    } catch (_) {
        // If totally unparseable, surface the raw text as the message
        return { message: rawText.trim() || 'No response received.', patch: null };
    }
}

/**
 * Apply a JSON patch (partial update) to the current CV data.
 * @param {object} currentData
 * @param {object} patch
 * @returns {object} new data object (deep clone with patch applied)
 */
export function applyPatch(currentData, patch) {
    const next = structuredClone(currentData);
    for (const [key, value] of Object.entries(patch)) {
        next[key] = value;
    }
    return next;
}

/**
 * Return a human-readable summary of what keys were changed.
 * @param {object} patch
 * @returns {string}
 */
export function describeChanges(patch) {
    if (!patch || typeof patch !== 'object') return 'No changes';
    const keys = Object.keys(patch);
    if (keys.length === 0) return 'No changes';
    const friendly = {
        objective: 'Professional Profile',
        interests: 'Technical Proficiencies',
        competencies: 'Operational Expertise',
        technologies: 'Core Tech Stack',
        tagline: 'Tagline',
        experiences: 'Experience',
        education: 'Education',
        highlights: 'Key Achievements',
        projects: 'Projects',
        books: 'Publications',
        certifications: 'Certifications',
        volunteering: 'Volunteering',
    };
    const labels = keys.map((k) => friendly[k] || k);
    if (labels.length === 1) return `Updated: ${labels[0]}`;
    if (labels.length === 2) return `Updated: ${labels[0]} and ${labels[1]}`;
    return `Updated: ${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}
