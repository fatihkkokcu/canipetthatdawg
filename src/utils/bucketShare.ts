import { Animal } from '../types/Animal';

const SHARE_SCHEMA_VERSION = 1;
const MAX_SHARED_IDS = 100;

type SharedBucketPayloadV1 = {
  v: 1;
  ids: string[];
  t?: string;
};

const toBase64Url = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const fromBase64Url = (value: string): string => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = `${padded}${'='.repeat(padLength)}`;
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const encodeBucketListForShare = (bucketList: Animal[], title?: string): string => {
  const uniqueIds = Array.from(
    new Set(
      bucketList
        .map((animal) => animal.id)
        .filter((id) => typeof id === 'string' && id.trim().length > 0)
    )
  ).slice(0, MAX_SHARED_IDS);

  const payload: SharedBucketPayloadV1 = {
    v: SHARE_SCHEMA_VERSION,
    ids: uniqueIds,
    ...(title && title.trim() ? { t: title.trim().slice(0, 80) } : {}),
  };

  return toBase64Url(JSON.stringify(payload));
};

export const decodeBucketListFromShare = (encoded: string): { ids: string[]; title?: string } | null => {
  try {
    const raw = fromBase64Url(encoded);
    const parsed: Partial<SharedBucketPayloadV1> = JSON.parse(raw);
    if (parsed.v !== SHARE_SCHEMA_VERSION || !Array.isArray(parsed.ids)) return null;

    const ids = Array.from(
      new Set(
        parsed.ids
          .filter((id): id is string => typeof id === 'string')
          .map((id) => id.trim())
          .filter(Boolean)
      )
    ).slice(0, MAX_SHARED_IDS);

    if (ids.length === 0) return null;

    return {
      ids,
      ...(typeof parsed.t === 'string' && parsed.t.trim()
        ? { title: parsed.t.trim().slice(0, 80) }
        : {}),
    };
  } catch {
    return null;
  }
};
