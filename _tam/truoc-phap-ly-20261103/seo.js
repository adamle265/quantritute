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
  // v1.30 (30/10): bỏ Range / If-* khi lấy index.html. Facebook gửi "Range: bytes=0-…" → trước đây trang trả chậm ~15 giây,
  // Facebook hết thời gian chờ nên link chia sẻ chỉ hiện "quantritute.com". If-None-Match có thể làm ASSETS trả 304 rỗng.
  const h = new Headers(request.headers); ['range', 'if-range', 'if-none-match', 'if-modified-since', 'if-match', 'if-unmodified-since'].forEach(k => h.delete(k));
  const res = await env.ASSETS.fetch(new Request(new URL('/', request.url), { headers: h }));
  const tags = [
    `<link rel="canonical" href="${escA(meta.url)}">`,
    `<meta property="og:url" content="${escA(meta.url)}">`, `<meta property="og:type" content="${escA(meta.type || 'website')}">`,
    `<meta property="og:site_name" content="Quản trị tử tế">`, `<meta property="og:locale" content="vi_VN">`,
    `<meta name="twitter:card" content="summary_large_image">`, `<meta name="twitter:title" content="${escA(meta.ogTitle || meta.title)}">`,
    `<meta name="twitter:description" content="${escA(meta.ogDesc || meta.desc)}">`, meta.image ? `<meta name="twitter:image" content="${escA(meta.image)}">` : '',
    meta.imageW ? `<meta property="og:image:width" content="${meta.imageW}"><meta property="og:image:height" content="${meta.imageH}"><meta property="og:image:type" content="image/jpeg">` : '',
    meta.imageAlt ? `<meta property="og:image:alt" content="${escA(meta.imageAlt)}"><meta name="twitter:image:alt" content="${escA(meta.imageAlt)}">` : '',
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
    // v1.31 (02/11): chèn sẵn tiêu đề H1 + đoạn mô tả vào #site (thay chữ "Đang mở cửa phòng…") để Google đọc được nội dung ngay trong HTML; JS vẫn vẽ lại trang như cũ
    .on('#site', { element: e => { if (meta.prerender) e.setInnerContent(meta.prerender, { html: true }); } })
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
const GUIDES = ['/huong-dan/', '/huong-dan/tai-hoa-don-dien-tu-hang-loat/', '/huong-dan/chuyen-xml-hoa-don-sang-excel/', '/huong-dan/lap-to-khai-thue-gtgt-mau-01-gtgt/', '/huong-dan/tao-van-ban-hang-loat-tu-excel/', '/huong-dan/tra-cuu-van-ban-phap-luat-thue-ke-toan/', '/huong-dan/doi-chieu-sao-ke-ngan-hang-voi-so-ke-toan/', '/huong-dan/ghep-doi-chieu-2-file-excel-khong-can-vlookup/', '/huong-dan/lap-bang-ke-va-soat-to-khai-gtgt-tu-danh-sach-hoa-don/', '/huong-dan/in-hoa-don-pdf-hang-loat-theo-danh-sach/', '/huong-dan/tai-to-khai-thue-hang-loat/'];
export async function sitemap({ request, env }) {
  await ensureSchema(env);
  const s = await getSettings(env), base = baseUrl(request, s);
  const [posts, tools] = await Promise.all([
    env.DB.prepare(`SELECT slug, published_at FROM posts WHERE status = 'published' AND noindex = 0 ORDER BY published_at DESC LIMIT 2000`).all(),
    env.DB.prepare(`SELECT slug, url FROM tools WHERE visible = 1 AND status = 'ok'`).all(), // v1.32: công cụ "Sắp ra mắt" chưa đưa vào sitemap
  ]);
  const u = (loc, lastmod) => `<url><loc>${escA(base + loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
    + ['/', '/cong-cu', '/bang-ghim', ...(ngamOn(s, 'baiviet') ? ['/blog'] : []), ...(ngamOn(s) ? ['/goc-ngam'] : []), '/ve-dom', '/goc-cam-on', '/tach-ca-phe'].map(x => u(x)).join('')
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
  '/cong-cu': { title: 'Bộ công cụ · Quản trị tử tế', desc: 'Bộ công cụ nhỏ, miễn phí cho việc văn phòng, kế toán – thuế. Dùng online ngay trên trình duyệt hoặc tải bản offline.',
    // v1.30: ảnh + lời riêng khi chia sẻ link (Facebook, Zalo)
    ogTitle: 'Bộ công cụ miễn phí cho Kế toán – Hành chính · Quản trị tử tế',
    ogDesc: 'Tải hóa đơn từ cổng thuế, lập bảng kê & tờ khai GTGT, đối chiếu 2 file Excel, tạo văn bản hàng loạt. Miễn phí, không cần cài đặt.',
    image: '/assets/og/cong-cu.jpg', imageW: 1200, imageH: 630, imageAlt: 'Bộ công cụ miễn phí cho Kế toán – Hành chính của Quản trị tử tế' },
  '/bang-ghim': { title: 'Bảng ghim · Quản trị tử tế', desc: 'Các công cụ mới phát hành, đang hoàn thiện, sắp làm và những đề xuất từ người dùng. Gửi đề xuất công cụ bạn đang cần.' },
  '/goc-ngam': { title: 'Góc ngẫm · Quản trị tử tế', desc: 'Góc ngẫm: tủ sách, phòng chiếu video và bài viết về quản trị, con người.', ngam: true },
  '/ve-dom': { title: 'Về Đốm · Quản trị tử tế', desc: 'Về Đốm và Minh Tuấn – người đứng sau Quản trị tử tế.' },
  '/goc-cam-on': { title: 'Góc cảm ơn · Quản trị tử tế', desc: 'Cảm ơn những góp ý, đề xuất tính năng của anh/chị – danh sách góp ý và tình trạng xử lý, cùng chung tay xây dựng kho công cụ miễn phí.' },
  '/tach-ca-phe': { title: 'Tách cà phê · Quản trị tử tế', desc: 'Mời Tuấn một tách cà phê để ủng hộ Quản trị tử tế duy trì kho công cụ miễn phí.' },
  '/hanh-trinh': { title: 'Hành trình · Quản trị tử tế', desc: DESC_HOME, noindex: true }, // đang tạm gác
};
const ALIAS = { '/phat-trien': '/goc-ngam', '/ve-minh-tuan': '/ve-dom', '/lien-he': '/tach-ca-phe' }; // đường dẫn cũ → canonical trang mới
const STATIC_HTML = ['/huong-dan/', '/tools/'];
/* 02/11/2026: ảnh chia sẻ Facebook/Zalo của công cụ – ưu tiên ảnh thiết kế riêng /assets/tools/og/<slug>.jpg (1200×630),
   không có thì ảnh giao diện /assets/tools/<slug>.jpg (1280×720, cũng là ảnh khung VIDEO DEMO), cuối cùng ảnh bàn làm việc */
async function toolImage(env, request, base, slug) {
  for (const [p, w, h] of [['/assets/tools/og/' + slug + '.jpg', 1200, 630], ['/assets/tools/' + slug + '.jpg', 1280, 720]]) {
    try { const r = await env.ASSETS.fetch(new Request(new URL(p, request.url), { method: 'HEAD' })); if (r.ok) return { image: base + p, w, h }; } catch (e) { }
  }
  return { image: base + '/assets/desk-on.jpg', w: 2752, h: 1536 };
}

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
      const h1 = key === '/' ? 'Quản trị tử tế' : m.title.replace(/ · Quản trị tử tế$/, '');
      const jsonld = key === '/' ? [
        { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Quản trị tử tế', url: base + '/', inLanguage: 'vi-VN' },
        { '@context': 'https://schema.org', '@type': 'Organization', name: 'Quản trị tử tế', url: base + '/', logo: base + '/icon-512.png' },
      ] : undefined;
      return renderShell(env, request, { title: m.title, desc: m.desc, ogTitle: m.ogTitle, ogDesc: m.ogDesc, url: base + (key === '/' ? '/' : key), jsonld,
        prerender: `<div class="loading"><h1>${escA(h1)}</h1><p>${escA(m.desc)}</p></div>`,
        image: base + (m.image || '/assets/desk-on.jpg'), imageW: m.image ? m.imageW : 2752, imageH: m.image ? m.imageH : 1536, imageAlt: m.imageAlt, noindex: hide });
    }
    const tm = path.match(/^\/cong-cu\/([a-z0-9-]+)$/);
    if (tm) {
      await load();
      const t = await env.DB.prepare(`SELECT * FROM tools WHERE slug = ?1 AND visible = 1`).bind(tm[1]).first();
      if (!t) return notFound(env, request, base);
      const ti = await toolImage(env, request, base, t.slug), image = ti.image, link = base + '/cong-cu/' + t.slug;
      const ready = t.status === 'ok', free = (t.pricing || 'free') === 'free' || !Number(t.price);
      const first = x => plain(String(x || '').split('\n').map(v => v.split('|').pop()).find(v => v.trim()) || '');
      // v1.31: mô tả = nỗi đau + lợi ích chính (+ "miễn phí, dùng online") thay vì chỉ 1 câu ngắn
      const core = [plain(t.pain || ''), first(t.benefits) || first(t.highlights)].filter(Boolean).map(x => x.replace(/[.\s]+$/, '')).join('. ');
      const desc = cut((ready ? '' : 'Sắp ra mắt: ') + (core ? core + '.' : '') + (ready && free ? ' Miễn phí, dùng online ngay trên trình duyệt.' : ''), 158) || DESC_HOME;
      const list = String(t.highlights || '').split('\n').map(v => v.split('|')[0].trim()).filter(Boolean).slice(0, 6);
      const jsonld = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: base + '/' },
        { '@type': 'ListItem', position: 2, name: 'Bộ công cụ', item: base + '/cong-cu' },
        { '@type': 'ListItem', position: 3, name: t.name, item: link }] }];
      if (ready) jsonld.push({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: t.name, description: desc, url: link, image,
        applicationCategory: 'BusinessApplication', operatingSystem: 'Web', inLanguage: 'vi-VN',
        ...(t.version ? { softwareVersion: String(t.version).replace(/^Bản\s*/i, '') } : {}), ...(t.released ? { datePublished: t.released } : {}),
        ...(free ? { offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' } } : {}),
        publisher: { '@type': 'Organization', name: 'Quản trị tử tế', url: base + '/' } });
      return renderShell(env, request, {
        title: t.name + ' · Bộ công cụ · Quản trị tử tế', desc, url: link, image, imageW: ti.w, imageH: ti.h, imageAlt: 'Công cụ ' + t.name, jsonld,
        noindex: !ready, // v1.32 (anh chốt 02/11): công cụ "Sắp ra mắt" tạm ẩn khỏi Google đến khi ra mắt; người dùng vẫn xem bình thường
        prerender: `<div class="loading"><h1>${escA(t.name)}</h1><p>${escA(desc)}</p>${list.length ? `<ul>${list.map(x => `<li>${escA(x)}</li>`).join('')}</ul>` : ''}${t.who ? `<p>Dành cho: ${escA(t.who)}</p>` : ''}</div>`,
      });
    }
  } catch (e) { console.error('seoRoute', e); return next(); }
  const res = await next();
  if (res.status !== 200 || !(res.headers.get('content-type') || '').includes('text/html')) return res;
  if (raw.startsWith('/tools/')) { // trang công cụ tĩnh: thêm canonical về thư mục công cụ (bản offline .html cũng trỏ về đây)
    try {
      await load();
      const dir = (raw.match(/^\/tools\/[a-z0-9-]+\//i) || [raw.replace(/\/?$/, '/')])[0];
      let hasDesc = false, d = '', og = '';
      try {
        const t = await env.DB.prepare(`SELECT slug, name, pain, benefits FROM tools WHERE url = ?1 AND visible = 1`).bind(dir).first();
        if (t) {
          d = cut([plain(t.pain), plain(String(t.benefits || '').split('\n')[0])].filter(Boolean).join('. '), 158);
          // 02/11/2026: thẻ chia sẻ Facebook/Zalo cho trang công cụ tĩnh (trước chỉ hiện tiêu đề, không ảnh, không mô tả).
          // Ảnh = ảnh giao diện /assets/tools/<slug>.jpg (1280×720) nếu có, không thì ảnh bàn làm việc.
          const { image, w, h } = await toolImage(env, request, base, t.slug);
          const title = t.name + ' · Quản trị tử tế', od = d ? d + ' Miễn phí, dùng ngay trên trình duyệt.' : DESC_HOME;
          og = [`<meta property="og:type" content="website">`, `<meta property="og:site_name" content="Quản trị tử tế">`, `<meta property="og:locale" content="vi_VN">`,
            `<meta property="og:url" content="${escA(base + dir)}">`, `<meta property="og:title" content="${escA(title)}">`, `<meta property="og:description" content="${escA(od)}">`,
            `<meta property="og:image" content="${escA(image)}">`, `<meta property="og:image:width" content="${w}"><meta property="og:image:height" content="${h}"><meta property="og:image:type" content="image/jpeg">`,
            `<meta property="og:image:alt" content="${escA('Công cụ ' + t.name)}">`,
            `<meta name="twitter:card" content="summary_large_image">`, `<meta name="twitter:title" content="${escA(title)}">`, `<meta name="twitter:description" content="${escA(od)}">`, `<meta name="twitter:image" content="${escA(image)}">`].join('');
        }
      } catch (e) { }
      return new HTMLRewriter()
        .on('meta[name="description"]', { element: () => { hasDesc = true; } })
        .on('meta[property^="og:"]', { element: el => { if (og) el.remove(); } })
        .on('meta[name^="twitter:"]', { element: el => { if (og) el.remove(); } })
        .on('head', { element: e => { e.append(`<link rel="canonical" href="${escA(base + dir)}">` + og, { html: true }); e.onEndTag(end => { if (!hasDesc && d) end.before(`<meta name="description" content="${escA(d)}">`, { html: true }); }); } })
        .transform(res);
    } catch (e) { return res; }
  }
  if (STATIC_HTML.some(p => raw.startsWith(p))) return res;
  try { await load(); } catch (e) { base = url.origin; }
  return notFound(env, request, base); // Cloudflare trả trang chủ cho đường dẫn không tồn tại → đổi thành 404
}
function notFound(env, request, base) {
  return renderShell(env, request, { title: 'Không tìm thấy · Quản trị tử tế', desc: '', url: base + '/', noindex: true, status: 404 });
}
