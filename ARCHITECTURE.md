# Aegis Operator — architecture

Aegis separates model judgement from deterministic runtime responsibilities.

## Control flow

```text
Owner task
   ↓
Acceptance contract
   ↓
Task strategy
   ↓
Deterministic compiler
   ↓
Jobs + required capabilities
   ↓
Worker routing
   ↓
Execution
   ↓
Evidence collection
   ↓
Acceptance: pass / fail / unverifiable
   ↓
Replan or owner review
```

## 1. Contract layer

The first durable artifact is not a plan but an acceptance contract. Each item needs a claim and something that makes the claim checkable: a command, an evidence path, or another explicit basis for judgement. A contract item that cannot be checked should not silently become a pass.

See [`src/contract.js`](src/contract.js).

## 2. Strategy and compilation

The strategy describes the character of the work — research, exploration, implementation, verification, freshness requirements, review depth — without choosing a specific provider.

A deterministic compiler turns that strategy into ordered job intents and required capabilities. This keeps provider choice and high-level reasoning separate.

See [`src/strategy-compiler.js`](src/strategy-compiler.js).

## 3. Worker routing

Workers expose capabilities. Jobs are routed only to workers that can physically perform the requested work. Text/research work and repository/shell work can therefore use different classes of worker.

Fallback is constrained by the risk of repeating work: retrying a read-only judgement is not the same as repeating a file mutation or external send.

See [`src/worker-router.js`](src/worker-router.js).

## 4. Evidence and acceptance

Aegis does not use the worker's own completion report as the primary proof of completion.

Mechanical checks are facts: a non-zero exit code stays a failure. Evidence files are collected explicitly. If a requested evidence path is missing, the collector can surface relevant changed files rather than pretending nothing happened.

See [`src/evidence.js`](src/evidence.js).

## 5. Loop protection

Repeated work is fingerprinted from the observed workspace state and step text. This looks trivial in code, but the boundary matters: observability data must not mutate the state being hashed, or the detector defeats itself.

See [`src/loop-guard.js`](src/loop-guard.js).

## 6. Environment boundary

Checks and generated commands are treated as untrusted child execution. They receive a copy of the environment with sensitive-looking variable names removed rather than the ambient process environment.

See [`src/safe-env.js`](src/safe-env.js).

## 7. Owner control

The system is designed around owner-in-the-loop control rather than pretending every action should be autonomous. The owner can pause, redirect, reject, request revisions and make the final acceptance decision. Sensitive or ambiguous actions are expected to escalate rather than be guessed.

## Reliability principles

- Do not convert missing evidence into success.
- Do not let a model overrule a failing mechanical check.
- Do not retry mutating work merely because a provider failed ambiguously.
- Do not mix live-research requirements with repository capabilities when no single worker can satisfy both.
- Do not give generated checks the ambient environment.
- Do not reclaim ambiguous resources as if their owner were certainly dead.
- Replan after repeated failure instead of repeating the same tactic forever.

This repository intentionally publishes representative paths rather than the complete private development history.
