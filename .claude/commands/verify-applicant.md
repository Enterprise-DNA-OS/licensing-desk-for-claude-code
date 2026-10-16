---
description: "Record the accuracy check an operator has actually performed."
---

# verify-applicant

Record the accuracy check an operator has actually performed.

Read CLAUDE.md and docs/cli.md. Read the affected application and related records first. Resolve names using the CLI. Use the operator's actual dates, evidence references, facts and decision, never the example values below.

```bash
node scripts/desk.mjs verify-applicant ORG-101 --checked=YYYY-MM-DD --reference="evidence:accuracy-check" --review=YYYY-MM-DD --actor="Operator"
```

Show the returned records in plain language. If a name is ambiguous, show every candidate and ask the operator to choose. A failed check stops the action. Never weaken a check to finish a task. All documents are drafts. Nothing is sent and no legal instrument is issued.
