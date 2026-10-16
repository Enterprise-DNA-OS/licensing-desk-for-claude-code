import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {REPO_ROOT} from './lib/db.mjs';
const env={...process.env,DATABASE_URL:'',DATA_DIR:path.join(REPO_ROOT,'.data/demo'),OUTPUT_DIR:path.join(REPO_ROOT,'.data/demo-output')};
for(const args of [['scripts/migrate.mjs'],['scripts/seed.mjs'],['scripts/desk.mjs','attention'],['scripts/desk.mjs','decision-ready'],['scripts/desk.mjs','renewals-due'],['scripts/view.mjs'],['scripts/docs.mjs']]){const p=spawnSync(process.execPath,args,{cwd:REPO_ROOT,env,stdio:'inherit'});if(p.status!==0)process.exit(p.status||1);}
