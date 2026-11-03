const E=require('../src/engine.js');
// danh sách: mua vào nhiều người bán, có số trùng nhau giữa người bán
const rows=[
 {so:'123',kh:'C26TAA',mst:'0101111111'},{so:'123',kh:'C26TBB',mst:'0102222222'},
 {so:'45',kh:'K26TDV',mst:'0103333333'},{so:'7',kh:'C26MHD',mst:'0104444444'},
 {so:'1001',kh:'C26TCC',mst:'0105555555'},{so:'88',kh:'C26TDD',mst:'0106666666'}
].map((r,i)=>Object.assign(r,{i,item:null}));
const names=['1C26TAA_00000123.pdf','HD_C26TBB-123_0102222222.pdf','20261015_K26TDV_00000045_CONG-TY-ABC.pdf',
 '0104444444_7.pdf','invoice_1001.pdf','abc.pdf','1C26TAA_00000123 (1).pdf','HoaDon_2026-10-15_so_88.pdf'];
const items=names.map((n,id)=>({id,name:n,keysName:E.extractKeys(n.replace(/\.pdf$/i,''),false)}));
const by=E.buildIndex(rows);
E.matchPass(rows,items,by,'name');
items.forEach(it=>console.log(it.name.padEnd(48),it.status,it.level||'',it.row!=null?rows[it.row].so+' '+rows[it.row].kh:'',it.why||'',it.amb||''));
// text pass
const t='HOA DON GIA TRI GIA TANG Ký hiệu (Serial): 1C26TDD Số (No.): 00000088 Ngày 15 tháng 10 năm 2026 Mã số thuế: 0106666666 Tổng tiền 1.234.000';
const k=E.extractKeys(t,true); console.log([...k.labeled],[...k.khs],[...k.msts]);
items[5].keysText=k; items[7].keysText=E.extractKeys('HOA DON Ky hieu C26TDD So: 88 MST 0106666666',true); E.textPass(rows,items,by); console.log(items[5].status,items[5].level,items[5].why, items[5].row);
