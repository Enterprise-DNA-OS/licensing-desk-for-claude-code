# Move licensing casework from Salesforce

This build covers the internal licensing desk. It does not replace the entire Public Sector platform, a public application portal, payment collection or field scheduling.

## Export the records you own

Salesforce supports [Details Only CSV report exports](https://help.salesforce.com/s/articleView?id=sf.reports_export.htm&language=en_US). Open the report, choose Export, Details Only, then CSV. If export is unavailable, ask your administrator for the necessary report and permissions. Retain the original export unchanged. The [licensing intake walkthrough](https://trailhead.salesforce.com/content/learn/modules/licensing-permitting-and-inspections-with-public-sector-solutions/manage-outreach-and-intake-of-authorizations) describes business applications, accounts, statuses and licence types. Sources checked 16 October 2026.

Your administrator creates detail reports joining the relevant account, licence type and business application records. Map them to this explicit projection. These are local importer headings, not a claim that every Salesforce organisation has these reports or labels out of the box.

| File | Required headings |
|---|---|
| applicants.csv | Applicant ID, Applicant Name, Owner, Retention Review Date |
| types.csv | Type ID, Type Name, Authority |
| applications.csv | Application ID, Applicant ID, Type ID, Application Name, Owner, Received Date, Target Date |

Use stable source IDs as text, unique headings and YYYY-MM-DD dates. Map owner IDs to a useful officer name. Target Date is a locally assigned administrative target, not a statutory deadline. Retention Review Date is set from your authority's records policy. Unknown columns are kept in raw_row for reconciliation but do not affect workflow. A file may be omitted when it has no rows; linked records must already exist or be in the folder. Unknown CSV file names and duplicate source IDs fail visibly.

## Import the folder in one command

Choose a fresh DATA_DIR, run npm run migrate without seed, then:

```bash
node scripts/desk.mjs import salesforce --dir=imports/salesforce --dry-run --actor="Import operator"
node scripts/desk.mjs import salesforce --dir=imports/salesforce --actor="Import operator"
node scripts/desk.mjs applications
node scripts/desk.mjs export --out=licensing-backup.json --json
```

The whole folder commits or rolls back. A dry run performs the same validation and rolls back. Unchanged rows import once. Changed source rows stop for explicit reconciliation, never overwrite local decisions. Compare all three record counts and the original IDs, applicant links, types, owners and dates before cutover.

Imported applicants are unverified, types are unconfigured and applications are open. Imported statuses are raw history only. Add the actual requirements, configure the reviewed policy, verify the applicant and enter evidence and inspection records before recording any new decision.

## What needs a separate mapping

Historic decisions, existing licences, evidence files, conditions, inspections, statutory calendars and pauses, fees, payments, portals, geographical layers, approvals with multiple signatories and vendor audit history need their own reviewed migration. The shipped importer covers the three listed reports, not an arbitrary Salesforce backup. Evidence remains in your controlled document store and is linked by reference. Renewal is a new application and officer decision, not an automatic extension.

Rehearse the mapped import and reconcile the internal casework in a day. Full platform migration depends on your data and controls. Enterprise DNA can map the exports, bring across additional history and tailor the workflow through Omni by Enterprise DNA. One setup fee, then a retainer. [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=salesforce-license-permit-management&utm_medium=switching-guide).
