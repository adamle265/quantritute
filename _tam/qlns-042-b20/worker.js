/* Chấm công Wi-Fi – BẢN THỬ NGHIỆM (Quản trị tử tế)
   Cloudflare Worker + D1. Một file máy chủ, giao diện trong app.html.
   - Nhân viên bấm Vào ca / Ra ca: máy chủ so IP của lượt bấm với IP văn phòng (Wi-Fi).
   - Màn hình chung (/tram): mỗi lần mở/làm mới báo IP văn phòng hiện tại + hiện QR động 30 giây (dự phòng).
   - Quản lý (/quan-ly): nhân viên, lượt chấm, IP văn phòng, lượt bị từ chối, cài đặt, tải CSV.
   Giờ chấm lấy theo đồng hồ máy chủ (không tin giờ điện thoại). Hiển thị theo giờ Việt Nam (UTC+7). */
import qrcode from './qrcode.mjs';
import APP_HTML from './app.html';
import { ICON_PNG_B64, ICON_SVG } from './icon.js';
import { DEMO, DEMO_PIN } from './demo-data.js';
import { OG_QL_B64, OG_NV_B64 } from './og-anh.js'; // 08/11: ảnh chia sẻ Facebook/Zalo cho bản chạy thử
import HRM_HTML from './phan-mem.html'; // 08/11: Phần mềm quản lý nhân sự bản xem trước (build/index.html chép sang khi node build.js)

const VER = '0.4.1';  // 07/11/2026: nối Phần mềm quản lý nhân sự (đồng bộ nhân viên, lượt chấm, đơn nghỉ, xác nhận công)
/* 07/11/2026 17:42 – CHẾ ĐỘ BẢN THỬ (để mọi người trải nghiệm, góp ý): bật khi chạy ở tên miền chamcong-thu.* hoặc biến môi trường DEMO=1.
   Không cần mật khẩu trang Quản lý và trang Mã QR chấm công; có sẵn tài khoản nhân viên mẫu (PIN chung DEMO_PIN); khóa các thao tác làm hỏng dữ liệu dùng chung;
   API công khai /api/demo/* để Phần mềm quản lý nhân sự (bản thử) kéo lượt chấm, đơn nghỉ về dữ liệu mẫu. Mỗi ngày tự dọn dữ liệu cũ. */
const DEMO_SEED = '2026-11-11b'; // 11/11 15:32: hồ sơ, phiếu lương 3 tháng, quản lý trực tiếp, công Xưởng Đóng gói ← // 11/11: thêm Xưởng Đóng gói SG008–SG013 (khối sản xuất, xếp ca) → // 09/11: thêm DS010 bán thời gian, DS011 cộng tác viên → máy chủ thử nạp lại dữ liệu mẫu
const MAU = 'Dữ liệu mẫu';
// giờ vào/ra tự sinh cho ngày sau ngày chốt dữ liệu mẫu – CÙNG công thức với Phần mềm quản lý nhân sự (bcSynRow) để hai bên khớp nhau
function demoHash(str) { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 1000003; return h; }
function hm2min(t) { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || '')); return m ? +m[1] * 60 + +m[2] : null; }
function vnHM(t) { const d = new Date(t + 7 * 3600e3); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); }
function dayT(iso, min) { return Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) - VN + min * 6e4; }
function addIso(iso, k) { const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + k * 864e5); return d.toISOString().slice(0, 10); }
function demoSynDay(e, iso) {
  if (e.sx) return null; // 11/11: khối sản xuất làm theo lịch xếp ca – phần mềm nhân sự tự sinh giờ theo lịch, máy chủ thử không sinh
  const wd = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))).getUTCDay();
  if (!DEMO.ca.thu.includes(wd)) return null;
  if (e.don.some(d => d.trang_thai === 'Đã duyệt' && d.tu <= iso && iso <= d.den)) return null;
  let h = demoHash(e.ma + iso), a = hm2min(DEMO.ca.vao), b = hm2min(DEMO.ca.ra);
  if (e.ld === 'ctv') { if (![1, 3, 5].includes(wd)) return null; a = 480; b = 690; } else if (e.ld === 'pt') { a = 810; b = 1050; } // 09/11: khớp phần mềm – CTV sáng T2/T4/T6, bán thời gian ca chiều
  return { vao: h % 17 === 0 ? a + 6 + h % 20 : a - 4 - h % 22, ra: b + 1 + (h >> 3) % 27 };
}
function demoPunchSt(db, ma, t, loai, ghi) { return db.prepare("INSERT INTO cham (ma, t, loai, cach, ip, wifi, tb, ghi) VALUES (?, ?, ?, 'wifi', '', 1, ?, ?)").bind(ma, t, loai, MAU, ghi); }
const DEMO_LOCKED = (() => { let m = ''; for (const c of DEMO.cty) for (const e of c.ds) for (const x of e.congs) if (!x.du_lieu.tam && x.ym > m) m = x.ym; return m; })();
function isDemo(env, url) { return env.DEMO === '1' || /^chamcong-thu\./i.test(url.hostname); }
/* ----- 0.4.2: lịch xếp ca ----- */
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/, MA_RE = /^[A-Z0-9._-]{1,20}$/;
function lichCfg(cfg) { try { return JSON.parse(cfg.lich_cfg || 'null'); } catch (e) { return null; } }
function lichClean(c) { // chỉ giữ trường cần cho trang nhân viên
  const s = (v, n) => String(v == null ? '' : v).slice(0, n), col = v => /^#[0-9a-fA-F]{3,8}$/.test(String(v || '')) ? v : '#64748b';
  const ca = (Array.isArray(c.ca) ? c.ca : []).slice(0, 30).map(x => ({ id: s(x.id, 10), ten: s(x.ten, 60), vao: s(x.vao, 5), ra: s(x.ra, 5), gio: +x.gio || 0, mau: col(x.mau) })).filter(x => x.id && !x.id.includes('+'));
  const kh = (Array.isArray(c.kh) ? c.kh : []).slice(0, 30).map(x => ({ k: s(x.k, 6), t: s(x.t, 80), mau: col(x.mau), chinh: x.chinh ? 1 : 0 })).filter(x => x.k);
  const mo = (Array.isArray(c.mo) ? c.mo : []).slice(0, 12).filter(x => ISO_RE.test(x.a) && ISO_RE.test(x.b) && ISO_RE.test(x.han)).map(x => ({ key: s(x.key, 20), ten: s(x.ten, 60), a: x.a, b: x.b, han: x.han }));
  const sx = (Array.isArray(c.sx) ? c.sx : []).slice(0, 2000).map(x => String(x).toUpperCase()).filter(x => MA_RE.test(x));
  return { ky: s(c.ky, 10), mode: c.mode === 'nv' ? 'nv' : 'ql', ca, kh, mo, sx, at: Date.now() };
}
function lichConf(LC, code) { const seg = String(code || '').split('+').map(id => LC.ca.find(x => x.id === id)).filter(Boolean).map(x => { const a = hm2min(x.vao), b0 = hm2min(x.ra); if (a == null || b0 == null) return null; return [a, b0 <= a ? b0 + 1440 : b0, x.id]; }).filter(Boolean).sort((p, q) => p[0] - q[0]);
  for (let i = 1; i < seg.length; i++) if (seg[i][0] < seg[i - 1][1]) return seg[i - 1][2] + ' và ' + seg[i][2] + ' trùng giờ'; return ''; }
