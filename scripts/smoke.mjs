import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {migrate} from './migrate.mjs';
import {reads,read,mutate,mutations,add,resolve,date,questions,tables} from './lib/domain.mjs';
import {importSalesforce} from './lib/import.mjs';
import {parseCsv} from './lib/csv.mjs';
import {page,table} from './lib/render.mjs';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'licensing-test-'));
process.env.DATA_DIR=path.join(tmp,'db');process.env.OUTPUT_DIR=path.join(tmp,'output');process.env.DATABASE_URL='';
let admin,schema,db,passed=0;
const today=new Date().toISOString().slice(0,10);
const later=(n)=>new Date(Date.now()+n*86400000).toISOString().slice(0,10);
const check=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
const tx=async(fn,rollback=false)=>{await db.exec('BEGIN');try{const out=await fn();await db.exec(rollback?'ROLLBACK':'COMMIT');return out;}catch(e){await db.exec('ROLLBACK');throw e;}};
const m=(cmd,term,f={})=>tx(()=>mutate(db,cmd,term,{actor:'Test officer',...f}));
const fail=async(name,fn,re)=>{await assert.rejects(fn,re);passed++;console.log('PASS '+name);};
const cli=(args,expected=0)=>{const p=spawnSync(process.execPath,args,{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});assert.equal(p.status,expected,p.stdout+p.stderr);return p;};
try{
 if(process.env.TEST_DATABASE_URL){
  const {default:pg}=await import('pg');admin=new pg.Client({connectionString:process.env.TEST_DATABASE_URL});await admin.connect();schema='test_'+randomUUID().replaceAll('-','');await admin.query(`create schema ${schema}`);
  const u=new URL(process.env.TEST_DATABASE_URL);u.searchParams.set('options',`-c search_path=${schema}`);process.env.DATABASE_URL=u.toString();
 }
 db=await getDb();await migrate(db);assert.equal((await migrate(db)).ran.length,0);
 const seed=fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8');await db.exec(seed);await db.exec(seed);
 check('idempotent seed',()=>{});assert.equal((await db.query('select * from applications')).length,5);
 for(const cmd of Object.keys(reads)){assert(Array.isArray(await read(db,cmd)));passed++;}
 assert.equal((await read(db,'decision-ready'))[0].code,'APP-103');
 assert.equal((await read(db,'insights')).length,10);passed++;
 assert.equal((await read(db,'application','app-101')).application.code,'APP-101');passed++;
 assert.equal((await resolve(db,'applicants','ridge community')).code,'ORG-103');
 const p=await resolve(db,'applicants','ORG-101');assert.equal((await resolve(db,'applicants',p.id.slice(0,12))).id,p.id);
 await fail('ambiguous names list candidates',()=>resolve(db,'applicants','harbour'),/Ambiguous.*\nORG-101[\s\S]*ORG-102/);
 check('CSV quotes BOM and multiline',()=>assert.deepEqual(parseCsv('\ufeffA,B\r\n"one,two","hello\n""world"""\r\n'),[{A:'one,two',B:'hello\n"world"'}]));
 check('invalid dates and CSV rejected',()=>{assert.throws(()=>date('2026-02-30'));assert.throws(()=>parseCsv('A,a\n1,2'));assert.throws(()=>parseCsv('a,b\n1'));assert.throws(()=>parseCsv('a\n"unterminated'));});
 const importDir=path.join(tmp,'imports');fs.cpSync(path.join(REPO_ROOT,'examples/salesforce'),importDir,{recursive:true});
 await tx(()=>importSalesforce(db,importDir,'Importer'),true);assert.equal((await db.query('select * from import_rows')).length,0);passed++;
 assert.equal((await tx(()=>importSalesforce(db,importDir,'Importer'))).inserted,3);
 assert.equal((await tx(()=>importSalesforce(db,importDir,'Importer'))).unchanged,3);passed++;
 assert.equal((await resolve(db,'applications','SF-APP-1')).status,'open');assert.equal((await resolve(db,'permit_types','SF-TYPE-1')).configured,false);passed++;
 fs.appendFileSync(path.join(importDir,'applications.csv'),'SF-APP-2,MISSING,SF-TYPE-1,Invalid owner,Jules,2026-10-01,2026-10-30,Open\n');
 const beforeCount=(await db.query('select * from applicants')).length;
 fs.appendFileSync(path.join(importDir,'applicants.csv'),'SF-ORG-2,Rollback example,Jules,2027-10-01\n');
 await fail('failed linked import rolls back the whole folder',()=>tx(()=>importSalesforce(db,importDir,'Importer')),/No applicants match/);
 assert.equal((await db.query('select * from applicants')).length,beforeCount);
 fs.cpSync(path.join(REPO_ROOT,'examples/salesforce'),importDir,{recursive:true});
 const file=path.join(importDir,'applications.csv');const original=fs.readFileSync(file,'utf8');fs.writeFileSync(file,original.replace('Coastal summer','Changed summer'));
 await fail('changed source cannot overwrite local history',()=>tx(()=>importSalesforce(db,importDir,'Importer')),/Changed source row/);
 fs.writeFileSync(file,original+original.split('\n')[1]+'\n');await fail('duplicate source IDs fail',()=>tx(()=>importSalesforce(db,importDir,'Importer')),/Duplicate source ID/);fs.writeFileSync(file,original);
 fs.writeFileSync(path.join(importDir,'unknown.csv'),'id\n1');await fail('unknown reports fail',()=>tx(()=>importSalesforce(db,importDir,'Importer')),/Unsupported CSV/);fs.unlinkSync(path.join(importDir,'unknown.csv'));
 const addFile=path.join(tmp,'new.json');fs.writeFileSync(addFile,JSON.stringify({code:'APP-X',applicant:'ORG-101',type:'TYPE-1',name:'<script>alert(1)</script>',owner:'Lee',received_on:today,target_on:later(10)}));
 await m('add','applications',{file:addFile});
 await fail('unknown fields fail',()=>tx(()=>add(db,'applicants',{code:'X',name:'X',owner:'X',retention_review_on:later(10),status:'approved'},'Tester')),/Unknown field/);
 for(const [entity,input] of [
 ['applicants',{code:'ORG-X',name:'New applicant',owner:'Lee',retention_review_on:later(10)}],
 ['permit_types',{code:'TYPE-X',name:'New policy',authority:'Demo authority'}],
 ['requirements',{code:'REQ-X',type:'TYPE-X',name:'Plan'}],
 ['evidence',{code:'EV-X',application:'APP-101',requirement:'REQ-2',document_ref:'demo:plan'}],
 ['inspections',{code:'IN-X',application:'APP-X',name:'Site check',inspector:'Lee',due_on:today}],
 ['conditions',{code:'COND-X',licence:'LIC-101',name:'Site tidy check',owner:'Lee',review_on:today}]
 ]){await tx(()=>add(db,entity,input,'Tester'));passed++;}
 await fail('cross-type evidence rejected',()=>tx(()=>add(db,'evidence',{code:'EV-WRONG',application:'APP-101',requirement:'REQ-X',document_ref:'demo:wrong'},'Tester')),/another permit type/);
 await m('configure-type','TYPE-X',{reference:'demo:reviewed-policy',days:'90'});
 await fail('policy revision requires new type',()=>m('configure-type','TYPE-X',{reference:'changed'}),/frozen/);
 await fail('requirements frozen after configuration',()=>tx(()=>add(db,'requirements',{code:'REQ-Y',type:'TYPE-X',name:'Changed'},'Tester')),/frozen/);
 await fail('empty policy cannot configure',()=>m('configure-type','TYPE-2',{reference:'test'}),/at least one/);
 await m('verify-applicant','ORG-102',{checked:today,reference:'demo:checked',review:later(365)});
 await fail('future checks rejected',()=>m('verify-applicant','ORG-102',{checked:later(1),reference:'demo:future',review:later(365)}),/future/);
 await m('check-evidence','EV-X',{result:'accepted',checked:today,reference:'demo:plan-checked'});
 await m('complete-inspection','IN-101',{result:'pass',completed:today,reference:'demo:inspection'});
 assert((await read(db,'decision-ready')).some(x=>x.code==='APP-101'));passed++;
 const decision={outcome:'approved',decided:today,reference:'demo:officer-decision',reason:'Officer reviewed original evidence','officer-confirmed':true};
 await fail('gaps block approval record',()=>m('record-decision','APP-102',decision),/blocked/);
 await fail('officer confirmation required',()=>m('record-decision','APP-103',{...decision,'officer-confirmed':undefined}),/officer-confirmed/);
 await fail('missing decision source rejected',()=>m('record-decision','APP-103',{...decision,reference:''}),/Missing reference/);
 await m('record-decision','APP-103',decision);
 await fail('duplicate decision rejected',()=>m('record-decision','APP-103',decision),/not open/);
 await fail('closed evidence cannot change',()=>m('check-evidence','EV-104',{result:'rejected',checked:today,reference:'demo:bad'}),/not open/);
 await fail('unapproved licence rejected',()=>m('record-licence','APP-102',{code:'LIC-X',issued:today,expires:later(365),reference:'demo:x'}),/No recorded approval/);
 await m('record-licence','APP-103',{code:'LIC-103',issued:today,expires:later(365),reference:'demo:licence103'});
 await fail('licence dates constrained',()=>m('record-licence','APP-103',{code:'LIC-104',issued:today,expires:later(-1),reference:'demo:wrong'}),/constraint|duplicate/);
 await m('record-decision','APP-X',{...decision,outcome:'refused',reason:'Recorded officer refusal'});
 await m('record-decision','APP-105',{...decision,outcome:'withdrawn',reason:'Recorded withdrawal'});
 await m('satisfy-condition','COND-101',{reference:'demo:condition-proof'});
 await m('log','APP-101',{note:'Applicant supplied the revised plan.'});
 const exp=await read(db,'export',null,{});assert.equal(Object.keys(exp.records).length,tables.length);assert(exp.records.audit_events.length>=15);assert.equal(exp.records.import_rows.length,3);passed++;
 const backup=path.join(tmp,'backup.json');await read(db,'export',null,{out:backup});assert(fs.existsSync(backup));
 for(const cmd of ['weekly-review','draft-evidence','draft-decision']){const {file}=await read(db,cmd,'APP-101',{});assert(fs.readFileSync(file,'utf8').includes('DRAFT'));passed++;}
 check('HTML escapes untrusted record text',()=>{const html=page({title:'<script>x</script>',sections:[{title:'<img>',html:table([{name:'<script>alert(1)</script>'}])}]});assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));});
 assert.equal(questions.length,10);
 await db.close();db=null;
 const out=JSON.parse(cli(['scripts/desk.mjs','applications','--json']).stdout);assert(out.some(x=>x.code==='APP-101'));passed++;
 assert.match(cli(['scripts/desk.mjs','application','harbour'],1).stderr,/Ambiguous/);
 assert.match(cli(['scripts/desk.mjs','applications','--surprise'],1).stderr,/Unknown flag/);
 assert.match(cli(['scripts/desk.mjs','unknown'],1).stderr,/Unknown command/);
 const imp=JSON.parse(cli(['scripts/desk.mjs','import','salesforce',`--dir=${importDir}`,'--actor=Importer','--dry-run','--json']).stdout);assert.equal(imp.unchanged,3);assert(imp.dry_run);passed++;
 cli(['scripts/view.mjs']);cli(['scripts/docs.mjs']);
 const rendered=fs.readFileSync(path.join(process.env.OUTPUT_DIR,'views/week.html'),'utf8');assert(rendered.includes('Harbour Licensing Desk'));assert(rendered.includes('Licensing desk'));passed++;
 const docs=fs.readdirSync(path.join(process.env.OUTPUT_DIR,'docs-out/application-pack'));assert(docs.some(x=>x.startsWith('app-x')));
 const xhtml=fs.readFileSync(path.join(process.env.OUTPUT_DIR,'docs-out/application-pack',docs.find(x=>x.startsWith('app-x'))),'utf8');assert(!xhtml.includes('<script>'));assert(xhtml.includes('&lt;script&gt;'));passed++;
 console.log(`PASS ${passed} checks; ${Object.keys(reads).length} read commands, ${mutations.length} mutation commands, ten insights, atomic import, drafts, exports and HTML.`);
}finally{if(db)await db.close();if(admin){await admin.query(`drop schema ${schema} cascade`);await admin.end();}fs.rmSync(tmp,{recursive:true,force:true});}
