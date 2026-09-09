# Worker routing

Aegis separates **what a job needs** from **which provider should execute it**.

A strategy is compiled into jobs with explicit required capabilities. The router then chooses among workers that can actually satisfy those capabilities.

## Capability classes

Typical text-side capabilities include research, brainstorming and writing. Repository-side capabilities include filesystem access, shell, tests, git and verified CLI work.

A job that genuinely requires fresh live research should not be silently routed to a coding worker without network access. Likewise, a repository mutation should not be handed to a text-only worker just because the model sounds confident.

## Why fallback is conservative

Provider failure does not automatically mean “try the same action somewhere else.”

Read-only judgement can often be retried safely. File mutations, external sends and other side effects may not be safe to repeat after an ambiguous failure. The published [`src/worker-router.js`](../src/worker-router.js) therefore makes retry policy explicit.

## Strategy compiler

[`src/strategy-compiler.js`](../src/strategy-compiler.js) applies deterministic rules to a validated strategy. Among other things it can:

- add exploration when the task is open-ended;
- add resource discovery when external material materially affects quality;
- add verification when review depth requires it;
- require live research when freshness is mandatory;
- reject impossible single-job capability combinations instead of routing them optimistically.

The key boundary is that the model can propose the nature of the work, while executable job shape remains inspectable and deterministic.
