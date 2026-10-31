/** Accept a single HTTPS link, including the text produced by shopping-app share buttons. */
export function productUrlFromText(text: string): string | null {
  const matches = text.trim().match(/https:\/\/[^\s<>"\]]+/gi) ?? [];
  if (matches.length !== 1) return null;
  const candidate = matches[0].replace(/[).,;!?]+$/, '');
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' || !url.hostname.includes('.') || url.username || url.password || (url.port && url.port !== '443')) return null;
    return url.href;
  } catch { return null; }
}
