import { useRef, useEffect, useCallback, useState } from 'react';
import styles from './RichTextEditor.module.css';

// SVG Icons for professional toolbar appearance
const Icons = {
  bold: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
    </svg>
  ),
  italic: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
    </svg>
  ),
  underline: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
    </svg>
  ),
  bulletFilled: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <circle cx="4" cy="7" r="2.5"/>
      <circle cx="4" cy="12" r="2.5"/>
      <circle cx="4" cy="17" r="2.5"/>
      <rect x="9" y="5.5" width="12" height="3" rx="1"/>
      <rect x="9" y="10.5" width="12" height="3" rx="1"/>
      <rect x="9" y="15.5" width="12" height="3" rx="1"/>
    </svg>
  ),
  bulletHollow: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <circle cx="4" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="4" cy="12" r="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="4" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="5.5" width="12" height="3" rx="1"/>
      <rect x="9" y="10.5" width="12" height="3" rx="1"/>
      <rect x="9" y="15.5" width="12" height="3" rx="1"/>
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
    </svg>
  ),
  alignLeft: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
    </svg>
  ),
  alignCenter: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
    </svg>
  ),
  alignRight: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
    </svg>
  ),
  alignJustify: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/>
    </svg>
  ),
};

const TOOLBAR_GROUPS = [
  {
    name: 'text',
    buttons: [
      { command: 'bold', icon: Icons.bold, title: 'Bold (Ctrl+B)' },
      { command: 'italic', icon: Icons.italic, title: 'Italic (Ctrl+I)' },
      { command: 'underline', icon: Icons.underline, title: 'Underline (Ctrl+U)' },
    ],
  },
  {
    name: 'lists',
    buttons: [
      { command: 'insertFilledList', icon: Icons.bulletFilled, title: 'Filled Bullet List (●)' },
      { command: 'insertHollowList', icon: Icons.bulletHollow, title: 'Hollow Bullet List (◦)' },
    ],
  },
  {
    name: 'insert',
    buttons: [
      { command: 'createLink', icon: Icons.link, title: 'Insert Link' },
    ],
  },
  {
    name: 'align',
    buttons: [
      { command: 'justifyLeft', icon: Icons.alignLeft, title: 'Align Left' },
      { command: 'justifyCenter', icon: Icons.alignCenter, title: 'Align Center' },
      { command: 'justifyRight', icon: Icons.alignRight, title: 'Align Right' },
      { command: 'justifyFull', icon: Icons.alignJustify, title: 'Justify' },
    ],
  },
];

