insert into applicants(code,name,owner,verified_on,verification_ref,retention_review_on) values
 ('ORG-101','Harbour Market Collective','Rina',CURRENT_DATE-10,'demo:identity-check-101',CURRENT_DATE+300),
 ('ORG-102','Harbour Events Trust','Owen',CURRENT_DATE-400,'demo:identity-check-102',CURRENT_DATE-5),
 ('ORG-103','Ridge Community Group','Rina',CURRENT_DATE-5,'demo:identity-check-103',CURRENT_DATE+300) on conflict do nothing;
insert into permit_types(code,name,authority,policy_ref,configured) values ('TYPE-1','Community market permission','Fictional Harbour Authority','demo:market-policy-v1',true),('TYPE-2','Temporary reserve use','Fictional Harbour Authority','',false) on conflict do nothing;
insert into requirements(code,type_id,name) select 'REQ-1',id,'Site plan' from permit_types where code='TYPE-1' on conflict do nothing;
insert into requirements(code,type_id,name) select 'REQ-2',id,'Operating plan' from permit_types where code='TYPE-1' on conflict do nothing;
insert into applications(code,applicant_id,type_id,name,owner,received_on,target_on,status)
 select v.code,p.id,t.id,v.name,v.owner,CURRENT_DATE+v.received,CURRENT_DATE+v.target,v.status from (values
 ('APP-101','ORG-101','TYPE-1','Spring community market','Rina',-30,-3,'open'),
 ('APP-102','ORG-102','TYPE-1','Harbour evening stalls','Owen',-20,5,'open'),
 ('APP-103','ORG-103','TYPE-1','Ridge winter market','Rina',-15,10,'open'),
 ('APP-104','ORG-101','TYPE-1','Existing harbour market','Rina',-365,-330,'approved'),
 ('APP-105','ORG-103','TYPE-2','Reserve picnic programme','Owen',-5,15,'open')) v(code,applicant,type,name,owner,received,target,status)
 join applicants p on p.code=v.applicant join permit_types t on t.code=v.type on conflict do nothing;
insert into evidence(code,application_id,requirement_id,document_ref,status,checked_on,checked_by,expires_on)
 select v.code,a.id,r.id,'demo:'||v.code,v.status,CURRENT_DATE-5,'Demo operator',CURRENT_DATE+v.expiry from (values
 ('EV-101','APP-101','REQ-1','accepted',300),('EV-102','APP-102','REQ-1','accepted',-1),('EV-103','APP-102','REQ-2','pending',300),
 ('EV-104','APP-103','REQ-1','accepted',300),('EV-105','APP-103','REQ-2','accepted',300),
 ('EV-106','APP-104','REQ-1','accepted',300),('EV-107','APP-104','REQ-2','accepted',300)) v(code,app,req,status,expiry)
 join applications a on a.code=v.app join requirements r on r.code=v.req on conflict do nothing;
insert into inspections(code,application_id,name,inspector,due_on,outcome,completed_on,report_ref)
 select v.code,a.id,'Site visit',v.inspector,CURRENT_DATE+v.due,v.outcome,case when outcome='pending' then null else CURRENT_DATE-2 end,case when outcome='pending' then '' else 'demo:inspection-report' end
 from (values ('IN-101','APP-101','Tama',-2,'pending'),('IN-102','APP-102','Tama',-3,'fail'),('IN-103','APP-103','Ava',-2,'pass')) v(code,app,inspector,due,outcome) join applications a on a.code=v.app on conflict do nothing;
insert into decisions(application_id,outcome,decided_on,decision_ref,reason,actor,snapshot) select id,'approved',CURRENT_DATE-330,'demo:historic-decision','Fictional existing decision, not a legal authorisation','Demo operator','{"demo":true}' from applications where code='APP-104' on conflict do nothing;
insert into licences(code,application_id,issued_on,expires_on,document_ref) select 'LIC-101',id,CURRENT_DATE-330,CURRENT_DATE+25,'demo:licence-101' from applications where code='APP-104' on conflict do nothing;
insert into conditions(code,licence_id,name,owner,review_on) select 'COND-101',id,'Review waste collection evidence','Rina',CURRENT_DATE-4 from licences where code='LIC-101' on conflict do nothing;
