  /* ================== TRÌNH SOẠN MẪU HỢP ĐỒNG KIỂU WORD (07/11/2026 – anh duyệt phương án 08:52) ==================
     Bộ soạn thảo TipTap 3.32.0 / ProseMirror (giấy phép MIT) đóng gói sẵn trong file (vendor/tiptap.iife.js → biến TT) – chạy không cần mạng.
     Mẫu lưu dạng HTML (tp.html). Mẫu cũ dạng ký hiệu (tp.nd: ^ # ~ ## _ ** ? [CHU_KY]) tự chuyển sang HTML khi mở / xuất (tplDoc).
     Trường ghép = thẻ <span data-f="khoa">, đoạn có điều kiện = <div data-if="khoa">, khối chữ ký = <div data-sign>, ngắt trang = <div data-pb>.
     Xuất: tplBlocks (đọc HTML → danh sách khối) → tplHtml (xem trước) / tplDocx (Word: đoạn, chữ đậm/nghiêng/gạch chân, cỡ chữ, căn lề,
     giãn dòng, thụt lề, danh sách số/chấm, bảng có/không viền, gộp ô, ngắt trang, khối chữ ký). */
  function fTag(k) { return '<span data-f="' + k + '">' + esc(TPL_KEYS[k] || k) + '</span>'; }
  function fold(s) { return HR.stripAcc(String(s || '')).toLowerCase().replace(/đ/g, 'd'); }
  // mẫu cũ (ký hiệu đầu dòng) → HTML của trình soạn
  function tplMdToHtml(nd) {
    var inl = function (t) {
      return String(t).split('**').map(function (s, i) {
        var h = esc(s).replace(/ {2,}/g, function (m) { return m.replace(/ /g, ' '); }).replace(/\{\{\s*([a-z_]+)\s*\}\}/g, function (m, k) { return fTag(k); });
        return i % 2 && h ? '<strong>' + h + '</strong>' : h;
      }).join('');
    };
    return String(nd || '').replace(/\r/g, '').split('\n').map(function (ln) {
      var cond = /^\?\s*/.test(ln); if (cond) ln = ln.replace(/^\?\s*/, '');
      var t = ln.trim(), h;
      if (t === '') h = '<p></p>';
      else if (t === '[CHU_KY]') h = '<div data-sign=""></div>';
      else if (t === '---') h = '<p style="text-align: center">———————</p>';
      else if (/^##\s/.test(t)) h = '<h2>' + inl(t.slice(3)) + '</h2>';
      else if (/^#\s/.test(t)) h = '<h1>' + inl(t.slice(2)) + '</h1>';
      else if (/^\^\s/.test(t)) h = '<p style="text-align: center"><strong>' + inl(t.slice(2)) + '</strong></p>';
      else if (/^~\s/.test(t)) h = '<p style="text-align: center"><em>' + inl(t.slice(2)) + '</em></p>';
      else if (/^_\s/.test(t)) h = '<p><em>' + inl(t.slice(2)) + '</em></p>';
      else h = '<p>' + inl(t) + '</p>';
      if (cond) { var mk = t.match(/\{\{\s*([a-z_]+)\s*\}\}/); if (mk) h = '<div data-if="' + mk[1] + '">' + h + '</div>'; }
      return h;
    }).join('');
  }
  function tplDoc(tp) { return tp.html || tplMdToHtml(tp.nd || ''); }
  function tplFieldsUsed(html) { var o = {}; String(html || '').replace(/data-(?:f|if)="([^"]*)"/g, function (m, k) { o[k] = 1; }); return Object.keys(o); }

  // HTML mẫu → danh sách khối. V: giá trị trường (null = giữ {{khoa}}); blank: mẫu trống (in cả đoạn có điều kiện)
  function tplBlocks(html, V, blank) {
    var doc = new DOMParser().parseFromString('<!doctype html><body>' + (html || '') + '</body>', 'text/html');
    function sz(st) { var m = /([\d.]+)\s*(pt|px)/.exec(st || ''); return m ? (m[2] === 'px' ? +m[1] * 0.75 : +m[1]) : 0; }
    function runs(node, f, out) {
      [].forEach.call(node.childNodes, function (n) {
        if (n.nodeType === 3) { if (n.nodeValue) out.push({ t: n.nodeValue, b: f.b, i: f.i, u: f.u, s: f.s }); return; }
        if (n.nodeType !== 1) return;
        var tg = n.tagName, g = { b: f.b, i: f.i, u: f.u, s: f.s };
        if (tg === 'BR') { out.push({ br: 1 }); return; }
        if (n.hasAttribute('data-f')) { var k = n.getAttribute('data-f'), v = V ? V[k] : null, e = !!V && (v === '' || v == null); out.push({ t: V ? (e ? BLANK : String(v)) : '{{' + k + '}}', b: f.b, i: f.i, u: f.u, s: f.s, fk: k, blank: e }); return; }
        if (tg === 'STRONG' || tg === 'B') g.b = 1; if (tg === 'EM' || tg === 'I') g.i = 1; if (tg === 'U') g.u = 1;
        var z = sz(n.style && n.style.fontSize); if (z) g.s = z;
        runs(n, g, out);
      });
      return out;
    }
    function para(el, lvl, depth) { var st = el.style || {}; return { t: 'p', lvl: lvl, al: st.textAlign || '', lh: parseFloat(st.lineHeight) || 0, ind: (+(el.getAttribute('data-ind') || 0)) + depth, list: null, runs: runs(el, {}, []) }; }
    function table(n) {
      var rows = [];
      [].forEach.call(n.querySelectorAll('tr'), function (tr) { if (tr.closest('table') !== n) return; var r = []; [].forEach.call(tr.children, function (td) { if (!/^T[DH]$/.test(td.tagName)) return; r.push({ cs: +(td.getAttribute('colspan') || 1), rs: +(td.getAttribute('rowspan') || 1), w: (td.getAttribute('colwidth') || '').split(',').map(Number).filter(Boolean), h: td.tagName === 'TH', blocks: walk(td.childNodes, 0) }); }); rows.push(r); });
      var nc = 0, occ = {}; rows.forEach(function (r, ri) { var c = 0; r.forEach(function (x) { while (occ[ri + ',' + c]) c++; for (var a = 0; a < x.rs; a++) for (var b = 0; b < x.cs; b++) occ[(ri + a) + ',' + (c + b)] = 1; c += x.cs; }); nc = Math.max(nc, c); });
      for (var k in occ) nc = Math.max(nc, +k.split(',')[1] + 1);
      var w = []; rows.forEach(function (r) { var c = 0; r.forEach(function (x) { x.w.forEach(function (v, j) { if (!w[c + j]) w[c + j] = v; }); c += x.cs; }); });
      return { t: 'tbl', bl: n.hasAttribute('data-bl'), rows: rows, nc: Math.max(nc, 1), w: w };
    }
    function walk(nodes, depth) {
      var out = [];
      [].forEach.call(nodes, function (n) {
        if (n.nodeType === 3) { if (n.nodeValue.trim()) out.push({ t: 'p', lvl: 'p', al: '', ind: depth, runs: [{ t: n.nodeValue }] }); return; }
        if (n.nodeType !== 1) return;
        var tg = n.tagName;
        if (tg === 'P') out.push(para(n, 'p', depth));
        else if (/^H[1-6]$/.test(tg)) out.push(para(n, tg === 'H1' ? 'h1' : tg === 'H2' ? 'h2' : 'h3', depth));
        else if (tg === 'UL' || tg === 'OL') {
          var no = +(n.getAttribute('start') || 1);
          [].forEach.call(n.children, function (li) { if (li.tagName !== 'LI') return; var sub = walk(li.childNodes, depth + 1), first = sub.filter(function (b) { return b.t === 'p'; })[0]; if (first) first.list = { o: tg === 'OL', n: no, d: depth }; no++; out.push.apply(out, sub); });
        }
        else if (tg === 'TABLE') out.push(table(n));
        else if (n.hasAttribute('data-if')) { var k = n.getAttribute('data-if'), v = V ? V[k] : null; if (!V || blank || !(v === '' || v == null)) out.push.apply(out, walk(n.childNodes, depth)); }
        else if (n.hasAttribute('data-sign')) out.push({ t: 'sign' });
        else if (n.hasAttribute('data-pb')) out.push({ t: 'pb' });
        else if (tg === 'HR') out.push({ t: 'p', lvl: 'p', al: 'center', ind: 0, runs: [{ t: '———————' }] });
        else if (tg !== 'COLGROUP' && tg !== 'COL' && tg !== 'STYLE' && tg !== 'SCRIPT') out.push.apply(out, walk(n.childNodes, depth));
      });
      return out;
    }
    return walk(doc.body.childNodes, 0);
  }
  function listMark(l) { return l.o ? l.n + '.' : (l.d ? '–' : '•'); }
  function tplHtml(html, V, blank) {
    function rh(r) {
      if (r.br) return '<br>';
      var t = esc(r.t);
      if (r.fk) t = '<span class="' + (V ? (r.blank ? 'tf-blank' : 'tf-v') : 'tf' + (TPL_KEYS[r.fk] ? '' : ' bad')) + '">' + t + '</span>';
      if (r.b) t = '<b>' + t + '</b>'; if (r.i) t = '<i>' + t + '</i>'; if (r.u) t = '<u>' + t + '</u>';
      return r.s ? '<span style="font-size:' + r.s + 'pt">' + t + '</span>' : t;
    }
    function ph(b, cell) {
      var al = b.al || (b.lvl === 'h1' ? 'center' : cell ? 'left' : 'justify'), st = 'text-align:' + al + (b.lh ? ';line-height:' + (b.lh * 1.15).toFixed(2) : '') + (b.ind ? ';margin-left:' + (b.ind * 1.6) + 'em' : '') + (b.list ? ';text-indent:-1.3em;padding-left:1.3em' : '');
      var inner = (b.list ? '<span class="tp-mk">' + listMark(b.list) + '</span>' : '') + b.runs.map(rh).join('');
      return '<p class="tp-' + b.lvl + '" style="' + st + '">' + (inner || '<br>') + '</p>';
    }
    function bh(b, cell) {
      if (b.t === 'sign') return '<div class="tp-sign"><div><b>NGƯỜI LAO ĐỘNG</b><i>(Ký, ghi rõ họ tên)</i>' + esc(V ? V.ho_ten : '') + '</div><div><b>NGƯỜI SỬ DỤNG LAO ĐỘNG</b><i>(Ký, đóng dấu, ghi rõ họ tên)</i>' + esc(V ? V.nguoi_dai_dien : '') + '</div></div>';
      if (b.t === 'pb') return '<div class="tp-pb"><span>Ngắt trang</span></div>';
      if (b.t === 'tbl') return '<table class="tp-tbl' + (b.bl ? ' bl' : '') + '"><tbody>' + b.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td' + (c.cs > 1 ? ' colspan="' + c.cs + '"' : '') + (c.rs > 1 ? ' rowspan="' + c.rs + '"' : '') + '>' + c.blocks.map(function (x) { return bh(x, 1); }).join('') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
      return ph(b, cell);
    }
    return tplBlocks(html, V, blank).map(function (b) { return bh(b, 0); }).join('');
  }
  var DOCX_W = 9071; // bề rộng vùng chữ A4 (twip) = 11906 − lề trái 1701 − lề phải 1134
  function tplDocx(html, V, signL, signR, blank) {
    function rx(r, base) {
      if (r.br) return '<w:r><w:br/></w:r>';
      var b = r.b || base.b, i = r.i || base.i, s = r.s ? Math.round(r.s * 2) : (base.sz || 26);
      return '<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>' + (b ? '<w:b/>' : '') + (i ? '<w:i/>' : '') + '<w:sz w:val="' + s + '"/><w:szCs w:val="' + s + '"/>' + (r.u ? '<w:u w:val="single"/>' : '') + '</w:rPr><w:t xml:space="preserve">' + xe(r.t) + '</w:t></w:r>';
    }
    function px(b, cell) {
      var base = b.lvl === 'h1' ? { b: 1, sz: 30 } : b.lvl === 'h2' ? { b: 1 } : b.lvl === 'h3' ? { b: 1, i: 1 } : {};
      var al = { left: 'left', center: 'center', right: 'right', justify: 'both' }[b.al] || (b.lvl === 'h1' ? 'center' : cell ? 'left' : 'both');
      var line = Math.round(240 * (b.lh || 1.25)), bf = b.lvl === 'h2' ? 120 : b.lvl === 'h1' ? 60 : 0, af = cell ? 20 : b.lvl === 'h1' ? 40 : 80;
      var ind = b.ind ? '<w:ind w:left="' + (b.ind * 454) + '"' + (b.list ? ' w:hanging="340"' : '') + '/>' : '';
      var rs = (b.list ? [{ t: listMark(b.list) + '\t' }] : []).concat(b.runs);
      return '<w:p><w:pPr><w:spacing w:before="' + bf + '" w:after="' + af + '" w:line="' + line + '" w:lineRule="auto"/>' + ind + '<w:jc w:val="' + al + '"/></w:pPr>' + rs.map(function (r) { return rx(r, base); }).join('') + '</w:p>';
    }
    function tx(t) {
      var nc = t.nc, ws = [], known = 0, nk = 0, i;
      for (i = 0; i < nc; i++) { if (t.w[i]) { known += t.w[i]; nk++; } }
      var avg = nk ? known / nk : 1; for (i = 0; i < nc; i++) ws.push(t.w[i] || avg);
      var sum = ws.reduce(function (a, b) { return a + b; }, 0); ws = ws.map(function (v) { return Math.round(v / sum * DOCX_W); });
      var wOf = function (c, cs) { var s = 0; for (var j = c; j < c + cs && j < nc; j++) s += ws[j]; return s; };
      var bd = t.bl ? 'nil' : 'single', brd = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(function (k) { return '<w:' + k + ' w:val="' + bd + '"' + (t.bl ? '' : ' w:sz="4" w:space="0" w:color="000000"') + '/>'; }).join('');
      var x = '<w:tbl><w:tblPr><w:tblW w:w="' + DOCX_W + '" w:type="dxa"/><w:tblBorders>' + brd + '</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>' + ws.map(function (v) { return '<w:gridCol w:w="' + v + '"/>'; }).join('') + '</w:tblGrid>';
      var occ = {};
      t.rows.forEach(function (r, ri) {
        var c = 0, it = 0, cells = '';
        while (c < nc) {
          var o = occ[ri + ',' + c];
          if (o) { cells += '<w:tc><w:tcPr><w:tcW w:w="' + wOf(c, o) + '" w:type="dxa"/>' + (o > 1 ? '<w:gridSpan w:val="' + o + '"/>' : '') + '<w:vMerge/></w:tcPr><w:p/></w:tc>'; c += o; continue; }
          var cl = r[it++];
          if (!cl) { cells += '<w:tc><w:tcPr><w:tcW w:w="' + wOf(c, 1) + '" w:type="dxa"/></w:tcPr><w:p/></w:tc>'; c++; continue; }
          var cs = Math.min(cl.cs, nc - c); for (var a = 1; a < cl.rs; a++) occ[(ri + a) + ',' + c] = cs;
          var inner = cl.blocks.map(function (bb) { return bb.t === 'tbl' ? tx(bb) + '<w:p/>' : bb.t === 'p' ? px(cl.h ? Object.assign({}, bb, { runs: bb.runs.map(function (q) { return Object.assign({}, q, { b: 1 }); }) }) : bb, 1) : ''; }).join('') || '<w:p/>';
          cells += '<w:tc><w:tcPr><w:tcW w:w="' + wOf(c, cs) + '" w:type="dxa"/>' + (cs > 1 ? '<w:gridSpan w:val="' + cs + '"/>' : '') + (cl.rs > 1 ? '<w:vMerge w:val="restart"/>' : '') + '</w:tcPr>' + inner + '</w:tc>';
          c += cs;
        }
        x += '<w:tr><w:trPr><w:cantSplit/></w:trPr>' + cells + '</w:tr>';
      });
      return x + '</w:tbl>';
    }
    var x = '';
    tplBlocks(html, V, blank).forEach(function (b) {
      if (b.t === 'sign') x += wsign(signL, signR);
      else if (b.t === 'pb') x += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      else if (b.t === 'tbl') x += tx(b) + '<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr></w:p>';
      else x += px(b, 0);
    });
    return x + wp([['Mẫu tham khảo do Phần mềm quản lý nhân sự (Quản trị tử tế) tạo từ dữ liệu – đơn vị rà soát, chỉnh sửa cho phù hợp quy chế và quy định hiện hành trước khi ký. Xóa dòng này khi dùng.', { i: 1, sz: 20 }]], { bf: 400 });
  }

  // ---------- Phần mở rộng của bộ soạn thảo (tạo 1 lần) ----------
  var TPE = null;
  function tpeExt() {
    if (TPE) return TPE;
    var T = window.TT;
    var Field = T.Node.create({
      name: 'field', group: 'inline', inline: true, atom: true, selectable: true, draggable: true,
      addAttributes: function () { return { k: { default: '', parseHTML: function (el) { return el.getAttribute('data-f'); }, renderHTML: function (a) { return { 'data-f': a.k }; } } }; },
      parseHTML: function () { return [{ tag: 'span[data-f]' }]; },
      renderHTML: function (p) { var k = p.node.attrs.k; return ['span', T.mergeAttributes(p.HTMLAttributes, { class: 'tpe-f' + (TPL_KEYS[k] ? '' : ' bad'), title: 'Trường ghép {{' + k + '}} – bấm để đổi, kéo để di chuyển' }), TPL_KEYS[k] || k]; },
      renderText: function (p) { return '{{' + p.node.attrs.k + '}}'; },
      addInputRules: function () { return [T.nodeInputRule({ find: /\{\{[a-z_]+\}\}$/, type: this.type, getAttributes: function (m) { return { k: m[0].slice(2, -2) }; } })]; },
      addPasteRules: function () { return [T.nodePasteRule({ find: /\{\{[a-z_]+\}\}/g, type: this.type, getAttributes: function (m) { return { k: m[0].slice(2, -2) }; } })]; }
    });
    var IfBlock = T.Node.create({
      name: 'ifBlock', group: 'block', content: 'block+', defining: true,
      addAttributes: function () { return { k: { default: '', parseHTML: function (el) { return el.getAttribute('data-if'); }, renderHTML: function (a) { return { 'data-if': a.k }; } } }; },
      parseHTML: function () { return [{ tag: 'div[data-if]' }]; },
      renderHTML: function (p) { var k = p.node.attrs.k; return ['div', T.mergeAttributes(p.HTMLAttributes, { class: 'tpe-if', 'data-label': 'Chỉ in khi có: ' + (TPL_KEYS[k] || k) }), 0]; }
    });
    var SignBlock = T.Node.create({
      name: 'signBlock', group: 'block', atom: true, selectable: true, draggable: true,
      parseHTML: function () { return [{ tag: 'div[data-sign]' }]; },
      renderHTML: function () { return ['div', { 'data-sign': '', class: 'tpe-sign', title: 'Khối chữ ký 2 bên – tên người lao động và người đại diện tự điền' }, ['div', {}, ['b', {}, 'NGƯỜI LAO ĐỘNG'], ['i', {}, '(Ký, ghi rõ họ tên)'], ['span', {}, '‹Họ và tên›']], ['div', {}, ['b', {}, 'NGƯỜI SỬ DỤNG LAO ĐỘNG'], ['i', {}, '(Ký, đóng dấu, ghi rõ họ tên)'], ['span', {}, '‹Người đại diện›']]]; }
    });
    var PageBreak = T.Node.create({
      name: 'pageBreak', group: 'block', atom: true, selectable: true,
      parseHTML: function () { return [{ tag: 'div[data-pb]' }]; },
      renderHTML: function () { return ['div', { 'data-pb': '', class: 'tpe-pb' }, ['span', {}, 'Ngắt trang']]; }
    });
    var Fmt = T.Extension.create({
      name: 'fmt',
      addGlobalAttributes: function () { return [{ types: ['paragraph', 'heading'], attributes: {
        lh: { default: null, parseHTML: function (el) { return el.style.lineHeight || null; }, renderHTML: function (a) { return a.lh ? { style: 'line-height: ' + a.lh } : {}; } },
        ind: { default: 0, parseHTML: function (el) { return +(el.getAttribute('data-ind') || 0); }, renderHTML: function (a) { return a.ind ? { 'data-ind': a.ind, style: 'margin-left: ' + (a.ind * 1.6) + 'em' } : {}; } } } }]; }
    });
    var TableX = T.Table.extend({
      addAttributes: function () { return Object.assign({}, this.parent && this.parent(), { bl: { default: false, parseHTML: function (el) { return el.hasAttribute('data-bl'); }, renderHTML: function (a) { return a.bl ? { 'data-bl': '' } : {}; } } }); },
      // khung hiển thị bảng (TableView) không tự gắn thuộc tính → dùng trang trí nút để hiện kiểu "không viền" trong lúc soạn
      addProseMirrorPlugins: function () { return (this.parent ? this.parent() : []).concat([new T.Plugin({ key: new T.PluginKey('tpeTblBl'), props: { decorations: function (st) { var ds = []; st.doc.descendants(function (n, pos) { if (n.type.name === 'table' && n.attrs.bl) ds.push(T.Decoration.node(pos, pos + n.nodeSize, { 'data-bl': '' })); }); return ds.length ? T.DecorationSet.create(st.doc, ds) : null; } } })]); }
    });
    var Slash = T.Extension.create({
      name: 'slash', addOptions: function () { return { ui: null }; },
      addProseMirrorPlugins: function () {
        var ui = this.options.ui;
        return [T.Suggestion({ editor: this.editor, char: '/', allowSpaces: true, pluginKey: new T.PluginKey('tpeSlash'),
          items: function (o) { return ui.slashItems(o.query); },
          command: function (o) { o.editor.chain().focus().deleteRange(o.range).run(); o.props.run(o.editor); },
          render: function () { return { onStart: function (p) { ui.menuShow(p); }, onUpdate: function (p) { ui.menuShow(p); }, onKeyDown: function (p) { return ui.menuKey(p.event); }, onExit: function () { ui.menuHide(); } }; } })];
      }
    });
    var Find = T.Extension.create({
      name: 'find', addOptions: function () { return { ui: null }; },
      addProseMirrorPlugins: function () {
        var ui = this.options.ui;
        return [new T.Plugin({ key: new T.PluginKey('tpeFind'), props: { decorations: function (state) { if (!ui.findQ) return null; var ds = findAll(state.doc, ui.findQ).map(function (r, i) { return T.Decoration.inline(r.from, r.to, { class: i === ui.findIx ? 'tpe-hit on' : 'tpe-hit' }); }); return T.DecorationSet.create(state.doc, ds); } } })];
      }
    });
    TPE = { Field: Field, IfBlock: IfBlock, SignBlock: SignBlock, PageBreak: PageBreak, Fmt: Fmt, TableX: TableX, Slash: Slash, Find: Find };
    return TPE;
  }
  function findAll(doc, q) { var out = [], fq = String(q).toLowerCase(); if (!fq) return out; doc.descendants(function (n, pos) { if (!n.isText) return; var t = n.text.toLowerCase(), i = 0; while ((i = t.indexOf(fq, i)) >= 0) { out.push({ from: pos + i, to: pos + i + fq.length }); i += fq.length; } }); return out; }

  Object.assign(IC, {
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>', redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    alL: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>', alC: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>', alR: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>', alJ: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>',
    ol: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M4 5h1v4M4 9h2M4 15h2l-2 3h2"/>', ul: '<path d="M10 6h10M10 12h10M10 18h10"/><circle cx="5" cy="6" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="18" r="1"/>',
    indL: '<path d="M10 6h10M10 12h10M10 18h10M7 9l-3 3 3 3"/>', indR: '<path d="M10 6h10M10 12h10M10 18h10M4 9l3 3-3 3"/>',
    tbl: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M10 4v16"/>', sign: '<path d="M3 17c3-1 4-8 6-8s0 7 2 7 2-3 4-3 2 2 6 2"/><path d="M3 21h18"/>',
    pb: '<path d="M6 3v5h12V3M6 21v-5h12v5"/><path d="M3 12h3M9 12h2M13 12h2M18 12h3"/>', cond: '<path d="M4 6h3l4 6-4 6H4"/><path d="M13 7h7M13 12h7M13 17h7"/>',
    find: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>', fld: '<path d="M8 4H6a2 2 0 0 0-2 2v4l-1 2 1 2v4a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v4l1 2-1 2v4a2 2 0 0 1-2 2h-2"/>'
  });
  var TPE_FS = ['10', '11', '12', '13', '14', '15', '16', '18', '20', '24'], TPE_LH = [['1', '1,0'], ['1.15', '1,15'], ['', '1,25 – mặc định'], ['1.5', '1,5'], ['2', '2,0']];
  var TPE_TBL = [['ins2', 'Chèn bảng 2 cột (Bên A / Bên B)'], ['ins3', 'Chèn bảng 3 × 3 có hàng tiêu đề'], ['-'], ['addRowBefore', 'Thêm hàng phía trên'], ['addRowAfter', 'Thêm hàng phía dưới'], ['addColumnBefore', 'Thêm cột bên trái'], ['addColumnAfter', 'Thêm cột bên phải'], ['-'], ['deleteRow', 'Xóa hàng'], ['deleteColumn', 'Xóa cột'], ['mergeCells', 'Gộp các ô đang chọn'], ['splitCell', 'Tách ô'], ['toggleHeaderRow', 'Bật / tắt hàng tiêu đề'], ['bl', 'Ẩn / hiện đường viền bảng'], ['-'], ['deleteTable', 'Xóa bảng']];

  // imp: mẫu vừa nhận diện từ file tải lên { ten, loai, html, report }
  function tplEditor(id, imp) {
    if (!window.TT) { toast('Thiếu bộ soạn thảo', 'err', 'Tải lại phần mềm (bản đầy đủ) rồi thử lại.'); return; }
    var L = tpls(), tp = id ? L.filter(function (x) { return x.id === id; })[0] : null, isNew = !tp;
    tp = tp || { id: 't' + Date.now().toString(36), ten: imp ? imp.ten : '', loai: imp ? imp.loai : [], html: imp ? imp.html : tplMdToHtml(TPL_LD) };
    var us = selUnits(), samples = []; us.forEach(function (u) { (u.data.HD || []).forEach(function (h) { samples.push({ u: u, h: h }); }); });
    samples.sort(function (a, b) { return cmp(b.h['Ngày ký'], a.h['Ngày ký']); });
    var types = hdTypes(us[0] || S.units[0]);
    var btn = function (c, icn, t, ex) { return '<button type="button" class="tpe-b" data-c="' + c + '" title="' + t + '" aria-label="' + t + '"' + (ex || '') + '>' + icn + '</button>'; };
    var bar = '<div class="tpe-g">' + btn('undo', ic('undo', 17), 'Hoàn tác (Ctrl+Z)') + btn('redo', ic('redo', 17), 'Làm lại (Ctrl+Y)') + '</div>' +
      '<div class="tpe-g"><select class="tpe-s" data-s="blk" title="Kiểu đoạn"><option value="p">Đoạn văn</option><option value="h1">Tên hợp đồng</option><option value="h2">Đề mục (Điều …)</option><option value="h3">Đề mục nhỏ</option></select>' +
      '<select class="tpe-s sm" data-s="fs" title="Cỡ chữ"><option value="">Cỡ 13</option>' + TPE_FS.filter(function (v) { return v !== '13'; }).map(function (v) { return '<option value="' + v + '">Cỡ ' + v + '</option>'; }).join('') + '</select></div>' +
      '<div class="tpe-g">' + btn('b', '<b>B</b>', 'In đậm (Ctrl+B)') + btn('i', '<i>I</i>', 'In nghiêng (Ctrl+I)') + btn('u', '<u>U</u>', 'Gạch chân (Ctrl+U)') + '</div>' +
      '<div class="tpe-g">' + btn('al-left', ic('alL', 17), 'Căn trái') + btn('al-center', ic('alC', 17), 'Căn giữa') + btn('al-right', ic('alR', 17), 'Căn phải') + btn('al-justify', ic('alJ', 17), 'Căn đều hai bên') + '</div>' +
      '<div class="tpe-g">' + btn('ol', ic('ol', 17), 'Danh sách đánh số (tự đánh lại số)') + btn('ul', ic('ul', 17), 'Danh sách gạch đầu dòng') + btn('out', ic('indL', 17), 'Giảm lề') + btn('in', ic('indR', 17), 'Tăng lề') +
      '<select class="tpe-s sm" data-s="lh" title="Giãn dòng">' + TPE_LH.map(function (x) { return '<option value="' + x[0] + '">' + (x[0] ? 'Giãn ' : 'Giãn ') + x[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="tpe-g">' + btn('tbl', ic('tbl', 17) + '<span>Bảng</span>', 'Bảng: chèn, thêm/xóa hàng cột, gộp ô, ẩn viền') + '</div>' +
      '<div class="tpe-g">' + btn('fld', ic('fld', 17) + '<span>Trường</span>', 'Chèn trường thông tin tại con trỏ (hoặc gõ / trong văn bản)', ' data-k="1"') + btn('cond', ic('cond', 17) + '<span>Điều kiện</span>', 'Đoạn chỉ in khi trường có dữ liệu (ví dụ dòng phụ cấp)') + btn('sign', ic('sign', 17), 'Chèn khối chữ ký 2 bên') + btn('pb', ic('pb', 17), 'Ngắt trang') + '</div>' +
      '<div class="tpe-g">' + btn('find', ic('find', 17), 'Tìm và thay thế (Ctrl+F)') + '</div>';
    var body = '<div class="tpe"><div class="tpe-meta"><div class="field"><label for="tpN">Tên mẫu <i class="req">*</i></label><input class="input" id="tpN" value="' + esc(tp.ten) + '" maxlength="80"></div>' +
      '<div class="tpe-types"><span class="tpe-lbl">Áp dụng cho loại hợp đồng</span><div>' + types.map(function (t) { return '<label class="tpe-chk"><input type="checkbox" data-tt="' + esc(t) + '"' + ((tp.loai || []).indexOf(t) >= 0 ? ' checked' : '') + '><span>' + esc(t) + '</span></label>'; }).join('') + '</div></div></div>' +
      '<div class="tpe-bar" id="tpeBar">' + bar + '</div>' +
      '<div class="tpe-findbar" id="tpeFind" hidden><input class="input" id="tpeQ" placeholder="Tìm…"><input class="input" id="tpeR" placeholder="Thay bằng…"><span class="faint" id="tpeCnt"></span><button type="button" class="btn btn-sm" data-c="fprev">‹</button><button type="button" class="btn btn-sm" data-c="fnext">›</button><button type="button" class="btn btn-sm" data-c="frep">Thay</button><button type="button" class="btn btn-sm" data-c="fall">Thay tất cả</button><button type="button" class="x-btn" data-c="fclose">Đóng</button></div>' +
      '<div class="tpe-main"><div class="tpe-scroll"><div class="tpe-page" id="tpeHost"></div></div>' +
      '<aside class="tpe-side"><div class="seg">' + (imp ? '<button data-tv="r">Nhận diện</button>' : '') + '<button data-tv="f">Trường thông tin</button><button data-tv="p">Xem trước</button><button data-tv="h">Hướng dẫn</button></div><div id="tpSide"></div></aside></div>' +
      '<div class="link-row nv-foot"><span class="link-row" style="margin:0"><button class="btn" id="tpTry">' + ic('dl', 15) + 'Tải thử .docx</button><span class="faint tpe-st" id="tpeSt"></span></span><span class="link-row" style="margin:0"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="tpOk">' + (isNew ? 'Thêm mẫu' : 'Lưu mẫu') + '</button></span></div></div>';
    var m = modal(imp ? 'Hoàn thiện mẫu từ file tải lên' : isNew ? 'Thêm hợp đồng mẫu' : 'Sửa mẫu: ' + tp.ten, imp ? 'Phần mềm đã chuyển nội dung file thành mẫu – kiểm tra từng đoạn, sửa chỗ chưa đúng rồi bấm Thêm mẫu' : 'Soạn như Word · kéo thả trường thông tin vào văn bản hoặc gõ / để chọn', body);
    var md = m.querySelector('.modal'); md.classList.add('tpe-modal'); m.classList.add('tpe-bg');
    var ui = { findQ: '', findIx: 0 }, X = tpeExt(), T = window.TT;
    var ed = new T.Editor({
      element: $('#tpeHost', m),
      extensions: [T.Document, T.Paragraph, T.Text, T.Bold, T.Italic, T.Underline, T.Heading.configure({ levels: [1, 2, 3] }), T.HardBreak, T.BulletList, T.OrderedList, T.ListItem, T.ListKeymap,
        T.Dropcursor.configure({ color: '#0F766E', width: 2 }), T.Gapcursor, T.UndoRedo, T.TextStyle, T.FontSize, T.TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] }),
        X.TableX.configure({ resizable: true }), T.TableRow, T.TableHeader, T.TableCell, X.Field, X.IfBlock, X.SignBlock, X.PageBreak, X.Fmt, X.Slash.configure({ ui: ui }), X.Find.configure({ ui: ui })],
      content: tplDoc(tp), parseOptions: { preserveWhitespace: 'full' },
      editorProps: { attributes: { class: 'tpe-doc', spellcheck: 'false' } }
    });
    var start = ed.getHTML(), meta0 = JSON.stringify([tp.ten, (tp.loai || []).slice().sort()]), view = imp ? 'r' : 'f', si = 0, pop = null;
    function dirty() { return ed.getHTML() !== start || JSON.stringify([$('#tpN', m).value.trim(), collectT().sort()]) !== meta0; }
    function collectT() { return $$('[data-tt]:checked', m).map(function (c) { return c.getAttribute('data-tt'); }); }
    // ---- trạng thái thanh công cụ
    function sync() {
      var A = function (n, a) { return ed.isActive(n, a); }, set = function (c, on) { var b = $('[data-c="' + c + '"]', m); if (b) b.classList.toggle('on', !!on); };
      set('b', A('bold')); set('i', A('italic')); set('u', A('underline')); set('ol', A('orderedList')); set('ul', A('bulletList')); set('cond', A('ifBlock'));
      var blk = A('heading', { level: 1 }) ? 'h1' : A('heading', { level: 2 }) ? 'h2' : A('heading', { level: 3 }) ? 'h3' : 'p', pa = ed.getAttributes(blk === 'p' ? 'paragraph' : 'heading');
      var al = pa.textAlign || (blk === 'h1' ? 'center' : 'justify');
      ['left', 'center', 'right', 'justify'].forEach(function (x) { set('al-' + x, al === x); });
      $('[data-s="blk"]', m).value = blk; var fs = (ed.getAttributes('textStyle').fontSize || '').replace(/pt$/, ''); $('[data-s="fs"]', m).value = TPE_FS.indexOf(fs) >= 0 && fs !== '13' ? fs : '';
      $('[data-s="lh"]', m).value = pa.lh && TPE_LH.some(function (x) { return x[0] === String(pa.lh); }) ? String(pa.lh) : '';
      $('[data-c="undo"]', m).disabled = !ed.can().undo(); $('[data-c="redo"]', m).disabled = !ed.can().redo();
      var st = $('#tpeSt', m), n = 0; ed.state.doc.descendants(function (x) { if (x.type.name === 'field') n++; }); st.textContent = n + ' trường ghép · ' + ed.state.doc.textContent.length.toLocaleString('vi-VN') + ' ký tự' + (dirty() ? ' · chưa lưu' : '');
    }
    var tmr; ed.on('transaction', function () { sync(); if (view === 'p') { clearTimeout(tmr); tmr = setTimeout(side, 350); } });
    // ---- thụt lề đoạn (ngoài danh sách)
    function indent(d) {
      var s = ed.state.selection, tr = ed.state.tr, ch = false;
      ed.state.doc.nodesBetween(s.from, s.to, function (n, pos) { if (n.type.name === 'paragraph' || n.type.name === 'heading') { var v = Math.max(0, Math.min(6, (n.attrs.ind || 0) + d)); if (v !== (n.attrs.ind || 0)) { tr.setNodeMarkup(pos, undefined, Object.assign({}, n.attrs, { ind: v })); ch = true; } return false; } });
      if (ch) ed.view.dispatch(tr); ed.commands.focus();
    }
    // ---- bảng chọn nổi (trường, bảng, gợi ý /)
    function bgRect() { return m.getBoundingClientRect(); }
    function popAt(r, html, cls) {
      closePop(); var B = bgRect(); pop = document.createElement('div'); pop.className = 'tpe-pop ' + (cls || ''); pop.innerHTML = html; m.appendChild(pop);
      var w = pop.offsetWidth, h = pop.offsetHeight, x = Math.min(r.left - B.left, B.width - w - 8), y = r.bottom - B.top + 4; if (y + h > B.height - 8) y = Math.max(8, r.top - B.top - h - 4);
      pop.style.left = Math.max(8, x) + 'px'; pop.style.top = y + 'px'; return pop;
    }
    function closePop() { if (pop) { pop.remove(); pop = null; } }
    var FL = []; TPL_FIELDS.forEach(function (g) { g[1].forEach(function (f) { FL.push({ k: f[0], l: f[1], g: g[0], q: fold(f[1] + ' ' + f[0] + ' ' + g[0]) }); }); });
    function fMatch(q) { var w = fold(q).trim().split(/\s+/).filter(Boolean); return FL.filter(function (f) { return w.every(function (x) { return f.q.indexOf(x) >= 0; }); }); }
    var ACT = [
      { l: 'Khối chữ ký 2 bên', q: 'khoi chu ky ky ten', run: function (e) { e.chain().focus().insertContent({ type: 'signBlock' }).run(); } },
      { l: 'Ngắt trang', q: 'ngat trang trang moi', run: function (e) { e.chain().focus().insertContent({ type: 'pageBreak' }).run(); } },
      { l: 'Bảng 2 cột', q: 'bang 2 cot ben a ben b', run: function (e) { e.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: false }).run(); } },
      { l: 'Đề mục (Điều …)', q: 'de muc dieu tieu de', run: function (e) { e.chain().focus().setHeading({ level: 2 }).run(); } },
      { l: 'Danh sách đánh số', q: 'danh sach so thu tu', run: function (e) { e.chain().focus().toggleOrderedList().run(); } }];
    ui.slashItems = function (q) {
      var f = fMatch(q).map(function (x) { return { g: x.g, l: x.l, k: x.k, run: function (e) { e.chain().focus().insertContent({ type: 'field', attrs: { k: x.k } }).run(); } }; });
      var w = fold(q).trim().split(/\s+/).filter(Boolean), a = ACT.filter(function (x) { return w.every(function (y) { return x.q.indexOf(y) >= 0 || fold(x.l).indexOf(y) >= 0; }); }).map(function (x) { return { g: 'Chèn', l: x.l, run: x.run }; });
      return f.concat(a).slice(0, 40);
    };
    var sm = { items: [], ix: 0, cmd: null };
    function listHtml(items, ix) {
      if (!items.length) return '<div class="tpe-none">Không có trường phù hợp – Esc để đóng</div>';
      var g0 = '';
      return items.map(function (it, i) { var h = it.g !== g0 ? '<div class="tpe-gh">' + esc(it.g) + '</div>' : ''; g0 = it.g; return h + '<button type="button" class="tpe-it' + (i === ix ? ' on' : '') + '" data-ix="' + i + '">' + esc(it.l) + (it.k ? '<small>{{' + it.k + '}}</small>' : '') + '</button>'; }).join('');
    }
    ui.menuShow = function (p) {
      sm.items = p.items; sm.ix = Math.min(sm.ix, Math.max(0, p.items.length - 1)); sm.cmd = p.command;
      var r = p.clientRect && p.clientRect(); if (!r) return;
      if (!p.items.length && /\s$/.test(p.query)) { closePop(); return; }
      var el = popAt(r, '<div class="tpe-list">' + listHtml(sm.items, sm.ix) + '</div><div class="tpe-hint">↑↓ chọn · Enter chèn · Esc đóng</div>', 'slash');
      el.addEventListener('mousedown', function (e) { var b = e.target.closest('[data-ix]'); if (b) { e.preventDefault(); sm.cmd(sm.items[+b.getAttribute('data-ix')]); } });
      var on = $('.tpe-it.on', el); if (on) on.scrollIntoView({ block: 'nearest' });
    };
    ui.menuKey = function (e) {
      if (!pop || !pop.classList.contains('slash')) return false;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { if (!sm.items.length) return true; sm.ix = (sm.ix + (e.key === 'ArrowDown' ? 1 : -1) + sm.items.length) % sm.items.length; $$('.tpe-it', pop).forEach(function (b, i) { b.classList.toggle('on', i === sm.ix); }); var on = $('.tpe-it.on', pop); if (on) on.scrollIntoView({ block: 'nearest' }); return true; }
      if (e.key === 'Enter' || e.key === 'Tab') { if (sm.items[sm.ix]) { sm.cmd(sm.items[sm.ix]); return true; } return false; }
      return false;
    };
    ui.menuHide = function () { sm.ix = 0; if (pop && pop.classList.contains('slash')) closePop(); };
    // bảng chọn trường có ô tìm (nút Trường, Điều kiện, bấm vào thẻ để đổi)
    function pickField(r, title, cur, cb, extra) {
      var el = popAt(r, '<div class="tpe-ph">' + esc(title) + '</div><input class="input tpe-pq" placeholder="Tìm trường… (gõ không dấu cũng được)"><div class="tpe-list"></div>' + (extra || ''), 'pick'), q = $('.tpe-pq', el), box = $('.tpe-list', el), ix = 0, items = [];
      function draw() { items = fMatch(q.value).map(function (x) { return { g: x.g, l: x.l, k: x.k }; }); ix = Math.max(0, items.findIndex(function (x) { return x.k === cur; })); if (q.value) ix = 0; box.innerHTML = listHtml(items, ix); var on = $('.tpe-it.on', box); if (on) on.scrollIntoView({ block: 'nearest' }); }
      draw(); setTimeout(function () { q.focus(); }, 10);
      q.addEventListener('input', draw);
      q.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!items.length) return; ix = (ix + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; box.innerHTML = listHtml(items, ix); var on = $('.tpe-it.on', box); if (on) on.scrollIntoView({ block: 'nearest' }); } else if (e.key === 'Enter') { e.preventDefault(); if (items[ix]) { closePop(); cb(items[ix].k); ed.view.focus(); } } });
      el.addEventListener('click', function (e) { var b = e.target.closest('[data-ix]'); if (b) { closePop(); cb(items[+b.getAttribute('data-ix')].k); ed.view.focus(); } var x = e.target.closest('[data-px]'); if (x) { closePop(); cb(null, x.getAttribute('data-px')); ed.view.focus(); } });
    }
    function caretRect() { var c = ed.view.coordsAtPos(ed.state.selection.from); return { left: c.left, right: c.right, top: c.top, bottom: c.bottom }; }
    // ---- lệnh thanh công cụ
    function run(c, b) {
      var ch = ed.chain().focus();
      if (c === 'undo') ch.undo().run(); else if (c === 'redo') ch.redo().run();
      else if (c === 'b') ch.toggleBold().run(); else if (c === 'i') ch.toggleItalic().run(); else if (c === 'u') ch.toggleUnderline().run();
      else if (/^al-/.test(c)) ch.setTextAlign(c.slice(3)).run();
      else if (c === 'ol') ch.toggleOrderedList().run(); else if (c === 'ul') ch.toggleBulletList().run();
      else if (c === 'in') { if (ed.isActive('listItem')) ch.sinkListItem('listItem').run(); else indent(1); }
      else if (c === 'out') { if (ed.isActive('listItem')) ch.liftListItem('listItem').run(); else indent(-1); }
      else if (c === 'sign') ch.insertContent({ type: 'signBlock' }).run();
      else if (c === 'pb') ch.insertContent({ type: 'pageBreak' }).run();
      else if (c === 'fld') pickField(b.getBoundingClientRect(), 'Chèn trường thông tin tại con trỏ', '', function (k) { ed.chain().focus().insertContent({ type: 'field', attrs: { k: k } }).run(); });
      else if (c === 'cond') {
        if (ed.isActive('ifBlock')) { ch.lift('ifBlock').run(); toast('Đã bỏ điều kiện', 'ok', 'Đoạn sẽ luôn được in.'); return; }
        var $p = ed.state.selection.$from, guess = ''; $p.parent.descendants(function (n) { if (!guess && n.type.name === 'field') guess = n.attrs.k; });
        pickField(b.getBoundingClientRect(), 'Đoạn đang chọn chỉ in khi trường này có dữ liệu', guess, function (k) { ed.chain().focus().wrapIn('ifBlock', { k: k }).run(); });
      }
      else if (c === 'tbl') {
        var inT = ed.isActive('table');
        var el = popAt(b.getBoundingClientRect(), TPE_TBL.map(function (x) { if (x[0] === '-') return '<hr>'; var ok = x[0] === 'ins2' || x[0] === 'ins3' ? true : x[0] === 'bl' ? inT : inT && ed.can()[x[0]](); return '<button type="button" class="tpe-it"' + (ok ? '' : ' disabled') + ' data-t="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join(''), 'menu');
        el.addEventListener('click', function (e) { var t = e.target.closest('[data-t]'); if (!t || t.disabled) return; var k = t.getAttribute('data-t'); closePop(); var c2 = ed.chain().focus();
          if (k === 'ins2') c2.insertTable({ rows: 2, cols: 2, withHeaderRow: false }).run(); else if (k === 'ins3') c2.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          else if (k === 'bl') c2.updateAttributes('table', { bl: !ed.getAttributes('table').bl }).run(); else c2[k]().run(); });
      }
      else if (c === 'find') { var fb = $('#tpeFind', m); fb.hidden = false; var q = $('#tpeQ', m), sel = ed.state.selection; if (!sel.empty) q.value = ed.state.doc.textBetween(sel.from, sel.to); q.focus(); q.select(); doFind(0); }
      else if (c === 'fclose') { $('#tpeFind', m).hidden = true; ui.findQ = ''; ed.view.dispatch(ed.state.tr.setMeta('tpeFind', 1)); ed.commands.focus(); }
      else if (c === 'fnext' || c === 'fprev') doFind(c === 'fnext' ? 1 : -1);
      else if (c === 'frep' || c === 'fall') {
        var hits = findAll(ed.state.doc, ui.findQ), rep = $('#tpeR', m).value; if (!hits.length) return;
        var tr = ed.state.tr, list = c === 'fall' ? hits.slice().reverse() : [hits[Math.min(ui.findIx, hits.length - 1)]];
        list.forEach(function (h) { if (rep) tr.insertText(rep, h.from, h.to); else tr.delete(h.from, h.to); });
        ed.view.dispatch(tr); if (c === 'fall') toast('Đã thay ' + hits.length + ' chỗ', 'ok'); doFind(0);
      }
    }
    function doFind(d) {
      ui.findQ = $('#tpeQ', m).value; var hits = findAll(ed.state.doc, ui.findQ);
      ui.findIx = hits.length ? ((ui.findIx + d) % hits.length + hits.length) % hits.length : 0;
      $('#tpeCnt', m).textContent = ui.findQ ? (hits.length ? (ui.findIx + 1) + '/' + hits.length : 'không thấy') : '';
      var tr = ed.state.tr.setMeta('tpeFind', 1);
      if (hits.length) { var h = hits[ui.findIx]; tr.setSelection(T.TextSelection.create(tr.doc, h.from, h.to)).scrollIntoView(); }
      ed.view.dispatch(tr);
    }
    $('#tpeBar', m).addEventListener('mousedown', function (e) { if (e.target.closest('[data-c]')) e.preventDefault(); });
    m.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]'); if (b && !b.disabled) { run(b.getAttribute('data-c'), b); return; }
      var tv = e.target.closest('[data-tv]'); if (tv) { view = tv.getAttribute('data-tv'); if (view === 'p') pickSample(); side(); return; }
      var ins = e.target.closest('[data-ins]'); if (ins) { ed.chain().focus().insertContent({ type: 'field', attrs: { k: ins.getAttribute('data-ins') } }).run(); return; }
      if (pop && !pop.contains(e.target) && !e.target.closest('.tpe-f')) closePop();
    });
    $('#tpeBar', m).addEventListener('change', function (e) {
      var s = e.target.getAttribute('data-s'), v = e.target.value, ch = ed.chain().focus();
      if (s === 'blk') { if (v === 'p') ch.setParagraph().run(); else ch.setHeading({ level: +v.slice(1) }).run(); }
      else if (s === 'fs') { if (v) ch.setFontSize(v + 'pt').run(); else ch.unsetFontSize().run(); }
      else if (s === 'lh') ch.updateAttributes('paragraph', { lh: v || null }).updateAttributes('heading', { lh: v || null }).run();
    });
    $('#tpeQ', m).addEventListener('input', function () { ui.findIx = 0; doFind(0); });
    $('#tpeQ', m).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); doFind(e.shiftKey ? -1 : 1); } });
    // bấm vào thẻ trường → đổi trường / xóa
    ed.view.dom.addEventListener('click', function (e) {
      var f = e.target.closest('.tpe-f'); if (!f) return;
      var pos = ed.view.posAtDOM(f, 0) - (ed.state.doc.nodeAt(ed.view.posAtDOM(f, 0)) && ed.state.doc.nodeAt(ed.view.posAtDOM(f, 0)).type.name === 'field' ? 0 : 1), n = ed.state.doc.nodeAt(pos);
      if (!n || n.type.name !== 'field') return;
      pickField(f.getBoundingClientRect(), 'Đổi trường ghép', n.attrs.k, function (k, x) {
        if (x === 'del') { ed.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run(); return; }
        ed.view.dispatch(ed.state.tr.setNodeMarkup(pos, undefined, { k: k })); ed.commands.focus();
      }, '<div class="tpe-pf"><button type="button" class="btn btn-sm btn-danger-ghost" data-px="del">' + ic('trash', 14) + 'Xóa thẻ này</button></div>');
    });
    function onFindKey(e) { if ((e.ctrlKey || e.metaKey) && !e.altKey && /^[fFhH]$/.test(e.key) && topMost()) { e.preventDefault(); e.stopPropagation(); run('find'); } }
    document.addEventListener('keydown', onFindKey);
    // ---- cột bên phải
    function pickSample() { var ch = collectT(), i = samples.findIndex(function (x) { return ch.indexOf(x.h['Loại hợp đồng']) >= 0; }); if (i >= 0) si = i; }
    function side() {
      var box = $('#tpSide', m);
      if (view === 'r') box.innerHTML = imp.report;
      else if (view === 'f') {
        box.innerHTML = '<input class="input tpe-fq" id="tpeFq" placeholder="Tìm trường…"><p class="faint tpe-tip"><b>Kéo thả</b> trường vào văn bản · <b>bấm</b> để chèn tại con trỏ · trong văn bản gõ <kbd>/</kbd> rồi gõ tên trường</p><div id="tpeFl"></div>';
        var dr = function () { var q = $('#tpeFq', m).value, ok = {}; fMatch(q).forEach(function (x) { ok[x.k] = 1; }); $('#tpeFl', m).innerHTML = TPL_FIELDS.map(function (g) { var it = g[1].filter(function (f) { return ok[f[0]]; }); return it.length ? '<div class="tf-g"><b>' + g[0] + '</b>' + it.map(function (f) { return '<button type="button" class="tf-b tpe-drag" draggable="true" data-ins="' + f[0] + '" title="{{' + f[0] + '}}">' + esc(f[1]) + '</button>'; }).join('') + '</div>' : ''; }).join('') || '<p class="muted">Không có trường phù hợp.</p>'; };
        dr(); $('#tpeFq', m).addEventListener('input', dr);
      }
      else if (view === 'h') box.innerHTML = '<div class="tpe-help"><h4>Ghép trường thông tin</h4><ul><li>Kéo thả trường từ thẻ "Trường thông tin" vào chỗ cần điền.</li><li>Gõ <kbd>/</kbd> trong văn bản, gõ tiếp vài chữ (không dấu cũng được, ví dụ <i>/ngay sinh</i>) → Enter.</li><li>Gõ <code>{{ho_ten}}</code> cũng tự thành thẻ.</li><li>Bấm vào thẻ để đổi sang trường khác hoặc xóa; kéo thẻ để di chuyển.</li><li>Trường trống khi tạo văn bản in dòng chấm "……" để điền tay.</li></ul>' +
        '<h4>Đoạn có điều kiện</h4><ul><li>Đặt con trỏ vào đoạn → nút <b>Điều kiện</b> → chọn trường: đoạn chỉ in khi trường có dữ liệu (ví dụ dòng phụ cấp chức vụ). Bấm lại nút để bỏ.</li></ul>' +
        '<h4>Phím tắt</h4><table class="tbl tp-help"><tbody><tr><td><kbd>Ctrl</kbd>+<kbd>B</kbd> / <kbd>I</kbd> / <kbd>U</kbd></td><td>Đậm / nghiêng / gạch chân</td></tr><tr><td><kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Y</kbd></td><td>Hoàn tác / làm lại</td></tr><tr><td><kbd>Ctrl</kbd>+<kbd>F</kbd></td><td>Tìm và thay thế</td></tr><tr><td><kbd>Shift</kbd>+<kbd>Enter</kbd></td><td>Xuống dòng trong cùng đoạn</td></tr><tr><td><kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd></td><td>Trong danh sách: lùi vào / ra; trong bảng: sang ô kế / ô trước</td></tr><tr><td>Gõ <code>1.</code> + dấu cách</td><td>Bắt đầu danh sách đánh số</td></tr></tbody></table>' +
        '<p class="faint" style="font-size:12.5px">Khổ A4, phông Times New Roman, lề trái 3 cm, lề phải 2 cm như văn bản Word tải về. Cỡ chữ mặc định 13, giãn dòng 1,25.</p></div>';
      else {
        var cur = samples[si], V = cur ? tplVals(cur.u, cur.h) : null;
        box.innerHTML = (samples.length ? '<div class="field"><label for="tpS">Xem với hợp đồng</label><select class="input" id="tpS">' + samples.slice(0, 60).map(function (x, i) { return opt(String(i), x.h['Số hợp đồng'] + ' · ' + (x.h['Họ và tên'] || '') + ' · ' + x.h['Loại hợp đồng'], String(si)); }).join('') + '</select></div>' : '') + '<div class="tp-paper">' + tplHtml(ed.getHTML(), V) + '</div>';
        var s2 = $('#tpS', m); if (s2) s2.addEventListener('change', function () { si = +s2.value; side(); });
      }
      $$('[data-tv]', m).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tv') === view); });
    }
    m.addEventListener('dragstart', function (e) { var b = e.target.closest && e.target.closest('.tpe-drag'); if (!b) return; var k = b.getAttribute('data-ins'); e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/html', fTag(k)); e.dataTransfer.setData('text/plain', '{{' + k + '}}'); });
    pickSample(); side(); sync();
    // ---- đóng: hỏi khi chưa lưu; Esc đóng bảng chọn trước
    function reallyClose() { m.guard = null; document.removeEventListener('keydown', onFindKey); closePop(); try { ed.destroy(); } catch (er) { } m.close(); }
    function tryClose() { if (pop) { closePop(); return; } if (!$('#tpeFind', m).hidden) { run('fclose'); return; } if (dirty()) confirmBox('Đóng mà không lưu?', 'Nội dung mẫu đã sửa sẽ mất.', 'Đóng, không lưu', reallyClose); else reallyClose(); }
    function topMost() { var all = $$('.modal-bg'); return all[all.length - 1] === m; }
    m.guard = function (e) { if (e.type === 'keydown' && (!topMost() || e.defaultPrevented)) return false; tryClose(); return false; };
    // ---- tải thử, lưu
    function collect() { return { ten: $('#tpN', m).value.trim().replace(/\s+/g, ' '), loai: collectT(), html: ed.getHTML() }; }
    $('#tpTry', m).addEventListener('click', function () { var c = collect(), cur = samples[si]; if (!cur) { toast('Chưa có hợp đồng nào để thử', 'err'); return; } try { saveDocx(contractXml(cur.u, cur.h, { html: c.html }), 'Thu_mau_' + HR.stripAcc(c.ten || 'hop_dong').replace(/[^A-Za-z0-9]+/g, '_') + '.docx'); toast('Đã tạo file thử', 'ok', 'Điền theo hợp đồng ' + cur.h['Số hợp đồng'] + '.'); } catch (er) { showErr('Chưa tạo được file thử', er); } });
    $('#tpOk', m).addEventListener('click', function () {
      var c = collect();
      if (!c.ten) { $('#tpN', m).classList.add('bad'); $('#tpN', m).focus(); toast('Chưa có tên mẫu', 'err'); return; }
      if (L.some(function (x) { return x.id !== tp.id && x.ten === c.ten; })) { $('#tpN', m).classList.add('bad'); toast('Tên mẫu đã có', 'err'); return; }
      var nF = 0, bad = {}; ed.state.doc.descendants(function (n) { if (n.type.name === 'field') { nF++; if (!TPL_KEYS[n.attrs.k]) bad[n.attrs.k] = 1; } if (n.type.name === 'ifBlock' && !TPL_KEYS[n.attrs.k]) bad[n.attrs.k] = 1; });
      if (!ed.state.doc.textContent.trim() && !nF) { toast('Nội dung mẫu đang trống', 'err'); return; }
      if (Object.keys(bad).length) { toast('Trường ghép không đúng: ' + Object.keys(bad).join(', '), 'err', 'Bấm vào thẻ màu đỏ để đổi sang trường trong danh sách.'); return; }
      var dupT = c.loai.filter(function (t) { return L.some(function (x) { return x.id !== tp.id && (x.loai || []).indexOf(t) >= 0; }); });
      var done = function () { var n = { id: tp.id, ten: c.ten, loai: c.loai, html: c.html, at: nowVn() }; if (tp.goc) n.goc = 1; var L2 = L.filter(function (x) { return x.id !== tp.id; }), i = L.findIndex(function (x) { return x.id === tp.id; }); if (i >= 0) L2.splice(i, 0, n); else L2.push(n); tplSave(L2, (isNew ? 'thêm' : 'sửa') + ' mẫu "' + c.ten + '"'); reallyClose(); render(); toast((isNew ? 'Đã thêm' : 'Đã lưu') + ' mẫu "' + c.ten + '"', 'ok'); };
      if (dupT.length) confirmBox('Loại hợp đồng đã có mẫu khác', dupT.join(', ') + ' đã gắn với mẫu khác. Khi tải văn bản cho các loại này, phần mềm sẽ hỏi chọn mẫu nào.', 'Vẫn lưu', done); else done();
    });
    setTimeout(function () { if (!m.contains(document.activeElement) || document.activeElement === $('#tpN', m) && !imp && !isNew) ed.commands.focus('start'); }, 60);
    return { ed: ed, m: m };
  }
