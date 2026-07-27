/**
 * "Is it a reachable link?" (PRD §5.2) — kept to cheap local checks.
 *
 * A HEAD request would be a stronger test but streaming hosts routinely reject
 * or hang on it, so a network probe here would produce false "No Signal" on
 * links that actually work. The WebView load is the real reachability test;
 * this stage only catches typos before we bother spinning the dial.
 */
export function normalizeUrl(input) {
  const raw = (input || '').trim();
  if (!raw) return { ok: false, reason: 'Enter a link to tune in.' };

  // Users paste from share sheets and browsers — assume https when the scheme
  // is missing rather than rejecting.
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  let parsed;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, reason: "That doesn't look like a link." };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only web links can be tuned in.' };
  }
  if (!parsed.hostname.includes('.') || parsed.hostname.endsWith('.')) {
    return { ok: false, reason: "That doesn't look like a link." };
  }

  return { ok: true, url: parsed.toString(), host: parsed.host.replace(/^www\./, '') };
}

export default normalizeUrl;
