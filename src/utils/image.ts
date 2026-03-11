import { DIRECTUS_ASSET_BASE, DIRECTUS_BASE_URL } from './directus';

export const FALLBACK_IMAGE_URL =
  "https://via.placeholder.com/300x400?text=Pas+d+image";

const stripWrappingQuotes = (value: string) =>
  value.trim().replace(/^['"]+|['"]+$/g, '');

const extractImageValue = (value: unknown): string => {
  if (typeof value === 'string') {
    const trimmed = stripWrappingQuotes(value);
    if (!trimmed) return '';

    // Directus or external integrations sometimes persist JSON-ish strings.
    if (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
      try {
        return extractImageValue(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }

    return trimmed;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => extractImageValue(entry)).find(Boolean) ?? '';
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return extractImageValue(
      record.url ??
        record.href ??
        record.src ??
        record.id ??
        record.value ??
        record.data,
    );
  }

  return '';
};

const withDirectusTransforms = (url: string) => {
  if (/[?&](width|height|fit|quality)=/i.test(url)) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=800&height=800&fit=cover&quality=90`;
};

export const isLikelyPackshotImage = (value?: unknown): boolean => {
  const raw = extractImageValue(value);
  if (!raw) return false;

  return (
    /cjdropshipping\.com/i.test(raw) ||
    /(?:_trans|_fine)\.(?:png|jpe?g|webp)$/i.test(raw) ||
    /\/quick\/product\//i.test(raw)
  );
};

export const resolveImageUrl = (
  value?: unknown,
  fallback: string = FALLBACK_IMAGE_URL,
): string => {
  const raw = extractImageValue(value);
  if (!raw) return fallback;
  if (/^data:/i.test(raw) || /^https?:\/\//i.test(raw)) return raw;
  if (/^\/\//.test(raw)) return `https:${raw}`;
  if (raw.startsWith('/assets/')) return withDirectusTransforms(`${DIRECTUS_BASE_URL}${raw}`);
  if (raw.startsWith('assets/')) return withDirectusTransforms(`${DIRECTUS_BASE_URL}/${raw}`);
  if (raw.startsWith('/')) return `${DIRECTUS_BASE_URL}${raw}`;
  return withDirectusTransforms(`${DIRECTUS_ASSET_BASE}/${raw}`);
};

export const resolveJournalCoverImage = ({
  coverImage,
  fallback = FALLBACK_IMAGE_URL,
}: {
  coverImage?: unknown
  fallback?: string
}): string => {
  const resolved = resolveImageUrl(coverImage, '');
  const shouldIgnoreCover = isLikelyPackshotImage(coverImage);
  if (resolved && !shouldIgnoreCover) return resolved;

  return fallback;
};
