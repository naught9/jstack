#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertGlobalSource, HOSTS, JstackError } from '../lib/core.mjs';
import { doctor, install } from '../lib/installer.mjs';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function usage() {
  return [
    'Usage:',
    '  node bin/jstack.mjs install [--project-root PATH | --global]',
    '    [--hosts codex,cursor,pi,opencode] [--with-mcp] [--force]',
    '  node bin/jstack.mjs doctor [--project-root PATH | --global]',
    '    [--hosts codex,cursor,pi,opencode] [--with-mcp]',
  ].join('\n');
}

function parseArgs(argv) {
  const command = argv.shift();
  if (!['install', 'doctor'].includes(command)) throw new JstackError(usage());
  let projectRoot = process.cwd();
  let projectRootExplicit = false;
  let global = false;
  let hosts = new Set(HOSTS);
  let withMcp = false;
  let force = false;

  while (argv.length > 0) {
    const arg = argv.shift();
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    } else if (arg === '--global') {
      global = true;
    } else if (arg === '--project-root') {
      if (argv.length === 0) throw new JstackError('--project-root requires a path.');
      projectRoot = path.resolve(argv.shift());
      projectRootExplicit = true;
    } else if (arg === '--hosts') {
      if (argv.length === 0) throw new JstackError('--hosts requires a comma-separated list.');
      const requested = argv.shift().split(',').filter(Boolean);
      const invalid = requested.filter((host) => !HOSTS.includes(host));
      if (requested.length === 0 || invalid.length > 0) {
        throw new JstackError(`Invalid hosts: ${invalid.join(', ') || '(empty)'}. Supported: ${HOSTS.join(', ')}`);
      }
      hosts = new Set(requested);
    } else if (arg === '--with-mcp') {
      withMcp = true;
    } else if (arg === '--force' && command === 'install') {
      force = true;
    } else {
      throw new JstackError(`Unknown option: ${arg}\n\n${usage()}`);
    }
  }
  if (global && projectRootExplicit) throw new JstackError('--global and --project-root are mutually exclusive.');
  return { command, sourceRoot, projectRoot, global, hosts, withMcp, force };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.global) await assertGlobalSource(sourceRoot);
  if (options.command === 'install') {
    const result = await install(options);
    console.log(
      `[jstack] Installed ${result.leafCount} assets from ${result.revision.revision}${
        result.revision.dirty ? ' (dirty)' : ''
      }.`,
    );
    if (!options.withMcp) console.log('[jstack] MCP runtime configuration unchanged; use --with-mcp to merge it.');
    if (result.backups > 0) console.log(`[jstack] Backed up ${result.backups} conflicting path(s).`);
    return;
  }

  const result = await doctor(options);
  console.log(result.lines.join('\n'));
  if (!result.healthy) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = error instanceof JstackError ? error.exitCode : 2;
});
