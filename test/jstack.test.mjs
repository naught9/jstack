import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { lstat, mkdir, mkdtemp, readFile, readlink, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JstackError } from '../lib/core.mjs';
import { doctor, install } from '../lib/installer.mjs';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const allHosts = new Set(['codex', 'cursor', 'pi', 'opencode']);
const execFile = promisify(execFileCallback);

async function fixture(options = {}) {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'jstack-test-'));
  return {
    sourceRoot,
    projectRoot,
    global: false,
    hosts: allHosts,
    withMcp: false,
    force: false,
    ...options,
  };
}

test('installs every v1 host idempotently and doctor reports healthy assets', async () => {
  const options = await fixture();
  const first = await install(options);
  assert.equal(first.leafCount, 50);

  const skillLink = path.join(options.projectRoot, '.agents', 'skills', 'build');
  assert.equal(path.resolve(path.dirname(skillLink), await readlink(skillLink)), path.join(sourceRoot, 'skills', 'build'));
  assert.match(await readFile(path.join(options.projectRoot, '.agents', 'agents', 'explorer.md'), 'utf8'), /inheritSkills: true/);
  assert.match(await readFile(path.join(options.projectRoot, '.codex', 'agents', 'explorer.toml'), 'utf8'), /developer_instructions = /);
  assert.match(await readFile(path.join(options.projectRoot, 'opencode.json'), 'utf8'), /"mode": "subagent"/);

  const statePath = path.join(options.projectRoot, '.agents', '.jstack-install.json');
  const before = await readFile(statePath, 'utf8');
  const stateMtime = (await stat(statePath)).mtimeMs;
  const openCodePath = path.join(options.projectRoot, 'opencode.json');
  const openCodeMtime = (await stat(openCodePath)).mtimeMs;
  await install(options);
  assert.equal(await readFile(statePath, 'utf8'), before);
  assert.equal((await stat(statePath)).mtimeMs, stateMtime);
  assert.equal((await stat(openCodePath)).mtimeMs, openCodeMtime);

  const result = await doctor(options);
  assert.equal(result.healthy, true);
  assert.ok(result.lines.some((line) => line.startsWith('[optional] Codex MCP')));
});

test('merges MCP and OpenCode JSONC without losing unrelated content', async () => {
  const options = await fixture({ withMcp: true });
  const opencodePath = path.join(options.projectRoot, 'opencode.json');
  await writeFile(
    opencodePath,
    [
      '{',
      '  // preserved comment',
      '  "theme": "dark",',
      '  "agent": {',
      '    "custom": { "mode": "all" },',
      '  },',
      '}',
      '',
    ].join('\n'),
  );
  await writeFile(
    path.join(options.projectRoot, '.mcp.json'),
    JSON.stringify({
      mcpServers: {
        linear: {
          type: 'http',
          url: 'https://mcp.linear.app/mcp',
          directTools: ['list_issues'],
        },
      },
    }),
  );

  await install(options);
  const opencode = await readFile(opencodePath, 'utf8');
  assert.match(opencode, /preserved comment/);
  assert.match(opencode, /"custom": \{ "mode": "all" \}/);
  assert.match(opencode, /"type": "remote"/);
  assert.match(opencode, /"command": \[/);

  const piMcp = JSON.parse(await readFile(path.join(options.projectRoot, '.mcp.json'), 'utf8'));
  assert.deepEqual(piMcp.mcpServers.linear.directTools, ['list_issues']);
  assert.equal((await doctor(options)).healthy, true);
});

test('refuses user-owned conflicts and force backs them up', async () => {
  const options = await fixture({ hosts: new Set(['codex']) });
  const target = path.join(options.projectRoot, '.agents', 'skills', 'build');
  await writeFile(target, 'user owned', { recursive: true }).catch(async () => {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, 'user owned');
  });

  await assert.rejects(install(options), (error) => error instanceof JstackError && error.exitCode === 1);
  await install({ ...options, force: true });
  assert.equal((await lstat(target)).isSymbolicLink(), true);
  const backupsRoot = path.join(options.projectRoot, '.agents', '.jstack-backups');
  assert.equal((await stat(backupsRoot)).isDirectory(), true);
});

