import { serp } from './client.js';
// engine=google_maps → local_results[]. Only fields SerpApi returns are passed through.
export async function searchProviders({ q, location, lat, lng, refresh }) {
  const params = { engine: 'google_maps', type: 'search', hl: 'en', gl: 'in' };
  params.q = location && !lat ? `${q} in ${location}` : q;
  if (lat && lng) params.ll = `@${lat},${lng},14z`;
  const d = await serp(params, { refresh });
  const rows = d.local_results || (d.place_results ? [d.place_results] : []);
  return {
    cached: !!d._cached,
    providers: rows.map(r => ({
      id: r.data_id || r.place_id, dataId: r.data_id, placeId: r.place_id,
      name: r.title, rating: r.rating ?? null, reviews: r.reviews ?? null,
      address: r.address ?? null, phone: r.phone ?? null, website: r.website ?? null,
      type: r.type ?? null, types: r.types ?? null,
      openState: r.open_state ?? null, hours: r.hours ?? null,
      gps: r.gps_coordinates ?? null, thumbnail: r.thumbnail ?? null,
      description: r.description ?? null, wheelchair: r.extensions?.some?.(e => JSON.stringify(e).match(/wheelchair/i)) || null,
    })).filter(p => p.id && p.name),
  };
}
