N='cong-cu/quan-ly-nhan-su/nguon/'
def rep(s,a,b):
    assert s.count(a)==1,(s.count(a),a[:90]); return s.replace(a,b)
for d in ('src','_ban-0.3.1'):
    p=N+d+'/chamcong.js'; s=open(p,encoding='utf-8').read()
    # bỏ 3 thẻ đầu
    i=s.index("        '<div class=\"wf-try\">' + T.map("); j=s.index("        '<h4 class=\"wf-h4\">Kịch bản thử 5 phút")
    s=s[:i]+s[j:]
    i=s.index("      // 08/11 15:10 anh: Trang quản lý đứng trước"); j=s.index("      var last = smp.map(")
    s=s[:i]+"      // 08/11 15:28 anh: bỏ 3 thẻ giới thiệu trang, gộp thẳng vào các bước của kịch bản thử\n"+s[j:]
    # thêm mô tả trang + QR vào bước
    s=rep(s,"{ t: 'Thiết lập Wi‑Fi văn phòng', dev:","{ t: 'Thiết lập Wi‑Fi văn phòng', ds: '<b>Trang quản lý</b> – cho kế toán, nhân sự: khai báo Wi‑Fi văn phòng, xem tổng hợp lượt chấm, lượt bị từ chối, tài khoản nhân viên. Làm bước này trước tiên.', dev:")
    s=rep(s,"{ t: 'Đăng nhập trang nhân viên', dev:","{ t: 'Đăng nhập trang nhân viên', ds: '<b>Trang nhân viên</b> – mỗi người dùng trên điện thoại của mình: chấm Vào ca / Ra ca, xem bảng công, phiếu lương, gửi đơn nghỉ.', qr: 1, dev:")
    s=rep(s,"hint: 'hoặc quét mã QR ở thẻ 2 bằng camera', ","")
    s=rep(s,"'<div class=\"wf-dev ' + x.ic + '\">'","(x.ds ? '<p class=\"wf-ds\">' + x.ds + '</p>' : '') + '<div class=\"wf-dev ' + x.ic + '\">'")
    s=rep(s,"(x.hint ? '<i>' + x.hint + '</i>' : '')","(x.qr ? '<div class=\"wf-qr\"><img src=\"' + D + '/api/demo/qr?u=nv\" alt=\"Mã QR mở Trang nhân viên\" loading=\"lazy\" onerror=\"this.parentNode.style.display=\\'none\\'\"><span>Hoặc mở camera điện thoại quét mã này<br><b class=\"mono\">' + esc(D.replace(/^https:\\/\\//, '')) + '</b></span></div>' : '')")
    s=rep(s,"""      '<p class="wf-more"><b>Dự phòng:</b> Wi‑Fi văn phòng lỗi → nhân viên quét <b>Mã QR chấm công</b> (thẻ 3) để chấm. <b>Thử thêm:</b> gửi đơn nghỉ trên điện thoại → duyệt ở <a href="#np">Nghỉ phép</a> → điện thoại thấy "Đã duyệt".</p>';""",
"""      '<div class="wf-bk"><div><b>Dự phòng – Mã QR chấm công:</b> chỉ dùng khi điện thoại nhân viên không bắt được Wi‑Fi văn phòng (Wi‑Fi lỗi, quá tải, ở xa bộ phát). Mở trang này trên một thiết bị cố định ở văn phòng; nhân viên quét mã đổi mỗi 30 giây để chấm.</div><a class="btn btn-sm" href="' + D + '/tram" target="_blank" rel="noopener">Mở ngay: Mã QR chấm công ' + ic('ext', 13) + '</a></div>' +
      '<p class="wf-more"><b>Thử thêm:</b> gửi đơn nghỉ trên điện thoại → duyệt ở <a href="#np">Nghỉ phép</a> → điện thoại thấy "Đã duyệt".</p>';""")
    open(p,'w',encoding='utf-8').write(s)
    p=N+d+'/ui.html'; s=open(p,encoding='utf-8').read()
    s=rep(s,".wf-more{margin:12px 0 0;font-size:13px;color:var(--ink-2)}",""".wf-more{margin:8px 0 0;font-size:13px;color:var(--ink-2)}
.wf-ds{margin:0;font-size:12.5px;line-height:1.5;color:var(--ink-2)}
.wf-sec .wf-qr{margin-top:8px}.wf-sec .wf-qr img{width:84px;height:84px}
.wf-bk{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:14px;padding:10px 12px;border:1px dashed var(--line);border-radius:12px;background:var(--surface-2);font-size:13px;color:var(--ink-2)}
.wf-bk>div{flex:1;min-width:240px}""")
    open(p,'w',encoding='utf-8').write(s)
print('ok')
