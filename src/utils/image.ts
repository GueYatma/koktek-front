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
  return `${DIRECTUS_ASSET_BASE}/${raw}`;
};
