import { getSettings, ensureSchema } from '../../src/core.js';
import { baseUrl } from '../../src/seo.js';
export const onRequestGet = async ({ request, env }) => {
  let base = new URL(request.url).origin;
  try { await ensureSchema(env); base = baseUrl(request, await getSettings(env)); } catch (e) { }
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};
