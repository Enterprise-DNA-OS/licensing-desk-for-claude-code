import fs from 'node:fs';
import path from 'node:path';
import {REPO_ROOT} from './db.mjs';
import {table} from './format.mjs';
export const tables=['applicants','permit_types','requirements','applications','evidence','inspections','decisions','licences','conditions','notes','audit_events','import_rows'];
export const required=(v,k)=>{if(v===undefined||v===null||String(v).trim()==='')throw Error(`Missing ${k}`);return String(v).trim();};
export function date(v){v=required(v,'date');if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T00:00:00Z'))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error(`Invalid calendar date: ${v}`);return v;}
export function past(v){v=date(v);if(v>new Date().toISOString().slice(0,10))throw Error('Check or decision cannot be future dated');return v;}
export async function resolve(db,entity,term){
 if(!tables.includes(entity)||['audit_events','import_rows','decisions','notes'].includes(entity))throw Error(`Unknown entity ${entity}`);
 required(term,'record');
 const found=await db.query(`select * from ${entity} where lower(code)=lower($1) or id::text=$1`,[term]);
 if(found.length===1)return found[0];
 const rows=await db.query(`select * from ${entity} where id::text like $1 or lower(code) like lower($1) ${['applicants','permit_types','requirements','applications','inspections','conditions'].includes(entity)?'or lower(name) like lower($2)':''} order by code`,[''+term+'%',...(['applicants','permit_types','requirements','applications','inspections','conditions'].includes(entity)?['%'+term+'%']:[])]);
 if(rows.length!==1)throw Error(rows.length?`Ambiguous ${entity}:\n${rows.map(x=>x.code+' '+(x.name||'')+' '+x.id).join('\n')}`:`No ${entity} match: ${term}`);return rows[0];
}
export async function audit(db,action,entity,before,after,actor){await db.query('insert into audit_events(action,entity,record_id,actor,before_row,after_row) values($1,$2,$3,$4,$5,$6)',[action,entity,after?.id||before?.id||null,actor,before?JSON.stringify(before):null,after?JSON.stringify(after):null]);}
export async function openApplication(db,id){const [a]=await db.query('select * from applications where id=$1 for update',[id]);if(!a||a.status!=='open')throw Error('Application is not open; create a new application for subsequent work');return a;}
export const fields={
 applicants:{required:['code','name','owner','retention_review_on'],optional:[],dates:['retention_review_on']},
 permit_types:{required:['code','name','authority'],optional:[]},
 requirements:{required:['code','type','name'],optional:[],links:{type:['permit_types','type_id']}},
 applications:{required:['code','applicant','type','name','owner','received_on','target_on'],optional:[],dates:['received_on','target_on'],links:{applicant:['applicants','applicant_id'],type:['permit_types','type_id']}},
 evidence:{required:['code','application','requirement','document_ref'],optional:['expires_on'],dates:['expires_on'],links:{application:['applications','application_id'],requirement:['requirements','requirement_id']}},
 inspections:{required:['code','application','name','inspector','due_on'],optional:[],dates:['due_on'],links:{application:['applications','application_id']}},
 conditions:{required:['code','licence','name','owner','review_on'],optional:[],dates:['review_on'],links:{licence:['licences','licence_id']}}
};
export async function add(db,entity,input,actor){
 const spec=fields[entity];if(!spec)throw Error('Cannot add '+entity);
 const allowed=[...spec.required,...spec.optional];for(const k of Object.keys(input))if(!allowed.includes(k))throw Error('Unknown field '+k);
 const row={};for(const k of spec.required)row[k]=required(input[k],k);for(const k of spec.optional)if(input[k]!==undefined&&input[k]!=='')row[k]=input[k];
 for(const k of spec.dates||[])if(row[k])row[k]=date(row[k]);
 for(const [k,[t,dest]] of Object.entries(spec.links||{})){row[dest]=(await resolve(db,t,row[k])).id;delete row[k];}
 if(entity==='applications')past(row.received_on);
 if(entity==='evidence'||entity==='inspections'){
  const a=await openApplication(db,row.application_id);
  if(entity==='evidence'){const [req]=await db.query('select * from requirements where id=$1',[row.requirement_id]);if(req.type_id!==a.type_id)throw Error('Requirement belongs to another permit type');}
 }
 if(entity==='requirements'){
  const [t]=await db.query('select * from permit_types where id=$1 for update',[row.type_id]);if(t.configured)throw Error('Configured requirements are frozen; create a new permit type for a policy revision');
 }
 const cols=Object.keys(row);const [created]=await db.query(`insert into ${entity}(${cols.join(',')}) values(${cols.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(row));
 await audit(db,'add',entity,null,created,actor);return created;
}
export const reads={
 applicants:'select code,name,owner,verified_on,retention_review_on from applicants order by code',
 types:'select code,name,authority,configured,policy_ref,freshness_days from permit_types order by code',
 requirements:'select r.code,t.code permit_type,r.name from requirements r join permit_types t on t.id=r.type_id order by r.code',
 applications:'select code,name,applicant,permit_type,owner,status,target_on from application_readiness order by target_on,code',
 'intake-queue':"select code,name,applicant,owner,age_days,days_left from application_readiness where status='open' order by received_on,code",
 'evidence-due':"select g.application,g.requirement,g.finding,a.owner,a.target_on from evidence_gaps g join applications a on a.id=g.application_id where a.status='open' and finding<>'Complete' order by a.target_on,g.requirement",
 inspections:'select i.code,a.code application,i.name,i.inspector,i.due_on,i.outcome,i.report_ref from inspections i join applications a on a.id=i.application_id order by due_on,i.code',
 'inspection-week':"select i.code,a.code application,i.inspector,i.due_on,i.outcome from inspections i join applications a on a.id=i.application_id where a.status='open' and i.outcome<>'pass' and i.due_on<=CURRENT_DATE+7 order by i.due_on,i.code",
 'decision-ready':"select code,applicant,permit_type,owner,target_on from application_readiness where status='open' and evidence_gaps=0 and inspection_gaps=0 and not policy_gap and not applicant_gap order by target_on,code",
 decisions:'select a.code application,d.outcome,d.decided_on,d.actor,d.decision_ref,d.reason from decisions d join applications a on a.id=d.application_id order by decided_on,a.code',
 licences:'select * from renewal_queue order by expires_on,code',
 'renewals-due':'select code,applicant,permit_type,owner,expires_on,days_left,open_conditions from renewal_queue where days_left<=60 order by expires_on,code',
 conditions:'select c.code,l.code licence,c.name,c.owner,c.review_on,c.status,c.evidence_ref from conditions c join licences l on l.id=c.licence_id order by review_on,c.code',
 'conditions-due':"select c.code,l.code licence,c.name,c.owner,c.review_on from conditions c join licences l on l.id=c.licence_id where c.status='open' and c.review_on<=CURRENT_DATE+7 order by review_on,c.code",
 attention:'select * from attention_queue order by due_on,record,issue',
 workload:"select owner,count(*)::integer open_applications,count(*) filter(where target_on<CURRENT_DATE)::integer overdue_targets,sum(evidence_gaps)::integer evidence_gaps,sum(inspection_gaps)::integer inspection_gaps from application_readiness where status='open' group by owner order by owner",
 compliance:`select 'REC-1' rule,code record,'Record accuracy review missing or stale' finding from application_readiness where status='open' and applicant_gap
 union all select 'POL-1',code,'Permit policy not configured' from application_readiness where status='open' and policy_gap
 union all select 'REC-2',code,'Retention review due; do not delete automatically' from applicants where retention_review_on<=CURRENT_DATE
 union all select 'POL-2',application,requirement||': '||finding from evidence_gaps g where finding<>'Complete' and exists(select 1 from applications a where a.id=g.application_id and a.status='open')
 union all select 'REC-3',a.code,'Decision record missing' from applications a where status<>'open' and not exists(select 1 from decisions d where d.application_id=a.id)
 order by rule,record,finding`,
 history:'select action,entity,actor,created_at from audit_events order by created_at,id'
};
export const questions=[
 ['Which owners have overdue applications and missing evidence?',reads.workload],
 ['Which applications are ready for an officer to review?',reads['decision-ready']],
 ['Which requirements are causing the most gaps?',`select requirement,count(*)::integer applications from evidence_gaps g join applications a on a.id=g.application_id where a.status='open' and finding<>'Complete' group by requirement order by applications desc,requirement`],
 ['Which applicants have multiple open applications?',`select p.code,p.name,count(*)::integer applications from applicants p join applications a on a.applicant_id=p.id where a.status='open' group by p.code,p.name having count(*)>1 order by p.code`],
 ['Which upcoming renewals still have conditions to review?',`select code,applicant,expires_on,open_conditions from renewal_queue where days_left<=60 and open_conditions>0 order by expires_on,code`],
 ['Which inspections are holding up an otherwise complete evidence pack?',`select code,applicant,owner,inspection_gaps from application_readiness where status='open' and evidence_gaps=0 and inspection_gaps>0 order by code`],
 ['Which complete packs need an applicant accuracy review?',`select code,applicant,owner from application_readiness where status='open' and evidence_gaps=0 and applicant_gap order by code`],
 ['Which permit types lack a documented local policy?',`select code,name,authority from permit_types where not configured or policy_ref='' order by code`],
 ['Which approvals have no licence record yet?',`select a.code,a.name,d.decided_on,d.actor from applications a join decisions d on d.application_id=a.id left join licences l on l.application_id=a.id where d.outcome='approved' and l.id is null order by a.code`],
 ['Which expired evidence sits on an overdue application?',`select g.application,g.requirement,a.owner,a.target_on from evidence_gaps g join applications a on a.id=g.application_id where a.status='open' and a.target_on<CURRENT_DATE and g.finding='Evidence expired' order by g.application,g.requirement`]
];
export function human(data){
 if(Array.isArray(data)){if(!data.length)return '(none)';if(data[0]?.question)return data.map(x=>x.question+'\n'+human(x.rows)).join('\n\n');return table(data,Object.keys(data[0]).map(key=>({key,label:key.replaceAll('_',' '),format:v=>v&&typeof v==='object'?JSON.stringify(v):v})));}
 if(data&&typeof data==='object')return Object.entries(data).map(([k,v])=>k+'\n'+(typeof v==='object'?human(v):String(v??''))).join('\n');return String(data??'');
}
export async function applicationFile(db,term){const a=await resolve(db,'applications',term);return {applicant:(await db.query('select * from applicants where id=$1',[a.applicant_id]))[0],policy:(await db.query('select * from permit_types where id=$1',[a.type_id]))[0],evidence_records:await db.query('select * from evidence where application_id=$1 order by code',[a.id]),application:(await db.query('select * from application_readiness where id=$1',[a.id]))[0],evidence:await db.query('select * from evidence_gaps where application_id=$1 order by requirement',[a.id]),inspections:await db.query('select code,name,due_on,outcome,report_ref from inspections where application_id=$1 order by code',[a.id]),decision:await db.query('select outcome,decided_on,decision_ref,reason,actor from decisions where application_id=$1',[a.id]),notes:await db.query('select body,actor,created_at from notes where application_id=$1 order by created_at,id',[a.id])};}
export async function mutate(db,cmd,term,f){
 const actor=required(f.actor,'actor');
 if(cmd==='add')return add(db,term,JSON.parse(fs.readFileSync(required(f.file,'file'),'utf8')),actor);
 if(cmd==='configure-type'){
  const t=await resolve(db,'permit_types',term);await db.query('select id from permit_types where id=$1 for update',[t.id]);
  if(t.configured)throw Error('Configured policy is frozen; create a new type for a revision');
  const req=await db.query('select id from requirements where type_id=$1',[t.id]);if(!req.length)throw Error('Add at least one requirement first');
  const days=Number(f.days||365);if(!Number.isSafeInteger(days)||days<1)throw Error('days must be a positive integer');
  const [row]=await db.query('update permit_types set configured=true,policy_ref=$2,freshness_days=$3 where id=$1 returning *',[t.id,required(f.reference,'reference'),days]);await audit(db,cmd,'permit_types',t,row,actor);return row;
 }
 if(cmd==='verify-applicant'){
  const p=await resolve(db,'applicants',term);const [row]=await db.query('update applicants set verified_on=$2,verification_ref=$3,retention_review_on=$4 where id=$1 returning *',[p.id,past(required(f.checked,'checked')),required(f.reference,'reference'),date(required(f.review,'review'))]);await audit(db,cmd,'applicants',p,row,actor);return row;
 }
 if(cmd==='check-evidence'){
  const e=await resolve(db,'evidence',term);await openApplication(db,e.application_id);
  if(!['accepted','rejected'].includes(f.result))throw Error('result must be accepted or rejected');
  const [row]=await db.query('update evidence set status=$2,checked_on=$3,checked_by=$4,document_ref=$5 where id=$1 returning *',[e.id,f.result,past(required(f.checked,'checked')),actor,required(f.reference,'reference')]);await audit(db,cmd,'evidence',e,row,actor);return row;
 }
 if(cmd==='complete-inspection'){
  const i=await resolve(db,'inspections',term);await openApplication(db,i.application_id);
  if(!['pass','fail'].includes(f.result))throw Error('result must be pass or fail');
  const [row]=await db.query('update inspections set outcome=$2,completed_on=$3,report_ref=$4 where id=$1 returning *',[i.id,f.result,past(required(f.completed,'completed')),required(f.reference,'reference')]);await audit(db,cmd,'inspections',i,row,actor);return row;
 }
 if(cmd==='record-decision'){
  const a=await resolve(db,'applications',term);await openApplication(db,a.id);
  if(!['approved','refused','withdrawn'].includes(f.outcome))throw Error('outcome must be approved, refused or withdrawn');
  if(f['officer-confirmed']!==true)throw Error('Supply --officer-confirmed only after the responsible officer made the decision');
  const [check]=await db.query('select * from application_readiness where id=$1',[a.id]);
  if(f.outcome==='approved'&&(check.evidence_gaps||check.inspection_gaps||check.policy_gap||check.applicant_gap))throw Error('Approval record blocked: resolve evidence, inspection, policy and applicant gaps first');
  const decided=past(required(f.decided,'decided'));if(decided<a.received_on)throw Error('Decision precedes application');
  const snapshot=await applicationFile(db,a.code);
  const [d]=await db.query('insert into decisions(application_id,outcome,decided_on,decision_ref,reason,actor,snapshot) values($1,$2,$3,$4,$5,$6,$7) returning *',[a.id,f.outcome,decided,required(f.reference,'reference'),required(f.reason,'reason'),actor,JSON.stringify(snapshot)]);
  const [row]=await db.query('update applications set status=$2 where id=$1 returning *',[a.id,f.outcome]);await audit(db,cmd,'applications',a,row,actor);await audit(db,cmd,'decisions',null,d,actor);return d;
 }
 if(cmd==='record-licence'){
  const a=await resolve(db,'applications',term);await db.query('select id from applications where id=$1 for update',[a.id]);
  const [d]=await db.query("select * from decisions where application_id=$1 and outcome='approved'",[a.id]);if(!d)throw Error('No recorded approval for this application');
  const issued=date(required(f.issued,'issued'));if(issued<d.decided_on)throw Error('Licence issue precedes decision');
  const [row]=await db.query('insert into licences(code,application_id,issued_on,expires_on,document_ref) values($1,$2,$3,$4,$5) returning *',[required(f.code,'code'),a.id,issued,date(required(f.expires,'expires')),required(f.reference,'reference')]);await audit(db,cmd,'licences',null,row,actor);return row;
 }
 if(cmd==='satisfy-condition'){
  const c=await resolve(db,'conditions',term);if(c.status==='satisfied')throw Error('Condition already satisfied');
  const [row]=await db.query("update conditions set status='satisfied',evidence_ref=$2 where id=$1 returning *",[c.id,required(f.reference,'reference')]);await audit(db,cmd,'conditions',c,row,actor);return row;
 }
 if(cmd==='log'){
  const a=await resolve(db,'applications',term);const [row]=await db.query('insert into notes(application_id,body,actor) values($1,$2,$3) returning *',[a.id,required(f.note,'note'),actor]);await audit(db,cmd,'notes',null,row,actor);return row;
 }
 throw Error('Unknown mutation '+cmd);
}
export const mutations=['add','configure-type','verify-applicant','check-evidence','complete-inspection','record-decision','record-licence','satisfy-condition','log'];
export async function read(db,cmd,term,f){
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='application')return applicationFile(db,term);
 if(cmd==='insights'){const out=[];for(const [question,sql] of questions)out.push({question,rows:await db.query(sql)});return out;}
 if(cmd==='export'){
  const out={version:1,exported_at:new Date().toISOString(),records:{}};for(const t of tables)out.records[t]=await db.query(`select * from ${t} order by id`);
  if(f.out){fs.writeFileSync(f.out,JSON.stringify(out,null,2)+'\n');return {file:path.resolve(f.out),counts:Object.fromEntries(tables.map(t=>[t,out.records[t].length]))};}return out;
 }
 if(['weekly-review','draft-evidence','draft-decision'].includes(cmd)){
  let data,label=cmd;
  if(cmd==='weekly-review')data={workload:await db.query(reads.workload),attention:await db.query(reads.attention),compliance:await db.query(reads.compliance)};
  else {const a=await resolve(db,'applications',term);label+='-'+a.code;data=await applicationFile(db,a.code);}
  const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,label.replace(/[^a-zA-Z0-9_-]/g,'_')+'-'+Date.now()+'.md');
  fs.writeFileSync(file,'# DRAFT: '+label+'\n\nInternal working paper only. No licence is issued and nothing has been sent. The responsible officer reviews the original evidence and makes the decision.\n\n```text\n'+human(data)+'\n```\n');return {file};
 }
 throw Error('Unknown command '+cmd);
}
