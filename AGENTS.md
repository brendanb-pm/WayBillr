# WayBillr — Repository Instructions

## Canonical standards

For substantive project work, load and enforce the canonical standards from `https://github.com/brendanb-pm/Codex-Standards` at effective revision `79e27cab42c3ed22cb4a0ac28f8f51a1c65d197a`.

At the first substantive task of a session, safely fetch the canonical repository without discarding local state. Verify `79e27cab42c3ed22cb4a0ac28f8f51a1c65d197a^{commit}` resolves, then load `Codex-Standards.md` and only task-triggered conditional modules from a read-only checkout or worktree at that revision. Do not copy, edit, commit, push, reset, or otherwise mutate canonical standards during WayBillr application execution. If the approved revision cannot be resolved or read safely, report `CANONICAL STANDARDS UNAVAILABLE` and stop substantive work.

## Current project state and navigation

This repository is initialized with standards integration only. No application source, stack, architecture, integration, or verification command is yet confirmed. Do not infer or fabricate product architecture, dependencies, extraction workflows, or test commands; add project-specific navigation and verification guidance only when durable source or specifications establish them.

## Data, document, and extraction safety

Do not commit credentials, API keys, service-account material, local environment files, customer or carrier data, waybills, document images, extraction artifacts, user data, generated caches, or temporary ingestion files.

When a confirmed implementation introduces document/image or batch ingestion, AI-assisted extraction, Google Apps Script/Drive/Sheets, or another extraction provider, preserve source-document retention, duplicate-processing prevention, driver/accounting workflow boundaries, PII/customer-data protections, and auditability. Probabilistic extraction output is not authoritative: apply deterministic structured-field validation and retain appropriate source/audit evidence before it can drive consequential workflow state.

## Verification

Use only verification commands established by the future project source and durable specifications. Before introducing production documents, external integrations, credentials, ingestion, or AI extraction, load the applicable canonical security, production/external-system, data-migration, UI/UX, and performance modules as triggered by the actual work.
