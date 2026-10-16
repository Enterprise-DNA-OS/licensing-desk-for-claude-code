# Licensing Desk for Claude Code

This is an internal licensing casework database for an officer-led administration team. The fictional demonstration concerns community markets and reserve use, not construction, clinical credentials or employment. Replace brand.json with the operator's business details. Ask for missing organisation context before using live records.

## One route for recurring work

| Command | Purpose |
|---|---|
| `/applicants` | List applicants, owners and record review dates. |
| `/types` | List permit types and their reviewed policy references. |
| `/requirements` | List required evidence by permit type. |
| `/applications` | List application records and internal targets. |
| `/intake-queue` | Review open applications oldest first. |
| `/evidence-due` | List missing, expired, rejected and stale evidence. |
| `/inspections` | Read inspection dates, outcomes and report references. |
| `/inspection-week` | Prepare overdue and upcoming inspections. |
| `/decision-ready` | List complete administrative packs for officer review. |
| `/decisions` | Read recorded officer decisions and their source references. |
| `/licences` | Read licence records and expiry dates. |
| `/renewals-due` | Review licences due within sixty days, including expired ones. |
| `/conditions` | Read licence conditions and their evidence. |
| `/conditions-due` | Prepare condition reviews due this week. |
| `/attention` | Read the combined overdue and evidence queue. |
| `/workload` | Compare officer workload, targets and evidence gaps. |
| `/compliance` | Check record accuracy, retention reviews, evidence and local policy. |
| `/history` | Read the CLI audit history. |
| `/application` | Read a complete application file before acting. |
| `/insights` | Answer ten questions across the licensing records. |
| `/add` | Add an applicant, type, requirement, application, evidence item, inspection or condition. |
| `/configure-type` | Freeze a reviewed local policy with its evidence requirements. |
| `/verify-applicant` | Record the accuracy check an operator has actually performed. |
| `/check-evidence` | Record acceptance or rejection of a document the officer reviewed. |
| `/complete-inspection` | Record an actual inspection outcome and report reference. |
| `/record-decision` | Record an existing officer decision after the administrative checks. |
| `/record-licence` | Record the existing licence document after an approved decision. |
| `/satisfy-condition` | Record the evidence satisfying a licence condition. |
| `/log` | Add a factual application note. |
| `/import` | Validate and import the mapped Salesforce detail reports. |
| `/export` | Export every domain record, audit event and original source row. |
| `/weekly-review` | Draft the Monday review from workload, attention and compliance. |
| `/draft-evidence` | Draft an evidence follow-up from the actual application file. |
| `/draft-decision` | Draft an internal decision review paper from recorded facts. |
| `/view` | Render the week, decision desk and renewal dashboards. |
| `/documents` | Render application packs, evidence requests and renewal review papers. |
| `/customise` | Add a field or change an agreed rule through a new migration. |
| `/new-view` | Add a read-only view for a new question. |

Read the matching .claude/commands file, then docs/cli.md for inputs. Every factual answer starts with the CLI. Use partial IDs or names only when they identify one record. If multiple candidates appear, show them and ask.

## Operating rules

- Read a complete application before changing it. Preserve source references and dates.
- Use one CLI, scripts/desk.mjs. All edits require an actor and are audited in the same transaction.
- An officer makes a statutory decision. The software records that decision with its source and reason. Never infer an approval from decision-ready.
- Never issue a licence, send a message, collect payment or invent evidence. Draft files for human review only.
- Never silently delete, weaken checks, overwrite imports or alter a recorded decision. Preserve history and propose an additive migration when necessary.
- Target dates, evidence freshness and requirements are local policy, not statutory rules. Read docs/compliance.md.
- Use a fresh DATA_DIR for trials. npm run demo always uses the local demonstration and ignores DATABASE_URL. Live records need a reviewed database and access controls.
- Use /customise for an agreed field or rule change and /new-view for an additional read-only report. No front end.

## Storage

Plain PostgreSQL migrations in supabase/migrations also run on embedded PGlite. DATABASE_URL selects PostgreSQL. Otherwise DATA_DIR selects the local embedded store. OUTPUT_DIR controls generated working papers. Actor labels are not authentication. CLI audit records are not a tamper-proof log. See docs/compliance.md for deployment boundaries.

Built and supported through Omni by Enterprise DNA. https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=salesforce-license-permit-management
