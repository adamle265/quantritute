/* ============================================================
 * v1.9 SEO & chia sẻ mạng xã hội cho Blog
 * Trang web là SPA (chạy bằng JavaScript) nên Facebook/Zalo/Google không đọc được tiêu đề bài.
 * Các hàm dưới đây chèn sẵn <title>, mô tả, thẻ og:* , twitter:*, canonical, JSON-LD vào index.html ở phía máy chủ.
 * ============================================================ */
import { ensureSchema, getSettings } from './core.js';
const escA = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plain = s => String(s || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#>*_`|-]+/g, ' ').replace(/\s+/g, ' ').trim();
const cut = (s, n) => s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;

export function baseUrl(request, s) { return (s.site_url || new URL(request.url).origin).replace(/\/+$/, ''); }
const abs = (base, u) => !u ? '' : /^https?:\/\//i.test(u) ? u : base + (u.startsWith('/') ? '' : '/') + u;

/** Lấy index.html tĩnh rồi thay thẻ meta. meta: {title, desc, url, image, type, noindex, jsonld} */
export async function renderShell(env, request, meta) {
  const res = await env.ASSETS.fetch(new Request(new URL('/', request.url), { headers: request.headers }));
  const tags = [
    `<link rel="canonical" href="${escA(meta.url)}">`,
    `<meta property="og:url" content="${escA(meta.url)}">`, `<meta property="og:type" content="${escA(meta.type || 'website')}">`,
    `<meta property="og:site_name" content="Quản trị tử tế">`, `<meta property="og:locale" content="vi_VN">`,
    `<meta name="twitter:card" content="summary_large_image">`, `<meta name="twitter:title" content="${escA(meta.ogTitle || meta.title)}">`,
    `<meta name="twitter:description" content="${escA(meta.ogDesc || meta.desc)}">`, meta.image ? `<meta name="twitter:image" content="${escA(meta.image)}">` : '',
    meta.noindex ? '<meta name="robots" content="noindex, nofollow">' : '',
    meta.jsonld ? `<script type="application/ld+json">${JSON.stringify(meta.jsonld).replace(/</g, '\\u003c')}</script>` : '',
  ].join('');
  return new HTMLRewriter()
    .on('title', { element: e => { e.setInnerContent(meta.title); } })
    .on('meta[name="description"]', { element: e => { e.setAttribute('content', meta.desc); } })
    .on('meta[property="og:title"]', { element: e => { e.setAttribute('content', meta.ogTitle || meta.title); } })
    .on('meta[property="og:description"]', { element: e => { e.setAttribute('content', meta.ogDesc || meta.desc); } })
    .on('meta[property="og:image"]', { element: e => { if (meta.image) e.setAttribute('content', meta.image); } })
    .on('head', { element: e => { e.append(tags, { html: true }); } })
    .transform(new Response(res.body, { status: meta.status || 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': meta.noindex ? 'no-store' : 'public, max-age=60' } }));
}

export async function blogPostPage({ request, env, params }) {
  try {
    await ensureSchema(env);
    const s = await getSettings(env), base = baseUrl(request, s), url = new URL(request.url);
    const slug = String(params.slug || '').toLowerCase().slice(0, 80), key = String(url.searchParams.get('xem-truoc') || '').slice(0, 40);
    const p = await env.DB.prepare(`SELECT slug, title, excerpt, body, cover_url, published_at, updated_at, status, seo_title, seo_desc, og_title, og_desc, og_image, noindex
      FROM posts WHERE slug = ?1 AND (status = 'published' OR (?2 <> '' AND preview_key = ?2))`).bind(slug, key).first();
    if (!p) return renderShell(env, request, { title: 'Không tìm thấy bài viết · Quản trị tử tế', desc: '', url: base + '/blog', noindex: true, status: 404 });
    const desc = cut(p.seo_desc || p.excerpt || plain(p.body), 160), image = abs(base, p.og_image || p.cover_url), link = base + '/blog/' + p.slug;
    const title = (p.seo_title || p.title) + ' · Quản trị tử tế';
    return renderShell(env, request, {
      title, desc, ogTitle: p.og_title || p.title, ogDesc: cut(p.og_desc || desc, 200), url: link, image, type: 'article', noindex: p.status !== 'published' || !!p.noindex,
      jsonld: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: desc, image: image ? [image] : undefined,
        datePublished: p.published_at || undefined, dateModified: new Date(p.updated_at || Date.now()).toISOString(),
        author: { '@type': 'Person', name: s.about_name || 'Minh Tuấn', url: base + '/ve-minh-tuan' },
        publisher: { '@type': 'Organization', name: 'Quản trị tử tế', url: base }, mainEntityOfPage: link },
    });
  } catch (e) { console.error('seo post', e); return env.ASSETS.fetch(new Request(new URL('/', request.url))); }
}

export async function blogIndexPage({ request, env }) {
  try {
    await ensureSchema(env);
    const s = await getSettings(env), base = baseUrl(request, s);
    return renderShell(env, request, { title: 'Blog · Quản trị tử tế', desc: 'Ghi chép mỗi ngày về quản trị, con người và những điều Tuấn đang học.', url: base + '/blog', image: base + '/assets/desk-on.jpg' });
  } catch (e) { return env.ASSETS.fetch(new Request(new URL('/', request.url))); }
}

export async function sitemap({ request, env }) {
  await ensureSchema(env);
  const s = await getSettings(env), base = baseUrl(request, s);
  const [posts, tools] = await Promise.all([
    env.DB.prepare(`SELECT slug, published_at FROM posts WHERE status = 'published' AND noindex = 0 ORDER BY published_at DESC LIMIT 2000`).all(),
    env.DB.prepare(`SELECT slug, url FROM tools WHERE visible = 1`).all(),
  ]);
  const u = (loc, lastmod) => `<url><loc>${escA(base + loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
    + ['/', '/cong-cu', '/bang-ghim', '/blog', '/goc-ngam', '/ve-minh-tuan', '/tach-ca-phe'].map(x => u(x)).join('')
    + tools.results.map(t => u('/cong-cu/' + t.slug) + (/^\/tools\//.test(t.url || '') ? u(t.url) : '')).join('')
    + posts.results.map(p => u('/blog/' + p.slug, p.published_at)).join('') + '</urlset>';
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
