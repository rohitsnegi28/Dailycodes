
✅ Developer Defect Prevention Checklist (Pre-Deployment)

> Purpose: To help developers systematically avoid common issues and ensure quality before pushing code to QA or higher environments.




---

🔍 Requirement & Design Understanding

[ ] I have reviewed the latest Business Requirements / User Stories.

[ ] I clarified all ambiguities with the BA/Product Owner before starting.

[ ] I understand the acceptance criteria and edge cases clearly.

[ ] I reviewed or contributed to the technical design/impact analysis.



---

🧠 Code Quality

[ ] My code follows our project's coding standards and naming conventions.

[ ] I have removed all hardcoded values, test credentials, and debug logs.

[ ] I’ve handled nulls, empty states, and exceptions properly.

[ ] Feature toggles/config flags are used where applicable.



---

🧪 Testing Done by Developer (Self-Check)

[ ] I have written/updated unit tests for all new logic.

[ ] I ran and passed unit tests locally.

[ ] I tested key positive and negative test cases manually.

[ ] I validated inputs/outputs for all exposed APIs or endpoints.

[ ] I verified database changes (if applicable) and confirmed no impact to existing data.

[ ] I’ve confirmed cross-browser / device behavior (for frontend).



---

🔄 Code Review & Merge Readiness

[ ] My code has zero linting or compilation errors.

[ ] I have created a Pull Request with a meaningful title and description.

[ ] All reviewers are tagged and context is provided (JIRA ID, screenshots, etc.).

[ ] I responded to all comments and applied suggestions before merging.



---

🔗 Integration Readiness

[ ] I’ve tested with mocked or actual APIs where feasible.

[ ] I verified service-to-service or module integrations if changed.

[ ] Feature branch is synced with the latest develop/main before merging.



---

🚀 Pre-Deployment

[ ] I have added/updated deployment steps or runbook instructions (if needed).

[ ] Environment-specific configs (URLs, keys) are externalized.

[ ] Migration scripts (if any) are tested and rollback steps are defined.

[ ] I’ve attached screenshots or test evidence in JIRA for QA reference.



---

🧾 Post-Deployment Validation (Developer Responsibility)

[ ] I verified that the deployed build behaves as expected in lower environments.

[ ] I confirmed logs, metrics, or monitoring signals are clean post-deploy.

[ ] I’ve informed the QA team of any known limitations or testing focus areas.



---

You can name this section in your document:
📄 Appendix-A: Developer Defect Prevention Checklist (Manual)


---

Let me know if you also want a QA checklist, or a combined Dev+QA readiness gate, or a formatted version (Word/Markdown/Excel).

