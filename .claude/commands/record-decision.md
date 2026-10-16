---
description: "Record an existing officer decision after the administrative checks."
---

# record-decision

Record an existing officer decision after the administrative checks.

Read CLAUDE.md and docs/cli.md. Read the affected application and related records first. Resolve names using the CLI. Use the operator's actual dates, evidence references, facts and decision, never the example values below.

```bash
node scripts/desk.mjs record-decision APP-103 --outcome=approved --decided=YYYY-MM-DD --reference="decision:signed-reference" --reason="Officer decision reason" --officer-confirmed --actor="Operator"
```

Show the returned records in plain language. If a name is ambiguous, show every candidate and ask the operator to choose. A failed check stops the action. Never weaken a check to finish a task. All documents are drafts. Nothing is sent and no legal instrument is issued.

Use --officer-confirmed only when the operator explicitly confirms that the responsible officer has already made this exact decision. Do not infer a statutory approval from a complete evidence checklist.
