/* ===== Dữ liệu mẫu (giả lập hoàn toàn): shop "Đốm Sáng", 2 tháng ===== */
function makeSample(){
  let seed=20261104; const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
  const P=[
    {sku:'1800000000000000101',name:'Trà thảo mộc Đốm Sáng',vari:'1 Hộp',price:159000,cost:38000},
    {sku:'1800000000000000102',name:'Trà thảo mộc Đốm Sáng',vari:'Combo 2 Hộp',price:299000,cost:null},
    {sku:'1800000000000000103',name:'Trà thảo mộc Đốm Sáng',vari:'Combo 3 Hộp',price:429000,cost:38000},
    {sku:'1800000000000000201',name:'Bình giữ nhiệt Đốm Sáng 500ml',vari:'Mặc định',price:249000,cost:72000},
    {sku:'1800000000000000301',name:'Sổ tay Quản trị tử tế',vari:'1 Cuốn',price:99000,cost:21000},
    {sku:'1800000000000000302',name:'Combo Trà thảo mộc & Bình giữ nhiệt',vari:'Mặc định',price:379000,cost:null}
  ];
  const W=[3,1,1,2,3,1];
  const pickP=()=>{let t=W.reduce((a,b)=>a+b,0),r=rnd()*t;for(let i=0;i<P.length;i++){r-=W[i];if(r<=0)return P[i];}return P[0];};
  const dt=(d,h,m)=>pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()+' '+pad(h)+':'+pad(m)+':'+pad(Math.floor(rnd()*60));
  const dtf=(d,h)=>pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()+' '+pad(h)+':15:00';
  const iso=d=>d.getFullYear()+'/'+pad(d.getMonth()+1)+'/'+pad(d.getDate());
  const orders=[],income=[],wallet=[]; let n=0;
  const start=new Date(2026,7,1), endD=new Date(2026,8,30), lastIncome=new Date(2026,8,30);
  for(let d=new Date(start);d<=endD;d.setDate(d.getDate()+1)){
    const k=1+Math.floor(rnd()*3);
    for(let j=0;j<k;j++){
      n++; const id=String(580000000000000000+n*7919);
      const p=pickP(), q=rnd()<0.12?2:1, bef=p.price*q, sd=rnd()<0.15?Math.round(bef*0.05/1000)*1000:0, pd=rnd()<0.3?Math.round(bef*0.1/100)*100:0;
      const r=rnd(); let st='Đã hoàn tất',ct='',deliv=null,canc=null,rq=0,cls='success';
      const dDel=new Date(d);dDel.setDate(dDel.getDate()+2+Math.floor(rnd()*3));
      if(r<0.08){st='Đã hủy';ct='Cancel';cls='cancel';canc=new Date(d);canc.setDate(canc.getDate()+3);}
      else if(r<0.105){ct='Return/Refund';cls='return';deliv=dDel;rq=q;}
      else{deliv=dDel; if(dDel>endD){st='Đã vận chuyển';deliv=null;cls='ship';}}
      if(n===37){ct='Return/Refund';cls='return';deliv=dDel;rq=1;}
      const created=dt(d,8+Math.floor(rnd()*13),Math.floor(rnd()*60));
      orders.push({id,status:st,sub:st,ctype:ct,sku:p.sku,ssku:'',name:p.name,vari:p.vari,qty:String(q),rqty:String(rq),unit:String(p.price),bef:String(bef),pdisc:String(pd),sdisc:String(sd),amt:String(bef-sd-pd),refund:rq?String(bef-sd):'',created,shipped:(deliv||cls==='ship')?dtf(new Date(d.getTime()+86400000),10):'',tracking:(deliv||cls==='ship')?'SPXVN06'+String(n*7919).padStart(8,'0'):'',carrier:(deliv||cls==='ship')?'SPX Express':'',delivered:deliv?dt(deliv,9+Math.floor(rnd()*9),Math.floor(rnd()*60)):'',cancelled:canc?dt(canc,10,5):'',cby:canc?'Người mua':'',reason:'',channel:rnd()<0.5?'Videos':'LIVE',pay:'Thanh toán khi giao hàng'});
      if(n===37){orders.push({...orders[orders.length-1],sku:P[4].sku,name:P[4].name,vari:P[4].vari,qty:'1',rqty:'0',unit:String(P[4].price),bef:String(P[4].price),pdisc:'0',sdisc:'0'});}
      const rev=bef-sd+(n===37?P[4].price:0);
      const sdt=new Date(deliv||canc||d);sdt.setDate(sdt.getDate()+(cls==='cancel'?4:3));
      if(cls==='ship'||sdt>lastIncome)continue;
      const parts={'phí giao dịch':-Math.round(rev*0.0605),'phí hoa hồng của tiktok shop':-Math.round(rev*0.1265),'phí vận chuyển của người bán':0,'hoa hồng liên kết':rnd()<0.25?-Math.round(rev*0.03):0,'phí xử lý đơn hàng':-3000,'thuế gtgt do tiktok shop khấu trừ':0,'thuế tncn do tiktok shop khấu trừ':0};
      if(cls==='cancel'){
        income.push({idA:id,key:id,type:'Đơn hàng',cdate:toDate(created),sdate:toDate(iso(sdt)),settle:0,rev:0,gross:bef-sd,refundSub:-(bef-sd),fee:0,pdisc:0,paid:0,parts:{}});
        if(rnd()<0.6){const f=-34200;const oo=orders.find(x=>x.id===id);if(oo){oo.shipped=dtf(new Date(d.getTime()+86400000),10);oo.tracking='SPXVN06'+String(n*7919).padStart(8,'0');oo.carrier='SPX Express';oo.cby='Hệ thống';}income.push({idA:id,key:id,type:'Đơn hàng',cdate:toDate(created),sdate:toDate(iso(new Date(sdt.getTime()+86400000))),settle:f,rev:0,gross:0,refundSub:0,fee:f,pdisc:0,paid:0,parts:{'phí vận chuyển của người bán':f}});}
        continue;
      }
      if(cls==='return'&&rq===q&&n!==37){
        const fee=-3000-34200;
        income.push({idA:id,key:id,type:'Đơn hàng',cdate:toDate(created),sdate:toDate(iso(sdt)),settle:fee,rev:0,gross:bef-sd,refundSub:-(bef-sd),fee,pdisc:pd,paid:0,parts:{'phí xử lý đơn hàng':-3000,'phí vận chuyển của người bán':-34200}});
        continue;
      }
      const refundSub=n===37?-(bef-sd):0, revNet=rev+refundSub;
      for(const k2 in parts)if(k2!=='phí xử lý đơn hàng')parts[k2]=Math.round(parts[k2]*revNet/rev);
      const fee=Object.values(parts).reduce((a,b)=>a+b,0);
      income.push({idA:id,key:id,type:'Đơn hàng',cdate:toDate(created),sdate:toDate(iso(sdt)),settle:revNet+fee,rev:revNet,gross:rev,refundSub,fee,pdisc:pd,paid:bef-sd-pd,parts});
    }
  }
  income.forEach((r,i)=>{r.fid=2;r.file='Income-mau-T8-T9.xlsx';r.sig='s'+i;});
  // ví: tiền vào ví theo ngày quyết toán; rút tiền mỗi thứ Hai
  const byDay={}; income.forEach(r=>{byDay[r.sdate]=(byDay[r.sdate]||0)+r.settle;});
  let bal=1250000, ref=3690000000000000000n;
  Object.keys(byDay).sort().forEach(dd=>{
    ref+=1013n; if(byDay[dd])wallet.push({ref:String(ref),type:'earnings',rawType:'Earnings',amount:byDay[dd],status:'transferred',date:dd,bank:'/'});
    bal+=byDay[dd]; const wd=new Date(dd+'T00:00:00');
    if(wd.getDay()===1&&bal>500000){ref+=7n;const amt=Math.floor(bal/1000)*1000;wallet.push({ref:String(ref),type:'withdrawal',rawType:'Withdrawal',amount:-amt,status:'transferred',date:dd,bank:'********6868'});bal-=amt;}
  });
  const mkSheet=(name,type,label,rows)=>({name,state:'visible',declared:'A1',actual:'',cells:0,hiddenRows:0,type,label,headerRow:1,rows,skipped:0});
  const files=[
    {id:1,name:'Don-hang-mau-T8-T9.xlsx',size:1,sheets:[mkSheet('OrderSKUList','order','Đơn hàng (OrderSKUList)',orders.length)],orders,income:[],wallet:[],reports:[],cost:[],kinds:['Đơn hàng (OrderSKUList)'],error:null,precision:0},
    {id:2,name:'Income-mau-T8-T9.xlsx',size:2,sheets:[mkSheet('Chi tiết đơn hàng','income','Income – Chi tiết đơn hàng',income.length),mkSheet('Lịch sử rút tiền','wallet','Income – Lịch sử rút tiền (ví)',wallet.length)],orders:[],income,wallet,reports:[],cost:[],kinds:['Income – Chi tiết đơn hàng','Income – Lịch sử rút tiền (ví)'],error:null,precision:0}
  ];
  const cost={}; P.forEach(p=>{if(p.cost!=null)cost[p.sku]={cost:p.cost};});
  cost[P[5].sku]={cost:null,parts:[{sku:P[0].sku,q:1},{sku:P[3].sku,q:1}]};
  return {files,cost,opening:1250000};
}
