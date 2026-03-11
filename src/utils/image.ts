import { DIRECTUS_ASSET_BASE, DIRECTUS_BASE_URL } from './directus';

export const FALLBACK_IMAGE_URL =
  "https://via.placeholder.com/300x400?text=Pas+d+image";

const JOURNAL_FALLBACKS: Array<{
  matcher: RegExp
  url: string
}> = [
  {
    matcher: /(coque|protection|magsafe|magnetique|antichoc|transparent)/i,
    url: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1100&w=825',
  },
  {
    matcher: /(chargeur|charge|batterie|usb|power|induction|gan)/i,
    url: 'https://images.pexels.com/photos/4526407/pexels-photo-4526407.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1100&w=825',
  },
  {
    matcher: /(voiture|auto|gps|moto|navigation)/i,
    url: 'https://images.pexels.com/photos/694424/pexels-photo-694424.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1100&w=825',
  },
  {
    matcher: /(selfie|creator|creation|photo|video|tr[eé]pied|capture)/i,
    url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1100&w=825',
  },
  {
    matcher: /(ecouteur|audio|casque|earbud)/i,
    url: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1100&w=825',
  },
];

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
  title,
  pillar,
  category,
  fallback = FALLBACK_IMAGE_URL,
}: {
  coverImage?: unknown
  title?: string | null
  pillar?: string | null
  category?: string | null
  fallback?: string
}): string => {
  const resolved = resolveImageUrl(coverImage, '');
  const shouldIgnoreCover = isLikelyPackshotImage(coverImage);
  if (resolved && !shouldIgnoreCover) return resolved;

  const haystack = [title, pillar, category].filter(Boolean).join(' ');
  const match = JOURNAL_FALLBACKS.find((entry) => entry.matcher.test(haystack));
  if (match) return match.url;

  return fallback;
};