export default function RichTextEditor({
  id,
  label,
  value = '',
  onChange,
  placeholder = '',
  hint,
  minHeight = 120,
}) {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);
  const [activeStyles, setActiveStyles] = useState(new Set());

  // Check which formatting is active at current selection
  const updateActiveStyles = useCallback(() => {
    const styles = new Set();
    if (document.queryCommandState('bold')) styles.add('bold');
    if (document.queryCommandState('italic')) styles.add('italic');
    if (document.queryCommandState('underline')) styles.add('underline');
    if (document.queryCommandState('insertUnorderedList')) styles.add('insertUnorderedList');
    if (document.queryCommandState('justifyLeft')) styles.add('justifyLeft');
    if (document.queryCommandState('justifyCenter')) styles.add('justifyCenter');
    if (document.queryCommandState('justifyRight')) styles.add('justifyRight');
    if (document.queryCommandState('justifyFull')) styles.add('justifyFull');
    setActiveStyles(styles);
  }, []);

  // Sync external value changes to editor
  useEffect(() => {
    const el = editorRef.current;
    if (!el || isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    // Only update if different to preserve cursor position
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    isInternalChange.current = true;
    const html = el.innerHTML;
    // Convert empty editor states to empty string
    const isEmpty = html === '<br>' || html === '<div><br></div>' || !html.trim();
    onChange(isEmpty ? '' : html);
    updateActiveStyles();
  }, [onChange, updateActiveStyles]);

  const handleSelectionChange = useCallback(() => {
    updateActiveStyles();
  }, [updateActiveStyles]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  const execCommand = useCallback((command, value = null) => {
    const el = editorRef.current;
    if (!el) return;

    // Focus editor before executing command
    el.focus();

    if (command === 'createLink') {
      const selection = window.getSelection();
      const selectedText = selection?.toString() || '';
      const url = prompt('Enter URL:', selectedText.startsWith('http') ? selectedText : 'https://');
      if (url) {
        document.execCommand('createLink', false, url);
      }
    } else if (command === 'insertFilledList') {
      // Insert filled bullet list using standard unordered list with custom styling
      document.execCommand('insertUnorderedList', false, null);
      // Add class to style as filled bullets
      const selection = window.getSelection();
      if (selection?.anchorNode) {
        let node = selection.anchorNode;
        while (node && node.nodeName !== 'UL') {
          node = node.parentNode;
        }
        if (node && node.nodeName === 'UL') {
          node.className = 'bullet-filled';
        }
      }
    } else if (command === 'insertHollowList') {
      // Insert hollow bullet list
      document.execCommand('insertUnorderedList', false, null);
      const selection = window.getSelection();
      if (selection?.anchorNode) {
        let node = selection.anchorNode;
        while (node && node.nodeName !== 'UL') {
          node = node.parentNode;
        }
        if (node && node.nodeName === 'UL') {
          node.className = 'bullet-hollow';
        }
      }
    } else {
      document.execCommand(command, false, value);
    }

    handleInput();
  }, [handleInput]);

  const handleKeyDown = useCallback((e) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        default:
          break;
      }
    }
  }, [execCommand]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    // Get plain text or HTML from clipboard
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    if (html) {
      // Sanitize pasted HTML - only keep allowed tags
      const temp = document.createElement('div');
      temp.innerHTML = html;
      
      // Remove all style attributes and unwanted elements
      const walker = document.createTreeWalker(temp, NodeFilter.SHOW_ELEMENT);
      const nodesToRemove = [];
      
      while (walker.nextNode()) {
        const node = walker.currentNode;
        // Remove style, class, and other attributes except href
        Array.from(node.attributes).forEach(attr => {
          if (attr.name !== 'href') {
            node.removeAttribute(attr.name);
          }
        });
        
        // Mark unsupported elements for removal (keep their text content)
        const tag = node.tagName.toLowerCase();
        const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'a', 'br', 'p', 'div', 'ul', 'li', 'span'];
        if (!allowedTags.includes(tag)) {
          nodesToRemove.push(node);
        }
      }
      
      // Replace unsupported elements with their text content
      nodesToRemove.forEach(node => {
        const textNode = document.createTextNode(node.textContent);
        node.parentNode?.replaceChild(textNode, node);
      });
      
      document.execCommand('insertHTML', false, temp.innerHTML);
    } else {
      // Insert plain text
      document.execCommand('insertText', false, text);
    }
    
    handleInput();
  }, [handleInput]);

  const inputId = id || `rte-${String(label || '').replace(/\s+/g, '-').toLowerCase()}`;
  const hasValue = (value ?? '').trim().length > 0;

  return (
    <div className={`${styles.richTextEditor} ${hasValue ? styles.filled : ''}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}

      <div className={styles.editorWrapper}>
        <div className={styles.toolbar}>
          {TOOLBAR_GROUPS.map((group, groupIdx) => (
            <div key={group.name} className={styles.toolbarGroup}>
              {group.buttons.map((btn) => {
                const isActive = activeStyles.has(btn.command) || 
                  (btn.command === 'insertFilledList' && activeStyles.has('insertUnorderedList')) ||
                  (btn.command === 'insertHollowList' && activeStyles.has('insertUnorderedList'));
                return (
                  <button
                    key={btn.command}
                    type="button"
                    className={`${styles.toolbarBtn} ${isActive ? styles.active : ''}`}
                    onClick={() => execCommand(btn.command)}
                    title={btn.title}
                    tabIndex={-1}
                    aria-pressed={isActive}
                  >
                    {btn.icon}
                  </button>
                );
              })}
              {groupIdx < TOOLBAR_GROUPS.length - 1 && (
                <span className={styles.separator} />
              )}
            </div>
          ))}
        </div>

        <div
          ref={editorRef}
          id={inputId}
          className={styles.editor}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          style={{ minHeight }}
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          aria-describedby={hint ? `${inputId}-hint` : undefined}
        />
      </div>

      {hint && (
        <p id={`${inputId}-hint`} className={styles.hint}>
          <i className="fas fa-info-circle" />
          {hint}
        </p>
      )}
    </div>
  );
}
