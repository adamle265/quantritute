import { previewToolUpdate } from '../../../src/mailer.js';
import fs from 'fs';
const tool = { id: 9, slug: 'quan-ly-nhan-su', name: 'Phần mềm quản lý nhân sự', status: 'ok', visible: 1, version: 'Bản 0.3.1',
  url: '/quan-ly-nhan-su/', changelog: '0.3.1 | 08/11/2026 | A1; A2\n0.2.1 | 07/11/2026 | B1; B2\n0.1.1 | 06/11/2026 | C1', upd_sent_ver: '', upd_sent_at: 0 };
const st = { prepare: sql => ({ bind() { return this; }, async first(c) { if (/FROM tools/.test(sql)) return tool; return c ? 0 : null; }, async all() { return { results: /FROM settings/.test(sql) ? [{ key: 'site_url', value: 'https://quantritute.com' }] : [] }; }, async run() {} }) };
const env = { DB: st };
const text = fs.readFileSync(new URL('../noi-dung.txt', import.meta.url), 'utf8');
const r0 = await previewToolUpdate(env, 9);
console.log('SUBJ', r0.subjectDefault); console.log('DRAFT\n' + r0.draft);
const r = await previewToolUpdate(env, 9, '', { subject: 'Thử', text });
fs.writeFileSync(new URL('./xem.html', import.meta.url), r.html); console.log('html', r.html.length, r.subject);
