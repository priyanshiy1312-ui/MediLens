import { serp } from './client.js';
// engine=google_maps_reviews → reviews[] (up to ~`pages` pages via next_page_token)
export async function fetchReviews(dataId, { pages = 2, refresh } = {}) {
  let out = [], token;
  for (let i = 0; i < pages; i++) {
    const p = { engine: 'google_maps_reviews', data_id: dataId, hl: 'en', sort_by: 'qualityScore' };
    if (token) p.next_page_token = token;
    const d = await serp(p, { refresh });
    out.push(...(d.reviews || []).map(r => ({
      rating: r.rating ?? null, date: r.date ?? null,
      text: r.extracted_snippet?.original || r.snippet || '',
    })).filter(r => r.text));
    token = d.serpapi_pagination?.next_page_token;
    if (!token) break;
  }
  return out;
}
