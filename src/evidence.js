const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { scrubbedEnv } = require('./safe-env');

const POSIX_SHELL_CANDIDATES = [
  process.env.OPERATOR_CHECK_SHELL,
  process.env.SHELL,
  'C:\\Program Files\\Git\\bin\\bash.exe',
  'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
  '/bin/bash',
  '/usr/bin/bash',
  '/bin/sh'
];

let cachedShell;

function resolveCheckShell() {
  if (cachedShell !== undefined) return cachedShell;
  for (const candidate of POSIX_SHELL_CANDIDATES) {
    if (!candidate) continue;
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        cachedShell = path.resolve(candidate);
        return cachedShell;
      }
    } catch {
      // Try the next candidate.
    }
  }
  cachedShell = true;
  return cachedShell;
}

function runCheck(workspace, item, timeoutMs, shell) {
  const result = spawnSync(item.check.cmd, {
    cwd: workspace.root,
    shell,
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 4 * 1024 * 1024,
    env: scrubbedEnv().env
  });
  const timedOut = result.error != null && result.error.code === 'ETIMEDOUT';
  return {
    itemId: item.id,
    cmd: item.check.cmd,
    exitCode: timedOut ? -1 : (result.status == null ? -1 : result.status),
    stdout: result.stdout || '',
    stderr: result.stderr || (result.error ? String(result.error.message) : ''),
    timedOut
  };
}

function readEvidenceFile(workspace, itemId, relPath, maxFileBytes) {
  let full;
  try {
    full = workspace.resolve(relPath);
  } catch (error) {
    return { itemId, path: relPath, exists: false, content: null, truncated: false, error: error.message };
  }
  if (!fs.existsSync(full)) {
    return { itemId, path: relPath, exists: false, content: null, truncated: false };
  }
  if (fs.statSync(full).isDirectory()) {
    let entries = [];
    try {
      entries = fs.readdirSync(full).slice(0, 50);
    } catch {
      entries = [];
    }
    return { itemId, path: relPath, exists: true, kind: 'directory', entries, content: null, truncated: false };
  }
  if (!fs.statSync(full).isFile()) {
    return { itemId, path: relPath, exists: false, content: null, truncated: false };
  }
  const raw = fs.readFileSync(full, 'utf8');
  const truncated = raw.length > maxFileBytes;
  return { itemId, path: relPath, exists: true, content: truncated ? raw.slice(0, maxFileBytes) : raw, truncated };
}

const READABLE = /\.(?:js|mjs|cjs|jsx|ts|tsx|vue|svelte|css|scss|html|md|json|txt|py|rb|go|rs|java|cs|php|sh|yml|yaml)$/i;
const MAX_FALLBACK_FILES = 10;

function collectEvidence({ workspace, contract, before, after, timeoutMs = 3 * 60 * 1000, maxFileBytes = 64 * 1024, shell = resolveCheckShell() }) {
  const checks = [];
  const files = [];
  for (const item of contract.items) {
    if (item.check) checks.push(runCheck(workspace, item, timeoutMs, shell));
    for (const relPath of item.evidenceRequired) {
      files.push(readEvidenceFile(workspace, item.id, relPath, maxFileBytes));
    }
  }
  const listing = (after?.entries || []).map((entry) => ({ path: entry.path, size: entry.size }));
  const diff = workspace.diff(before, after);

  const missing = files.some((file) => file.exists === false);
  if (missing) {
    const shown = new Set(files.map((file) => file.path));
    const changed = [...(diff.added || []), ...(diff.modified || [])]
      .filter((relPath) => !shown.has(relPath) && READABLE.test(relPath))
      .slice(0, MAX_FALLBACK_FILES);
    for (const relPath of changed) {
      files.push({ ...readEvidenceFile(workspace, 'changed by work', relPath, maxFileBytes), fallback: true });
    }
  }

  return { checks, files, diff, workspace: listing };
}

module.exports = { collectEvidence, resolveCheckShell };
