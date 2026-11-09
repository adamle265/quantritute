const N = process.argv[2]; process.chdir(N);
global.fflate = require(N + '/vendor/fflate.umd.js');
const HR = require(N + '/src/core.js'); global.HR = HR; const HRR = require(N + '/src/rules.js');
const path = require('path'); const { scanDir } = require(N + '/tao-du-lieu-mau.js');
const r = scanDir(path.join(N, 'du-lieu-mau', 'Du_lieu_nhan_su_Dom_Sang_Edu'), () => {});
const unit = { id: 'u1', name: 'Edu', data: r.data }, R = '2026-11-09';
const ids = r.data.NV.map(e => e['Mã NV']);
r.data.NV[1]['Loại lao động'] = 'Bán thời gian'; r.data.NV[1]['Số sổ BHXH'] = '';
r.data.NV[5]['Loại lao động'] = 'Cộng tác viên';
const hd = r.data.HD.find(h => h['Mã NV'] === r.data.NV[3]['Mã NV']); if (hd) { hd['Loại hợp đồng'] = 'Hợp đồng cộng tác viên'; }
unit.wf = { cong: { '2026-10': { [ids[0]]: { xn: 2, at: '01/11/2026 09:00', ph: 'Ngày 15 em đi làm, sao ghi vắng?' }, [ids[4]]: { xn: 1 } } } };
const al = HRR.alerts(unit, R, {});
al.filter(a => /ld_hd|bhxh_pt|ctv_hd|cong_sai/.test(a.kind)).forEach(a => console.log('[' + a.level + '] ' + a.kind + ' ' + a.id + ': ' + a.title));
console.log('tổng', al.length, 'NV1', r.data.NV[1]['Mã NV'], 'NV2', r.data.NV[2]['Mã NV'], 'NV3', r.data.NV[3]['Mã NV']);
const by = HRR.contractsOf(r.data); ['DS003','DS004'].forEach(id => { const c = HRR.currentContract(by[id] || [], HR.dnum(R)); console.log(id, r.data.NV.find(e=>e['Mã NV']===id)['Trạng thái'], c && c['Loại hợp đồng'], (r.data.CC['2026-10']||[]).filter(x=>x['Mã NV']===id).length); });