function lichCodeOk(LC, code) { if (!code) return true; if (LC.kh.some(x => x.k === code)) return true; const ids = String(code).split('+'); return ids.length <= 4 && ids.every(id => LC.ca.some(x => x.id === id)); }
async function lichPush(db, body, allow) { // body: { cfg, ky: [{key, a, b}], list: [{ma, d: {iso: mã}}] }
  const st = [], LC = body.cfg ? lichClean(body.cfg) : null; let n = 0;
  if (LC) st.push(db.prepare("INSERT INTO cfg (k, v) VALUES ('lich_cfg', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(JSON.stringify(LC)));
  const ky = (Array.isArray(body.ky) ? body.ky : []).slice(0, 20).filter(k => ISO_RE.test(k.a) && ISO_RE.test(k.b) && k.a <= k.b);
  const list = (Array.isArray(body.list) ? body.list : []).slice(0, 2000);
  for (const x of list) {
    const ma = String(x.ma || '').toUpperCase(); if (!MA_RE.test(ma) || (allow && !allow(ma))) continue; const d = x.d || {};
    for (const k of ky) {
      st.push(db.prepare('DELETE FROM lich WHERE ma = ? AND ngay BETWEEN ? AND ?').bind(ma, k.a, k.b), db.prepare('DELETE FROM dk_ca WHERE ma = ? AND ngay BETWEEN ? AND ?').bind(ma, k.a, k.b));
      Object.keys(d).forEach(iso => { if (!ISO_RE.test(iso) || iso < k.a || iso > k.b) return; const c = String(d[iso] || '').slice(0, 40); if (!c) return; st.push(db.prepare('INSERT INTO lich (ma, ngay, ca, ky) VALUES (?, ?, ?, ?) ON CONFLICT(ma, ngay) DO UPDATE SET ca = excluded.ca, ky = excluded.ky').bind(ma, iso, c, String(k.key || '').slice(0, 20))); n++; });
    }
  }
  for (let i = 0; i < st.length; i += 400) await db.batch(st.slice(i, i + 400));
  return n;
}
async function hoSoPush(db, body, allow) {
  const st = []; let n = 0;
  for (const x of (Array.isArray(body.list) ? body.list : []).slice(0, 2000)) { const ma = String(x.ma || '').toUpperCase(); if (!MA_RE.test(ma) || (allow && !allow(ma))) continue; const js = JSON.stringify(x.d || {}); if (js.length > 900000) continue; st.push(db.prepare('INSERT INTO ho_so (ma, du_lieu, at) VALUES (?, ?, ?) ON CONFLICT(ma) DO UPDATE SET du_lieu = excluded.du_lieu, at = excluded.at').bind(ma, js, Date.now())); n++; }
  for (let i = 0; i < st.length; i += 100) await db.batch(st.slice(i, i + 100)); return n;
}
async function hoSoOf(db, ma) { const r = await db.prepare('SELECT du_lieu, at FROM ho_so WHERE ma = ?').bind(ma).first(); if (!r) return null; try { const d = JSON.parse(r.du_lieu); d.at = r.at; return d; } catch (e) { return null; } }
async function dkList(db, tu, allow) { return (await db.prepare('SELECT ma, ngay, ca, ky, t FROM dk_ca WHERE ngay >= ? ORDER BY ma, ngay').bind(tu).all()).results.filter(x => !allow || allow(x.ma)); }
// 11/11 15:32: mỗi ngày tạo lại vài đơn mẫu đang chờ duyệt để quản lý trực tiếp thử Duyệt / Từ chối trên app (mỗi quản lý 1 đơn của 1 nhân viên dưới quyền)
function demoDonCho(db, today, now) {
  const out = [], done = {}, LO = ['Nghỉ phép năm', 'Nghỉ việc riêng có lương', 'Nghỉ phép năm', 'Nghỉ không lương']; let i = 0;
  for (const c of DEMO.cty) for (const e of c.ds) { const ql = e.hs && e.hs.ql; if (!ql || done[ql]) continue; done[ql] = 1; const tu = addIso(today, 5 + (i % 6)), den = i % 3 === 0 ? addIso(tu, 1) : tu, bg = c.ds.find(x => x.ma !== e.ma && x.ma !== ql && x.pb === e.pb) || c.ds.find(x => x.ma !== e.ma && x.ma !== ql) || null;
    out.push(db.prepare("INSERT INTO don (so, ma, loai, tu, den, so_ngay, ly_do, tao, trang_thai, nguoi_duyet, duyet_ma, ban_giao, nguon, cap_nhat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Chờ duyệt', ?, ?, ?, ?, ?)")
      .bind('MAU-' + today.replace(/-/g, '').slice(2) + '-' + e.ma, e.ma, LO[i % 4], tu, den, den === tu ? 1 : 2, ['Việc gia đình', 'Đưa con đi khám', 'Về quê', 'Việc cá nhân'][i % 4], now - (i + 1) * 3600e3, e.hs.ql_ten || '', ql, bg ? bg.ma + '|' + bg.ten : '', MAU, now)); i++; }
  return out;
}
async function hsOf(db, ma, demo) { const HS = await hoSoOf(db, ma); if (HS || !demo) return HS; const e = demoFind(ma); return e && e.hs ? { ...e.hs } : null; }
function demoFind(ma) { for (const c of DEMO.cty) { const e = c.ds.find(x => x.ma === ma); if (e) return { ...e, cty: c.ten }; } return null; }
async function demoPrep(db, cfg, now) {
  const st = [];
  if (!cfg.ql_pin) { const salt = randHex(16); await setCfg(db, { ql_pin: await hashPin(randHex(16), salt), ql_salt: salt, qr_secret: randHex(32), ten_cty: 'Đốm Sáng – bản thử (dữ liệu mẫu)', hien_ip: '1', ip_gio: '12', che_do: 'wifi_hoac_qr' }); }
  if (cfg.demo_seed !== DEMO_SEED) {
    for (const c of DEMO.cty) for (const e of c.ds) {
      const salt = randHex(16), h = await hashPin(DEMO_PIN, salt);
      st.push(db.prepare("INSERT INTO nv (ma, ten, pin, salt, active, created, pb, ncc, nguon) VALUES (?, ?, ?, ?, 1, ?, ?, 0, 'mau') ON CONFLICT(ma) DO UPDATE SET ten = excluded.ten, pin = excluded.pin, salt = excluded.salt, active = 1, fail = 0, lock_until = 0, pb = excluded.pb, nguon = 'mau'").bind(e.ma, e.ten, h, salt, now, c.ten + ' · ' + e.pb));
      for (const x of e.congs) { const y = +x.ym.slice(0, 4), m = +x.ym.slice(5, 7), chot = x.du_lieu.tam ? now : Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 3, 9, 30) - VN;
        st.push(db.prepare('INSERT INTO cong (ym, ma, du_lieu, chot, nguoi, xn, xn_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(ym, ma) DO UPDATE SET du_lieu = excluded.du_lieu, chot = excluded.chot, xn = excluded.xn, xn_at = excluded.xn_at').bind(x.ym, e.ma, JSON.stringify(x.du_lieu), chot, 'Quản trị viên', x.ym < DEMO_LOCKED ? 1 : 0, x.ym < DEMO_LOCKED ? chot + 864e5 : null)); }
      for (const ph of (e.phieu || [])) st.push(db.prepare("INSERT INTO phieu (ym, ma, du_lieu, chot, nguoi, gui, xem_at, hoi) VALUES (?, ?, ?, ?, ?, ?, ?, '[]') ON CONFLICT(ym, ma) DO UPDATE SET du_lieu = excluded.du_lieu, xem_at = excluded.xem_at, hoi = '[]'").bind(ph.ym, e.ma, JSON.stringify(ph), ph.ym + '-28', 'Kế toán (dữ liệu mẫu)', now, ph.ym < DEMO_LOCKED ? now : null));
      for (const r of e.p) { if (r[1]) st.push(demoPunchSt(db, e.ma, dayT(r[0], hm2min(r[1])), 'vao', MAU)); if (r[2]) st.push(demoPunchSt(db, e.ma, dayT(r[0], hm2min(r[2])), 'ra', MAU)); }
    }
    st.unshift(db.prepare("DELETE FROM cham WHERE tb = ?").bind(MAU));
    st.push(db.prepare("INSERT INTO cfg (k, v) VALUES ('demo_syn', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(DEMO.ref));
    cfg.demo_syn = DEMO.ref; cfg.demo_day = '';
    st.push(db.prepare("INSERT INTO cfg (k, v) VALUES ('demo_seed', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(DEMO_SEED));
  }
  const today = isoVN(now);
  if (cfg.demo_day !== today) { // dọn mỗi ngày: giữ 14 ngày lượt chấm thử (lượt chấm mẫu giữ lại), 3 ngày lượt từ chối; xác nhận công về như mẫu để người sau thử lại
    // lượt chấm mẫu tự sinh cho các ngày đã qua sau ngày chốt dữ liệu mẫu (hôm nay để người thử tự chấm)
    const yest = addIso(today, -1); let d = addIso(cfg.demo_syn || DEMO.ref, 1), n = 0;
    while (d <= yest && n++ < 62) { for (const c of DEMO.cty) for (const e of c.ds) { const x = demoSynDay(e, d); if (x) st.push(demoPunchSt(db, e.ma, dayT(d, x.vao), 'vao', MAU + ' (tự sinh)'), demoPunchSt(db, e.ma, dayT(d, x.ra), 'ra', MAU + ' (tự sinh)')); } d = addIso(d, 1); }
    if (yest > (cfg.demo_syn || '')) st.push(db.prepare("INSERT INTO cfg (k, v) VALUES ('demo_syn', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(yest));
    st.push(db.prepare('DELETE FROM cham WHERE t < ? AND COALESCE(tb, \'\') != ?').bind(now - 14 * 864e5, MAU), db.prepare('DELETE FROM tu_choi WHERE t < ?').bind(now - 3 * 864e5),
      db.prepare("DELETE FROM don WHERE nguon = 'Điện thoại' AND tao < ?").bind(now - 14 * 864e5), db.prepare('UPDATE cong SET xn = CASE WHEN ym < ? THEN 1 ELSE 0 END, xn_at = CASE WHEN ym < ? THEN chot + 86400000 ELSE NULL END, phan_hoi = NULL').bind(DEMO_LOCKED, DEMO_LOCKED),
      db.prepare("DELETE FROM ip_vp WHERE last < ?").bind(now - 2 * 864e5), db.prepare("DELETE FROM dk_ca WHERE ngay < ?").bind(addIso(today, -14)), db.prepare("DELETE FROM lich WHERE ngay < ?").bind(addIso(today, -70)), db.prepare("DELETE FROM phien WHERE last < ?").bind(now - 7 * 864e5),
      db.prepare("UPDATE nv SET fail = 0, lock_until = 0, active = 1 WHERE nguon = 'mau'"), db.prepare("DELETE FROM don WHERE nguon = ?").bind(MAU),
      ...demoDonCho(db, today, now),
      db.prepare("INSERT INTO cfg (k, v) VALUES ('demo_day', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(today));
  }
  if (st.length) await db.batch(st);
  return st.length > 0 || !cfg.ql_pin;
}
const DEMO_NO = 'Bản thử dùng chung cho mọi người nên không đổi được mục này. Khi triển khai riêng cho công ty, anh/chị đổi được bình thường.';
const VN = 7 * 3600e3;
const QR_STEP = 30e3;          // QR đổi mỗi 30 giây
const QR_GRACE = 5e3;          // mã vừa đổi trong 5 giây vẫn nhận mã ngay trước đó (đang quét đúng lúc đổi)
const PASS_MS = 120e3;         // quét đúng mã → được 2 phút để đăng nhập/bấm chấm (thẻ qua cửa ký số)
const DUP_MS = 120e3;          // bấm trùng cùng loại trong 2 phút → không ghi thêm
const DEF = { che_do: 'wifi_hoac_qr', ip_gio: '72', hien_ip: '1', ten_cty: '' };

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS cfg (k TEXT PRIMARY KEY, v TEXT)`,
  `CREATE TABLE IF NOT EXISTS nv (ma TEXT PRIMARY KEY, ten TEXT NOT NULL, pin TEXT, salt TEXT, active INTEGER DEFAULT 1, fail INTEGER DEFAULT 0, lock_until INTEGER DEFAULT 0, created INTEGER)`,
  `CREATE TABLE IF NOT EXISTS phien (tok TEXT PRIMARY KEY, vai TEXT NOT NULL, ma TEXT, created INTEGER, last INTEGER, tb TEXT)`,
  `CREATE TABLE IF NOT EXISTS ip_vp (ip TEXT PRIMARY KEY, nguon TEXT, first INTEGER, last INTEGER)`,
  `CREATE TABLE IF NOT EXISTS cham (id INTEGER PRIMARY KEY AUTOINCREMENT, ma TEXT NOT NULL, t INTEGER NOT NULL, loai TEXT NOT NULL, cach TEXT NOT NULL, ip TEXT, wifi INTEGER, tb TEXT, ghi TEXT, huy INTEGER DEFAULT 0, nguoi TEXT)`,
  `CREATE INDEX IF NOT EXISTS cham_t ON cham(t)`,
  `CREATE TABLE IF NOT EXISTS tu_choi (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER, ma TEXT, ip TEXT, ly_do TEXT, tb TEXT)`,
  /* 0.2: mã máy – mỗi trình duyệt một mã riêng (cookie qtt_may), đăng xuất không mất. Một máy dùng cho ≥ 2 nhân viên → cảnh báo chấm hộ */
  `CREATE TABLE IF NOT EXISTS may_nv (may TEXT NOT NULL, ma TEXT NOT NULL, nhan TEXT, first INTEGER, last INTEGER, so_dn INTEGER DEFAULT 0, so_cham INTEGER DEFAULT 0, PRIMARY KEY (may, ma))`,
  `CREATE TABLE IF NOT EXISTS may_bo_qua (may TEXT PRIMARY KEY, ghi TEXT, t INTEGER)`,
  /* 0.3.1: đơn nghỉ nhân viên gửi trên điện thoại; công tháng đã chốt gửi nhân viên xác nhận */
  `CREATE TABLE IF NOT EXISTS don (so TEXT PRIMARY KEY, ma TEXT NOT NULL, loai TEXT, tu TEXT, den TEXT, so_ngay REAL, ly_do TEXT, tao INTEGER, trang_thai TEXT, nguoi_duyet TEXT, ngay_duyet TEXT, ly_do_tc TEXT, nguon TEXT, cap_nhat INTEGER)`,
  `CREATE INDEX IF NOT EXISTS don_ma ON don(ma)`,
  `CREATE TABLE IF NOT EXISTS cong (ym TEXT NOT NULL, ma TEXT NOT NULL, du_lieu TEXT, chot INTEGER, nguoi TEXT, xn INTEGER DEFAULT 0, xn_at INTEGER, phan_hoi TEXT, PRIMARY KEY (ym, ma))`,
  /* 0.4.1: phiếu lương (bảng kê trả lương – BLLĐ Điều 95.3) gửi từ phần mềm; nhân viên hỏi lại từng dòng (hoi = JSON [{t, dong, nd, tl, tl_at, tl_by}]) */
  `CREATE TABLE IF NOT EXISTS phieu (ym TEXT NOT NULL, ma TEXT NOT NULL, du_lieu TEXT, chot TEXT, nguoi TEXT, gui INTEGER, xem_at INTEGER, hoi TEXT DEFAULT '[]', PRIMARY KEY (ym, ma))`,
  /* 0.4.2 (11/11): lịch xếp ca đã chốt + thông báo (phần mềm gửi lên) và lịch nhân viên tự đăng ký (khối sản xuất, vận hành) */
  `CREATE TABLE IF NOT EXISTS lich (ma TEXT NOT NULL, ngay TEXT NOT NULL, ca TEXT, ky TEXT, PRIMARY KEY (ma, ngay))`,
  `CREATE TABLE IF NOT EXISTS dk_ca (ma TEXT NOT NULL, ngay TEXT NOT NULL, ca TEXT, ky TEXT, t INTEGER, PRIMARY KEY (ma, ngay))`,
  /* 0.4.2 (11/11 14:57): mục "Tôi" – hồ sơ, hành trình, hợp đồng do phần mềm gửi lên; kho file (chỉ máy chủ riêng của đơn vị, ≤ 1,2 MB/file) */
  `CREATE TABLE IF NOT EXISTS ho_so (ma TEXT PRIMARY KEY, du_lieu TEXT, at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS kho_file (id TEXT PRIMARY KEY, ma TEXT NOT NULL, kho TEXT, ref TEXT, ten TEXT, loai TEXT, size INTEGER, at INTEGER, data TEXT)`,
  `CREATE INDEX IF NOT EXISTS kho_file_ma ON kho_file (ma)`,
  `CREATE TABLE IF NOT EXISTS anh (ma TEXT PRIMARY KEY, data TEXT, at INTEGER)` // 11/11 15:32: ảnh đại diện nhân viên tự tải lên
];
const MIGRATE_V2 = ['ALTER TABLE cham ADD COLUMN may TEXT', 'ALTER TABLE phien ADD COLUMN may TEXT', 'ALTER TABLE tu_choi ADD COLUMN may TEXT'];
const MIGRATE_V3 = ['ALTER TABLE nv ADD COLUMN pb TEXT', 'ALTER TABLE nv ADD COLUMN ncc INTEGER DEFAULT 0', 'ALTER TABLE nv ADD COLUMN nguon TEXT'];
const MIGRATE_V4 = ['ALTER TABLE don ADD COLUMN duyet_ma TEXT', 'ALTER TABLE don ADD COLUMN ban_giao TEXT']; // 11/11 15:32: đơn – quản lý trực tiếp duyệt trên app, người nhận bàn giao
let schemaOk = false;
async function ensureSchema(db) {
  if (schemaOk) return;
  await db.batch(SCHEMA.map(s => db.prepare(s)));
  const v = await db.prepare("SELECT v FROM cfg WHERE k = 'schema_v'").first();
  const sv = v ? Number(v.v) : 0;
  if (sv < 4) {
    for (const sql of (sv < 2 ? MIGRATE_V2 : []).concat(sv < 3 ? MIGRATE_V3 : [], MIGRATE_V4)) { try { await db.prepare(sql).run(); } catch (e) { if (!/duplicate column/i.test(String(e && e.message))) throw e; } }
    await db.prepare("INSERT INTO cfg (k, v) VALUES ('schema_v', '4') ON CONFLICT(k) DO UPDATE SET v = '4'").run();
  }
  schemaOk = true;
}

/* ---------- tiện ích ---------- */
const enc = new TextEncoder();
function hex(buf) { return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join(''); }
function randHex(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return hex(a); }
async function sha256(s) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(s))); }
async function hashPin(pin, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(String(pin)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 1000 }, key, 256);
  return hex(bits);
}
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
function b32(bytes) { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < bytes.length; i++) s += A[bytes[i] & 31]; return s; }
function json(o, status = 200, headers = {}) {
  return new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
}
function bad(msg, status = 400) { return json({ ok: false, loi: msg }, status); }
/* 0.3.1: API đồng bộ cho Phần mềm quản lý nhân sự (chạy trên trình duyệt của kế toán, khác tên miền) – xác thực bằng Mã kết nối, không dùng cookie */
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'authorization, content-type', 'access-control-max-age': '86400' };
function jc(o, status = 200) { return json(o, status, CORS); }
function isoVN(t) { const q = vnParts(t); return q.y + '-' + q.m + '-' + q.d; }
function cookies(req) { const o = {}; (req.headers.get('cookie') || '').split(/;\s*/).forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1)); }); return o; }
function setCookie(name, val, maxAge) { return name + '=' + encodeURIComponent(val) + '; Path=/; Max-Age=' + maxAge + '; HttpOnly; Secure; SameSite=Lax'; }
function vnDayStart(t) { return Math.floor((t + VN) / 864e5) * 864e5 - VN; }
function pad(n) { return String(n).padStart(2, '0'); }
function vnParts(t) { const d = new Date(t + VN); return { d: pad(d.getUTCDate()), m: pad(d.getUTCMonth() + 1), y: d.getUTCFullYear(), h: pad(d.getUTCHours()), mi: pad(d.getUTCMinutes()), s: pad(d.getUTCSeconds()) }; }
function shortUA(ua) {
  ua = ua || '';
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : 'Khác';
  const br = /EdgA?\//.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Zalo/i.test(ua) ? 'Zalo' : /Safari\//.test(ua) ? 'Safari' : 'Trình duyệt khác';
  return os + ' · ' + br;
}

/* ---------- IP ---------- */
function clientIP(req, env) {
  if (env.DEV === '1' && req.headers.get('x-test-ip')) return req.headers.get('x-test-ip');
  return req.headers.get('cf-connecting-ip') || '';
}
function expandV6(ip) {
  ip = ip.split('%')[0].toLowerCase();
  if (ip.includes('.')) return null; // IPv4 nhúng – bỏ qua
  const [h, t] = ip.split('::');
  const hp = h ? h.split(':') : [], tp = t !== undefined ? (t ? t.split(':') : []) : null;
  let parts = tp === null ? hp : hp.concat(Array(8 - hp.length - tp.length).fill('0'), tp);
  if (parts.length !== 8) return null;
  return parts.map(p => p.padStart(4, '0'));
}
function ipKind(ip) { return ip.includes(':') ? 'IPv6' : 'IPv4'; }
function sameNet(a, b) {
  if (!a || !b) return false;
  if (ipKind(a) !== ipKind(b)) return false;
  if (ipKind(a) === 'IPv4') return a === b;
  const x = expandV6(a), y = expandV6(b);
  if (!x || !y) return a === b;
  return x.slice(0, 4).join(':') === y.slice(0, 4).join(':'); // cùng dải /64
}
async function officeIPs(db, cfg, now) {
  const hours = Math.max(1, Number(cfg.ip_gio) || 72);
  const { results } = await db.prepare('SELECT ip, nguon, first, last FROM ip_vp ORDER BY last DESC').all();
  return results.map(r => ({ ...r, hieu_luc: r.nguon === 'tay' || r.last > now - hours * 3600e3 }));
}
function matchOffice(ip, list) { return list.some(r => r.hieu_luc && sameNet(ip, r.ip)); }

/* ---------- cấu hình, phiên ---------- */
async function getCfg(db) {
  const { results } = await db.prepare('SELECT k, v FROM cfg').all();
  const o = { ...DEF }; results.forEach(r => { o[r.k] = r.v; }); return o;
}
async function setCfg(db, obj) {
  await db.batch(Object.entries(obj).map(([k, v]) => db.prepare('INSERT INTO cfg (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').bind(k, String(v))));
}
const COOKIE = { nv: 'qtt_nv', ql: 'qtt_ql', tram: 'qtt_tram' };
const AGE = { nv: 180 * 864e2, ql: 12 * 3600, tram: 365 * 864e2 };
async function newSession(db, vai, ma, req) {
  const tok = randHex(32), now = Date.now();
  await db.prepare('INSERT INTO phien (tok, vai, ma, created, last, tb, may) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(await sha256(tok), vai, ma || null, now, now, shortUA(req.headers.get('user-agent')), req.may || null).run();
  return setCookie(COOKIE[vai], tok, AGE[vai]);
}
async function session(db, req, vai) {
  const tok = cookies(req)[COOKIE[vai]];
  if (!tok) return null;
  const row = await db.prepare('SELECT * FROM phien WHERE tok = ? AND vai = ?').bind(await sha256(tok), vai).first();
  if (!row) return null;
  if (vai === 'ql' && row.created < Date.now() - AGE.ql * 1000) return null;
  if (row.last < Date.now() - 3600e3) await db.prepare('UPDATE phien SET last = ? WHERE tok = ?').bind(Date.now(), row.tok).run();
  if (vai === 'nv') {
    const nv = await db.prepare('SELECT ma, ten, active, ncc FROM nv WHERE ma = ?').bind(row.ma).first();
    if (!nv || !nv.active) return null;
    row.nv = nv;
  }
  return row;
}

/* ---------- QR động ---------- */
async function qrToken(secret, w) { return b32((await hmac(secret, 'qr:' + w)).slice(0, 12)); }
async function verifyQR(secret, t, now) {
  if (!t || !secret) return false;
  const w = Math.floor(now / QR_STEP);
  if (t === await qrToken(secret, w)) return true;
  return now - w * QR_STEP < QR_GRACE && t === await qrToken(secret, w - 1);
}
/* Quét QR hợp lệ (kiểm tra NGAY lúc mở link) → nhận "thẻ qua cửa" ký số, dùng để bấm chấm trong 2 phút. */
async function makePass(secret, now) { return now + '.' + b32(await hmac(secret, 'pass:' + now)); }
async function verifyPass(secret, p, now) {
  const m = /^(\d{13})\.([A-Z2-9]+)$/.exec(String(p || ''));
  if (!m || !secret) return false;
  const t0 = Number(m[1]);
  if (t0 > now + 5e3 || now - t0 > PASS_MS) return false;
  return m[2] === b32(await hmac(secret, 'pass:' + t0));
}
function qrSvg(text) { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 8, margin: 2, scalable: true }); }

/* ---------- dữ liệu chấm ---------- */
async function punchesBetween(db, from, to, ma) {
  const sql = 'SELECT c.id, c.ma, n.ten, c.t, c.loai, c.cach, c.ip, c.wifi, c.tb, c.may, c.ghi, c.huy, c.nguoi FROM cham c LEFT JOIN nv n ON n.ma = c.ma WHERE c.t >= ? AND c.t < ?' + (ma ? ' AND c.ma = ?' : '') + ' ORDER BY c.t';
  const st = ma ? db.prepare(sql).bind(from, to, ma) : db.prepare(sql).bind(from, to);
  return (await st.all()).results;
}
async function logReject(db, ma, ip, lyDo, req) {
  await db.prepare('INSERT INTO tu_choi (t, ma, ip, ly_do, tb, may) VALUES (?, ?, ?, ?, ?, ?)').bind(Date.now(), ma || null, ip, lyDo, shortUA(req.headers.get('user-agent')), req.may || null).run();
}
async function noteDevice(db, req, ma, kind) {
  if (!req.may || !ma) return;
  const now = Date.now(), dn = kind === 'dn' ? 1 : 0, ch = kind === 'cham' ? 1 : 0;
  await db.prepare('INSERT INTO may_nv (may, ma, nhan, first, last, so_dn, so_cham) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(may, ma) DO UPDATE SET last = excluded.last, nhan = excluded.nhan, so_dn = so_dn + excluded.so_dn, so_cham = so_cham + excluded.so_cham')
    .bind(req.may, ma, shortUA(req.headers.get('user-agent')), now, now, dn, ch).run();
}
/* Máy dùng chung: một mã máy gắn với ≥ 2 nhân viên, trừ máy quản lý đã đánh dấu "đã kiểm tra" */
async function sharedDevices(db) {
  const { results } = await db.prepare('SELECT m.may, m.ma, n.ten, m.nhan, m.first, m.last, m.so_dn, m.so_cham, b.ghi AS bo_qua_ghi, b.t AS bo_qua_t FROM may_nv m LEFT JOIN nv n ON n.ma = m.ma LEFT JOIN may_bo_qua b ON b.may = m.may WHERE m.may IN (SELECT may FROM may_nv GROUP BY may HAVING COUNT(*) > 1) ORDER BY m.may, m.first').all();
  const by = {};
  results.forEach(r => { const o = by[r.may] || (by[r.may] = { may: r.may, nhan: r.nhan, last: 0, bo_qua: r.bo_qua_t ? { ghi: r.bo_qua_ghi, t: r.bo_qua_t } : null, nv: [] }); o.nv.push({ ma: r.ma, ten: r.ten || r.ma, first: r.first, last: r.last, so_dn: r.so_dn, so_cham: r.so_cham }); if (r.last > o.last) { o.last = r.last; o.nhan = r.nhan; } });
  return Object.values(by).sort((a, b) => b.last - a.last);
}

/* ---------- API ---------- */
async function api(req, env, url) {
  const db = env.DB; await ensureSchema(db);
  const p = url.pathname, now = Date.now(), ip = clientIP(req, env);
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  let cfg = await getCfg(db);
  const demo = isDemo(env, url);
  if (demo && await demoPrep(db, cfg, now)) cfg = await getCfg(db);
  const isSetup = !!cfg.ql_pin;
  const sess = vai => demo && (vai === 'ql' || vai === 'tram') ? Promise.resolve({ vai, demo: true }) : session(db, req, vai); // bản thử: không cần mật khẩu quản lý / kích hoạt màn hình chung

  /* ----- BẢN THỬ: API công khai cho Phần mềm quản lý nhân sự (bản thử, chạy file trên máy người dùng) ----- */
  if (p.startsWith('/api/demo/')) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (!demo) return jc({ ok: false, loi: 'Chỉ có ở bản thử.' }, 404);
    const r = p.slice(10);
    if (r === 'nv') return jc({ ok: true, pin: DEMO_PIN, cty: DEMO.cty.map(c => ({ ten: c.ten, ds: c.ds.map(e => ({ ma: e.ma, ten: e.ten, pb: e.pb, cd: e.cd })) })) });
    if (r === 'cham') {
      const tu = String(url.searchParams.get('tu') || isoVN(now - 13 * 864e5)), den = String(url.searchParams.get('den') || isoVN(now));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(tu) || !/^\d{4}-\d{2}-\d{2}$/.test(den)) return jc({ ok: false, loi: 'tu, den dạng YYYY-MM-DD' }, 400);
      const from = Date.UTC(+tu.slice(0, 4), +tu.slice(5, 7) - 1, +tu.slice(8, 10)) - VN, to = Date.UTC(+den.slice(0, 4), +den.slice(5, 7) - 1, +den.slice(8, 10)) - VN + 864e5;
      return jc({ ok: true, now, list: (await punchesBetween(db, from, to)).filter(x => !x.huy).map(x => ({ id: x.id, ma: x.ma, t: x.t, loai: x.loai, cach: x.cach, ghi: x.ghi || '' })) });
    }
    if (r === 'don') return jc({ ok: true, now, list: (await db.prepare("SELECT * FROM don WHERE nguon = 'Điện thoại' AND trang_thai != 'Đã hủy' ORDER BY tao DESC LIMIT 200").all()).results });
    if (r === 'don-cap-nhat' && req.method === 'POST') {
      const list = Array.isArray(body.list) ? body.list.slice(0, 200) : [], st = [];
      for (const x of list) { if (!['Đã duyệt', 'Từ chối', 'Chờ duyệt'].includes(x.trang_thai)) continue; st.push(db.prepare("UPDATE don SET trang_thai = ?, nguoi_duyet = ?, ngay_duyet = ?, ly_do_tc = ?, so_ngay = COALESCE(?, so_ngay), cap_nhat = ? WHERE so = ? AND nguon = 'Điện thoại'").bind(x.trang_thai, String(x.nguoi_duyet || '').slice(0, 80), String(x.ngay_duyet || ''), String(x.ly_do_tc || '').slice(0, 300), x.so_ngay == null ? null : Number(x.so_ngay) || null, now, String(x.so))); }
      if (st.length) await db.batch(st); return jc({ ok: true, n: st.length });
    }
    // 10/11/2026 16:01: bản thử – phần mềm nhân sự (dữ liệu mẫu) gửi phiếu lương lên điện thoại, chỉ nhận mã NV có trong dữ liệu mẫu
    if (r === 'phieu' && req.method === 'POST') {
      const ym = String(body.ym || ''); if (!/^\d{4}-\d{2}$/.test(ym)) return jc({ ok: false, loi: 'ym dạng YYYY-MM' }, 400);
      const list = Array.isArray(body.list) ? body.list.slice(0, 100) : [], st = [];
      for (const x of list) {
        const ma = String(x.ma || '').toUpperCase(); if (!demoFind(ma)) continue; const dl = JSON.stringify(x.du_lieu || {}); if (dl.length > 20000) continue;
        st.push(db.prepare("INSERT INTO phieu (ym, ma, du_lieu, chot, nguoi, gui, xem_at, hoi) VALUES (?, ?, ?, ?, ?, ?, NULL, '[]') ON CONFLICT(ym, ma) DO UPDATE SET du_lieu = excluded.du_lieu, chot = excluded.chot, nguoi = excluded.nguoi, gui = excluded.gui, xem_at = CASE WHEN phieu.du_lieu = excluded.du_lieu THEN phieu.xem_at ELSE NULL END").bind(ym, ma, dl, String(body.chot || '').slice(0, 40), String(body.nguoi || '').slice(0, 80), now));
      }
      if (st.length) await db.batch(st); return jc({ ok: true, n: st.length });
    }
    if (r === 'phieu-hoi') {
      const ym = String(url.searchParams.get('ym') || '');
      return jc({ ok: true, list: (await db.prepare('SELECT ma, xem_at, hoi FROM phieu WHERE ym = ?').bind(ym).all()).results.filter(x => demoFind(x.ma)).map(x => ({ ma: x.ma, xem_at: x.xem_at, hoi: JSON.parse(x.hoi || '[]') })) });
    }
    if (r === 'phieu-tra-loi' && req.method === 'POST') {
      const ym = String(body.ym || ''), ma = String(body.ma || '').toUpperCase(), i = +body.idx, tl = String(body.tra_loi || '').trim().slice(0, 500);
      if (!demoFind(ma)) return jc({ ok: false, loi: 'Không có câu hỏi này.' }, 404);
      const row = await db.prepare('SELECT hoi FROM phieu WHERE ym = ? AND ma = ?').bind(ym, ma).first(); if (!row || !tl) return jc({ ok: false, loi: 'Không có câu hỏi này.' }, 404);
      const a = JSON.parse(row.hoi || '[]'); if (!a[i]) return jc({ ok: false, loi: 'Không có câu hỏi này.' }, 404);
      a[i].tl = tl; a[i].tl_at = now; a[i].tl_by = String(body.nguoi || '').slice(0, 80);
      await db.prepare('UPDATE phieu SET hoi = ? WHERE ym = ? AND ma = ?').bind(JSON.stringify(a), ym, ma).run(); return jc({ ok: true });
    }
    // 11/11: lịch xếp ca – phần mềm nhân sự (dữ liệu mẫu) gửi lịch đã thông báo, kéo lịch nhân viên đăng ký
    if (r === 'lich' && req.method === 'POST') return jc({ ok: true, n: await lichPush(db, body, ma => !!demoFind(ma)) });
    if (r === 'ho-so' && req.method === 'POST') return jc({ ok: true, n: await hoSoPush(db, body, ma => !!demoFind(ma)) });
    if (r === 'dk-ca') return jc({ ok: true, list: await dkList(db, String(url.searchParams.get('tu') || isoVN(now - 7 * 864e5)), ma => !!demoFind(ma)) });
    if (r === 'qr') { const to = { nv: '/', tram: '/tram', ql: '/quan-ly' }[url.searchParams.get('u') || 'nv'] || '/'; return new Response(qrSvg(url.origin + to), { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'max-age=3600', ...CORS } }); }
    return jc({ ok: false, loi: 'Không có API này' }, 404);
  }

  /* ----- 0.3.1: ĐỒNG BỘ VỚI PHẦN MỀM QUẢN LÝ NHÂN SỰ (xác thực: Authorization: Bearer <Mã kết nối>) -----
     Máy chủ này là nơi lưu chính lượt chấm, đơn nghỉ gửi từ điện thoại, xác nhận công.
     Phần mềm nhân sự: đẩy danh sách nhân viên + mã PIN, kéo lượt chấm, kéo đơn, trả kết quả duyệt đơn, gửi công tháng đã chốt. */
  if (p.startsWith('/api/sync/')) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const key = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (!cfg.sync_key || !key || await sha256(key) !== cfg.sync_key) return jc({ ok: false, loi: 'Mã kết nối không đúng hoặc chưa tạo. Vào trang Quản lý → Cài đặt → Kết nối Phần mềm quản lý nhân sự.' }, 401);
    const r = p.slice(10);
    if (r === 'ping') {
      const n = await db.prepare('SELECT COUNT(*) AS n, SUM(CASE WHEN pin IS NOT NULL THEN 1 ELSE 0 END) AS c FROM nv WHERE active = 1').first();
      return jc({ ok: true, ver: VER, ten_cty: cfg.ten_cty, che_do: cfg.che_do, so_nv: n.n || 0, co_pin: n.c || 0, now });
    }
    if (r === 'nhan-vien' && req.method === 'POST') {
      const list = Array.isArray(body.list) ? body.list.slice(0, 2000) : [], out = { them: 0, sua: 0, chua_pin: [] }, st = [];
      for (const x of list) {
        const ma = String(x.ma || '').trim().toUpperCase(), ten = String(x.ten || '').trim().slice(0, 120);
        if (!/^[A-Z0-9._-]{1,20}$/.test(ma) || !ten) continue;
        const old = await db.prepare('SELECT ma, pin FROM nv WHERE ma = ?').bind(ma).first();
        if (!old) { st.push(db.prepare("INSERT INTO nv (ma, ten, active, created, pb, ncc, nguon) VALUES (?, ?, ?, ?, ?, ?, 'phan-mem')").bind(ma, ten, x.active ? 1 : 0, now, String(x.pb || '').slice(0, 120), x.ncc ? 1 : 0)); out.them++; out.chua_pin.push(ma); }
        else { st.push(db.prepare("UPDATE nv SET ten = ?, active = ?, pb = ?, ncc = ?, nguon = 'phan-mem' WHERE ma = ?").bind(ten, x.active ? 1 : 0, String(x.pb || '').slice(0, 120), x.ncc ? 1 : 0, ma)); out.sua++; if (!old.pin) out.chua_pin.push(ma); }
        if (!x.active) st.push(db.prepare("DELETE FROM phien WHERE vai = 'nv' AND ma = ?").bind(ma));
      }
      if (st.length) await db.batch(st);
      return jc({ ok: true, ...out });
    }
    if (r === 'pin' && req.method === 'POST') {
      const ma = String(body.ma || '').trim().toUpperCase(), pin = String(body.pin || '');
      if (!/^\d{4,8}$/.test(pin)) return jc({ ok: false, loi: 'Mã PIN 4–8 chữ số.' }, 400);
      const old = await db.prepare('SELECT ma FROM nv WHERE ma = ?').bind(ma).first(), salt = randHex(16), h = await hashPin(pin, salt);
      if (old) await db.prepare('UPDATE nv SET pin = ?, salt = ?, fail = 0, lock_until = 0, active = 1 WHERE ma = ?').bind(h, salt, ma).run();
      else { const ten = String(body.ten || '').trim().slice(0, 120); if (!ten) return jc({ ok: false, loi: 'Thiếu họ tên.' }, 400); await db.prepare("INSERT INTO nv (ma, ten, pin, salt, active, created, pb, nguon) VALUES (?, ?, ?, ?, 1, ?, ?, 'phan-mem')").bind(ma, ten, h, salt, now, String(body.pb || '').slice(0, 120)).run(); }
      await db.prepare("DELETE FROM phien WHERE vai = 'nv' AND ma = ?").bind(ma).run();
      return jc({ ok: true });
    }
    if (r === 'cham') {
      const tu = String(url.searchParams.get('tu') || ''), den = String(url.searchParams.get('den') || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(tu) || !/^\d{4}-\d{2}-\d{2}$/.test(den)) return jc({ ok: false, loi: 'tu, den dạng YYYY-MM-DD' }, 400);
      const from = Date.UTC(+tu.slice(0, 4), +tu.slice(5, 7) - 1, +tu.slice(8, 10)) - VN, to = Date.UTC(+den.slice(0, 4), +den.slice(5, 7) - 1, +den.slice(8, 10)) - VN + 864e5;
      const rows = (await punchesBetween(db, from, to)).filter(x => !x.huy).map(x => ({ id: x.id, ma: x.ma, t: x.t, loai: x.loai, cach: x.cach, ghi: x.ghi || '' }));
      return jc({ ok: true, list: rows });
    }
    if (r === 'don') {
      const tu = String(url.searchParams.get('tu') || '2000-01-01');
      return jc({ ok: true, list: (await db.prepare('SELECT * FROM don WHERE den >= ? ORDER BY tao').bind(tu).all()).results });
    }
    if (r === 'don-cap-nhat' && req.method === 'POST') {
      const list = Array.isArray(body.list) ? body.list.slice(0, 1000) : [], st = [];
      for (const x of list) {
        if (!['Đã duyệt', 'Từ chối', 'Chờ duyệt'].includes(x.trang_thai)) continue;
        st.push(db.prepare('UPDATE don SET trang_thai = ?, nguoi_duyet = ?, ngay_duyet = ?, ly_do_tc = ?, so_ngay = COALESCE(?, so_ngay), cap_nhat = ? WHERE so = ?').bind(x.trang_thai, String(x.nguoi_duyet || '').slice(0, 80), String(x.ngay_duyet || ''), String(x.ly_do_tc || '').slice(0, 300), x.so_ngay == null ? null : Number(x.so_ngay), now, String(x.so)));
      }
      if (st.length) await db.batch(st);
      return jc({ ok: true, n: st.length });
    }
    if (r === 'cong' && req.method === 'POST') {
      const ym = String(body.ym || ''); if (!/^\d{4}-\d{2}$/.test(ym)) return jc({ ok: false, loi: 'ym dạng YYYY-MM' }, 400);
      const list = Array.isArray(body.list) ? body.list.slice(0, 2000) : [], st = [];
      for (const x of list) {
        const ma = String(x.ma || '').toUpperCase(), dl = JSON.stringify(x.du_lieu || {}).slice(0, 20000);
        const old = await db.prepare('SELECT du_lieu FROM cong WHERE ym = ? AND ma = ?').bind(ym, ma).first();
        if (old && old.du_lieu === dl) continue; // không đổi → giữ xác nhận cũ
        st.push(db.prepare('INSERT INTO cong (ym, ma, du_lieu, chot, nguoi, xn, xn_at, phan_hoi) VALUES (?, ?, ?, ?, ?, 0, NULL, NULL) ON CONFLICT(ym, ma) DO UPDATE SET du_lieu = excluded.du_lieu, chot = excluded.chot, nguoi = excluded.nguoi, xn = 0, xn_at = NULL, phan_hoi = NULL').bind(ym, ma, dl, now, String(body.nguoi || '').slice(0, 80)));
      }
      if (st.length) await db.batch(st);
      return jc({ ok: true, n: st.length });
    }
    if (r === 'phieu' && req.method === 'POST') {
      const ym = String(body.ym || ''); if (!/^\d{4}-\d{2}$/.test(ym)) return jc({ ok: false, loi: 'ym dạng YYYY-MM' }, 400);
      const list = Array.isArray(body.list) ? body.list.slice(0, 2000) : [], st = [];
      for (const x of list) {
        const ma = String(x.ma || '').toUpperCase(); if (!/^[A-Z0-9._-]{1,20}$/.test(ma)) continue;
        st.push(db.prepare("INSERT INTO phieu (ym, ma, du_lieu, chot, nguoi, gui, xem_at, hoi) VALUES (?, ?, ?, ?, ?, ?, NULL, '[]') ON CONFLICT(ym, ma) DO UPDATE SET du_lieu = excluded.du_lieu, chot = excluded.chot, nguoi = excluded.nguoi, gui = excluded.gui, xem_at = CASE WHEN phieu.du_lieu = excluded.du_lieu THEN phieu.xem_at ELSE NULL END").bind(ym, ma, JSON.stringify(x.du_lieu || {}).slice(0, 30000), String(body.chot || '').slice(0, 40), String(body.nguoi || '').slice(0, 80), now));
      }
      if (st.length) await db.batch(st);
      return jc({ ok: true, n: st.length });
    }
    if (r === 'phieu-hoi') {
      const ym = String(url.searchParams.get('ym') || '');
      return jc({ ok: true, list: (await db.prepare('SELECT ma, xem_at, hoi FROM phieu WHERE ym = ?').bind(ym).all()).results.map(x => ({ ma: x.ma, xem_at: x.xem_at, hoi: JSON.parse(x.hoi || '[]') })) });
    }
    if (r === 'phieu-tra-loi' && req.method === 'POST') {
      const ym = String(body.ym || ''), ma = String(body.ma || '').toUpperCase(), i = +body.idx, tl = String(body.tra_loi || '').trim().slice(0, 500);
      const row = await db.prepare('SELECT hoi FROM phieu WHERE ym = ? AND ma = ?').bind(ym, ma).first(); if (!row || !tl) return jc({ ok: false, loi: 'Không có câu hỏi này.' }, 404);
      const a = JSON.parse(row.hoi || '[]'); if (!a[i]) return jc({ ok: false, loi: 'Không có câu hỏi này.' }, 404);
      a[i].tl = tl; a[i].tl_at = now; a[i].tl_by = String(body.nguoi || '').slice(0, 80);
      await db.prepare('UPDATE phieu SET hoi = ? WHERE ym = ? AND ma = ?').bind(JSON.stringify(a), ym, ma).run();
      return jc({ ok: true });
    }
    if (r === 'lich' && req.method === 'POST') return jc({ ok: true, n: await lichPush(db, body, null) });
    if (r === 'ho-so' && req.method === 'POST') return jc({ ok: true, n: await hoSoPush(db, body, null) });
    if (r === 'kho-ids') return jc({ ok: true, ids: (await db.prepare('SELECT id FROM kho_file').all()).results.map(x => x.id) });
    if (r === 'kho-xoa' && req.method === 'POST') { const ids = (Array.isArray(body.ids) ? body.ids : []).slice(0, 500).map(String); for (let i = 0; i < ids.length; i += 50) await db.batch(ids.slice(i, i + 50).map(id => db.prepare('DELETE FROM kho_file WHERE id = ?').bind(id))); return jc({ ok: true, n: ids.length }); }
    if (r === 'kho-file' && req.method === 'POST') {
      const id = String(body.id || '').slice(0, 80), ma = String(body.ma || '').toUpperCase(), data = String(body.data || ''); if (!id || !MA_RE.test(ma) || !data) return jc({ ok: false, loi: 'Thiếu dữ liệu file' }, 400);
      if (data.length > 1700000) return jc({ ok: false, loi: 'File quá lớn (tối đa 1,2 MB)' }, 413);
      await db.prepare('INSERT INTO kho_file (id, ma, kho, ref, ten, loai, size, at, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, ten = excluded.ten, ref = excluded.ref, at = excluded.at').bind(id, ma, String(body.kho || '').slice(0, 10), String(body.ref || '').slice(0, 120), String(body.ten || 'file').slice(0, 160), String(body.loai || '').slice(0, 80), Math.round(data.length * 3 / 4), Date.now(), data).run();
      return jc({ ok: true });
    }
    if (r === 'dk-ca') return jc({ ok: true, list: await dkList(db, String(url.searchParams.get('tu') || isoVN(now - 7 * 864e5)), null) });
    if (r === 'cong-xac-nhan') {
      const ym = String(url.searchParams.get('ym') || '');
      return jc({ ok: true, list: (await db.prepare('SELECT ma, xn, xn_at, phan_hoi, chot FROM cong WHERE ym = ?').bind(ym).all()).results });
    }
    return jc({ ok: false, loi: 'Không có API này' }, 404);
  }


  if (p === '/api/trang-thai') {
    const s = await session(db, req, 'nv');
    const offices = await officeIPs(db, cfg, now);
    const o = { ok: true, ver: VER, demo, setup: isSetup, ten_cty: cfg.ten_cty, che_do: cfg.che_do, ip: cfg.hien_ip === '1' ? ip : null, ip_loai: ipKind(ip), wifi: matchOffice(ip, offices), co_ip_vp: offices.some(r => r.hieu_luc), now };
    if (s) {
      o.me = { ma: s.nv.ma, ten: s.nv.ten };
      const d0 = vnDayStart(now), m = vnParts(now);
      const mStart = Date.UTC(m.y, Number(m.m) - 1, 1) - VN;
      o.thang = (await punchesBetween(db, mStart, d0 + 864e5, s.nv.ma)).filter(r => !r.huy).map(r => ({ t: r.t, loai: r.loai, cach: r.cach }));
      o.me.ncc = !!s.nv.ncc; o.ket_noi = !!cfg.sync_key;
      o.don = (await db.prepare('SELECT so, loai, tu, den, so_ngay, ly_do, trang_thai, ly_do_tc, nguoi_duyet, ngay_duyet, ban_giao FROM don WHERE ma = ? ORDER BY tu DESC LIMIT 15').bind(s.nv.ma).all()).results;
      o.duyet = (await db.prepare("SELECT d.so, d.ma, n.ten, n.pb, d.loai, d.tu, d.den, d.so_ngay, d.ly_do, d.ban_giao, d.tao FROM don d LEFT JOIN nv n ON n.ma = d.ma WHERE d.duyet_ma = ? AND d.trang_thai = 'Chờ duyệt' ORDER BY d.tu LIMIT 30").bind(s.nv.ma).all()).results;
      const av = await db.prepare('SELECT at FROM anh WHERE ma = ?').bind(s.nv.ma).first(); o.me.anh = av ? av.at : 0;
      o.cong = (await db.prepare('SELECT ym, du_lieu, chot, xn, xn_at, phan_hoi FROM cong WHERE ma = ? ORDER BY ym DESC LIMIT ' + (demo ? 6 : 3)).bind(s.nv.ma).all()).results.map(r => ({ ...r, du_lieu: JSON.parse(r.du_lieu || '{}') }));
      const HS = await hsOf(db, s.nv.ma, demo); if (HS) { HS.hop_dong = (HS.hop_dong || []).map(h => ({ ...h, html: h.html ? 1 : 0 })); o.hs = HS; o.kho = (await db.prepare('SELECT id, kho, ref, ten, loai, size, at FROM kho_file WHERE ma = ? ORDER BY at DESC LIMIT 200').bind(s.nv.ma).all()).results; }
      const LC = lichCfg(cfg);
      if (LC && (LC.sx || []).includes(s.nv.ma)) { const t0 = isoVN(now), a = isoVN(now - 21 * 864e5), b = isoVN(now + 56 * 864e5);
        o.lich = { ky: LC.ky, mode: LC.mode, ca: LC.ca, kh: LC.kh, mo: LC.mode === 'nv' ? LC.mo.filter(k => k.han >= t0) : [], hom_nay: t0,
          d: (await db.prepare('SELECT ngay, ca FROM lich WHERE ma = ? AND ngay BETWEEN ? AND ? ORDER BY ngay').bind(s.nv.ma, a, b).all()).results,
          dk: (await db.prepare('SELECT ngay, ca, t FROM dk_ca WHERE ma = ? AND ngay >= ? ORDER BY ngay').bind(s.nv.ma, t0).all()).results }; }
      o.phieu = (await db.prepare('SELECT ym, du_lieu, xem_at, hoi FROM phieu WHERE ma = ? ORDER BY ym DESC LIMIT 12').bind(s.nv.ma).all()).results.map(r => ({ ym: r.ym, xem_at: r.xem_at, du_lieu: JSON.parse(r.du_lieu || '{}'), hoi: JSON.parse(r.hoi || '[]') }));
      o.cty = (o.hs && o.hs.cty) || cfg.ten_cty; // 11/11 15:32: tên công ty của chính người đăng nhập (bản thử có 2 công ty mẫu)
      if (demo) { const e = demoFind(s.nv.ma); if (e) { o.cty = e.cty; o.ho_so = { cty: e.cty, pb: e.pb, cd: e.cd, vao: e.vao, tt: e.tt, email: e.email, hd: e.hd, qp: e.qp, bl: e.bl }; o.don = o.don.concat(e.don.map(d => ({ ...d, mau: 1 }))).slice(0, 20);
        // công tạm tính tháng đang mở = ký hiệu trong dữ liệu mẫu + các ngày sau đó tính từ lượt chấm
        const ymNow = isoVN(now).slice(0, 7), tc = o.cong.find(c => c.ym === ymNow && c.du_lieu.tam);
        if (tc) { const dl = tc.du_lieu, ng = dl.ngay = dl.ngay || {}, by = {}, today = isoVN(now);
          o.thang.forEach(r => { const k = isoVN(r.t), x = by[k] = by[k] || {}; x[r.loai] = 1; if (r.loai === 'vao' && !x.tv) x.tv = r.t; if (r.loai === 'ra') x.tr = r.t; });
          Object.keys(by).forEach(k => { if (k <= DEMO.ref) return; const dd = k.slice(8, 10), b = by[k]; if (b.vao && b.ra) { if (ng[dd] !== 'X') { ng[dd] = 'X'; dl.cong = Math.round((dl.cong + 1) * 100) / 100; dl.huong = Math.round((dl.huong + 1) * 100) / 100; } const ct = dl.ct = dl.ct || {}; if (!ct[dd]) { const ti = vnHM(b.tv), to = vnHM(b.tr), h = Math.max(0, Math.min(8, (b.tr - b.tv) / 3600e3 - 1)); ct[dd] = [ti, to, Math.max(0, hm2min(ti) - 480), Math.max(0, 1020 - hm2min(to)), Math.round(h * 100) / 100, 0]; } } else if (k === today) ng[dd] = '…'; else ng[dd] = '?'; });
          tc.chot = now; } } }
    }
    return json(o);
  }

  if (p === '/api/cai-dat-lan-dau' && req.method === 'POST') {
    if (isSetup) return bad('Đã cài đặt rồi.', 409);
    const pin = String(body.pin || ''), ten = String(body.ten_cty || '').trim().slice(0, 120);
    if (!/^\d{6,12}$/.test(pin)) return bad('Mã PIN quản lý cần 6–12 chữ số.');
    if (!ten) return bad('Nhập tên đơn vị.');
    const salt = randHex(16);
    await setCfg(db, { ql_pin: await hashPin(pin, salt), ql_salt: salt, qr_secret: randHex(32), ten_cty: ten });
    return json({ ok: true }, 200, { 'set-cookie': await newSession(db, 'ql', null, req) });
  }

  if (p === '/api/dang-nhap' && req.method === 'POST') {
    const ma = String(body.ma || '').trim().toUpperCase(), pin = String(body.pin || '');
    const nv = await db.prepare('SELECT * FROM nv WHERE ma = ?').bind(ma).first();
    if (!nv || !nv.active || !nv.pin) return bad('Sai mã nhân viên hoặc mã PIN.', 401);
    if (nv.lock_until > now) return bad('Nhập sai nhiều lần. Thử lại sau ' + Math.ceil((nv.lock_until - now) / 60e3) + ' phút hoặc nhờ kế toán mở khóa.', 429);
    if (await hashPin(pin, nv.salt) !== nv.pin) {
      if (demo) return bad('Sai mã PIN. Bản thử: mã PIN của mọi tài khoản mẫu là ' + DEMO_PIN + '.', 401);
      const f = nv.fail + 1;
      await db.prepare('UPDATE nv SET fail = ?, lock_until = ? WHERE ma = ?').bind(f >= 5 ? 0 : f, f >= 5 ? now + 15 * 60e3 : 0, ma).run();
      return bad('Sai mã nhân viên hoặc mã PIN.', 401);
    }
    await db.prepare('UPDATE nv SET fail = 0, lock_until = 0 WHERE ma = ?').bind(ma).run();
    await noteDevice(db, req, ma, 'dn');
    return json({ ok: true }, 200, { 'set-cookie': await newSession(db, 'nv', ma, req) });
  }

  if (p === '/api/dang-nhap-ql' && req.method === 'POST') {
    if (demo) return json({ ok: true });
    if (!isSetup) return bad('Chưa cài đặt.', 409);
    const lock = Number(cfg.ql_lock || 0);
    if (lock > now) return bad('Nhập sai nhiều lần. Thử lại sau ' + Math.ceil((lock - now) / 60e3) + ' phút.', 429);
    if (await hashPin(String(body.pin || ''), cfg.ql_salt) !== cfg.ql_pin) {
      const f = Number(cfg.ql_fail || 0) + 1;
      await setCfg(db, f >= 5 ? { ql_fail: 0, ql_lock: now + 15 * 60e3 } : { ql_fail: f });
      return bad('Sai mã PIN quản lý.', 401);
    }
    await setCfg(db, { ql_fail: 0, ql_lock: 0 });
    return json({ ok: true }, 200, { 'set-cookie': await newSession(db, 'ql', null, req) });
  }

  if (p === '/api/dang-xuat' && req.method === 'POST') {
    const vai = ['nv', 'ql', 'tram'].includes(body.vai) ? body.vai : 'nv';
    const tok = cookies(req)[COOKIE[vai]];
    if (tok) await db.prepare('DELETE FROM phien WHERE tok = ?').bind(await sha256(tok)).run();
    return json({ ok: true }, 200, { 'set-cookie': setCookie(COOKIE[vai], '', 0) });
  }

  if (p === '/api/qr' && req.method === 'POST') {
    if (await verifyQR(cfg.qr_secret, String(body.t || ''), now)) return json({ ok: true, pass: await makePass(cfg.qr_secret, now), het: now + PASS_MS });
    const s = await session(db, req, 'nv');
    await logReject(db, s ? s.nv.ma : null, ip, 'Quét mã QR đã đổi (quá 30 giây)', req);
    return json({ ok: false, loi: 'Mã QR này đã đổi. Hãy quét mã đang hiện ở trang Mã QR chấm công (mã đổi mỗi 30 giây).' }, 403);
  }

  if (p === '/api/cham' && req.method === 'POST') {
    const s = await session(db, req, 'nv');
    if (!s) return bad('Phiên đăng nhập đã hết. Đăng nhập lại.', 401);
    const loai = body.loai === 'ra' ? 'ra' : 'vao';
    const offices = await officeIPs(db, cfg, now);
    const wifi = matchOffice(ip, offices);
    const hasQR = !!(body.pass || body.t), qrOk = hasQR && (body.pass ? await verifyPass(cfg.qr_secret, body.pass, now) : await verifyQR(cfg.qr_secret, String(body.t), now));
    let ok, lyDo = '';
    if (cfg.che_do === 'chi_wifi') ok = wifi;
    else if (cfg.che_do === 'chi_qr') ok = qrOk;
    else ok = wifi || qrOk;
    if (!ok) {
      if (hasQR && !qrOk) lyDo = 'Lượt quét QR không còn hiệu lực (quá 2 phút hoặc mã không đúng). Hãy quét lại mã đang hiện ở trang Mã QR chấm công.';
      else if (cfg.che_do === 'chi_qr') lyDo = 'Đơn vị đang dùng chế độ chỉ chấm bằng QR. Hãy quét mã ở trang Mã QR chấm công.';
      else if (!offices.some(r => r.hieu_luc)) lyDo = 'Chưa có IP văn phòng. Hãy mở trang Mã QR chấm công (hoặc nhờ kế toán thêm IP văn phòng) rồi thử lại.';
      else lyDo = 'Không nhận ra mạng Wi-Fi văn phòng (' + ipKind(ip) + '). Hãy bắt Wi-Fi văn phòng' + (cfg.che_do === 'chi_wifi' ? '' : ' hoặc quét Mã QR chấm công đặt ở văn phòng') + '.';
      await logReject(db, s.nv.ma, ip, (hasQR ? (qrOk ? 'QR hợp lệ' : 'QR quá 2 phút') : 'Không có QR') + ' · ' + (wifi ? 'IP khớp' : 'IP không khớp') + ' · chế độ ' + cfg.che_do, req);
      return json({ ok: false, loi: lyDo, ip: cfg.hien_ip === '1' ? ip : null }, 403);
    }
    const last = await db.prepare('SELECT t, loai FROM cham WHERE ma = ? AND huy = 0 AND t <= ? ORDER BY t DESC LIMIT 1').bind(s.nv.ma, now).first();
    if (last && last.loai === loai && now - last.t < DUP_MS) return json({ ok: true, trung: true, t: last.t, loai, cach: qrOk ? 'qr' : 'wifi' });
    const cach = wifi ? 'wifi' : 'qr';
    await db.prepare('INSERT INTO cham (ma, t, loai, cach, ip, wifi, tb, may) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(s.nv.ma, now, loai, cach, ip, wifi ? 1 : 0, shortUA(req.headers.get('user-agent')), req.may || null).run();
    await noteDevice(db, req, s.nv.ma, 'cham');
    return json({ ok: true, t: now, loai, cach });
  }

  /* ----- 0.3.1: nhân viên gửi / hủy đơn nghỉ, xác nhận công tháng ----- */
  if (p === '/api/don' && req.method === 'POST') {
    const s = await session(db, req, 'nv'); if (!s) return bad('Phiên đăng nhập đã hết. Đăng nhập lại.', 401);
    if (body.huy) { const r = await db.prepare("UPDATE don SET trang_thai = 'Đã hủy', cap_nhat = ? WHERE so = ? AND ma = ? AND trang_thai = 'Chờ duyệt'").bind(now, String(body.huy), s.nv.ma).run(); return r.meta.changes ? json({ ok: true }) : bad('Chỉ hủy được đơn đang chờ duyệt.'); }
    const LOAI = ['Nghỉ phép năm', 'Nghỉ việc riêng có lương', 'Nghỉ ốm', 'Nghỉ thai sản', 'Nghỉ không lương'];
    const loai = LOAI.includes(body.loai) ? body.loai : null, tu = String(body.tu || ''), den = String(body.den || body.tu || ''), ly = String(body.ly_do || '').trim().slice(0, 300);
    if (!loai) return bad('Chọn loại nghỉ.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tu) || !/^\d{4}-\d{2}-\d{2}$/.test(den) || den < tu) return bad('Chọn ngày nghỉ (đến ngày không trước từ ngày).');
    if (den > isoVN(now + 366 * 864e5) || tu < isoVN(now - 62 * 864e5)) return bad('Ngày nghỉ chỉ trong khoảng 2 tháng trước đến 1 năm tới.');
    const trung = await db.prepare("SELECT so FROM don WHERE ma = ? AND trang_thai IN ('Chờ duyệt','Đã duyệt') AND tu <= ? AND den >= ?").bind(s.nv.ma, den, tu).first();
    if (trung) return bad('Đã có đơn ' + trung.so + ' trùng ngày.');
    const so = 'DT-' + isoVN(now).replace(/-/g, '').slice(2) + '-' + randHex(2).toUpperCase(), HS = await hsOf(db, s.nv.ma, demo);
    let bg = ''; const bgm = String(body.ban_giao || '').trim().toUpperCase(); if (bgm) { if (bgm === s.nv.ma) return bad('Người nhận bàn giao phải là người khác.'); const x = await db.prepare('SELECT ma, ten FROM nv WHERE ma = ? AND active = 1').bind(bgm).first(); if (!x) return bad('Không tìm thấy người nhận bàn giao.'); bg = x.ma + '|' + x.ten; }
    await db.prepare("INSERT INTO don (so, ma, loai, tu, den, ly_do, tao, trang_thai, nguoi_duyet, duyet_ma, ban_giao, nguon, cap_nhat) VALUES (?, ?, ?, ?, ?, ?, ?, 'Chờ duyệt', ?, ?, ?, 'Điện thoại', ?)").bind(so, s.nv.ma, loai, tu, den, ly, now, (HS && HS.ql_ten) || '', (HS && HS.ql) || null, bg, now).run();
    return json({ ok: true, so });
  }
  /* ----- 11/11 15:32: quản lý trực tiếp duyệt đơn trên app · sơ đồ tổ chức · ảnh đại diện · đổi mã PIN ----- */
  if (p === '/api/duyet-don' && req.method === 'POST') {
    const s = await session(db, req, 'nv'); if (!s) return bad('Phiên đăng nhập đã hết. Đăng nhập lại.', 401);
    const so = String(body.so || ''), ok = !!body.dong_y, ly = String(body.ly_do || '').trim().slice(0, 300); if (!ok && !ly) return bad('Ghi lý do từ chối để nhân viên biết.');
    const r = await db.prepare("UPDATE don SET trang_thai = ?, nguoi_duyet = ?, ngay_duyet = ?, ly_do_tc = ?, cap_nhat = ? WHERE so = ? AND duyet_ma = ? AND trang_thai = 'Chờ duyệt'").bind(ok ? 'Đã duyệt' : 'Từ chối', s.nv.ten, isoVN(now), ok ? null : ly, now, so, s.nv.ma).run();
    return r.meta.changes ? json({ ok: true }) : bad('Đơn này đã được xử lý hoặc không thuộc quyền duyệt của anh/chị.');
  }
  if (p === '/api/to-chuc') {
    const s = await session(db, req, 'nv'); if (!s) return bad('Phiên đăng nhập đã hết. Đăng nhập lại.', 401);
    const me = await hsOf(db, s.nv.ma, demo), cty = me && me.cty, by = {};
    for (const r of (await db.prepare('SELECT ma, du_lieu FROM ho_so').all()).results) { try { const d = JSON.parse(r.du_lieu); by[r.ma] = d; } catch (e) { } }
    if (demo) for (const c of DEMO.cty) for (const e of c.ds) if (!by[e.ma] && e.hs) by[e.ma] = e.hs;
    const act = {}; (await db.prepare('SELECT ma FROM nv WHERE active = 1').all()).results.forEach(x => { act[x.ma] = 1; });
    const av = {}; (await db.prepare('SELECT ma, at FROM anh').all()).results.forEach(x => { av[x.ma] = x.at; });
    const list = Object.keys(by).filter(ma => act[ma] && (!cty || by[ma].cty === cty)).map(ma => { const d = by[ma]; return { ma, ten: d.ten, pb: d.pb, cd: d.cd, cv: d.cv || '', ql: d.ql || '', truong: d.truong ? 1 : 0, anh: av[ma] || 0 }; });
    return json({ ok: true, cty: cty || cfg.ten_cty, list });
  }
  if (p === '/api/anh') {
    const s = await session(db, req, 'nv'); if (!s) return new Response('Phiên đăng nhập đã hết', { status: 401 });
    const r = await db.prepare('SELECT data FROM anh WHERE ma = ?').bind(String(url.searchParams.get('ma') || '').toUpperCase()).first(); if (!r) return new Response('', { status: 404 });
    return new Response(Uint8Array.from(atob(r.data), c => c.charCodeAt(0)), { headers: { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=86400', 'x-content-type-options': 'nosniff' } });
  }
  if (p === '/api/anh-dai-dien' && req.method === 'POST') {
    const s = await session(db, req, 'nv'); if (!s) return bad('Phiên đăng nhập đã hết. Đăng nhập lại.', 401);
    if (demo) return bad(DEMO_NO);
    if (body.xoa) { await db.prepare('DELETE FROM anh WHERE ma = ?').bind(s.nv.ma).run(); return json({ ok: true }); }
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data || '')); if (!m || m[1].length > 160000) return bad('Ảnh không hợp lệ hoặc quá lớn.');
    await db.prepare('INSERT INTO anh (ma, data, at) VALUES (?, ?, ?) ON CONFLICT(ma) DO UPDATE SET data = excluded.data, at = excluded.at').bind(s.nv.ma, m[1], now).run(); return json({ ok: true, at: now });
  }
  if (p === '/api/doi-pin' && req.method === 'POST') {
    const s = await session(db, req, 'nv'); if (!s) return bad('Phiên đăng nhập đã hết. Đăng nhập lại.', 401);
    if (demo) return bad('Bản thử dùng chung mã PIN 123456 cho mọi người nên không đổi được. Khi triển khai riêng cho công ty, nhân viên tự đổi mã PIN ở đây.');
    const cu = String(body.cu || ''), moi = String(body.moi || ''); if (!/^\d{4,8}$/.test(moi)) return bad('Mã PIN mới 4–8 chữ số.');
    const nv = await db.prepare('SELECT pin, salt FROM nv WHERE ma = ?').bind(s.nv.ma).first(); if (!nv || await hashPin(cu, nv.salt) !== nv.pin) return bad('Mã PIN hiện tại chưa đúng.');
    const salt = randHex(16); await db.prepare('UPDATE nv SET pin = ?, salt = ? WHERE ma = ?').bind(await hashPin(moi, salt), salt, s.nv.ma).run(); return json({ ok: true });
  }
  /* ----- 0.4.2: nhân viên xem hợp đồng, file kho của chính mình ----- */
  if (p === '/api/hop-dong') {
    const s = await session(db, req, 'nv'); if (!s) return bad('Phiên đăng nhập đã hết. Đăng nhập lại.', 401);
    const HS = await hsOf(db, s.nv.ma, demo), i = +url.searchParams.get('i'), h = HS && (HS.hop_dong || [])[i]; if (!h || !h.html) return bad('Chưa có nội dung hợp đồng này trên máy chủ.');
    return json({ ok: true, so: h.so, loai: h.loai, html: h.html });
  }
  if (p === '/api/kho-file') {
    const s = await session(db, req, 'nv'); if (!s) return new Response('Phiên đăng nhập đã hết', { status: 401 });
    const f = await db.prepare('SELECT ten, loai, data FROM kho_file WHERE id = ? AND ma = ?').bind(String(url.searchParams.get('id') || ''), s.nv.ma).first(); if (!f) return new Response('Không tìm thấy file', { status: 404 });
    const bin = Uint8Array.from(atob(f.data), c => c.charCodeAt(0)), safe = /^(application\/pdf|image\/(png|jpeg|webp|gif))$/.test(f.loai || '') ? f.loai : 'application/octet-stream';
    return new Response(bin, { headers: { 'content-type': safe, 'content-disposition': (safe === 'application/octet-stream' ? 'attachment' : 'inline') + "; filename*=UTF-8''" + encodeURIComponent(f.ten || 'file'), 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" } });
  }
  /* ----- 0.4.2: nhân viên khối sản xuất đăng ký ca trong kỳ đang mở (trước hạn đăng ký) ----- */
  if (p === '/api/dang-ky-ca' && req.method === 'POST') {
    const s = await session(db, req, 'nv'); if (!s) return bad('Phiên đăng nhập đã hết. Đăng nhập lại.', 401);
    const LC = lichCfg(cfg), t0 = isoVN(now); if (!LC || LC.mode !== 'nv' || !(LC.sx || []).includes(s.nv.ma)) return bad('Đơn vị chưa mở đăng ký lịch làm cho anh/chị.');
    const d = body.d || {}, st = []; let n = 0;
    for (const iso of Object.keys(d).slice(0, 62)) {
      if (!ISO_RE.test(iso)) continue; const k = LC.mo.find(x => x.a <= iso && iso <= x.b && x.han >= t0); if (!k) return bad('Ngày ' + iso.slice(8) + '/' + iso.slice(5, 7) + ' không thuộc kỳ đang mở đăng ký hoặc đã quá hạn.');
      const code = String(d[iso] || '').slice(0, 40); if (!lichCodeOk(LC, code)) return bad('Ca "' + code + '" không có trong thiết lập của đơn vị.'); const cf = lichConf(LC, code); if (cf) return bad('Ngày ' + iso.slice(8) + '/' + iso.slice(5, 7) + ': ' + cf + ' – bỏ bớt 1 ca.');
      st.push(code ? db.prepare('INSERT INTO dk_ca (ma, ngay, ca, ky, t) VALUES (?, ?, ?, ?, ?) ON CONFLICT(ma, ngay) DO UPDATE SET ca = excluded.ca, ky = excluded.ky, t = excluded.t').bind(s.nv.ma, iso, code, k.key, now) : db.prepare('DELETE FROM dk_ca WHERE ma = ? AND ngay = ?').bind(s.nv.ma, iso)); n++;
    }
    if (st.length) await db.batch(st); return json({ ok: true, n });
  }
  if (p === '/api/phieu-xem' && req.method === 'POST') {
    const s = await session(db, req, 'nv'); if (!s) return bad('Phiên đăng nhập đã hết. Đăng nhập lại.', 401);
    await db.prepare('UPDATE phieu SET xem_at = ? WHERE ym = ? AND ma = ? AND xem_at IS NULL').bind(now, String(body.ym || ''), s.nv.ma).run();
    return json({ ok: true });
  }
  if (p === '/api/phieu-hoi' && req.method === 'POST') {
    const s = await session(db, req, 'nv'); if (!s) return bad('Phiên đăng nhập đã hết. Đăng nhập lại.', 401);
    const ym = String(body.ym || ''), dong = String(body.dong || '').trim().slice(0, 120), nd = String(body.noi_dung || '').trim().slice(0, 300);
    if (!nd) return bad('Ghi rõ thắc mắc để kế toán kiểm tra.');
    const row = await db.prepare('SELECT hoi FROM phieu WHERE ym = ? AND ma = ?').bind(ym, s.nv.ma).first(); if (!row) return bad('Không có phiếu lương tháng này.');
    const a = JSON.parse(row.hoi || '[]'); if (a.length >= 20) return bad('Đã gửi nhiều câu hỏi – liên hệ trực tiếp kế toán.');
    a.push({ t: now, dong, nd });
    await db.prepare('UPDATE phieu SET hoi = ? WHERE ym = ? AND ma = ?').bind(JSON.stringify(a), ym, s.nv.ma).run();
    return json({ ok: true });
  }
  if (p === '/api/xac-nhan-cong' && req.method === 'POST') {
    const s = await session(db, req, 'nv'); if (!s) return bad('Phiên đăng nhập đã hết. Đăng nhập lại.', 401);
    const ym = String(body.ym || ''), dong_y = !!body.dong_y, ph = String(body.phan_hoi || '').trim().slice(0, 500);
    if (!dong_y && !ph) return bad('Ghi rõ ngày nào sai, sai thế nào để kế toán kiểm tra.');
    const r = await db.prepare('UPDATE cong SET xn = ?, xn_at = ?, phan_hoi = ? WHERE ym = ? AND ma = ?').bind(dong_y ? 1 : 2, now, ph, ym, s.nv.ma).run();
    return r.meta.changes ? json({ ok: true }) : bad('Không có công tháng này.');
  }

  /* ----- màn hình chung ----- */
  if (p === '/api/tram/kich-hoat' && req.method === 'POST') {
    if (!await sess('ql')) return bad('Cần đăng nhập quản lý.', 401);
    if (demo) return json({ ok: true });
    return json({ ok: true }, 200, { 'set-cookie': await newSession(db, 'tram', null, req) });
  }
  if (p === '/api/tram') {
    const s = await sess('tram');
    if (!s) return bad('Trang Mã QR chấm công chưa kích hoạt trên thiết bị này.', 401);
    if (ip) {
      const row = await db.prepare('SELECT last FROM ip_vp WHERE ip = ?').bind(ip).first();
      if (!row) await db.prepare("INSERT INTO ip_vp (ip, nguon, first, last) VALUES (?, 'tram', ?, ?)").bind(ip, now, now).run();
      else if (now - row.last > 60e3) await db.prepare('UPDATE ip_vp SET last = ? WHERE ip = ?').bind(now, ip).run();
      if (now - Number(cfg.tram_last || 0) > 60e3) await setCfg(db, { tram_last: now, tram_ip: ip });
    }
    const w = Math.floor(now / QR_STEP);
    const link = url.origin + '/q?t=' + await qrToken(cfg.qr_secret, w);
    const d0 = vnDayStart(now);
    const list = (await punchesBetween(db, d0, d0 + 864e5)).filter(r => !r.huy);
    const byNv = {};
    list.forEach(r => { const o = byNv[r.ma] || (byNv[r.ma] = { ma: r.ma, ten: r.ten || r.ma, luot: [] }); o.luot.push({ t: r.t, loai: r.loai, cach: r.cach }); });
    const vuaCham = list.filter(r => now - r.t < 90e3 && r.t <= now).slice(-3).reverse().map(r => ({ ten: r.ten || r.ma, t: r.t, loai: r.loai, cach: r.cach }));
    const nvCount = (await db.prepare('SELECT COUNT(*) AS n FROM nv WHERE active = 1').first()).n;
    return json({ ok: true, demo, ten_cty: cfg.ten_cty, che_do: cfg.che_do, ip, ip_loai: ipKind(ip), now, het_han: (w + 1) * QR_STEP, qr: cfg.che_do === 'chi_wifi' ? null : qrSvg(link), hom_nay: Object.values(byNv).sort((a, b) => b.luot[b.luot.length - 1].t - a.luot[a.luot.length - 1].t), vua_cham: vuaCham, so_nv: nvCount, ...(env.DEV === '1' ? { _link: link } : {}) });
  }

  /* ----- quản lý ----- */
  if (p.startsWith('/api/ql/')) {
    if (!await sess('ql')) return bad('Cần đăng nhập quản lý.', 401);
    const r = p.slice(8);
    if (demo && (r === 'cfg' || r === 'xoa-du-lieu' || (r === 'nv' && !(body.go_thiet_bi || body.mo_khoa) && req.method === 'POST'))) return bad(DEMO_NO, 403);
    if (r === 'tong-quan') {
      const ngay = String(url.searchParams.get('ngay') || '');
      let d0 = vnDayStart(now);
      const mm = ngay.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (mm) d0 = Date.UTC(+mm[3], +mm[2] - 1, +mm[1]) - VN;
      const [nv, cham, tc, ph] = await Promise.all([
        db.prepare('SELECT ma, ten, active, lock_until, pb, ncc, nguon, (pin IS NOT NULL) AS co_pin FROM nv ORDER BY ma').all(),
        punchesBetween(db, d0, d0 + 864e5),
        db.prepare('SELECT * FROM tu_choi ORDER BY t DESC LIMIT 100').all(),
        db.prepare("SELECT ma, tb, last FROM phien WHERE vai = 'nv'").all()
      ]);
      const tb = {}; ph.results.forEach(x => { (tb[x.ma] = tb[x.ma] || []).push(x.tb + ' (' + fmtShort(x.last) + ')'); });
      const ips = await officeIPs(db, cfg, now);
      const may_chung = await sharedDevices(db);
      const { ql_pin, ql_salt, qr_secret, ql_fail, ql_lock, schema_v, sync_key, ...pub } = cfg; pub.ket_noi = !!sync_key;
      return json({ ok: true, demo, ngay0: d0, now, ip, ip_loai: ipKind(ip), wifi: matchOffice(ip, ips), cfg: pub, nv: nv.results.map(x => ({ ...x, thiet_bi: tb[x.ma] || [], khoa: x.lock_until > now })), cham, tu_choi: tc.results, ip_vp: ips, may_chung, may_toi: req.may });
    }
    if (r === 'nv' && req.method === 'POST') {
      const ma = String(body.ma || '').trim().toUpperCase(), ten = String(body.ten || '').trim().slice(0, 120);
      if (!/^[A-Z0-9._-]{1,20}$/.test(ma)) return bad('Mã nhân viên chỉ gồm chữ, số, dấu chấm, gạch (tối đa 20 ký tự).');
      const old = await db.prepare('SELECT ma FROM nv WHERE ma = ?').bind(ma).first();
      if (body.pin !== undefined && body.pin !== '' && !/^\d{4,8}$/.test(String(body.pin))) return bad('Mã PIN nhân viên cần 4–8 chữ số.');
      if (!old) {
        if (!ten) return bad('Nhập họ tên.');
        if (!body.pin) return bad('Đặt mã PIN ban đầu cho nhân viên.');
        const salt = randHex(16);
        await db.prepare('INSERT INTO nv (ma, ten, pin, salt, active, created) VALUES (?, ?, ?, ?, 1, ?)').bind(ma, ten, await hashPin(String(body.pin), salt), salt, now).run();
      } else {
        if (ten) await db.prepare('UPDATE nv SET ten = ? WHERE ma = ?').bind(ten, ma).run();
        if (body.pin) { const salt = randHex(16); await db.prepare('UPDATE nv SET pin = ?, salt = ?, fail = 0, lock_until = 0 WHERE ma = ?').bind(await hashPin(String(body.pin), salt), salt, ma).run(); }
        if (body.active !== undefined) await db.prepare('UPDATE nv SET active = ? WHERE ma = ?').bind(body.active ? 1 : 0, ma).run();
        if (body.mo_khoa) await db.prepare('UPDATE nv SET fail = 0, lock_until = 0 WHERE ma = ?').bind(ma).run();
      }
      if (body.go_thiet_bi || body.pin || body.active === false) await db.prepare("DELETE FROM phien WHERE vai = 'nv' AND ma = ?").bind(ma).run();
      return json({ ok: true });
    }
    if (r === 'ip' && req.method === 'POST') {
      if (body.xoa) { await db.prepare('DELETE FROM ip_vp WHERE ip = ?').bind(String(body.xoa)).run(); return json({ ok: true }); }
      const v = String(body.ip || ip).trim();
      if (!/^[0-9a-fA-F:.]{2,45}$/.test(v)) return bad('IP không hợp lệ.');
      await db.prepare("INSERT INTO ip_vp (ip, nguon, first, last) VALUES (?, 'tay', ?, ?) ON CONFLICT(ip) DO UPDATE SET nguon = 'tay', last = excluded.last").bind(v, now, now).run();
      return json({ ok: true });
    }
    if (r === 'cfg' && req.method === 'POST') {
      const o = {};
      if (['wifi_hoac_qr', 'chi_wifi', 'chi_qr'].includes(body.che_do)) o.che_do = body.che_do;
      if (body.ip_gio !== undefined) o.ip_gio = Math.min(24 * 30, Math.max(1, Number(body.ip_gio) || 72));
      if (body.hien_ip !== undefined) o.hien_ip = body.hien_ip ? '1' : '0';
      if (body.ten_cty) o.ten_cty = String(body.ten_cty).trim().slice(0, 120);
      if (body.pin_moi) {
        if (!/^\d{6,12}$/.test(String(body.pin_moi))) return bad('Mã PIN quản lý cần 6–12 chữ số.');
        const salt = randHex(16); o.ql_pin = await hashPin(String(body.pin_moi), salt); o.ql_salt = salt;
      }
      if (body.doi_qr) o.qr_secret = randHex(32);
      let maKetNoi = null; if (body.tao_ma_ket_noi) { maKetNoi = 'QTT-' + randHex(12).toUpperCase(); o.sync_key = await sha256(maKetNoi); o.sync_at = String(now); }
      if (Object.keys(o).length) await setCfg(db, o);
      if (body.pin_moi) await db.prepare("DELETE FROM phien WHERE vai = 'ql'").run();
      return json({ ok: true, dang_xuat: !!body.pin_moi, ma_ket_noi: maKetNoi });
    }
    if (r === 'cham' && req.method === 'POST') {
      if (body.huy) { await db.prepare('UPDATE cham SET huy = ?, ghi = COALESCE(ghi, \'\') || ? WHERE id = ?').bind(body.khoi_phuc ? 0 : 1, body.khoi_phuc ? '' : ' [Hủy ' + fmtShort(now) + ']', Number(body.huy)).run(); return json({ ok: true }); }
      const ma = String(body.ma || '').toUpperCase(), m1 = String(body.ngay || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/), m2 = String(body.gio || '').match(/^(\d{1,2}):(\d{2})$/);
      if (!m1 || !m2) return bad('Ngày dạng dd/mm/yyyy, giờ dạng HH:MM.');
      if (!String(body.ghi || '').trim()) return bad('Ghi lý do chấm bổ sung (vd: quên chấm, có xác nhận của quản lý).');
      if (!await db.prepare('SELECT ma FROM nv WHERE ma = ?').bind(ma).first()) return bad('Không có nhân viên này.');
      const t = Date.UTC(+m1[3], +m1[2] - 1, +m1[1], +m2[1], +m2[2]) - VN;
      await db.prepare("INSERT INTO cham (ma, t, loai, cach, ip, wifi, tb, ghi, nguoi) VALUES (?, ?, ?, 'tay', ?, 0, ?, ?, 'Quản lý')").bind(ma, t, body.loai === 'ra' ? 'ra' : 'vao', ip, shortUA(req.headers.get('user-agent')), String(body.ghi).trim().slice(0, 200)).run();
      return json({ ok: true });
    }
    if (r === 'xuat') {
      const th = String(url.searchParams.get('thang') || '').match(/^(\d{2})\/(\d{4})$/);
      if (!th) return bad('Tháng dạng mm/yyyy.');
      const from = Date.UTC(+th[2], +th[1] - 1, 1) - VN, to = Date.UTC(+th[2], +th[1], 1) - VN;
      const rows = await punchesBetween(db, from, to);
      const esc = v => { v = v === null || v === undefined ? '' : String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      const CACH = { wifi: 'Wi-Fi', qr: 'QR', tay: 'Nhập tay' };
      const shared = {}; (await sharedDevices(db)).forEach(d => { if (!d.bo_qua) shared[d.may] = d.nv; });
      const lines = [['Mã NV', 'Họ tên', 'Ngày', 'Giờ', 'Loại', 'Cách chấm', 'IP', 'Thiết bị', 'Mã máy', 'Cảnh báo', 'Ghi chú', 'Trạng thái'].join(',')];
      rows.forEach(x => {
        const q = vnParts(x.t), sh = x.may && shared[x.may] ? shared[x.may].filter(o => o.ma !== x.ma) : [];
        lines.push([x.ma, x.ten || '', q.d + '/' + q.m + '/' + q.y, q.h + ':' + q.mi + ':' + q.s, x.loai === 'ra' ? 'Ra' : 'Vào', CACH[x.cach] || x.cach, x.ip, x.tb, x.may ? x.may.slice(0, 6) : '', sh.length ? 'Máy dùng chung với ' + sh.map(o => o.ma).join(', ') : '', x.ghi, x.huy ? 'Đã hủy' : 'Hợp lệ'].map(esc).join(','));
      });
      return new Response('﻿' + lines.join('\r\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="Cham_cong_' + th[2] + '_' + th[1] + '.csv"', 'cache-control': 'no-store' } });
    }
    if (r === 'may' && req.method === 'POST') {
      const may = String(body.may || '');
      if (!/^[0-9a-f]{12,32}$/.test(may)) return bad('Mã máy không hợp lệ.');
      if (body.bat_lai) await db.prepare('DELETE FROM may_bo_qua WHERE may = ?').bind(may).run();
      else await db.prepare('INSERT INTO may_bo_qua (may, ghi, t) VALUES (?, ?, ?) ON CONFLICT(may) DO UPDATE SET ghi = excluded.ghi, t = excluded.t').bind(may, String(body.ghi || '').trim().slice(0, 200) || 'Đã kiểm tra', now).run();
      return json({ ok: true });
    }
    if (r === 'xoa-du-lieu' && req.method === 'POST') {
      if (body.xac_nhan !== 'XOA') return bad('Gõ XOA để xác nhận.');
      await db.batch([db.prepare('DELETE FROM cham'), db.prepare('DELETE FROM tu_choi')]);
      return json({ ok: true });
    }
  }
  return bad('Không có địa chỉ này.', 404);
}
function fmtShort(t) { const q = vnParts(t); return q.h + ':' + q.mi + ' ' + q.d + '/' + q.m; }

/* ---------- trang ---------- */
const MANIFEST = JSON.stringify({ name: 'Chấm công', short_name: 'Chấm công', start_url: '/', scope: '/', display: 'standalone', background_color: '#F4EFE5', theme_color: '#2F7D4F', icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png' }, { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }] });
function b64ToBytes(b64) { const s = atob(b64), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
const SEC = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY', 'permissions-policy': 'camera=(), microphone=(), geolocation=()' };

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    let may = cookies(req).qtt_may, newMay = false;
    if (!/^[0-9a-f]{16}$/.test(may || '')) { may = randHex(8); newMay = true; }
    req.may = may;
    const withMay = res => { if (newMay) res.headers.append('set-cookie', 'qtt_may=' + may + '; Path=/; Max-Age=' + (2 * 365 * 864e2) + '; HttpOnly; Secure; SameSite=Lax'); return res; };
    try {
      if (url.pathname.startsWith('/api/')) return withMay(await api(req, env, url));
      if (url.pathname === '/manifest.webmanifest') return new Response(MANIFEST, { headers: { 'content-type': 'application/manifest+json', 'cache-control': 'max-age=3600' } });
      if (url.pathname === '/icon.png') return new Response(b64ToBytes(ICON_PNG_B64), { headers: { 'content-type': 'image/png', 'cache-control': 'max-age=86400' } });
      if (url.pathname === '/icon.svg') return new Response(ICON_SVG, { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'max-age=86400' } });
      if (/^\/phan-mem\/?$/.test(url.pathname) && isDemo(env, url)) return new Response(HRM_HTML, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' } });
      if (/^\/og-(ql|nv)\.jpg$/.test(url.pathname) && isDemo(env, url)) return new Response(b64ToBytes(url.pathname === '/og-ql.jpg' ? OG_QL_B64 : OG_NV_B64), { headers: { 'content-type': 'image/jpeg', 'cache-control': 'max-age=86400' } });
      const ROUTES = { '/': 'nv', '/q': 'q', '/tram': 'tram', '/quan-ly': 'ql' };
      const route = ROUTES[url.pathname.replace(/\/+$/, '') || '/'];
      if (!route) return new Response('Không có trang này', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
      let html = APP_HTML.replace('{{ROUTE}}', route).replace(/{{VER}}/g, VER);
      // 08/11: thẻ chia sẻ (tiêu đề + ảnh) khi dán link bản chạy thử lên Facebook/Zalo – chỉ ở bản thử, máy chủ của công ty không có
      if (isDemo(env, url) && (route === 'ql' || route === 'nv')) {
        const og = route === 'ql'
          ? { t: 'Trang quản lý chấm công – bản chạy thử', d: 'Thiết lập mạng Wi‑Fi văn phòng, xem lượt chấm của nhân viên. Dữ liệu mẫu, dùng thử miễn phí – Quản trị tử tế.', i: '/og-ql.jpg', u: '/quan-ly' }
          : { t: 'Chấm công trên điện thoại – bản chạy thử', d: 'Bắt Wi‑Fi văn phòng là chấm được, không cài ứng dụng. Chọn tài khoản mẫu để thử ngay – Quản trị tử tế.', i: '/og-nv.jpg', u: '/' };
        const o = url.origin;
        html = html.replace('<title>Chấm công</title>', '<title>' + og.t + '</title>\n<meta name="description" content="' + og.d + '">\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="Quản trị tử tế">\n<meta property="og:title" content="' + og.t + '">\n<meta property="og:description" content="' + og.d + '">\n<meta property="og:url" content="' + o + og.u + '">\n<meta property="og:image" content="' + o + og.i + '?v=0811">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:locale" content="vi_VN">\n<meta name="twitter:card" content="summary_large_image">');
      }
      return withMay(new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...SEC } }));
    } catch (e) {
      return json({ ok: false, loi: 'Lỗi máy chủ: ' + (e && e.message || e) }, 500);
    }
  }
};
