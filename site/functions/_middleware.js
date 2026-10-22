// v1.13: chuyển hướng về tên miền chính https://quantritute.com
// - quantritute.pages.dev và www.quantritute.com → quantritute.com (giữ nguyên đường dẫn)
// - Không đụng bản xem trước (<nhánh>.quantritute.pages.dev) và các yêu cầu gửi form (POST)
// v1.22: link ngắn theo kênh để đo nguồn khách (dùng ở bio, mô tả video, bài đăng group):
//   /tt → TikTok · /yt → YouTube · /fb → Fanpage · /nhom → group Facebook · /zl → Zalo · /mail → email
//   Có thể nối thêm đường dẫn: /yt/cong-cu/hoa-don-thue → /cong-cu/hoa-don-thue?utm_source=youtube…
//   Thêm ?c=<tên> để ghi tên chiến dịch (VD /nhom?c=gia-dinh-ke-toan)
const MAIN = 'quantritute.com';
const OLD = new Set(['quantritute.pages.dev', 'www.quantritute.com']);
const SHORT = { tt: 'tiktok', yt: 'youtube', fb: 'facebook', nhom: 'facebook-group', zl: 'zalo', mail: 'email' };
export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);
  if (OLD.has(url.hostname) && (request.method === 'GET' || request.method === 'HEAD')) {
    url.hostname = MAIN; url.protocol = 'https:'; url.port = '';
    return Response.redirect(url.toString(), 301);
  }
  const m = url.pathname.match(/^\/(tt|yt|fb|nhom|zl|mail)(\/.*)?$/i);
  if (m && (request.method === 'GET' || request.method === 'HEAD')) {
    const src = SHORT[m[1].toLowerCase()], rest = (m[2] || '/').replace(/\/{2,}/g, '/');
    const to = new URL(/^\/[a-z0-9\-/]*$/i.test(rest) ? rest : '/', url.origin);
    to.searchParams.set('utm_source', src);
    to.searchParams.set('utm_medium', src === 'email' ? 'email' : 'social');
    const c = (url.searchParams.get('c') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
    if (c) to.searchParams.set('utm_campaign', c);
    return new Response(null, { status: 302, headers: { location: to.pathname + to.search, 'cache-control': 'no-store' } });
  }
  return next();
};