test('preserves compatible unmanaged Codex MCP and rejects conflicting tables', async () => {
  const options = await fixture({ hosts: new Set(['codex']), withMcp: true });
  const configPath = path.join(options.projectRoot, '.codex', 'config.toml');
  const { mkdir } = await import('node:fs/promises');
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, '[mcp_servers."linear"]\nurl = "https://mcp.linear.app/mcp"\n');
  await install(options);
  const compatible = await readFile(configPath, 'utf8');
  assert.equal(compatible.match(/mcp_servers\."linear"/g)?.length, 1);

  const conflictOptions = await fixture({ hosts: new Set(['codex']), withMcp: true });
  const conflictPath = path.join(conflictOptions.projectRoot, '.codex', 'config.toml');
  await mkdir(path.dirname(conflictPath), { recursive: true });
  await writeFile(
    conflictPath,
    '[mcp_servers."linear"]\nurl = "https://wrong.example/mcp"\n\n[features]\nsearch = true\n',
  );
  await assert.rejects(install(conflictOptions), (error) => error instanceof JstackError && error.exitCode === 1);
  await install({ ...conflictOptions, force: true });
  const forced = await readFile(conflictPath, 'utf8');
  assert.doesNotMatch(forced, /wrong\.example/);
  assert.match(forced, /https:\/\/mcp\.linear\.app\/mcp/);
  assert.match(forced, /\[features\]\nsearch = true/);
});

test('doctor detects broken generated assets', async () => {
  const options = await fixture({ hosts: new Set(['pi']) });
  await install(options);
  await writeFile(path.join(options.projectRoot, '.agents', 'agents', 'worker.md'), 'changed');
  const result = await doctor(options);
  assert.equal(result.healthy, false);
  assert.ok(result.problems.includes('Pi agent worker'));
});

test('preflights MCP conflicts before creating shared assets', async () => {
  const options = await fixture({ hosts: new Set(['pi']), withMcp: true });
  await writeFile(
    path.join(options.projectRoot, '.mcp.json'),
    JSON.stringify({ mcpServers: { linear: { type: 'http', url: 'https://wrong.example/mcp' } } }),
  );

  await assert.rejects(install(options), (error) => error instanceof JstackError && error.exitCode === 1);
  await assert.rejects(lstat(path.join(options.projectRoot, '.agents')), { code: 'ENOENT' });
});

test('rejects duplicate IDs, escaping paths, malformed frontmatter, and invalid MCP shapes', async () => {
  const invalidSource = await mkdtemp(path.join(os.tmpdir(), 'jstack-source-'));
  await mkdir(path.join(invalidSource, 'skills', 'one'), { recursive: true });
  await mkdir(path.join(invalidSource, '.agents'), { recursive: true });
  await writeFile(path.join(invalidSource, 'skills', 'one', 'SKILL.md'), 'missing frontmatter');
  await writeFile(path.join(invalidSource, '.agents', '.mcp.json'), JSON.stringify({ mcpServers: {} }));
  const manifest = {
    version: 4,
    updatedAt: '2026-07-13T00:00:00Z',
    mcp: { path: '.agents/.mcp.json' },
    skills: [
      { id: 'one', path: 'skills/one/SKILL.md' },
      { id: 'one', path: 'skills/one/SKILL.md' },
    ],
    subagents: [],
  };
  await writeFile(path.join(invalidSource, 'manifest.json'), JSON.stringify(manifest));
  const options = await fixture({ sourceRoot: invalidSource });
  await assert.rejects(install(options), /Missing YAML frontmatter/);

  await writeFile(path.join(invalidSource, 'skills', 'one', 'SKILL.md'), '---\nname: one\ndescription: test\n---\nbody\n');
  await assert.rejects(install(options), /Duplicate skill id/);
  manifest.skills = [{ id: 'one', path: '../outside.md' }];
  await writeFile(path.join(invalidSource, 'manifest.json'), JSON.stringify(manifest));
  await assert.rejects(install(options), /escapes the source root/);
  manifest.skills = [{ id: 'one', path: 'skills/one/SKILL.md' }];
  await writeFile(
    path.join(invalidSource, '.agents', '.mcp.json'),
    JSON.stringify({ mcpServers: { bad: { command: 'node', args: [42] } } }),
  );
  await writeFile(path.join(invalidSource, 'manifest.json'), JSON.stringify(manifest));
  await assert.rejects(install(options), /Invalid MCP server definition/);
});

test('global CLI install uses stable absolute links under an isolated home', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'jstack-home-'));
  await execFile(process.execPath, [path.join(sourceRoot, 'bin', 'jstack.mjs'), 'install', '--global', '--hosts', 'cursor'], {
    cwd: sourceRoot,
    env: { ...process.env, HOME: home },
  });
  const link = path.join(home, '.agents', 'skills', 'build');
  assert.equal(path.isAbsolute(await readlink(link)), true);
  assert.equal(await readlink(link), path.join(sourceRoot, 'skills', 'build'));
});
