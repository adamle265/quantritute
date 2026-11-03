import { ensureStudioSchema } from '../../src/studio-schema.js';
const done=new Set(['_mig_studio_v1']); let n=0; const keys=[];
for (let i=2;i<=18;i++) done.add('_mig_studio_v'+i); ['_mig_studio_v91','_mig_studio_v14b','_mig_studio_v13b','_mig_studio_v7b'].forEach(k=>done.add(k));
const DB={prepare(sql){const o={sql,args:[],bind(...a){o.args=a;return o},async first(){const m=sql.match(/key = '([^']+)'/);return m&&done.has(m[1])?'1':null}};return o},
 async batch(st){n+=st.length; st.forEach(x=>{const m=x.sql.match(/VALUES \('(_mig_[^']+)'/); if(m) keys.push(m[1]); if(/caption = \?4/.test(x.sql)&&x.args[0]==='v20'&&x.args[1]==='tiktok') console.log('v20 tiktok:',x.args[3].slice(0,60))})}};
await ensureStudioSchema({DB}); console.log('statements',n,'keys',keys.join(','));
