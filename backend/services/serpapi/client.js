// Single place that talks to SerpApi. API key never leaves the backend.
const BASE = 'https://serpapi.com/search.json';
const cache = new Map(); const TTL = 10 * 60 * 1000;
export class SerpError extends Error { constructor(msg, status = 502) { super(msg); this.status = status; } }

export async function serp(params, { refresh = false } = {}) {
  const key = process.env.SERPAPI_API_KEY;
  if (!key || key === 'your_api_key_here') throw new SerpError('SERPAPI_API_KEY is not configured on the server.', 500);
  const ck = JSON.stringify(params);
  const hit = cache.get(ck);
  if (!refresh && hit && Date.now() - hit.t < TTL) return { ...hit.v, _cached: true };
  const url = `${BASE}?${new URLSearchParams({ ...params, api_key: key })}`;
  let res;
  try { res = await fetch(url, { signal: AbortSignal.timeout(20000) }); }
  catch { throw new SerpError('SerpApi temporarily unavailable (timeout/network).'); }
  if (res.status === 429) throw new SerpError('SerpApi rate limit reached. Try again shortly.', 429);
  let data; try { data = await res.json(); } catch { throw new SerpError('Malformed response from SerpApi.'); }
  if (!res.ok || data.error) {
    if (/hasn't returned any results/i.test(data?.error || '')) return { _empty: true };
    throw new SerpError(data?.error || `SerpApi error ${res.status}`);
  }
  cache.set(ck, { t: Date.now(), v: data });
  return data;
}
