/* Vỏ Web Worker: nhận lệnh từ giao diện, gọi GDC, báo tiến trình */
function GDC_friendly(e) {
  var m = (e && e.message) || String(e || '');
  if (/allocation|Invalid (string|array) length|out of memory|Array buffer/i.test(m)) return 'Trình duyệt không đủ bộ nhớ để xử lý file này. Vui lòng đóng bớt tab/ứng dụng khác rồi thử lại; với file rất lớn hãy dùng bản chạy bằng Python.';
  return 'Đã có lỗi khi xử lý dữ liệu: ' + m;
}
self.GDC_friendly = GDC_friendly;
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
  self.onmessage = function (e) {
    var d = e.data, id = d.id;
    var last = 0;
    GDC.setProgress(function (msg, pct) { var now = Date.now(); if (now - last < 120 && pct < 99) return; last = now; self.postMessage({ id: id, progress: { message: msg, percent: pct } }); });
    var run;
    if (d.fn === 'init') run = Promise.resolve(GDC.setSheetJS(d.args[0]));
    else if (d.fn === 'loadFile') run = d.args[1].arrayBuffer().then(function (buf) { return GDC.loadFileBuffer(d.args[0], d.args[1].name, buf); });
    else run = Promise.resolve().then(function () { return GDC[d.fn].apply(null, d.args); });
    run.then(function (res) { if (id) self.postMessage({ id: id, ok: true, result: res }); },
      function (err) { if (id) self.postMessage({ id: id, ok: false, error: err && err.friendly ? err.message : GDC_friendly(err) }); });
  };
}
