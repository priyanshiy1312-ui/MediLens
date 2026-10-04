import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { searchProviders } from './services/serpapi/mapsSearchService.js';
import { fetchReviews } from './services/serpapi/reviewsService.js';
import { themeInsights, overallSentiment, searchReviews, medilensScore } from './analysis.js';

const app = express(); app.use(express.json());
app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '../public')));
const wrap = fn => (req, res) => fn(req, res).catch(e => res.status(e.status || 500).json({ error: e.message || 'Unexpected error' }));

app.get('/api/search', wrap(async (req, res) => {
  const { q, location, lat, lng, refresh } = req.query;
  if (!q) return res.status(400).json({ error: 'Query "q" is required.' });
  const r = await searchProviders({ q, location, lat, lng, refresh: refresh === '1' });
  const providers = r.providers.map(p => ({ ...p, medilens: medilensScore(p, { query: q }) }))
    .sort((a, b) => (b.medilens.score ?? -1) - (a.medilens.score ?? -1));
  res.json({ source: 'SerpApi google_maps', cached: r.cached, query: q, providers });
}));

app.get('/api/providers/:id/reviews', wrap(async (req, res) => {
  const reviews = await fetchReviews(req.params.id, { refresh: req.query.refresh === '1' });
  const out = { source: 'SerpApi google_maps_reviews', count: reviews.length, reviews: reviews.slice(0, 30) };
  if (req.query.q) out.matches = reviews.length ? searchReviews(reviews, req.query.q) : [];
  res.json(out);
}));

app.post('/api/insights', wrap(async (req, res) => {
  const { dataId, query = '', provider } = req.body || {};
  if (!dataId) return res.status(400).json({ error: 'dataId required.' });
  const reviews = await fetchReviews(dataId);
  if (reviews.length < 5) return res.json({ enough: false, message: 'Not enough evidence to generate insights.', reviewsAnalysed: reviews.length });
  const sentiment = overallSentiment(reviews);
  res.json({ enough: true, reviewsAnalysed: reviews.length, sentiment, themes: themeInsights(reviews),
    medilens: provider ? medilensScore(provider, { query, sentiment }) : null,
    disclaimer: 'Derived from a sample of public online reviews; may be incomplete or biased. Not a clinical quality rating.' });
}));

app.post('/api/compare', wrap(async (req, res) => {
  const { providers = [], query = '' } = req.body || {};
  if (providers.length < 2 || providers.length > 4) return res.status(400).json({ error: 'Select 2–4 providers.' });
  const rows = await Promise.all(providers.map(async p => {
    let sentiment = null; try { sentiment = overallSentiment(await fetchReviews(p.dataId, { pages: 1 })); } catch {}
    return { ...p, sentiment, medilens: medilensScore(p, { query, sentiment }) };
  }));
  res.json({ providers: rows });
}));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`MediLens on http://localhost:${port}`));
