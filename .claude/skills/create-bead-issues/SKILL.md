---
name: create-beads-issue
description: Analyze user input and create a well-defined issue in beads with all necessary context, requirements, and references for implementation.
user-invocable: true
---

# Creation Guidelines

If the user provides $ARGUMENTS, analyze them first and ask for clarification if needed.

**CRITICAL**: Either the user provides the issue to create in the prompt, or you must ask the user where to find the documents that will be used to create the issues.

<mandatory-rule-create-issue>
    - Issues must be created in beads with all necessary context, requirements, and references for implementation. Use the `bd create` command with appropriate flags to set up the issue correctly.
    - Issue should belong to an epic or be linked to a parent issue if applicable, using the `--parent` flag.
    - If project is monorepo label epics ands issues with monorepo package name, so they can be easily found by the implementation supervisor.
    - If project is monorepo and the issue or epic belongs to a specific package, add the package name in the design notes, so the implementation supervisor can route it to the correct discipline.
</mandatory-rule-create-issue>

```python
Task(
    subagent_type="beads-owner",
    prompt="Create issues for this project"
)
```
