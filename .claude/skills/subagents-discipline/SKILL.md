---
name: subagents-discipline
description: Core engineering principles for implementation tasks
---

# Implementation Principles

## Rule 0: Read the Bead First

Before implementing anything, **read the bead comments** for context:

```bash
bd show {BEAD_ID}
bd comments {BEAD_ID}
```

The orchestrator's dispatch prompt is automatically logged as a DISPATCH comment on the bead. This contains:
- The investigation findings
- Root cause analysis (file, function, line)
- Related files that may need changes
- Gotchas and edge cases

**Use this context.** Don't re-investigate. The comments contain everything you need to implement confidently.

If no dispatch or context comments exist, ask the orchestrator to provide context before proceeding.

---

## Rule 1: Look Before You Code

Before writing code that touches external data (API, database, file, config):

1. **Fetch/read the ACTUAL data** - run the command, see the output
2. **Note exact field names, types, formats** - not what docs say, what you SEE
3. **Code against what you observed** - not what you assumed

```
WITHOUT looking first:
  Assumed: column is "reference_images"
  Reality: column is "reference_image_url"
  Result:  Query fails

WITH looking first:
  Ran: SELECT column_name FROM information_schema.columns WHERE table_name = 'assets';
  Saw: reference_image_url
  Coded against: reference_image_url
  Result: Works
```

## Rule 2: Test Functionally (Close the Loop)

**Principle: Optimize for the fastest way to verify your work actually works.**

| You built | Fast verification | Slower alternative |
|-----------|------------------|--------------------|
| API endpoint | `curl` the endpoint, check response | Write integration test |
| Database change | Run migration, query the result | Write migration test |
| Frontend component | Load in browser, interact with it | Write component test |
| CLI tool | Run the command, check output | Write unit test |
| Config change | Restart service, verify behavior | N/A — just verify |

**Two strategies:**

1. **User Journey Tests** — Test actual behavior as a user experiences it:
   ```bash
   # API: curl with real data
   curl -X POST localhost:3000/api/users -d '{"name":"test"}' -H "Content-Type: application/json"

   # CLI: run the command
   bd create "Test" -d "Testing" && bd list

   # Error case: curl with invalid auth
   curl -X POST localhost:3000/api/users -H "Authorization: Bearer invalid"
   ```

2. **Component Tests** — Supplement for regression prevention when fast verification isn't possible:
   - Complex logic with many edge cases
   - Code that runs in environments you can't easily replicate
   - Shared libraries used by multiple consumers

**"Close the Loop" principle:** Run the actual thing. Verify it works. Check error cases.

Good: "Curled endpoint with invalid auth, got 401 as expected"
Bad: "Wrote tests, they compile"

## Rule 3: Use Your Tools

Before claiming you can't fully test:

1. **Check what MCP servers you have access to** - list available tools
2. **If any tool can help verify the feature works**, use it
3. **Be resourceful** - browser automation, database inspection, API testing tools

## Rule 4: Log Decisions and Deviations (Mandatory when applicable)

During implementation, log every non-trivial decision and any deviation from the spec/design doc as bead comments. This creates a traceable decision trail that the QA agent and humans can review.

### Decisions

When you choose between alternatives, pick a pattern, or make a non-obvious choice:

```bash
bd comments add {BEAD_ID} "DECISION: [what you chose] instead of [alternative] because [reason]"
```

Examples:
- `DECISION: Used Strategy pattern instead of switch/case because the spec lists 5+ payment providers and more will be added`
- `DECISION: Stored session in Redis instead of memory because the spec requires horizontal scaling`
- `DECISION: Used batch insert instead of individual inserts because the dataset exceeds 1000 rows`

### Deviations

When you implement something differently from what the spec/design doc defined — **always log why**:

```bash
bd comments add {BEAD_ID} "DEVIATION: Spec said [X], implemented [Y] because [reason]"
```

Examples:
- `DEVIATION: Spec said use REST endpoint, implemented WebSocket because the data requires real-time push`
- `DEVIATION: Spec defined field as 'user_id: string', implemented as 'user_id: number' because the DB schema uses integer PKs`
- `DEVIATION: Spec included pagination, deferred to separate task because it requires a new dependency`

### When to log:
- **DECISION**: Always log when multiple valid approaches exist and you picked one
- **DEVIATION**: Always log when your implementation differs from the spec in any way
- Skip if the choice is trivially obvious and self-explanatory from the code

---

## Rule 5: Log Completion Summary (Mandatory)

Before marking the bead as in-review, you MUST leave a structured completion comment summarizing what was done. This is consumed by the code-reviewer agent and the orchestrator to understand the scope of changes without reading every diff.

```bash
bd comments add {BEAD_ID} "COMPLETED:
Summary: [1-2 sentences describing what was implemented/fixed]
Files changed: [list of files modified, created, or deleted]
Decisions: [count of DECISION comments logged, or 'none']
Deviations: [count of DEVIATION comments logged, or 'none — implemented as spec']
Tests: [what was tested and how — functional verification, unit tests, etc.]"
```

This is NOT optional. Every implementation task must have a COMPLETED comment before marking in-review.

---

## For Epic Children

If your BEAD_ID contains a dot (e.g., BD-001.2), you're implementing part of a larger feature:

1. **Check for design doc**: `bd show {EPIC_ID} --json | jq -r '.[0].design'`
2. **Read it if it exists** - this is your contract
3. **Match it exactly** - same field names, same types, same shapes

---

## Rule 6: Never Close Beads

Your job ends at `in-review`. After pushing and marking the bead `in-review` with `needs-review` label, **stop**. Do NOT run `bd close`.

Closing beads is the user's decision after review and QA gates pass. This is non-negotiable.

---

## Red Flags - Stop and Verify

When you catch yourself thinking:
- "This should work..." → run it and see
- "I assume the field is..." → look at the actual data
- "I'll test it later..." → test it now
- "It's too simple to break..." → verify anyway

---
