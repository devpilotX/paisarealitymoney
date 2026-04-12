const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

const HTML_ENTITY_REGEX = /[&<>"'/]/g;

export function escapeHtml(input: string): string {
  return input.replace(HTML_ENTITY_REGEX, (char) => HTML_ENTITIES[char] ?? char);
}

export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export function sanitizeEmail(input: unknown): string | null {
  const str = sanitizeString(input).toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(str)) {
    return null;
  }
  return str;
}

export function sanitizeSlug(input: unknown): string | null {
  const str = sanitizeString(input).toLowerCase();
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(str) || str.length > 200) {
    return null;
  }
  return str;
}

export function sanitizeNumber(input: unknown, min?: number, max?: number): number | null {
  let num: number;
  if (typeof input === 'number') {
    num = input;
  } else if (typeof input === 'string') {
    num = parseFloat(input);
  } else {
    return null;
  }

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  if (min !== undefined && num < min) {
    return null;
  }

  if (max !== undefined && num > max) {
    return null;
  }

  return num;
}

export function sanitizeInteger(input: unknown, min?: number, max?: number): number | null {
  const num = sanitizeNumber(input, min, max);
  if (num === null) {
    return null;
  }
  return Math.floor(num);
}

export function sanitizeEnum<T extends string>(input: unknown, allowedValues: readonly T[]): T | null {
  const str = sanitizeString(input);
  if (allowedValues.includes(str as T)) {
    return str as T;
  }
  return null;
}

export function sanitizeUrl(input: unknown): string | null {
  const str = sanitizeString(input);
  try {
    const url = new URL(str);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

export function sanitizePhone(input: unknown): string | null {
  const str = sanitizeString(input);
  const cleaned = str.replace(/[^0-9+]/g, '');
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  if (!phoneRegex.test(cleaned)) {
    return null;
  }
  return cleaned;
}

export function truncateString(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input;
  }
  return input.slice(0, maxLength);
}

export default {
  escapeHtml,
  sanitizeString,
  sanitizeEmail,
  sanitizeSlug,
  sanitizeNumber,
  sanitizeInteger,
  sanitizeEnum,
  sanitizeUrl,
  sanitizePhone,
  truncateString,
};