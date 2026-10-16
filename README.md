# Licensing Desk for Claude Code

Applications, evidence, inspections, officer decisions, licence records and conditions in a database you own. MIT code from Enterprise DNA. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free code. Clone, install and run the demo. Hosting and coding-agent costs are yours. | Your permit types, evidence rules, Salesforce records and working papers. [Get your version built](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=salesforce-license-permit-management&utm_medium=readme). | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=salesforce-license-permit-management&utm_medium=readme). |

## The internal licensing desk

A licensing team reviews incoming applications, requests missing evidence, schedules inspection work, prepares decision papers and checks upcoming renewals. This build holds that work. It records an officer's existing decision and licence document. It does not grant statutory permission or replace the full Salesforce Public Sector platform.

Salesforce lists Public Sector Service Core at US$275 per user per month, billed annually. Ten users illustrate US$33,000 a year. This is base-platform list pricing, not a verified customer invoice or a complete licensing-project quote. [Salesforce pricing](https://www.salesforce.com/government/solutions/pricing/), checked 16 October 2026.

## Quick start

Node 20 or newer. No database server is needed for the embedded demo.

```bash
git clone https://github.com/Enterprise-DNA-OS/licensing-desk-for-claude-code.git
cd licensing-desk-for-claude-code
npm install
npm test
npm run demo
```

All applicants, authorities and evidence references are fictional. The demo ignores DATABASE_URL and writes to .data/demo. It includes an overdue application, an expired document, a failed inspection, an unconfigured permit type and a licence with a condition review overdue.

Subsequent demo queries on Linux or macOS:

```bash
DATA_DIR=.data/demo node scripts/desk.mjs intake-queue
DATA_DIR=.data/demo node scripts/desk.mjs decision-ready
DATA_DIR=.data/demo node scripts/desk.mjs insights --json
```

On PowerShell set `$env:DATA_DIR='.data/demo'`, then run the commands without the DATA_DIR prefix. Use a fresh DATA_DIR and npm run migrate without seed for your records. DATABASE_URL selects a controlled PostgreSQL database.

## Recurring work

| Command | Result |
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

## Ten questions across the records

Run node scripts/desk.mjs insights. Each question is answered by a real query in this build. These are questions beyond a fixed dashboard, not claims that a configured Salesforce report can never answer them.

1. Which owners have overdue applications and missing evidence?
2. Which applications are ready for an officer to review?
3. Which requirements are causing the most gaps?
4. Which applicants have multiple open applications?
5. Which upcoming renewals still have conditions to review?
6. Which inspections are holding up an otherwise complete evidence pack?
7. Which complete packs need an applicant accuracy review?
8. Which permit types lack a documented local policy?
9. Which approvals have no licence record yet?
10. Which expired evidence sits on an overdue application?

## Your first hour: ten things to ask for

1. Show the oldest applications waiting for an officer.
2. Read the complete Spring community market file.
3. Which evidence is missing or expired?
4. Prepare this week's inspection list.
5. Which packs have passed the recorded administrative checks?
6. Show renewals with conditions still open.
7. Draft the Monday review.
8. Draft an evidence request for APP-101.
9. Test our mapped Salesforce report folder without changing records.
10. Add our district field and a read-only district workload report.

## Branded working papers and views

npm run docs produces application review packs, evidence-request drafts and renewal-review papers. npm run view produces the week, decision desk and renewal dashboards. Set the name, logo and colours once in brand.json. The output is read-only HTML that can be opened or printed. Drafts stay local. No message sends and no legal licence certificate is generated.

## Import and export

```bash
node scripts/desk.mjs import salesforce --dir=examples/salesforce --dry-run --actor="Operator"
node scripts/desk.mjs import salesforce --dir=examples/salesforce --actor="Operator"
node scripts/desk.mjs export --out=licensing-backup.json --json
```

The importer takes mapped Details Only CSV reports for applicants, permit types and applications in one transaction. It preserves original rows, accepts unchanged reimports and stops on changed source rows. It does not import arbitrary Salesforce backups or historical approvals. Applicants start unverified, types start unconfigured and applications start open. See [the switch guide](docs/replace-salesforce-license-permit-management.md) for the exact mapping and separate work for licences, inspections, evidence, fees and legacy history.

## Controls and scope

[Record checks](docs/compliance.md) cover missing accuracy checks, retention review reminders, documented local policy and required evidence. An approved decision record requires those checks, completed inspections, a source reference and an explicit officer confirmation. Statutory clocks and legal eligibility remain the authority's responsibility. A configured policy is frozen. An existing decision stays unchanged. A renewal is a new application.

The code runs without a portal, mobile app, offline sync, live Salesforce connection, payments or automatic notices. [Why no front end](docs/why-no-front-end.md) describes this shape and what a managed version can add. Database owners can change records directly. Actor text is not identity verification and the audit is not tamper-proof. Shared use needs reviewed access, backups, protected evidence storage and jurisdiction-specific rules.

## Verification

npm test creates and removes a temporary database. It exercises every domain command, the import and export, decision gates, stale evidence, ambiguous names, date checks, rollback, source-change rejection, drafts and escaped HTML. CI runs Node 20 and 22 on Windows and Linux, plus PostgreSQL 17. TEST_DATABASE_URL must identify a disposable test database; the suite creates and removes its own schema.

## Licence

MIT. Copyright (c) 2026 Enterprise DNA. Salesforce is a trademark of Salesforce, Inc. This independent project is not affiliated with or endorsed by Salesforce.
