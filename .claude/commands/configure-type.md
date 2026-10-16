---
description: "Freeze a reviewed local policy with its evidence requirements."
---

# configure-type

Freeze a reviewed local policy with its evidence requirements.

Read CLAUDE.md and docs/cli.md. Read the affected application and related records first. Resolve names using the CLI. Use the operator's actual dates, evidence references, facts and decision, never the example values below.

```bash
node scripts/desk.mjs configure-type TYPE-X --reference="policy:approved-v1" --days=365 --actor="Operator"
```

Show the returned records in plain language. If a name is ambiguous, show every candidate and ask the operator to choose. A failed check stops the action. Never weaken a check to finish a task. All documents are drafts. Nothing is sent and no legal instrument is issued.
