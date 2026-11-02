/* ============================================================
 * v1.9 SEO & chia sẻ mạng xã hội cho Blog
 * Trang web là SPA (chạy bằng JavaScript) nên Facebook/Zalo/Google không đọc được tiêu đề bài.
 * Các hàm dưới đây chèn sẵn <title>, mô tả, thẻ og:* , twitter:*, canonical, JSON-LD vào index.html ở phía máy chủ.
 * ============================================================ */
import { ensureSchema, getSettings, ngamOn } from './core.js';
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
    if (!key && !ngamOn(s, 'baiviet')) return renderShell(env, request, { title: 'Bài viết · Quản trị tử tế', desc: '', url: base + '/blog', noindex: true });
    const p = await env.DB.prepare(`SELECT slug, title, excerpt, body, cover_url, published_at, updated_at, status, seo_title, seo_desc, og_title, og_desc, og_image, noindex
      FROM posts WHERE slug = ?1 AND (status = 'published' OR (?2 <> '' AND preview_key = ?2))`).bind(slug, key).first();
    if (!p) return renderShell(env, request, { title: 'Không tìm thấy bài viết · Quản trị tử tế', desc: '', url: base + '/blog', noindex: true, status: 404 });
    const desc = cut(p.seo_desc || p.excerpt || plain(p.body), 160), image = abs(base, p.og_image || p.cover_url), link = base + '/blog/' + p.slug;
    const title = (p.seo_title || p.title) + ' · Quản trị tử tế';
    return renderShell(env, request, {
      title, desc, ogTitle: p.og_title || p.title, ogDesc: cut(p.og_desc || desc, 200), url: link, image, type: 'article', noindex: p.status !== 'published' || !!p.noindex,
      jsonld: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: desc, image: image ? [image] : undefined,
        datePublished: p.published_at || undefined, dateModified: new Date(p.updated_at || Date.now()).toISOString(),
        author: { '@type': 'Organization', name: 'Quản trị tử tế', url: base + '/ve-dom' },
        publisher: { '@type': 'Organization', name: 'Quản trị tử tế', url: base }, mainEntityOfPage: link },
    });
  } catch (e) { console.error('seo post', e); return env.ASSETS.fetch(new Request(new URL('/', request.url))); }
}

export async function blogIndexPage({ request, env }) {
  try {
    await ensureSchema(env);
    const s = await getSettings(env), base = baseUrl(request, s);
    return renderShell(env, request, { title: 'Blog · Quản trị tử tế', desc: 'Ghi chép mỗi ngày về quản trị, con người và những điều Đốm đang học.', url: base + '/blog', image: base + '/assets/desk-on.jpg', noindex: !ngamOn(s, 'baiviet') });
  } catch (e) { return env.ASSETS.fetch(new Request(new URL('/', request.url))); }
}

