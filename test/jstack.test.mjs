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
const allHosts = new Set(['codex', 'cursor', 'pi', 'opencode', 'prime']);
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
  assert.equal(first.leafCount, 57);

  const skillLink = path.join(options.projectRoot, '.agents', 'skills', 'build');
  assert.equal(path.resolve(path.dirname(skillLink), await readlink(skillLink)), path.join(sourceRoot, 'skills', 'build'));
  const referencesLink = path.join(options.projectRoot, '.agents', 'references');
  assert.equal(path.resolve(path.dirname(referencesLink), await readlink(referencesLink)), path.join(sourceRoot, 'references'));
  assert.match(await readFile(path.join(options.projectRoot, '.agents', 'agents', 'explorer.md'), 'utf8'), /inheritSkills: true/);
  assert.match(await readFile(path.join(options.projectRoot, '.codex', 'agents', 'explorer.toml'), 'utf8'), /developer_instructions = /);
  assert.match(await readFile(path.join(options.projectRoot, 'opencode.json'), 'utf8'), /"mode": "subagent"/);
  const primeAdapter = await readFile(
    path.join(options.projectRoot, '.agents', 'skills', 'jstack-subagents', 'SKILL.md'),
    'utf8',
  );
  assert.match(primeAdapter, /description: Prime Agent only/);
  assert.match(primeAdapter, /Runtime guard: use this adapter only inside Prime Agent/);
  assert.match(primeAdapter, /handle = await rlm\(prompt/);
  assert.match(primeAdapter, /agent_message\.send/);
  assert.match(primeAdapter, /receiver_role="parent"/);
  assert.match(primeAdapter, /end the parent turn/);
  assert.match(primeAdapter, /GPT-5\.6 models support the `max` thinking level/);

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


test('installs and diagnoses the Prime RLM subagent adapter without relying on Pi agent discovery', async () => {
  const options = await fixture({ hosts: new Set(['prime']) });
  await install(options);

  const adapterPath = path.join(options.projectRoot, '.agents', 'skills', 'jstack-subagents', 'SKILL.md');
  const adapter = await readFile(adapterPath, 'utf8');
  const manifest = JSON.parse(await readFile(path.join(sourceRoot, 'manifest.json'), 'utf8'));
  for (const role of manifest.subagents) {
    assert.ok(adapter.includes('| `' + role.id + '` |'));
    const promptPath = path.resolve(path.dirname(adapterPath), '..', '..', 'prompts', `${role.id}.md`);
    assert.equal(await readFile(promptPath, 'utf8').then(() => true), true);
  }
  await assert.rejects(lstat(path.join(options.projectRoot, '.agents', 'agents', 'explorer.md')), { code: 'ENOENT' });
  assert.equal((await doctor(options)).healthy, true);

  await writeFile(adapterPath, 'changed');
  const drift = await doctor(options);
  assert.equal(drift.healthy, false);
  assert.ok(drift.problems.includes('Prime subagent adapter'));
});

test('documents asynchronous Prime fan-out and keeps orchestration skills on the shared contract', async () => {
  const conventions = await readFile(path.join(sourceRoot, 'references', 'host-conventions.md'), 'utf8');
  assert.match(conventions, /Prime Agent RLM/);
  assert.match(conventions, /await rlm\(prompt/);
  assert.match(conventions, /Spawn admission is not task completion/);
  assert.match(conventions, /agent_message\.send/);
  assert.match(conventions, /End the parent turn/);
  assert.match(conventions, /GPT-5\.6 models support `max` thinking/);

  const orchestrationSkills = [
    'build',
    'build-epic',
    'grind-to-green',
    'grind-epic',
    'investigate',
    'parallelize',
    'plan',
    'parallel-plan',
    'quick-review',
    'thermos',
  ];
  for (const name of orchestrationSkills) {
    const content = await readFile(path.join(sourceRoot, 'skills', name, 'SKILL.md'), 'utf8');
    assert.match(content, /references\/host-conventions\.md/, `${name} must use the shared host contract`);
  }

  const parallelize = await readFile(path.join(sourceRoot, 'skills', 'parallelize', 'SKILL.md'), 'utf8');
  assert.match(parallelize, /Admit the wave/);
  assert.match(parallelize, /explicit terminal handoff from every admitted worker/);
  assert.doesNotMatch(parallelize, /poll background results|Parallel in one turn/);

  const thermos = await readFile(path.join(sourceRoot, 'skills', 'thermos', 'SKILL.md'), 'utf8');
  assert.match(thermos, /Admit both roles before collecting either result/);
  assert.match(thermos, /Collect both handoffs/);
  assert.doesNotMatch(thermos, /same turn when the host allows|Prefer background\/async/);

  const buildEpic = await readFile(path.join(sourceRoot, 'skills', 'build-epic', 'SKILL.md'), 'utf8');
  assert.match(buildEpic, /Retain the implementer handle and collect its explicit terminal handoff before starting thermos/);
  assert.match(buildEpic, /otherwise spawn a fresh `worker`/);
  assert.match(buildEpic, /Collect the fixer or implementer's explicit terminal handoff/);
  assert.match(buildEpic, /do not re-run thermos against an in-progress fix/);
  assert.doesNotMatch(buildEpic, /\(or resume implementer\)/);
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

test('global CLI install uses stable absolute links and remains healthy and idempotent', async (context) => {
  if (!(await stat(path.join(sourceRoot, '.git'))).isDirectory()) {
    context.skip('requires the stable primary jstack checkout');
    return;
  }
  const home = await mkdtemp(path.join(os.tmpdir(), 'jstack-home-'));
  const cli = path.join(sourceRoot, 'bin', 'jstack.mjs');
  const args = [cli, 'install', '--global', '--hosts', 'cursor,prime'];
  const environment = { ...process.env, HOME: home };
  await execFile(process.execPath, args, { cwd: sourceRoot, env: environment });

  const link = path.join(home, '.agents', 'skills', 'build');
  assert.equal(path.isAbsolute(await readlink(link)), true);
  assert.equal(await readlink(link), path.join(sourceRoot, 'skills', 'build'));
  const referencesLink = path.join(home, '.agents', 'references');
  assert.equal(path.isAbsolute(await readlink(referencesLink)), true);
  assert.equal(await readlink(referencesLink), path.join(sourceRoot, 'references'));

  const primeAdapterPath = path.join(home, '.agents', 'skills', 'jstack-subagents', 'SKILL.md');
  const primeAdapter = await readFile(primeAdapterPath, 'utf8');
  assert.match(primeAdapter, /\.\.\/\.\.\/prompts\/explorer\.md/);
  assert.equal(
    await readFile(path.resolve(path.dirname(primeAdapterPath), '..', '..', 'prompts', 'explorer.md'), 'utf8').then(
      () => true,
    ),
    true,
  );

  const statePath = path.join(home, '.agents', '.jstack-install.json');
  const before = await readFile(statePath, 'utf8');
  await execFile(process.execPath, args, { cwd: sourceRoot, env: environment });
  assert.equal(await readFile(statePath, 'utf8'), before);
  await execFile(process.execPath, [cli, 'doctor', '--global', '--hosts', 'cursor,prime'], {
    cwd: sourceRoot,
    env: environment,
  });
});
