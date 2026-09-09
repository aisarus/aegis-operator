# Aegis Operator

Aegis is a local autonomous operator for AI-assisted development. It turns an ambiguous goal into an acceptance contract, strategy, jobs, worker routing, evidence, replanning and owner review.

The core idea: **models can reason, while checkable facts, limits and acceptance state stay deterministic whenever possible.**

## Public source snapshot

This repository is a curated, runnable source snapshot focused on the architecture and runtime paths that best explain the system. It is deliberately smaller than the working development tree: the goal here is inspectable evidence, not a dump of every integration, experiment and historical artifact.

```text
GOAL → CONTRACT → STRATEGY → JOBS → ROUTING → EVIDENCE → ACCEPT / REJECT → REPLAN → OWNER REVIEW
```

Start here:

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — current system boundaries and control flow.
- [`docs/routing.md`](docs/routing.md) — capability-based worker routing.
- [`src/contract.js`](src/contract.js) — acceptance contracts must be verifiable.
- [`src/strategy-compiler.js`](src/strategy-compiler.js) — deterministic strategy → job-intent compilation.
- [`src/worker-router.js`](src/worker-router.js) — conservative fallback semantics.
- [`src/evidence.js`](src/evidence.js) — mechanical checks and evidence collection.
- [`src/loop-guard.js`](src/loop-guard.js) — repeated-step fingerprinting.
- [`src/safe-env.js`](src/safe-env.js) — environment isolation for generated checks.
- [`tests/`](tests/) — regression tests for the published paths.
- [`SECURITY.md`](SECURITY.md) — public/runtime boundary.

The published subset has no third-party runtime dependencies. Run its regression tests with:

```bash
npm test
```

## Engineering stories

Three incidents shaped the design more than any test-count scoreboard:

**Observability changed the state it was observing.** A ledger originally lived inside the workspace used for loop detection. Writing observability data changed the workspace hash, so repeated work stopped looking repeated. The ledger was moved outside the observed state and the invariant was covered by regression tests.

**A provider-limit diagnosis was actually a lifecycle bug.** A session flag was updated before launch arguments were calculated, so the first call attempted to resume a conversation that did not exist. A fallback provider happened to be rate-limited, producing a plausible but wrong top-level diagnosis. The fix changed lifecycle ordering and was verified through a live continuation flow plus regression coverage.

**A crashed process could leave budget reserved.** Recovery logic was changed to distinguish live, dead and unknown holders. Resources are reclaimed only when their owner is proven dead; ambiguous state remains conservative.

## My role

A substantial amount of implementation code was produced with coding agents. I own the product concept, architecture and constraints, task decomposition, agent direction, review, failure diagnosis, verification design and iteration.

That is intentional: Aegis is an AI-native engineering project, not an attempt to pretend every line was typed manually.

## Non-claims

Aegis is actively developed engineering work, not a claim that autonomous software development is solved. This public snapshot is for architecture and source inspection; it is not packaged as a standalone production release.

---

**Arseniy Perel** · AI Product Builder / AI Automation / Rapid Prototyping  
[GitHub profile](https://github.com/aisarus) · [Portfolio source](https://github.com/aisarus/arseny-portfolio)
