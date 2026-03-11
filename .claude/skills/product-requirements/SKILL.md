---
name: product-requirements
description: Transform a raw idea into a structured PRD (Product Requirements Document). Dispatches Grace (product-manager) to elicit, structure, and validate requirements before architectural design.
user-invocable: true
---

# Guidelines

If the user provides $ARGUMENTS, analyze them first and ask for clarification if needed.

## Before Dispatching

1. **Gather context:**
   - Ask the user if they have any existing documents about the idea (briefs, notes, sketches, competitive analysis)
   - If documents exist, read them and include their paths in the dispatch prompt

2. **Define output location:**
   - Ask the user where the PRD should be saved
   - Suggest default: `docs/prd/PRD-{feature-name-kebab-case}.md`
   - Ensure the parent directory exists (create if needed)

## Dispatch

```python
Task(
    subagent_type="product-manager",
    prompt="Create a PRD for the requested feature/product. Save the PRD to {agreed_path}. Context: {user_idea}. Reference documents: {doc_paths_if_any}"
)
```

## After Dispatch

1. Verify the PRD file was created at the agreed path
2. Show the user the status from Grace's report (DRAFT or APPROVED)
3. If DRAFT — inform the user they can continue iterating with Grace by running this skill again or editing directly
4. If APPROVED — recommend proceeding with `/architect-solution` referencing the PRD path
