---
description: "Add a read-only dashboard for a licensing question."
---
# New view

Read CLAUDE.md, views.json and the existing SQL views. Translate the operator's question into a read-only query. Run it first and show actual rows. Add an SQL view in the next migration when a reusable join is needed. Add a named entry to views.json using the existing renderer. Run npm run migrate, npm run view and npm test. Inspect the HTML and confirm the values against the CLI. Do not add action buttons, a web server, writes or a second rendering framework.
