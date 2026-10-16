# Record checks and officer responsibility

Checked 16 October 2026. The built-in checks support a New Zealand licensing desk's records work. They do not determine entitlement, confer statutory authority, certify compliance, calculate statutory working-day clocks or replace a legal assessment. Australian authorities need their own jurisdiction-specific rules before operational use.

| Rule | What the software checks | Source and limit |
|---|---|---|
| REC-1 | Flags missing or stale applicant accuracy checks before an approval can be recorded. Requires an operator, check date and reference. | [NZ Privacy Commissioner, principle 8](https://www.privacy.org.nz/privacy-principles/8/) requires reasonable steps for accuracy before use or disclosure. The demo's 365-day interval is local policy, not legislation. |
| REC-2 | Flags a record's retention review date. Never deletes records. | [NZ Privacy Commissioner, principle 9](https://www.privacy.org.nz/privacy-principles/9/) limits unnecessary retention. Public-sector disposal duties also apply. An officer must reconcile these obligations and approved retention schedules. |
| REC-3 | Flags a closed application without a decision record. CLI decisions require source, date, reason and actor, and capture a review snapshot. | [Archives NZ Information and Records Management Standard](https://www.archives.govt.nz/manage-information/how-to-manage-your-information/key-obligations-and-the-standard/information-and-records-management-standard) addresses assigned responsibilities, records and their management. This limited metadata check does not certify the whole standard. |
| POL-1 | Blocks an approval record until a permit type has a policy reference and at least one required evidence item. | Organisation-defined policy. The fictional market examples have no legal effect. A reviewed policy version is frozen; use a new type for revisions. |
| POL-2 | Blocks approval records for missing, rejected, expired or stale evidence, and for pending or failed inspections. | Organisation-defined evidence checklist. Inspection requirements must be entered by the officer; the software cannot infer inspections required by legislation. |

The [Public Records Act 2005](https://www.legislation.govt.nz/act/public/2005/40/en/latest/sections/DLM345729/) distinguishes duties to maintain records and authority for disposal. A retention reminder is never permission to destroy a public or protected record.

## What a recorded decision means

record-decision stores a decision already made by the responsible officer. The operator must supply --officer-confirmed, an outcome, decision date, source reference and reason. An approved outcome also requires the current administrative checks to be complete. Refused and withdrawn outcomes require an officer decision reference but do not require a successful evidence pack. All decisions are final within this workflow. Corrections, appeals and renewals need a separately reviewed new application or migration, preserving the original record.

record-licence stores an existing licence document and its dates only after a recorded approval. It does not issue a legal instrument. Document generation produces internal drafts, never signed certificates or notices of statutory approval. No payment processing or external sending exists.

## Deployment controls

The embedded demo is for a single trusted operator. Domain tables have row-level security and no public policies. Database owners bypass those policies. Actor text is an attribution label, not authentication. The CLI audit contains before and after records but is not tamper-proof. Shared deployment needs authenticated roles, reviewed permissions, protected document storage, encryption, backups, restore testing, change control, retention rules and jurisdiction-specific legal review. The software has no accreditation or government security certification.
