/**
 * Valida URL de YouTube en formato embed (coincide con backend).
 */
export function isValidYoutubeEmbedUrl(url) {
  if (url == null || url === '') return true;
  if (typeof url !== 'string') return false;
  const u = url.trim();
  if (!u) return true;
  return (
    /^https:\/\/(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]{11}(\?[^#]*)?(#.*)?$/.test(u)
    || /^https:\/\/(www\.)?youtube-nocookie\.com\/embed\/[a-zA-Z0-9_-]{11}(\?[^#]*)?(#.*)?$/.test(u)
  );
}
