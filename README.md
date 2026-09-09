# Aegis Operator

Aegis is a local autonomous operator for AI-assisted development. It turns an ambiguous goal into an acceptance contract, strategy, jobs, worker routing, evidence, replanning and owner review.

The core idea: models can reason, while checkable facts, limits and acceptance state stay deterministic whenever possible.

## Public source snapshot

This repository is a curated source snapshot focused on the architecture and representative runtime paths that explain the system. It includes selected modules, matching regression tests and engineering notes.

```text
GOAL → CONTRACT → STRATEGY → JOBS → ROUTING → EVIDENCE → ACCEPT / REJECT → REPLAN → OWNER REVIEW
```

Key paths:

- `ARCHITECTURE.md` — system boundaries.
- `docs/routing.md` — worker and capability routing.
- `src/contract.js` — acceptance contracts.
- `src/strategy-compiler.js` and `src/mission-compiler.js` — compiling intent into executable work.
- `src/worker-router.js` — capability-based routing.
- `src/evidence.js` and `src/baseline-acceptor.js` — evidence and acceptance.
- `src/loop-guard.js`, `src/shared-lock.js`, `src/worktree.js` — reliability boundaries.
- `src/safe-env.js` — environment isolation.
- `tests/` — regression tests for the published paths.

## Engineering stories

Three incidents shaped the design: observability data once changed the workspace state used by loop detection; a provider-limit diagnosis turned out to be a session-lifecycle ordering bug; and crashed processes could leave budget reserved until recovery logic learned to distinguish live, dead and unknown holders.

## My role

A substantial amount of implementation code was produced with coding agents. I own the product concept, architecture and constraints, task decomposition, agent direction, review, failure diagnosis, verification design and iteration.

Aegis is actively developed engineering work, not a claim that autonomous software development is solved. This public snapshot is intended for source inspection rather than as a standalone production release.

**Arseniy Perel** · AI Product Builder / AI Automation / Rapid Prototyping

[GitHub profile](https://github.com/aisarus) · [Portfolio source](https://github.com/aisarus/arseny-portfolio)
