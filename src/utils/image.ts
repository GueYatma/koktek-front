import { DIRECTUS_ASSET_BASE } from './directus';

export const FALLBACK_IMAGE_URL =
  "https://via.placeholder.com/300x400?text=Pas+d+image";

export const resolveImageUrl = (
  value?: string | null,
  fallback: string = FALLBACK_IMAGE_URL,
): string => {
  const raw = (value ?? "").trim();
  if (!raw) return fallback;
  if (/^https?:\/\//i.test(raw)) return raw;
  // Ensure we request a high-quality image from Directus
  const separator = raw.includes('?') ? '&' : '?';
  const url = `${DIRECTUS_ASSET_BASE}/${raw}`;
  if (url.includes('quality=')) return url; // Already has quality params
  return `${url}${separator}quality=90&width=1200`;
};
