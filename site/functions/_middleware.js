// v1.13: chuyển hướng về tên miền chính https://quantritute.com
// - quantritute.pages.dev và www.quantritute.com → quantritute.com (giữ nguyên đường dẫn)
// - Không đụng bản xem trước (<nhánh>.quantritute.pages.dev) và các yêu cầu gửi form (POST)
const MAIN = 'quantritute.com';
const OLD = new Set(['quantritute.pages.dev', 'www.quantritute.com']);
export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);
  if (OLD.has(url.hostname) && (request.method === 'GET' || request.method === 'HEAD')) {
    url.hostname = MAIN; url.protocol = 'https:'; url.port = '';
    return Response.redirect(url.toString(), 301);
  }
  return next();
};
