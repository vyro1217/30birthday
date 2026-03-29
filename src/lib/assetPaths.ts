export function getPublicAssetPath(path: string): string {
  const normalizedPath = path.replace(/^\/+/, '');
  const baseUrl =
    (typeof import.meta !== 'undefined' &&
      (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL) ||
    '/';

  return `${baseUrl}${normalizedPath}`;
}
