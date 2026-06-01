import { useState, useRef, useEffect, useCallback } from 'react';
import { streamImproveCV, parseAiChatResponse, applyPatch, describeChanges } from '../utils/aiHelper';
import FileUploader from './FileUploader';
import { MergePreviewModal } from './MergePreview';

const SUGGESTIONS = [
    'What does my professional profile say?',
    'Improve my professional summary',
    'Strengthen my experience bullet points',
    'Make my whole CV more professional',
    'What sections could I improve?',
];

const WELCOME = "Hi! I'm your CV writing assistant. Ask me anything — read a section, improve the writing, make it shorter, use stronger verbs, or just chat about what you'd like to change.";

let _msgId = 0;
const uid = () => String(++_msgId);

function MessageBubble({ msg, onApply, sectionTitles }) {
    const isUser = msg.role === 'user';
    const hasPatch = msg.patch && typeof msg.patch === 'object' && !Array.isArray(msg.patch);
    const patchLabel = hasPatch ? describeChanges(msg.patch) : '';

    return (
        <div className={`ai-chat-msg ${isUser ? 'ai-chat-msg--user' : 'ai-chat-msg--ai'}`}>
            {!isUser && (
                <div className="ai-chat-avatar">
                    <i className="fas fa-magic" />
                </div>
            )}
            <div className="ai-chat-bubble-wrap">
                <div className={`ai-chat-bubble ${msg.isError ? 'ai-chat-bubble--error' : ''}`}>
                    <p className="ai-chat-text">{msg.text}</p>
                    {hasPatch && (
                        <div className="ai-chat-patch-row">
                            {msg.applied ? (
                                <span className="ai-chat-applied-badge">
                                    <i className="fas fa-check-circle" /> Applied to CV
                                </span>
                            ) : (
                                <button
                                    className="ai-chat-apply-btn"
                                    onClick={() => onApply(msg)}
                                    type="button"
                                >
                                    <i className="fas fa-check" /> Apply: {patchLabel}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StreamingBubble({ text }) {
    return (
        <div className="ai-chat-msg ai-chat-msg--ai">
            <div className="ai-chat-avatar">
                <i className="fas fa-magic" />
            </div>
            <div className="ai-chat-bubble-wrap">
                <div className="ai-chat-bubble">
                    {text ? (
                        <p className="ai-chat-text">{text}<span className="ai-chat-cursor" /></p>
                    ) : (
                        <div className="ai-chat-thinking">
                            <span /><span /><span />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AIAssistant({ data, onApply }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [previousData, setPreviousData] = useState(null);
    const [undoVisible, setUndoVisible] = useState(false);
    const [changeLabel, setChangeLabel] = useState('');
    
    // File upload states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [showMergePreview, setShowMergePreview] = useState(false);
    const [mergeConflicts, setMergeConflicts] = useState([]);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const abortRef = useRef(null);
    const undoTimerRef = useRef(null);

    // Scroll to bottom whenever messages or streaming text changes
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingText]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [isOpen]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortRef.current) abortRef.current();
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        };
    }, []);

    const handleOpen = () => {
        setIsOpen(true);
        if (messages.length === 0) {
            setMessages([{ id: uid(), role: 'assistant', text: WELCOME, patch: null, applied: false, rawResponse: '' }]);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        if (abortRef.current) abortRef.current();
    };

    const handleNewChat = () => {
        if (abortRef.current) abortRef.current();
        setIsStreaming(false);
        setStreamingText('');
        setMessages([{ id: uid(), role: 'assistant', text: WELCOME, patch: null, applied: false, rawResponse: '' }]);
        setInputText('');
        setTimeout(() => inputRef.current?.focus(), 80);
    };

    // Build history array to send to backend
    const buildHistory = (msgs) =>
        msgs
            .filter((m) => m.text && m.role !== undefined)
            .slice(-20)
            .map((m) => ({
                role: m.role === 'user' ? 'user' : 'model',
                text: m.role === 'user' ? m.text : (m.rawResponse || m.text),
            }));

    const sendMessage = useCallback(
        (text) => {
            const trimmed = text.trim();
            if (!trimmed || isStreaming) return;

            const userMsg = { id: uid(), role: 'user', text: trimmed, patch: null, applied: false };
            const history = buildHistory(messages);

            setMessages((prev) => [...prev, userMsg]);
            setInputText('');
            resetInputHeight();
            setIsStreaming(true);
            setStreamingText('');

            let accumulated = '';

            const abort = streamImproveCV(
                trimmed,
                data,
                history,
                // onChunk — try to show partial message text live
                (chunk) => {
                    accumulated += chunk;
                    // Also try matching 'error' key for mid-stream error preview
                    const errorMatch = accumulated.match(/"error"\s*:\s*"((?:[^"\\]|\\.)*)/);
                    const msgMatch = accumulated.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)/);
                    const match = errorMatch || msgMatch;
                    if (match) {
                        let partial = match[1];
                        partial = partial.replace(/\\(.)/g, (_, c) => {
                            if (c === 'n') return '\n';
                            if (c === 't') return '\t';
                            if (c === '"') return '"';
                            if (c === '\\') return '\\';
                            return c;
                        });
                        setStreamingText(partial);
                    }
                },
                // onDone
                (fullText) => {
                    const { message, patch, isError } = parseAiChatResponse(fullText);
                    const aiMsg = {
                        id: uid(),
                        role: 'assistant',
                        text: message,
                        patch,
                        applied: false,
                        isError,
                        rawResponse: fullText,
                    };
                    setMessages((prev) => [...prev, aiMsg]);
                    setIsStreaming(false);
                    setStreamingText('');
                },
                // onError
                (err) => {
                    const errMsg = {
                        id: uid(),
                        role: 'assistant',
                        text: `Something went wrong: ${err.message || 'Unknown error'}. Please try again.`,
                        patch: null,
                        applied: false,
                        isError: true,
                        rawResponse: '',
                    };
                    setMessages((prev) => [...prev, errMsg]);
                    setIsStreaming(false);
                    setStreamingText('');
                }
            );

            abortRef.current = abort;
        },
        [messages, data, isStreaming]
    );

    const handleApply = useCallback(
        (msg) => {
            if (!msg.patch || msg.applied) return;
            const snapshot = structuredClone(data);
            const newData = applyPatch(data, msg.patch);
            const label = describeChanges(msg.patch);

            setPreviousData(snapshot);
            setChangeLabel(label);
            onApply(newData);
            setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, applied: true } : m)));

            setUndoVisible(true);
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
            undoTimerRef.current = setTimeout(() => setUndoVisible(false), 7000);
        },
        [data, onApply]
    );

    const handleUndo = () => {
        if (previousData) {
            onApply(previousData);
            setPreviousData(null);
            setMessages((prev) => {
                const last = [...prev].reverse().find((m) => m.applied);
                return last ? prev.map((m) => (m.id === last.id ? { ...m, applied: false } : m)) : prev;
            });
        }
        setUndoVisible(false);
    };

    const handleFileExtracted = async (extractionResult) => {
        // Show extracted data in chat
        const extractedMsg = {
            id: uid(),
            role: 'assistant',
            text: `I've extracted resume data from your ${extractionResult.file_type.toUpperCase()} file. Here's what I found:

**File**: ${extractionResult.filename}
**Extraction Method**: ${extractionResult.extraction_method}
**Confidence**: ${Math.round(extractionResult.confidence_score * 100)}%

**Extracted Sections**:
${Object.entries(extractionResult.extracted_data)
    .filter(([k, v]) => v && (typeof v === 'string' ? v.trim() : Array.isArray(v) ? v.length : v))
    .map(([k]) => `• ${k}`)
    .join('\n')}

Would you like me to merge this with your current resume? I can show you a preview so you can choose which data to keep.`,
            patch: null,
            applied: false,
            rawResponse: '',
        };

        setMessages((prev) => [...prev, extractedMsg]);
        setExtractedData(extractionResult.extracted_data);
        setShowUploadModal(false);

        // Auto-validate with backend AI
        await validateAndPrepareForMerge(extractionResult.extracted_data);
    };

    const validateAndPrepareForMerge = async (extracted) => {
        try {
            const response = await fetch('/api/ai/validate-and-merge/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    extracted_data: extracted,
                    current_data: data,
                    merge_choices: {},
                    raw_text: 'pending',
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Validation failed');
            }

            const result = await response.json();
            setMergeConflicts(result.conflicts || []);
            
            // Add follow-up message with merge options
            const followUp = {
                id: uid(),
                role: 'assistant',
                text: result.summary || 'Ready to merge! Review the extracted data and decide what to keep.',
                patch: null,
                applied: false,
                rawResponse: '',
            };
            setMessages((prev) => [...prev, followUp]);
        } catch (err) {
            const errMsg = {
                id: uid(),
                role: 'assistant',
                text: `Validation issue: ${err.message}. You can still proceed with the merge preview.`,
                patch: null,
                applied: false,
                isError: true,
                rawResponse: '',
            };
            setMessages((prev) => [...prev, errMsg]);
        }
    };

    const handleMergeApply = async (mergeChoices) => {
        if (!extractedData) return;

        try {
            console.log('🔄 Starting merge with choices:', mergeChoices);
            
            // Call backend to apply merge with user choices
            const requestBody = {
                extracted_data: extractedData,
                current_data: data,
                merge_choices: mergeChoices,
                raw_text: '',
            };
            console.log('📤 Sending merge request:', requestBody);
            
            const response = await fetch('/api/ai/validate-and-merge/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            console.log('📬 Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Backend error:', errorText);
                throw new Error(`Merge failed (${response.status}): ${errorText.slice(0, 200)}`);
            }

            const result = await response.json();
            console.log('✅ Merge result:', result);
            const mergedData = result.validated_data;

            // Apply to CV
            const snapshot = structuredClone(data);
            setPreviousData(snapshot);
            setChangeLabel('Merged extracted resume data');
            onApply(mergedData);

            // Add success message
            const successMsg = {
                id: uid(),
                role: 'assistant',
                text: `✓ Successfully merged! ${result.applied_changes?.length || 0} fields updated.${result.summary ? '\n' + result.summary : ''}`,
                patch: null,
                applied: false,
                rawResponse: '',
            };
            setMessages((prev) => [...prev, successMsg]);
            setUndoVisible(true);
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
            undoTimerRef.current = setTimeout(() => setUndoVisible(false), 7000);

            // Cleanup
            setShowMergePreview(false);
            setExtractedData(null);
            setMergeConflicts([]);
        } catch (err) {
            const errMsg = {
                id: uid(),
                role: 'assistant',
                text: `Merge error: ${err.message}. Please try again.`,
                patch: null,
                applied: false,
                isError: true,
                rawResponse: '',
            };
            setMessages((prev) => [...prev, errMsg]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputText);
        }
    };

    const handleInputChange = (e) => {
        setInputText(e.target.value);
        // Auto-grow the textarea
        const el = e.target;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    };

    const resetInputHeight = () => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }
    };

    // Add button to quickly open merge preview
    const addMergeButton = () => {
        if (extractedData && !showMergePreview) {
            setShowMergePreview(true);
        }
    };

    const showSuggestions = messages.length <= 1 && !isStreaming;

    return (
        <>
            {/* FAB */}
            {!isOpen && (
                <button className="ai-fab" onClick={handleOpen} title="AI Writing Assistant" aria-label="Open AI Writing Assistant">
                    <i className="fas fa-magic" />
                    <span>AI Assistant</span>
                </button>
            )}

            {/* Chat panel */}
            {isOpen && (
                <div className="ai-chat-panel" role="dialog" aria-label="AI CV Writing Assistant">
                    {/* Header */}
                    <div className="ai-chat-header">
                        <div className="ai-chat-header__left">
                            <div className="ai-chat-header__icon"><i className="fas fa-magic" /></div>
                            <div>
                                <div className="ai-chat-header__name">AI Writing Assistant</div>
                                <div className="ai-chat-header__sub">Powered by Gemini</div>
                            </div>
                        </div>
                        <div className="ai-chat-header__actions">
                            <button
                                className="ai-chat-icon-btn"
                                onClick={handleNewChat}
                                title="New conversation"
                                aria-label="New conversation"
                            >
                                <i className="fas fa-plus" />
                            </button>
                            <button
                                className="ai-chat-icon-btn"
                                onClick={() => setShowUploadModal(true)}
                                title="Upload resume file"
                                aria-label="Upload resume file"
                            >
                                <i className="fas fa-upload" />
                            </button>
                            <button
                                className="ai-chat-icon-btn"
                                onClick={handleClose}
                                title="Close"
                                aria-label="Close"
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="ai-chat-messages">
                        {messages.map((msg) => (
                            <MessageBubble
                                key={msg.id}
                                msg={msg}
                                onApply={handleApply}
                                sectionTitles={data?.sectionTitles}
                            />
                        ))}

                        {isStreaming && <StreamingBubble text={streamingText} />}

                        {/* Suggestion chips */}
                        {showSuggestions && (
                            <div className="ai-chat-suggestions">
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s}
                                        className="ai-chat-suggestion"
                                        type="button"
                                        onClick={() => sendMessage(s)}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input area */}
                    <div className="ai-chat-input-area">
                        <div className="ai-chat-input-wrap">
                            <textarea
                                ref={inputRef}
                                className="ai-chat-input"
                                placeholder="Ask anything about your CV…"
                                value={inputText}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                disabled={isStreaming}
                            />
                            <button
                                className="ai-chat-send-btn"
                                onClick={() => sendMessage(inputText)}
                                disabled={!inputText.trim() || isStreaming}
                                type="button"
                                aria-label="Send"
                            >
                                {isStreaming ? (
                                    <span className="ai-chat-send-spinner" />
                                ) : (
                                    <i className="fas fa-paper-plane" />
                                )}
                            </button>
                        </div>
                        <div className="ai-chat-input-hint">Enter to send · Shift+Enter for new line</div>
                    </div>
                </div>
            )}

            {/* Undo toast */}
            {undoVisible && (
                <div className="ai-undo-toast" role="status">
                    <div className="ai-undo-toast__left">
                        <i className="fas fa-check-circle" />
                        <span>{changeLabel}</span>
                    </div>
                    <button className="ai-undo-toast__btn" onClick={handleUndo}>
                        <i className="fas fa-undo" /> Undo
                    </button>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="ai-upload-modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="ai-upload-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="ai-upload-modal-header">
                            <h3>Import Resume from File</h3>
                            <button
                                className="ai-upload-modal-close"
                                onClick={() => setShowUploadModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="ai-upload-modal-body">
                            <FileUploader
                                onExtracted={handleFileExtracted}
                                onLoading={setIsUploading}
                                compact={false}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Merge Preview Modal */}
            <MergePreviewModal
                isOpen={showMergePreview && !!extractedData}
                onClose={() => setShowMergePreview(false)}
                extractedData={extractedData}
                currentData={data}
                conflicts={mergeConflicts}
                onMergeComplete={handleMergeApply}
                isLoading={isUploading}
            />
        </>
    );
}
