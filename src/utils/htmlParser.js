/**
 * HTML parsing utilities for rich text support.
 * - sanitizeHtml: Strips unsafe HTML, keeps only allowed formatting tags
 * - parseHtmlToPdfNodes: Converts HTML to react-pdf compatible node structure
 */

const ALLOWED_TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 'a', 'br', 'p', 'div', 'ul', 'li', 'span']);
const ALLOWED_ATTRS = new Set(['href', 'data-bullet', 'style']);
const ALLOWED_STYLE_PROPS = new Set(['text-align']);

/**
 * Sanitizes a style attribute to only allow safe properties.
 * @param {string} styleStr - The style attribute value
 * @returns {string} - Sanitized style string
 */
function sanitizeStyle(styleStr) {
  if (!styleStr) return '';
  const allowed = [];
  const props = styleStr.split(';');
  for (const prop of props) {
    const [name, value] = prop.split(':').map(s => s.trim());
    if (name && value && ALLOWED_STYLE_PROPS.has(name.toLowerCase())) {
      allowed.push(`${name}: ${value}`);
    }
  }
  return allowed.join('; ');
}

/**
 * Sanitizes HTML string to only allow safe formatting tags.
 * @param {string} html - Raw HTML string
 * @returns {string} - Sanitized HTML string
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  
  // If no HTML tags present, return escaped text
  if (!/<[^>]+>/.test(html)) {
    return escapeHtml(html);
  }

  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Walk through all elements and sanitize
  const walker = document.createTreeWalker(temp, NodeFilter.SHOW_ELEMENT);
  const nodesToUnwrap = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const tag = node.tagName.toLowerCase();

    // Sanitize attributes
    Array.from(node.attributes).forEach(attr => {
      const attrName = attr.name.toLowerCase();
      if (!ALLOWED_ATTRS.has(attrName)) {
        node.removeAttribute(attr.name);
      } else if (attrName === 'style') {
        // Sanitize style attribute to only allow safe properties
        const sanitized = sanitizeStyle(attr.value);
        if (sanitized) {
          node.setAttribute('style', sanitized);
        } else {
          node.removeAttribute('style');
        }
      }
    });

    // Mark unsupported tags for unwrapping (keep their content)
    if (!ALLOWED_TAGS.has(tag)) {
      nodesToUnwrap.push(node);
    }
  }

  // Unwrap unsupported elements (replace with their children)
  nodesToUnwrap.forEach(node => {
    while (node.firstChild) {
      node.parentNode?.insertBefore(node.firstChild, node);
    }
    node.parentNode?.removeChild(node);
  });

  return temp.innerHTML;
}

/**
 * Escapes HTML special characters.
 * @param {string} text - Plain text
 * @returns {string} - Escaped HTML
 */
export function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Converts HTML string to an array of nodes for react-pdf rendering.
 * Each node has: { type: 'text'|'bold'|'italic'|'underline'|'link', content: string, href?: string }
 * 
 * @param {string} html - HTML string with formatting
 * @returns {Array<{type: string, content: string, href?: string}>}
 */
export function parseHtmlToPdfNodes(html) {
  if (!html || typeof html !== 'string') return [{ type: 'text', content: '' }];

  // If no HTML tags, return as plain text
  if (!/<[^>]+>/.test(html)) {
    return [{ type: 'text', content: html }];
  }

  const nodes = [];
  const temp = document.createElement('div');
  temp.innerHTML = html;

  function processNode(node, inheritedStyles = new Set()) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text) {
        // Determine the combined style
        let type = 'text';
        if (inheritedStyles.has('bold')) type = 'bold';
        if (inheritedStyles.has('italic')) type = inheritedStyles.has('bold') ? 'boldItalic' : 'italic';
        if (inheritedStyles.has('underline')) type = type + 'Underline';
        if (inheritedStyles.has('link')) type = 'link';
        
        const nodeObj = { type, content: text };
        if (inheritedStyles.has('link') && inheritedStyles.href) {
          nodeObj.href = inheritedStyles.href;
        }
        nodes.push(nodeObj);
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      const newStyles = new Set(inheritedStyles);

      // Apply styles based on tag
      if (tag === 'b' || tag === 'strong') {
        newStyles.add('bold');
      } else if (tag === 'i' || tag === 'em') {
        newStyles.add('italic');
      } else if (tag === 'u') {
        newStyles.add('underline');
      } else if (tag === 'a') {
        newStyles.add('link');
        newStyles.href = node.getAttribute('href') || '';
      } else if (tag === 'br') {
        nodes.push({ type: 'linebreak' });
        return;
      }

      // Process children
      Array.from(node.childNodes).forEach(child => processNode(child, newStyles));

      // Add line break after block elements
      if (tag === 'p' || tag === 'div' || tag === 'li') {
        // Don't add linebreak if this is the last child
        if (node.nextSibling) {
          nodes.push({ type: 'linebreak' });
        }
      }
    }
  }

  Array.from(temp.childNodes).forEach(child => processNode(child));

  // Clean up: merge adjacent text nodes of same type, remove empty nodes
  const cleaned = [];
  for (const node of nodes) {
    if (node.type === 'linebreak') {
      cleaned.push(node);
      continue;
    }
    if (!node.content) continue;

    const last = cleaned[cleaned.length - 1];
    if (last && last.type === node.type && node.type !== 'link' && last.type !== 'linebreak') {
      last.content += node.content;
    } else {
      cleaned.push(node);
    }
  }

  return cleaned.length > 0 ? cleaned : [{ type: 'text', content: '' }];
}

/**
 * Strips all HTML tags and returns plain text.
 * @param {string} html - HTML string
 * @returns {string} - Plain text
 */
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

/**
 * Checks if a string contains any HTML tags.
 * @param {string} str - String to check
 * @returns {boolean}
 */
export function hasHtml(str) {
  return /<[^>]+>/.test(str || '');
}
