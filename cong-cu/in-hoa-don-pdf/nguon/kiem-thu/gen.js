const {PDFDocument,StandardFonts}=require('pdf-lib');const fs=require('fs');
const E=require('../src/engine.js');
(async()=>{ fs.rmSync('big',{recursive:true,force:true}); fs.mkdirSync('big/pdf',{recursive:true});
 const sellers=[];for(let i=0;i<60;i++)sellers.push(['01'+String(10000000+i*7919).slice(-8),'C26T'+String.fromCharCode(65+i%26)+String.fromCharCode(65+(i*7)%26)]);
 const head=['STT','Ký hiệu hóa đơn','Số hóa đơn','Ngày lập','MST người bán','Tên người bán'];const rows=[];
 for(let i=0;i<2000;i++){const s=sellers[i%60];const n=1000+i*13%7000+Math.floor(i/60);rows.push([i+1,s[1],n,'15/10/2026',s[0],'CONG TY '+i]);
  const doc=await PDFDocument.create();const f=await doc.embedFont(StandardFonts.Helvetica);const p=doc.addPage([595,842]);
  ['HOA DON GTGT','Ky hieu: 1'+s[1],'So: '+String(n).padStart(8,'0'),'Ma so thue: '+s[0],'Tong tien: 1.000.000'].forEach((t,k)=>p.drawText(t,{x:50,y:780-k*20,size:11,font:f}));
  if(i%2) p.drawText('trang them',{x:50,y:500,size:9,font:f});
  const name=i%2? 'Scan_'+String(i).padStart(5,'0')+'.pdf' : '1'+s[1]+'_'+String(n).padStart(8,'0')+'.pdf';
  fs.writeFileSync('big/pdf/'+name,await doc.save());}
 // xáo thứ tự danh sách so với tên file
 fs.writeFileSync('big/ds.xlsx',E.writeXlsx([{name:'DS',head,rows}]));
 console.log(fs.readdirSync('big/pdf').length);
})();
