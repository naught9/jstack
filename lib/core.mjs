import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  lstat,
  mkdir,
  readFile,
  readlink,
  realpath,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const HOSTS = ['codex', 'cursor', 'pi', 'opencode'];

export class JstackError extends Error {
  constructor(message, exitCode = 2) {
    super(message);
    this.exitCode = exitCode;
  }
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function parseFrontmatter(content, filePath) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new JstackError(`Missing YAML frontmatter: ${filePath}`);
  }

  const frontmatter = match[1];
  const nameMatch = frontmatter.match(/^name:\s*(.+?)\s*$/m);
  const descriptionMatch = frontmatter.match(/^description:\s*(.*)$/m);
  if (!nameMatch || !descriptionMatch) {
    throw new JstackError(`Frontmatter must define name and description: ${filePath}`);
  }

  let description = descriptionMatch[1].trim();
  if (description === '>-' || description === '>' || description === '|-' || description === '|') {
    const lines = frontmatter.split(/\r?\n/);
    const start = lines.findIndex((line) => line.startsWith('description:')) + 1;
    const values = [];
    for (let index = start; index < lines.length; index += 1) {
      const line = lines[index];
      if (line && !/^\s/.test(line)) break;
      values.push(line.trim());
    }
    description = values.join(description.startsWith('|') ? '\n' : ' ').trim();
  } else if (description.startsWith('"')) {
    description = JSON.parse(description);
  }

  return {
    name: nameMatch[1].trim().replace(/^['"]|['"]$/g, ''),
    description,
    body: match[2].replace(/^\r?\n/, ''),
  };
}

export async function pathExists(filePath) {
  try {
    await lstat(filePath);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

export async function loadSource(sourceRoot) {
  const manifestPath = path.join(sourceRoot, 'manifest.json');
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    throw new JstackError(`Could not read ${manifestPath}: ${error.message}`);
  }

  const manifestKeys = new Set(['$schema', 'version', 'updatedAt', 'mcp', 'skills', 'subagents']);
  if (Object.keys(manifest).some((key) => !manifestKeys.has(key))) {
    throw new JstackError('manifest.json contains unsupported properties.');
  }
  if (
    manifest.version !== 4 ||
    typeof manifest.updatedAt !== 'string' ||
    Number.isNaN(Date.parse(manifest.updatedAt)) ||
    !Array.isArray(manifest.skills) ||
    !Array.isArray(manifest.subagents)
  ) {
    throw new JstackError('manifest.json must use version 4 with skills and subagents arrays.');
  }
  if (
    !manifest.mcp ||
    typeof manifest.mcp.path !== 'string' ||
    Object.keys(manifest.mcp).some((key) => key !== 'path')
  ) {
    throw new JstackError('manifest.json must define mcp.path.');
  }

  const validateEntries = async (entries, kind) => {
    const ids = new Set();
    const result = [];
    for (const entry of entries) {
      if (
        !entry ||
        Object.keys(entry).some((key) => !['id', 'path'].includes(key)) ||
        typeof entry.id !== 'string' ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) ||
        typeof entry.path !== 'string'
      ) {
        throw new JstackError(`Invalid ${kind} manifest entry.`);
      }
      if (ids.has(entry.id)) throw new JstackError(`Duplicate ${kind} id: ${entry.id}`);
      ids.add(entry.id);
      if (path.isAbsolute(entry.path)) throw new JstackError(`${kind} path must be relative: ${entry.path}`);
      const filePath = path.resolve(sourceRoot, entry.path);
      if (!filePath.startsWith(`${path.resolve(sourceRoot)}${path.sep}`)) {
        throw new JstackError(`${kind} path escapes the source root: ${entry.path}`);
      }
      if (!(await pathExists(filePath))) throw new JstackError(`Missing ${kind} source: ${entry.path}`);
      const parsed = parseFrontmatter(await readFile(filePath, 'utf8'), filePath);
      if (parsed.name !== entry.id) {
        throw new JstackError(`${kind} id ${entry.id} does not match frontmatter name ${parsed.name}.`);
      }
      result.push({ ...entry, filePath, ...parsed });
    }
    return result;
  };

  if (path.isAbsolute(manifest.mcp.path)) throw new JstackError('mcp.path must be relative.');
  const mcpPath = path.resolve(sourceRoot, manifest.mcp.path);
  if (!mcpPath.startsWith(`${path.resolve(sourceRoot)}${path.sep}`)) {
    throw new JstackError('mcp.path must stay within the source root.');
  }
  let mcp;
  try {
    mcp = JSON.parse(await readFile(mcpPath, 'utf8'));
  } catch (error) {
    throw new JstackError(`Could not read MCP source ${manifest.mcp.path}: ${error.message}`);
  }
  if (!mcp.mcpServers || typeof mcp.mcpServers !== 'object' || Array.isArray(mcp.mcpServers)) {
    throw new JstackError('MCP source must define an mcpServers object.');
  }
  for (const [id, server] of Object.entries(mcp.mcpServers)) {
    const remote =
      server?.type === 'http' &&
      typeof server.url === 'string' &&
      server.url.length > 0 &&
      server.command === undefined &&
      server.args === undefined;
    const local =
      server?.url === undefined &&
      typeof server?.command === 'string' &&
      server.command.length > 0 &&
      Array.isArray(server.args ?? []) &&
      (server.args ?? []).every((argument) => typeof argument === 'string');
    if (!remote && !local) throw new JstackError(`Invalid MCP server definition: ${id}`);
  }

  return {
    manifest,
    skills: await validateEntries(manifest.skills, 'skill'),
    subagents: await validateEntries(manifest.subagents, 'subagent'),
    mcp,
    mcpPath,
  };
}

export function sourceRevision(sourceRoot) {
  try {
    const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: sourceRoot, encoding: 'utf8' }).trim();
    const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: sourceRoot, encoding: 'utf8' }).trim();
    return { revision, dirty: Boolean(dirty) };
  } catch {
    return { revision: 'unknown', dirty: true };
  }
}

