import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseCsv} from './csv.mjs';
import {add,required} from './domain.mjs';
export const imports=[
 ['applicants.csv','applicants',{'Applicant ID':'code','Applicant Name':'name','Owner':'owner','Retention Review Date':'retention_review_on'}],
 ['types.csv','permit_types',{'Type ID':'code','Type Name':'name','Authority':'authority'}],
 ['applications.csv','applications',{'Application ID':'code','Applicant ID':'applicant','Type ID':'type','Application Name':'name','Owner':'owner','Received Date':'received_on','Target Date':'target_on'}]
];
export async function importSalesforce(db,dir,actor){
 required(dir,'dir');required(actor,'actor');const present=fs.readdirSync(dir).filter(x=>/\.csv$/i.test(x));
 if(!present.length)throw Error('No CSV files');for(const f of present)if(!imports.some(x=>x[0]===f))throw Error('Unsupported CSV file '+f);
 const stats={inserted:0,unchanged:0,files:[]};
 for(const [file,entity,mapping] of imports){
  if(!present.includes(file))continue;const rows=parseCsv(fs.readFileSync(path.join(dir,file),'utf8'));if(!rows.length)throw Error('Empty report '+file);
  const seen=new Set();
  for(const raw of rows){
   const normalized=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k.toLowerCase(),v]));const input={};
   for(const [heading,col] of Object.entries(mapping)){if(!(heading.toLowerCase() in normalized))throw Error(`${file}: Missing heading ${heading}`);input[col]=required(normalized[heading.toLowerCase()],heading);}
   if(seen.has(input.code.toLowerCase()))throw Error('Duplicate source ID '+input.code);seen.add(input.code.toLowerCase());
   const digest=createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(normalized).sort(([a],[b])=>a.localeCompare(b))))).digest('hex');
   const [old]=await db.query('select * from import_rows where source_file=$1 and source_id=$2',[file,input.code]);
   if(old){if(old.digest!==digest)throw Error(`Changed source row ${file}/${input.code}: reconcile explicitly`);stats.unchanged++;continue;}
   const row=await add(db,entity,input,actor);
   await db.query('insert into import_rows(source_file,source_id,digest,raw_row,record_id) values($1,$2,$3,$4,$5)',[file,input.code,digest,JSON.stringify(raw),row.id]);stats.inserted++;
  }
  stats.files.push(file);
 }
 return stats;
}
