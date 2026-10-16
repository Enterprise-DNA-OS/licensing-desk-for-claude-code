create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table applicants(id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, owner text not null, verified_on date, verification_ref text not null default '', retention_review_on date not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger applicants_touch before update on applicants for each row execute function touch_updated_at();
alter table applicants enable row level security;
revoke all on applicants from public;
create table permit_types(id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, authority text not null, policy_ref text not null default '', configured boolean not null default false, freshness_days integer not null default 365 check(freshness_days>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger permit_types_touch before update on permit_types for each row execute function touch_updated_at();
alter table permit_types enable row level security;
revoke all on permit_types from public;
create table requirements(id uuid primary key default gen_random_uuid(), code text not null unique, type_id uuid not null references permit_types(id), name text not null, unique(type_id,name), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger requirements_touch before update on requirements for each row execute function touch_updated_at();
alter table requirements enable row level security;
revoke all on requirements from public;
create table applications(id uuid primary key default gen_random_uuid(), code text not null unique, applicant_id uuid not null references applicants(id), type_id uuid not null references permit_types(id), name text not null, owner text not null, received_on date not null, target_on date not null, status text not null default 'open' check(status in ('open','approved','refused','withdrawn')), check(target_on>=received_on), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger applications_touch before update on applications for each row execute function touch_updated_at();
alter table applications enable row level security;
revoke all on applications from public;
create table evidence(id uuid primary key default gen_random_uuid(), code text not null unique, application_id uuid not null references applications(id), requirement_id uuid not null references requirements(id), document_ref text not null default '', status text not null default 'pending' check(status in ('pending','accepted','rejected')), checked_on date, checked_by text, expires_on date, unique(application_id,requirement_id), check(status='pending' or (checked_on is not null and checked_by is not null and length(trim(document_ref))>0)), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger evidence_touch before update on evidence for each row execute function touch_updated_at();
alter table evidence enable row level security;
revoke all on evidence from public;
create table inspections(id uuid primary key default gen_random_uuid(), code text not null unique, application_id uuid not null references applications(id), name text not null, inspector text not null, due_on date not null, outcome text not null default 'pending' check(outcome in ('pending','pass','fail')), completed_on date, report_ref text not null default '', check(outcome='pending' or (completed_on is not null and length(trim(report_ref))>0)), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger inspections_touch before update on inspections for each row execute function touch_updated_at();
alter table inspections enable row level security;
revoke all on inspections from public;
create table decisions(id uuid primary key default gen_random_uuid(), application_id uuid not null unique references applications(id), outcome text not null check(outcome in ('approved','refused','withdrawn')), decided_on date not null, decision_ref text not null check(length(trim(decision_ref))>0), reason text not null check(length(trim(reason))>0), actor text not null, snapshot jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger decisions_touch before update on decisions for each row execute function touch_updated_at();
alter table decisions enable row level security;
revoke all on decisions from public;
create table licences(id uuid primary key default gen_random_uuid(), code text not null unique, application_id uuid not null unique references applications(id), issued_on date not null, expires_on date not null, document_ref text not null check(length(trim(document_ref))>0), check(expires_on>=issued_on), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger licences_touch before update on licences for each row execute function touch_updated_at();
alter table licences enable row level security;
revoke all on licences from public;
create table conditions(id uuid primary key default gen_random_uuid(), code text not null unique, licence_id uuid not null references licences(id), name text not null, owner text not null, review_on date not null, status text not null default 'open' check(status in ('open','satisfied')), evidence_ref text not null default '', check(status='open' or length(trim(evidence_ref))>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger conditions_touch before update on conditions for each row execute function touch_updated_at();
alter table conditions enable row level security;
revoke all on conditions from public;
create table notes(id uuid primary key default gen_random_uuid(), application_id uuid not null references applications(id), body text not null check(length(trim(body))>0), actor text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger notes_touch before update on notes for each row execute function touch_updated_at();
alter table notes enable row level security;
revoke all on notes from public;
create table audit_events(id uuid primary key default gen_random_uuid(), action text not null, entity text not null, record_id uuid, actor text not null, before_row jsonb, after_row jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger audit_events_touch before update on audit_events for each row execute function touch_updated_at();
alter table audit_events enable row level security;
revoke all on audit_events from public;
create table import_rows(id uuid primary key default gen_random_uuid(), source_file text not null, source_id text not null, digest text not null, raw_row jsonb not null, record_id uuid not null, unique(source_file,source_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger import_rows_touch before update on import_rows for each row execute function touch_updated_at();
alter table import_rows enable row level security;
revoke all on import_rows from public;

create index evidence_application on evidence(application_id);
create index inspections_application on inspections(application_id);
create index applications_applicant on applications(applicant_id);
create index conditions_licence on conditions(licence_id);
create view evidence_gaps as
 select a.id application_id,a.code application,r.name requirement,
 case when e.id is null then 'Missing evidence' when e.document_ref='' then 'Missing document reference'
 when e.status<>'accepted' then 'Evidence not accepted' when e.checked_on is null or e.checked_on<CURRENT_DATE-t.freshness_days then 'Evidence check stale'
 when e.expires_on<CURRENT_DATE then 'Evidence expired' else 'Complete' end finding
 from applications a join permit_types t on t.id=a.type_id join requirements r on r.type_id=t.id
 left join evidence e on e.application_id=a.id and e.requirement_id=r.id;
create view application_readiness as
 select a.id,a.code,a.name,p.name applicant,t.name permit_type,a.owner,a.status,a.received_on,a.target_on,
 CURRENT_DATE-a.received_on age_days,a.target_on-CURRENT_DATE days_left,
 (select count(*)::integer from evidence_gaps g where g.application_id=a.id and finding<>'Complete') evidence_gaps,
 (select count(*)::integer from inspections i where i.application_id=a.id and outcome<>'pass') inspection_gaps,
 (not t.configured or t.policy_ref='' or not exists(select 1 from requirements r where r.type_id=t.id)) policy_gap,
 (p.verified_on is null or p.verified_on<CURRENT_DATE-t.freshness_days or p.verification_ref='') applicant_gap
 from applications a join applicants p on p.id=a.applicant_id join permit_types t on t.id=a.type_id;
create view renewal_queue as
 select l.id,l.code,a.code application,p.name applicant,t.name permit_type,a.owner,l.issued_on,l.expires_on,
 l.expires_on-CURRENT_DATE days_left,
 (select count(*)::integer from conditions c where c.licence_id=l.id and c.status='open') open_conditions
 from licences l join applications a on a.id=l.application_id join applicants p on p.id=a.applicant_id join permit_types t on t.id=a.type_id;
create view attention_queue as
 select 'Application target overdue' issue,a.code record,a.owner,a.target_on due_on from applications a where status='open' and target_on<CURRENT_DATE
 union all select 'Evidence: '||g.finding,g.application,a.owner,a.target_on from evidence_gaps g join applications a on a.id=g.application_id where a.status='open' and g.finding<>'Complete'
 union all select 'Inspection '||outcome,i.code,i.inspector,i.due_on from inspections i join applications a on a.id=i.application_id where a.status='open' and (i.outcome='fail' or (i.outcome='pending' and i.due_on<=CURRENT_DATE+7))
 union all select 'Licence renewal review',code,owner,expires_on from renewal_queue where days_left<=60
 union all select 'Condition review overdue',code,owner,review_on from conditions where status='open' and review_on<CURRENT_DATE
 union all select 'Applicant record review',code,owner,retention_review_on from applicants where retention_review_on<=CURRENT_DATE;