export async function assertGlobalSource(sourceRoot) {
  try {
    const git = await stat(path.join(sourceRoot, '.git'));
    if (!git.isDirectory()) throw new Error('not a primary checkout');
  } catch {
    throw new JstackError(
      '--global must be run from the stable primary jstack checkout, not a submodule or worktree.',
    );
  }
}

export function targetsFor({ global, projectRoot }) {
  const home = os.homedir();
  const root = global ? home : projectRoot;
  return {
    root,
    agentsRoot: path.join(root, '.agents'),
    cursorRoot: path.join(root, '.cursor'),
    codexRoot: path.join(root, '.codex'),
    opencodeConfig: global
      ? path.join(home, '.config', 'opencode', 'opencode.json')
      : path.join(root, 'opencode.json'),
    piMcp: global ? path.join(home, '.config', 'mcp', 'mcp.json') : path.join(root, '.mcp.json'),
    cursorMcp: path.join(root, '.cursor', 'mcp.json'),
    codexConfig: path.join(root, '.codex', 'config.toml'),
  };
}

export function relativeStatePath(root, filePath) {
  const relative = path.relative(root, filePath);
  return relative.startsWith('..') ? filePath : relative;
}

export async function loadState(targets) {
  const statePath = path.join(targets.agentsRoot, '.jstack-install.json');
  if (!(await pathExists(statePath))) return { statePath, state: { version: 1, entries: {} } };
  try {
    const state = JSON.parse(await readFile(statePath, 'utf8'));
    if (state.version !== 1 || typeof state.entries !== 'object') throw new Error('unsupported state');
    return { statePath, state };
  } catch (error) {
    throw new JstackError(`Invalid jstack install state: ${error.message}`);
  }
}

export async function atomicWrite(filePath, content) {
  if (await pathExists(filePath)) {
    const info = await lstat(filePath);
    if (info.isFile() && (await readFile(filePath, 'utf8')) === content) return false;
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tempPath, content);
  await rename(tempPath, filePath);
  return true;
}

export async function inspectLeaf(item, previousEntry) {
  if (!(await pathExists(item.path))) return { status: 'missing' };
  const info = await lstat(item.path);
  if (item.kind === 'symlink') {
    if (!info.isSymbolicLink()) return { status: previousEntry ? 'owned-drift' : 'conflict' };
    const physicalParent = await realpath(path.dirname(item.path));
    const current = path.resolve(physicalParent, await readlink(item.path));
    const expected = await realpath(item.target);
    return current === expected ? { status: 'ok' } : { status: previousEntry ? 'owned-drift' : 'conflict' };
  }
  if (!info.isFile()) return { status: previousEntry ? 'owned-drift' : 'conflict' };
  const content = await readFile(item.path, 'utf8');
  if (content === item.content) return { status: 'ok' };
  return { status: previousEntry ? 'owned-drift' : 'conflict', actualHash: sha256(content) };
}

export async function backupPath(filePath, targets, timestamp) {
  const relative = relativeStatePath(targets.root, filePath).replace(/^\.\.[/\\]/g, 'external/');
  const destination = path.join(targets.agentsRoot, '.jstack-backups', timestamp, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await rename(filePath, destination);
  return destination;
}

export async function applyLeaf(item) {
  await mkdir(path.dirname(item.path), { recursive: true });
  if (await pathExists(item.path)) await rm(item.path, { recursive: true, force: true });
  if (item.kind === 'symlink') {
    const physicalParent = await realpath(path.dirname(item.path));
    const physicalTarget = await realpath(item.target);
    const target = item.relative === false ? physicalTarget : path.relative(physicalParent, physicalTarget) || '.';
    await symlink(target, item.path, 'dir');
  } else {
    await atomicWrite(item.path, item.content);
  }
}

export async function leafState(item, targets) {
  return item.kind === 'symlink'
    ? { kind: 'symlink', target: path.resolve(item.target) }
    : { kind: 'file', sha256: sha256(item.content) };
}

export async function staleEntryStatus(filePath, entry) {
  if (!(await pathExists(filePath))) return 'missing';
  const info = await lstat(filePath);
  if (entry.kind === 'symlink' && info.isSymbolicLink()) {
    const physicalParent = await realpath(path.dirname(filePath));
    const target = path.resolve(physicalParent, await readlink(filePath));
    const expected = await realpath(entry.target);
    return target === expected ? 'owned' : 'modified';
  }
  if (entry.kind === 'file' && info.isFile()) {
    return sha256(await readFile(filePath)) === entry.sha256 ? 'owned' : 'modified';
  }
  return 'modified';
}

export async function resolvedLink(filePath) {
  return realpath(filePath);
}
