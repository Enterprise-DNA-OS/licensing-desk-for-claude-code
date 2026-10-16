#!/usr/bin/env node
import {getDb} from './lib/db.mjs';
import {reads,read,mutate,mutations,human} from './lib/domain.mjs';
import {importSalesforce} from './lib/import.mjs';
const args=process.argv.slice(2),f={},pos=[];
for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');const k=i<0?a.slice(2):a.slice(2,i);if(k in f)throw Error('Duplicate flag '+k);f[k]=i<0?true:a.slice(i+1);}else pos.push(a);}
const [cmd,term]=pos;
const flagSets={
 add:['file','actor'],'configure-type':['reference','days','actor'],'verify-applicant':['checked','reference','review','actor'],
 'check-evidence':['result','checked','reference','actor'],'complete-inspection':['result','completed','reference','actor'],
 'record-decision':['outcome','decided','reference','reason','actor','officer-confirmed'],'record-licence':['code','issued','expires','reference','actor'],
 'satisfy-condition':['reference','actor'],log:['note','actor'],import:['dir','actor','dry-run'],export:['out']
};
if(!cmd||f.help){console.log('Licensing desk: '+[...Object.keys(reads),'application','insights',...mutations,'import salesforce','export','weekly-review','draft-evidence','draft-decision'].join(', ')+'\nUse --json for machine output. See docs/cli.md for arguments.');process.exit(0);}
let db;
try{
 if(pos.length>2)throw Error('Too many positional arguments; quote values and use --key=value');
 for(const k of Object.keys(f))if(!['json',...(flagSets[cmd]||[])].includes(k))throw Error('Unknown flag --'+k);
 for(const [k,v] of Object.entries(f))if(v===true&&!['json','dry-run','officer-confirmed'].includes(k))throw Error('Flag --'+k+' requires a value');
 if(f['dry-run']!==undefined&&f['dry-run']!==true)throw Error('--dry-run takes no value');
 db=await getDb();await db.exec('BEGIN');let result;
 if(cmd==='import'){if(term!=='salesforce')throw Error('Use import salesforce');result=await importSalesforce(db,f.dir,f.actor);}
 else result=mutations.includes(cmd)?await mutate(db,cmd,term,f):await read(db,cmd,term,f);
 await db.exec(f['dry-run']?'ROLLBACK':'COMMIT');if(f['dry-run'])result={...result,dry_run:true};
 console.log(f.json?JSON.stringify(result,null,2):human(result));
}catch(e){if(db)await db.exec('ROLLBACK').catch(()=>{});console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
