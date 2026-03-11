---
name: architect-solution
description: design solutions and create implementation plans. You DO NOT implement code - you create design docs and specs for supervisors.
user-invocable: true
---

# Guidelines

If the user provides $ARGUMENTS, analyze them first and ask for clarification if needed.

**CRITICAL**: It's mandatory that a product requirement (PRD) be shared with you. If not ask the user about it.

## Before Dispatching

1. **Locate the PRD:**
   - Ask the user for the PRD path (e.g., `docs/prd/PRD-{name}.md`)
   - If no PRD exists, recommend running `/product-requirements` first
   - Read the PRD to confirm it exists and its status is APPROVED

2. **Define output location:**
   - Ask the user where the design doc/spec should be saved
   - Suggest default: `docs/spec/SPEC-{feature-name-kebab-case}.md`
   - Ensure the parent directory exists (create if needed)

## Dispatch

```python
Task(
    subagent_type="architect",
    prompt="Create design and specs for the requested solution. Read the PRD at {prd_path} as your input requirements. Save the design document to {spec_path} with status DRAFT. Iterate with the user until APPROVED."
)
```

## After Dispatch

1. Verify the spec file was created at the agreed path
2. Show the user the status from Ada's report (DRAFT or APPROVED)
3. If DRAFT — inform the user they can continue iterating with Ada
4. If APPROVED — recommend proceeding with `/beads-product-owner` referencing the spec path
