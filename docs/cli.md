# Licensing desk CLI

Run npm run migrate before queries. Flags use --key=value. Quote values containing spaces. Append --json to any command for machine output. Human output is the default. Dates use YYYY-MM-DD. Mutation flags shown below are required except configure-type --days, which defaults to 365. Replace all example placeholders with the operator's actual facts. No command sends or deletes records.

### applicants

List applicants, owners and record review dates.

```bash
node scripts/desk.mjs applicants
```

### types

List permit types and their reviewed policy references.

```bash
node scripts/desk.mjs types
```

### requirements

List required evidence by permit type.

```bash
node scripts/desk.mjs requirements
```

### applications

List application records and internal targets.

```bash
node scripts/desk.mjs applications
```

### intake-queue

Review open applications oldest first.

```bash
node scripts/desk.mjs intake-queue
```

### evidence-due

List missing, expired, rejected and stale evidence.

```bash
node scripts/desk.mjs evidence-due
```

### inspections

Read inspection dates, outcomes and report references.

```bash
node scripts/desk.mjs inspections
```

### inspection-week

Prepare overdue and upcoming inspections.

```bash
node scripts/desk.mjs inspection-week
```

### decision-ready

List complete administrative packs for officer review.

```bash
node scripts/desk.mjs decision-ready
```

### decisions

Read recorded officer decisions and their source references.

```bash
node scripts/desk.mjs decisions
```

### licences

Read licence records and expiry dates.

```bash
node scripts/desk.mjs licences
```

### renewals-due

Review licences due within sixty days, including expired ones.

```bash
node scripts/desk.mjs renewals-due
```

### conditions

Read licence conditions and their evidence.

```bash
node scripts/desk.mjs conditions
```

### conditions-due

Prepare condition reviews due this week.

```bash
node scripts/desk.mjs conditions-due
```

### attention

Read the combined overdue and evidence queue.

```bash
node scripts/desk.mjs attention
```

### workload

Compare officer workload, targets and evidence gaps.

```bash
node scripts/desk.mjs workload
```

### compliance

Check record accuracy, retention reviews, evidence and local policy.

```bash
node scripts/desk.mjs compliance
```

### history

Read the CLI audit history.

```bash
node scripts/desk.mjs history
```

### application

Read a complete application file before acting.

```bash
node scripts/desk.mjs application APP-101
```

### insights

Answer ten questions across the licensing records.

```bash
node scripts/desk.mjs insights
```

### add

Add an applicant, type, requirement, application, evidence item, inspection or condition.

```bash
node scripts/desk.mjs add applications --file=application.json --actor="Operator"
```

### configure-type

Freeze a reviewed local policy with its evidence requirements.

```bash
node scripts/desk.mjs configure-type TYPE-X --reference="policy:approved-v1" --days=365 --actor="Operator"
```

### verify-applicant

Record the accuracy check an operator has actually performed.

```bash
node scripts/desk.mjs verify-applicant ORG-101 --checked=YYYY-MM-DD --reference="evidence:accuracy-check" --review=YYYY-MM-DD --actor="Operator"
```

### check-evidence

Record acceptance or rejection of a document the officer reviewed.

```bash
node scripts/desk.mjs check-evidence EV-101 --result=accepted --checked=YYYY-MM-DD --reference="evidence:plan" --actor="Operator"
```

### complete-inspection

Record an actual inspection outcome and report reference.

```bash
node scripts/desk.mjs complete-inspection IN-101 --result=pass --completed=YYYY-MM-DD --reference="report:inspection" --actor="Operator"
```

### record-decision

Record an existing officer decision after the administrative checks.

```bash
node scripts/desk.mjs record-decision APP-103 --outcome=approved --decided=YYYY-MM-DD --reference="decision:signed-reference" --reason="Officer decision reason" --officer-confirmed --actor="Operator"
```

### record-licence

Record the existing licence document after an approved decision.

```bash
node scripts/desk.mjs record-licence APP-103 --code=LIC-103 --issued=YYYY-MM-DD --expires=YYYY-MM-DD --reference="licence:existing-document" --actor="Operator"
```

### satisfy-condition

Record the evidence satisfying a licence condition.

```bash
node scripts/desk.mjs satisfy-condition COND-101 --reference="evidence:condition-proof" --actor="Operator"
```

### log

Add a factual application note.

```bash
node scripts/desk.mjs log APP-101 --note="Actual operator note" --actor="Operator"
```

### import

Validate and import the mapped Salesforce detail reports.

```bash
node scripts/desk.mjs import salesforce --dir=examples/salesforce --dry-run --actor="Operator"
```

### export

Export every domain record, audit event and original source row.

```bash
node scripts/desk.mjs export --out=licensing-backup.json --json
```

### weekly-review

Draft the Monday review from workload, attention and compliance.

```bash
node scripts/desk.mjs weekly-review
```

### draft-evidence

Draft an evidence follow-up from the actual application file.

```bash
node scripts/desk.mjs draft-evidence APP-101
```

### draft-decision

Draft an internal decision review paper from recorded facts.

```bash
node scripts/desk.mjs draft-decision APP-101
```

## Add shapes

Pass a JSON file to add. Unknown fields are rejected. Relationships accept a unique code, ID prefix or case-insensitive name. Evidence and inspection changes require an open application. Evidence must match a requirement of that application's type.

| Entity | Required keys | Optional keys |
|---|---|---|
| applicants | code, name, owner, retention_review_on | none |
| permit_types | code, name, authority | none |
| requirements | code, type, name | none |
| applications | code, applicant, type, name, owner, received_on, target_on | none |
| evidence | code, application, requirement, document_ref | expires_on |
| inspections | code, application, name, inspector, due_on | none |
| conditions | code, licence, name, owner, review_on | none |

Inspection result is pass or fail. Evidence result is accepted or rejected. Decision outcome is approved, refused or withdrawn. All decisions require --officer-confirmed and a reference to the actual officer decision. Only approved outcomes require the complete local administrative checks. No recorded outcome can be edited through the CLI.

For documents run npm run docs. For dashboards run npm run view. OUTPUT_DIR changes their destination. The database export is an archive of all domain records, not a drop-in restore command. Use your database's backup and restore tools for operational recovery and test restoration before cutover.
