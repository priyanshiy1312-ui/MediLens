// Transparent, rule-based review analysis + MediLens Score. No fabricated data.
export const THEMES = {
  'Doctor experience': /doctor|dr\.|surgeon|consultant|cardiologist|physician|specialist/i,
  'Staff behaviour': /staff|nurse|reception|behaviou?r|rude|polite|helpful|courteous/i,
  'Waiting time': /wait|queue|delay|crowd|long time|appointment time/i,
  'Cleanliness': /clean|hygien|dirty|neat|sanitation|washroom/i,
  'Facilities': /facilit|equipment|infrastructure|rooms?|parking|ward|icu|lab/i,
  'Emergency experience': /emergency|ambulance|casualty|trauma|\ber\b/i,
  'Communication': /explain|communicat|inform|counsel|clarity/i,
  'Appointment experience': /appointment|booking|schedul|registration/i,
  'Overall satisfaction': /recommend|satisf|excellent|great|best|worst|poor|terrible|good/i,
};
const label = s => s == null ? null : s >= 4 ? 'Positive' : s >= 3 ? 'Mixed' : 'Negative';

export function themeInsights(reviews) {
  const rated = reviews.filter(r => r.rating != null);
  return Object.entries(THEMES).map(([theme, re]) => {
    const m = rated.filter(r => re.test(r.text));
    const avg = m.length ? m.reduce((a, r) => a + r.rating, 0) / m.length : null;
    return { theme, mentions: m.length, avgRating: avg && +avg.toFixed(2), sentiment: m.length >= 3 ? label(avg) : null,
      note: m.length >= 3 ? null : 'Not enough review evidence found.' };
  });
}
export function overallSentiment(reviews) {
  const r = reviews.filter(x => x.rating != null);
  return r.length >= 5 ? +(r.reduce((a, x) => a + x.rating, 0) / r.length).toFixed(2) : null;
}
export function searchReviews(reviews, query) {
  const terms = query.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !['what','people','patients','about','say','mention','mentioning','reviews'].includes(w));
  const hits = reviews.filter(r => terms.some(t => r.text.toLowerCase().includes(t.slice(0, 5))));
  return hits.slice(0, 5).map(r => ({ rating: r.rating, date: r.date, snippet: r.text.length > 220 ? r.text.slice(0, 220) + '…' : r.text }));
}
// Weights: rating 30, volume 20, sentiment 20, relevance 15, availability 15.
// Missing signals are excluded and remaining weights renormalised (reported in `used`).
export function medilensScore(p, { query = '', sentiment = null } = {}) {
  const words = query.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !['hospitals','clinics','near','best','jaipur','centers','centres'].includes(w));
  const hay = `${p.name} ${p.type || ''} ${(p.types || []).join(' ')} ${p.description || ''}`.toLowerCase();
  const rel = words.length ? words.filter(w => hay.includes(w.slice(0, 5))).length / words.length : null;
  const avail = [p.phone, p.website, p.hours || p.openState, p.address].filter(Boolean).length / 4;
  const f = [
    ['Rating', 30, p.rating != null ? (p.rating - 1) / 4 : null, p.rating != null ? `${p.rating} rating` : null],
    ['Review volume', 20, p.reviews != null ? Math.min(1, Math.log10(p.reviews + 1) / 4) : null, p.reviews != null ? `${p.reviews} reviews (log scale, 10k = max)` : null],
    ['Review sentiment', 20, sentiment != null ? (sentiment - 1) / 4 : null, sentiment != null ? `avg ${sentiment} across fetched reviews` : null],
    ['Query relevance', 15, rel, rel != null ? `${Math.round(rel * 100)}% of query terms matched in name/category` : null],
    ['Availability info', 15, avail, `${Math.round(avail * 4)}/4 of phone, website, hours, address listed`],
  ];
  const used = f.filter(x => x[2] != null); const tw = used.reduce((a, x) => a + x[1], 0);
  const score = tw ? Math.round(used.reduce((a, x) => a + x[1] * x[2], 0) / tw * 100) : null;
  return { score, factors: f.map(([n, w, v, why]) => ({ name: n, weight: w, value: v == null ? null : +v.toFixed(2), evidence: why })) };
}