/* v1.22 Trang Hướng dẫn tĩnh (site/public/huong-dan, sinh bằng site/huong-dan-nguon/tao-trang.py) */
const GUIDES = ['/huong-dan/', '/huong-dan/tai-hoa-don-dien-tu-hang-loat/', '/huong-dan/chuyen-xml-hoa-don-sang-excel/', '/huong-dan/lap-to-khai-thue-gtgt-mau-01-gtgt/', '/huong-dan/tao-van-ban-hang-loat-tu-excel/', '/huong-dan/tra-cuu-van-ban-phap-luat-thue-ke-toan/', '/huong-dan/doi-chieu-sao-ke-ngan-hang-voi-so-ke-toan/', '/huong-dan/ghep-doi-chieu-2-file-excel-khong-can-vlookup/', '/huong-dan/lap-bang-ke-va-soat-to-khai-gtgt-tu-danh-sach-hoa-don/'];
export async function sitemap({ request, env }) {
  await ensureSchema(env);
  const s = await getSettings(env), base = baseUrl(request, s);
  const [posts, tools] = await Promise.all([
    env.DB.prepare(`SELECT slug, published_at FROM posts WHERE status = 'published' AND noindex = 0 ORDER BY published_at DESC LIMIT 2000`).all(),
    env.DB.prepare(`SELECT slug, url FROM tools WHERE visible = 1`).all(),
  ]);
  const u = (loc, lastmod) => `<url><loc>${escA(base + loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
    + ['/', '/cong-cu', '/bang-ghim', ...(ngamOn(s, 'baiviet') ? ['/blog'] : []), ...(ngamOn(s) ? ['/goc-ngam'] : []), '/ve-dom', '/goc-cam-on'].map(x => u(x)).join('')
    + GUIDES.map(x => u(x, '2026-10-21')).join('')
    + tools.results.map(t => u('/cong-cu/' + t.slug) + (/^\/tools\//.test(t.url || '') ? u(t.url) : '')).join('')
    + (ngamOn(s, 'baiviet') ? posts.results.map(p => u('/blog/' + p.slug, p.published_at)).join('') : '') + '</urlset>';
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

/* ============================================================
 * v1.23 (27/10/2026) Sửa lỗi lập chỉ mục Google (Search Console)
 * 1) Trang SPA (/, /cong-cu, /cong-cu/<slug>, /bang-ghim, /goc-ngam, /ve-dom, /tach-ca-phe…) được chèn sẵn
 *    tiêu đề, mô tả, canonical riêng ở phía máy chủ → Google không coi là bản sao của trang chủ.
 * 2) Đường dẫn không tồn tại trước đây được Cloudflare trả về trang chủ (mã 200) → nay trả mã 404 + noindex
 *    (giao diện vẫn hiện trang "Đốm lạc đường" như cũ). Lỗi này gây ra 4 trang "Trùng lặp" (/xl/*.xml, /assets/desk-).
 * 3) /cong-cu/<slug> của công cụ chưa có hoặc đang ẩn → 404 (trước đây JS tự đổi về /cong-cu, Google tính là chuyển hướng).
 * Lưu ý: thêm trang HTML tĩnh mới ngoài /huong-dan/ và /tools/ thì phải thêm tiền tố vào STATIC_HTML, nếu không sẽ bị trả 404.
 * ============================================================ */
const DESC_HOME = 'Quản trị lấy Con người làm gốc. Chia sẻ hành trình học, tạo giá trị mỗi ngày. Kho công cụ nhỏ, miễn phí cho việc văn phòng.';
const SPA = {
  '/': { title: 'Quản trị tử tế', desc: DESC_HOME },
  '/cong-cu': { title: 'Bộ công cụ · Quản trị tử tế', desc: 'Bộ công cụ nhỏ, miễn phí cho việc văn phòng, kế toán – thuế. Dùng online ngay trên trình duyệt hoặc tải bản offline.' },
  '/bang-ghim': { title: 'Bảng ghim · Quản trị tử tế', desc: 'Các công cụ mới phát hành, đang hoàn thiện, sắp làm và những đề xuất từ người dùng. Gửi đề xuất công cụ bạn đang cần.' },
  '/goc-ngam': { title: 'Góc ngẫm · Quản trị tử tế', desc: 'Góc ngẫm: tủ sách, phòng chiếu video và bài viết về quản trị, con người.', ngam: true },
  '/ve-dom': { title: 'Về Đốm · Quản trị tử tế', desc: 'Về Đốm và Minh Tuấn – người đứng sau Quản trị tử tế.' },
  '/goc-cam-on': { title: 'Góc cảm ơn · Quản trị tử tế', desc: 'Cảm ơn những góp ý, đề xuất tính năng của anh/chị – danh sách góp ý và tình trạng xử lý, cùng chung tay xây dựng kho công cụ miễn phí.' },
  '/tach-ca-phe': { title: 'Tách cà phê · Quản trị tử tế', desc: 'Mời Tuấn một tách cà phê để ủng hộ Quản trị tử tế duy trì kho công cụ miễn phí.' },
  '/hanh-trinh': { title: 'Hành trình · Quản trị tử tế', desc: DESC_HOME, noindex: true }, // đang tạm gác
};
const ALIAS = { '/phat-trien': '/goc-ngam', '/ve-minh-tuan': '/ve-dom', '/lien-he': '/tach-ca-phe' }; // đường dẫn cũ → canonical trang mới
const STATIC_HTML = ['/huong-dan/', '/tools/'];

export async function seoRoute(ctx, next) {
  const { request, env } = ctx, url = new URL(request.url), raw = url.pathname;
  if (/^\/(api|blog)(\/|$)/.test(raw) || raw === '/sitemap.xml' || raw === '/robots.txt') return next();
  const path = raw.replace(/\/+$/, '') || '/';
  let s, base;
  const load = async () => { if (!s) { await ensureSchema(env); s = await getSettings(env); base = baseUrl(request, s); } };
  try {
    const key = ALIAS[path] || path;
    if (SPA[key]) {
      await load();
      const m = SPA[key], hide = m.noindex || (m.ngam && !ngamOn(s));
      return renderShell(env, request, { title: m.title, desc: m.desc, url: base + (key === '/' ? '/' : key), image: base + '/assets/desk-on.jpg', noindex: hide });
    }
    const tm = path.match(/^\/cong-cu\/([a-z0-9-]+)$/);
    if (tm) {
      await load();
      const t = await env.DB.prepare(`SELECT slug, name, sub, pain FROM tools WHERE slug = ?1 AND visible = 1`).bind(tm[1]).first();
      if (!t) return notFound(env, request, base);
      const img = await env.ASSETS.fetch(new Request(new URL('/assets/tools/' + t.slug + '.jpg', request.url), { method: 'HEAD' }));
      return renderShell(env, request, {
        title: t.name + ' · Bộ công cụ · Quản trị tử tế', desc: cut(plain(t.pain || t.sub || DESC_HOME), 160), url: base + '/cong-cu/' + t.slug,
        image: base + (img.ok ? '/assets/tools/' + t.slug + '.jpg' : '/assets/desk-on.jpg'),
      });
    }
  } catch (e) { console.error('seoRoute', e); return next(); }
  const res = await next();
  if (res.status !== 200 || !(res.headers.get('content-type') || '').includes('text/html')) return res;
  if (raw.startsWith('/tools/')) { // trang công cụ tĩnh: thêm canonical về thư mục công cụ (bản offline .html cũng trỏ về đây)
    try {
      await load();
      const dir = (raw.match(/^\/tools\/[a-z0-9-]+\//i) || [raw.replace(/\/?$/, '/')])[0];
      return new HTMLRewriter().on('head', { element: e => { e.append(`<link rel="canonical" href="${escA(base + dir)}">`, { html: true }); } }).transform(res);
    } catch (e) { return res; }
  }
  if (STATIC_HTML.some(p => raw.startsWith(p))) return res;
  try { await load(); } catch (e) { base = url.origin; }
  return notFound(env, request, base); // Cloudflare trả trang chủ cho đường dẫn không tồn tại → đổi thành 404
}
function notFound(env, request, base) {
  return renderShell(env, request, { title: 'Không tìm thấy · Quản trị tử tế', desc: '', url: base + '/', noindex: true, status: 404 });
}
