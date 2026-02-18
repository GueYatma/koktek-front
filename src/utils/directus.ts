const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const RAW_DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL as
  | string
  | undefined;

const DIRECTUS_BASE_URL = normalizeBaseUrl(
  RAW_DIRECTUS_URL ?? 'https://directus.koktek.com',
);

const DIRECTUS_ASSET_BASE = `${DIRECTUS_BASE_URL}/assets`;

export { DIRECTUS_BASE_URL, DIRECTUS_ASSET_BASE };
