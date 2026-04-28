import DOMPurify from 'isomorphic-dompurify';

// Configure DOMPurify for safe HTML content
const purifyConfig = {
  ALLOWED_TAGS: [
    'b',
    'i',
    'em',
    'strong',
    'p',
    'br',
    'a',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'span',
    'div',
    'img',
  ],
  ALLOWED_ATTR: [
    'href',
    'target',
    'rel',
    'title',
    'alt',
    'src',
    'width',
    'height',
    'class',
    'id',
  ],
  ALLOW_DATA_ATTR: false,
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
  // Force all links to open in new tab with security attributes
  FORCE_BODY: true,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows basic formatting but strips dangerous content
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';

  // First pass: Clean with DOMPurify
  let clean = DOMPurify.sanitize(dirty, purifyConfig);

  // Second pass: Additional security measures
  // Force all links to have security attributes
  clean = clean.replace(
    /<a\s+([^>]*)href="([^"]*)"([^>]*)>/gi,
    '<a $1href="$2"$3 target="_blank" rel="noopener noreferrer nofollow">'
  );

  // Remove any javascript: URLs
  clean = clean.replace(/javascript:/gi, '');

  // Remove event handlers
  clean = clean.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');

  // Remove data: URLs (except for images)
  clean = clean.replace(/data:(?!image\/)/gi, '');

  return clean;
}

/**
 * Sanitize plain text content
 * Removes all HTML tags and entities
 */
export function sanitizeText(dirty: string | null | undefined): string {
  if (!dirty) return '';

  // Remove all HTML tags
  let clean = dirty.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };

  Object.entries(entities).forEach(([entity, char]) => {
    clean = clean.replace(new RegExp(entity, 'g'), char);
  });

  // Remove null bytes
  clean = clean.replace(/\x00/g, '');

  // Trim whitespace
  return clean.trim();
}

/**
 * Sanitize for use in URLs/path parameters
 * Removes dangerous characters that could be used for injection
 */
export function sanitizeSlug(dirty: string | null | undefined): string {
  if (!dirty) return '';

  return dirty
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validate and sanitize file name
 * Prevents directory traversal attacks
 */
export function sanitizeFileName(dirty: string | null | undefined): string {
  if (!dirty) return '';

  // Remove path components
  let clean = dirty.replace(/^(?:\.\.[\/\\])+/, '');
  clean = clean.replace(/[\/\\]/g, '_');

  // Remove null bytes
  clean = clean.replace(/\x00/g, '');

  // Limit length
  if (clean.length > 255) {
    const ext = clean.lastIndexOf('.');
    if (ext > 0) {
      clean = clean.substring(0, 255 - (clean.length - ext)) + clean.substring(ext);
    } else {
      clean = clean.substring(0, 255);
    }
  }

  return clean;
}

/**
 * Sanitize search query input
 * Prevents search injection attacks
 */
export function sanitizeSearchQuery(dirty: string | null | undefined): string {
  if (!dirty) return '';

  // Remove special search characters that could cause issues
  return dirty
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

/**
 * Strict sanitization for user display names
 * Only allows alphanumeric, spaces, hyphens, and underscores
 */
export function sanitizeDisplayName(dirty: string | null | undefined): string {
  if (!dirty) return '';

  return dirty
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 50); // Limit length
}

/**
 * Check if content contains potential spam patterns
 * Returns true if spam detected
 */
export function detectSpam(content: string): boolean {
  const spamPatterns = [
    /\b(buy now|click here|limited time|act now)\b/gi,
    /\b(viagra|cialis|casino|lottery|winner)\b/gi,
    /(.)\1{10,}/, // Repeated characters
    /https?:\/\/[^\s]{100,}/, // Very long URLs
    /\b[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}\b.*\b[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}\b/g, // Multiple emails
  ];

  return spamPatterns.some((pattern) => pattern.test(content));
}

/**
 * Check if content contains profanity
 * Simple implementation - replace with proper service for production
 */
export function containsProfanity(content: string): boolean {
  const profanityList = [
    'spam',
    'estafa',
    'virus',
    'phishing',
    'hacker',
    'hack',
    // Add more as needed
  ];

  const lowerContent = content.toLowerCase();
  return profanityList.some((word) => lowerContent.includes(word));
}

/**
 * Comprehensive content validation
 * Returns object with validation results and sanitized content
 */
export function validateContent(
  content: string,
  options: {
    allowHtml?: boolean;
    maxLength?: number;
    minLength?: number;
    checkSpam?: boolean;
    checkProfanity?: boolean;
  } = {}
): {
  valid: boolean;
  sanitized: string;
  errors: string[];
} {
  const errors: string[] = [];
  const { allowHtml = false, maxLength = 5000, minLength = 1, checkSpam = true, checkProfanity = true } = options;

  // Check if content exists
  if (!content || content.trim().length === 0) {
    errors.push('Content is required');
    return { valid: false, sanitized: '', errors };
  }

  // Check minimum length
  if (content.trim().length < minLength) {
    errors.push(`Content must be at least ${minLength} characters`);
  }

  // Check maximum length (before sanitization)
  if (content.length > maxLength * 2) {
    // Allow some buffer for HTML
    errors.push(`Content exceeds maximum length of ${maxLength} characters`);
  }

  // Sanitize content
  const sanitized = allowHtml ? sanitizeHtml(content) : sanitizeText(content);

  // Check sanitized length
  if (sanitized.length > maxLength) {
    errors.push(`Content exceeds maximum length of ${maxLength} characters`);
  }

  // Check for spam
  if (checkSpam && detectSpam(sanitized)) {
    errors.push('Content appears to be spam');
  }

  // Check for profanity
  if (checkProfanity && containsProfanity(sanitized)) {
    errors.push('Content contains inappropriate language');
  }

  return {
    valid: errors.length === 0,
    sanitized,
    errors,
  };
}
