import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { atomicWrite, JstackError, pathExists, sha256 } from './core.mjs';

function tokenizeJsonc(text) {
  const tokens = [];
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === '/' && text[index + 1] === '/') {
      index += 2;
      while (index < text.length && text[index] !== '\n') index += 1;
      continue;
    }
    if (char === '/' && text[index + 1] === '*') {
      const end = text.indexOf('*/', index + 2);
      if (end === -1) throw new JstackError('Unterminated JSONC block comment.');
      index = end + 2;
      continue;
    }
    if ('{}[]:,'.includes(char)) {
      tokens.push({ type: char, start: index, end: index + 1 });
      index += 1;
      continue;
    }
    if (char === '"') {
      const start = index;
      index += 1;
      while (index < text.length) {
        if (text[index] === '\\') index += 2;
        else if (text[index] === '"') {
          index += 1;
          break;
        } else index += 1;
      }
      const raw = text.slice(start, index);
      tokens.push({ type: 'string', start, end: index, value: JSON.parse(raw) });
      continue;
    }
    const start = index;
    while (index < text.length && !/[\s{}\[\]:,]/.test(text[index])) index += 1;
    tokens.push({ type: 'primitive', start, end: index, value: text.slice(start, index) });
  }
  return tokens;
}

function parseJsoncAst(text) {
  const tokens = tokenizeJsonc(text);
  let cursor = 0;
  const peek = () => tokens[cursor];
  const take = (type) => {
    const token = tokens[cursor];
    if (!token || token.type !== type) throw new JstackError(`Invalid JSONC near offset ${token?.start ?? text.length}.`);
    cursor += 1;
    return token;
  };

  const parseValue = () => {
    const token = peek();
    if (!token) throw new JstackError('Unexpected end of JSONC.');
    if (token.type === '{') {
      const open = take('{');
      const properties = [];
      while (peek()?.type !== '}') {
        const key = take('string');
        take(':');
        const value = parseValue();
        const property = { key: key.value, keyStart: key.start, start: key.start, value };
        if (peek()?.type === ',') property.commaAfter = take(',');
        properties.push(property);
        if (!property.commaAfter && peek()?.type !== '}') throw new JstackError('Expected comma in JSONC object.');
      }
      const close = take('}');
      for (let index = 1; index < properties.length; index += 1) {
        properties[index].commaBefore = properties[index - 1].commaAfter;
      }
      return { type: 'object', start: open.start, end: close.end, closeStart: close.start, properties };
    }
    if (token.type === '[') {
      const open = take('[');
      while (peek()?.type !== ']') {
        parseValue();
        if (peek()?.type === ',') take(',');
        else if (peek()?.type !== ']') throw new JstackError('Expected comma in JSONC array.');
      }
      const close = take(']');
      return { type: 'array', start: open.start, end: close.end };
    }
    cursor += 1;
    return { type: 'scalar', start: token.start, end: token.end };
  };

  const root = parseValue();
  if (root.type !== 'object' || cursor !== tokens.length) throw new JstackError('OpenCode config must be one JSON object.');
  return root;
}

function jsoncToJson(text) {
  let output = '';
  let index = 0;
  let inString = false;
  while (index < text.length) {
    const char = text[index];
    if (inString) {
      output += char;
      if (char === '\\') {
        output += text[index + 1] ?? '';
        index += 2;
        continue;
      }
      if (char === '"') inString = false;
      index += 1;
      continue;
    }
    if (char === '"') {
      inString = true;
      output += char;
      index += 1;
      continue;
    }
    if (char === '/' && text[index + 1] === '/') {
      while (index < text.length && text[index] !== '\n') index += 1;
      continue;
    }
    if (char === '/' && text[index + 1] === '*') {
      index += 2;
      while (index < text.length && !(text[index] === '*' && text[index + 1] === '/')) index += 1;
      index += 2;
      continue;
    }
    output += char;
    index += 1;
  }
  let cleaned = '';
  index = 0;
  inString = false;
  while (index < output.length) {
    const char = output[index];
    if (inString) {
      cleaned += char;
      if (char === '\\') {
        cleaned += output[index + 1] ?? '';
        index += 2;
        continue;
      }
      if (char === '"') inString = false;
      index += 1;
      continue;
    }
    if (char === '"') {
      inString = true;
      cleaned += char;
      index += 1;
      continue;
    }
    if (char === ',') {
      let lookahead = index + 1;
      while (/\s/.test(output[lookahead] ?? '')) lookahead += 1;
      if (output[lookahead] === '}' || output[lookahead] === ']') {
        index += 1;
        continue;
      }
    }
    cleaned += char;
    index += 1;
  }
  return cleaned;
}

function semanticValue(text, node) {
  return JSON.parse(jsoncToJson(text.slice(node.start, node.end)));
}

function indentValue(value, indent) {
  return JSON.stringify(value, null, 2)
    .split('\n')
    .map((line, index) => (index === 0 ? line : `${indent}${line}`))
    .join('\n');
}

function lineIndent(text, offset) {
  const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
  return text.slice(lineStart, offset).match(/^\s*/)?.[0] ?? '';
}

function applyReplacements(text, replacements) {
  let output = text;
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    output = output.slice(0, replacement.start) + replacement.value + output.slice(replacement.end);
  }
  return output;
}

export function inspectJsoncEntries(text, sectionName, desired, ownedKeys, compatible = (a, b) => JSON.stringify(a) === JSON.stringify(b)) {
  const root = parseJsoncAst(text);
  const sectionProperty = root.properties.find((property) => property.key === sectionName);
  if (!sectionProperty) {
    return Object.fromEntries(Object.keys(desired).map((key) => [key, { status: 'missing' }]));
  }
  if (sectionProperty.value.type !== 'object') throw new JstackError(`OpenCode ${sectionName} must be an object.`);
  const existing = new Map(sectionProperty.value.properties.map((property) => [property.key, property]));
  const result = {};
  for (const [key, value] of Object.entries(desired)) {
    const property = existing.get(key);
    if (!property) result[key] = { status: 'missing' };
    else if (compatible(semanticValue(text, property.value), value)) result[key] = { status: 'ok' };
    else result[key] = { status: ownedKeys.has(key) ? 'owned-drift' : 'conflict' };
  }
  return result;
}

export function updateJsoncEntries(
  text,
  sectionName,
  desired,
  ownedKeys,
  force,
  compatible = (a, b) => JSON.stringify(a) === JSON.stringify(b),
) {
  const root = parseJsoncAst(text);
  const sectionProperty = root.properties.find((property) => property.key === sectionName);
  const replacements = [];

  if (!sectionProperty) {
    const rootIndent = lineIndent(text, root.closeStart);
    const propertyIndent = `${rootIndent}  `;
    const comma = root.properties.length > 0 && !root.properties.at(-1).commaAfter ? ',' : '';
    const serialized = indentValue(desired, `${propertyIndent}  `);
    replacements.push({
      start: root.closeStart,
      end: root.closeStart,
      value: `${comma}\n${propertyIndent}${JSON.stringify(sectionName)}: ${serialized}\n${rootIndent}`,
    });
    return applyReplacements(text, replacements);
  }
  if (sectionProperty.value.type !== 'object') throw new JstackError(`OpenCode ${sectionName} must be an object.`);

  const section = sectionProperty.value;
  const existing = new Map(section.properties.map((property) => [property.key, property]));
  const sectionIndent = lineIndent(text, section.closeStart);
  const propertyIndent = `${sectionIndent}  `;

  for (const [key, value] of Object.entries(desired)) {
    const property = existing.get(key);
    if (!property) continue;
    const current = semanticValue(text, property.value);
    if (compatible(current, value)) continue;
    if (!ownedKeys.has(key) && !force) throw new JstackError(`OpenCode ${sectionName}.${key} is user-owned and conflicts.`, 1);
    replacements.push({
      start: property.value.start,
      end: property.value.end,
      value: indentValue(value, `${propertyIndent}  `),
    });
  }

  const missing = Object.entries(desired).filter(([key]) => !existing.has(key));
  if (missing.length > 0) {
    const comma = section.properties.length > 0 && !section.properties.at(-1).commaAfter ? ',' : '';
    const body = missing
      .map(([key, value]) => `${propertyIndent}${JSON.stringify(key)}: ${indentValue(value, `${propertyIndent}  `)}`)
      .join(',\n');
    replacements.push({
      start: section.closeStart,
      end: section.closeStart,
      value: `${comma}\n${body}\n${sectionIndent}`,
    });
  }
  return applyReplacements(text, replacements);
}

export async function readJsonConfig(filePath, fallback) {
  if (!(await pathExists(filePath))) return fallback;
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    throw new JstackError(`Invalid JSON config ${filePath}: ${error.message}`);
  }
}

export function compatibleMcp(existing, desired) {
  if (desired.url !== undefined && existing.url !== desired.url) return false;
  if (desired.type !== undefined && existing.type !== undefined && existing.type !== desired.type) return false;
  if (desired.command !== undefined && existing.command !== desired.command) return false;
  if (desired.args !== undefined && JSON.stringify(existing.args ?? []) !== JSON.stringify(desired.args)) return false;
  return true;
}

export async function mergeJsonMcp(filePath, desiredServers, ownedKeys, force) {
  const config = await readJsonConfig(filePath, { mcpServers: {} });
  if (!config.mcpServers || typeof config.mcpServers !== 'object' || Array.isArray(config.mcpServers)) {
    throw new JstackError(`${filePath} must define mcpServers as an object.`, 1);
  }
  for (const [id, desired] of Object.entries(desiredServers)) {
    const existing = config.mcpServers[id];
    if (existing && !compatibleMcp(existing, desired) && !ownedKeys.has(id) && !force) {
      throw new JstackError(`MCP server ${id} conflicts in ${filePath}.`, 1);
    }
    config.mcpServers[id] = { ...(existing ?? {}), ...desired };
  }
  await atomicWrite(filePath, `${JSON.stringify(config, null, 2)}\n`);
}

export async function inspectJsonMcp(filePath, desiredServers) {
  if (!(await pathExists(filePath))) return Object.fromEntries(Object.keys(desiredServers).map((id) => [id, 'missing']));
  const config = await readJsonConfig(filePath, {});
  return Object.fromEntries(
    Object.entries(desiredServers).map(([id, desired]) => {
      const existing = config.mcpServers?.[id];
      return [id, !existing ? 'missing' : compatibleMcp(existing, desired) ? 'ok' : 'conflict'];
    }),
  );
}

export const CODEX_MCP_START = '# >>> jstack managed MCP >>>';
export const CODEX_MCP_END = '# <<< jstack managed MCP <<<';

export function renderCodexMcp(servers) {
  const sections = [];
  for (const [id, server] of Object.entries(servers)) {
    const lines = [`[mcp_servers.${JSON.stringify(id)}]`];
    if (server.url) lines.push(`url = ${JSON.stringify(server.url)}`);
    else {
      lines.push(`command = ${JSON.stringify(server.command)}`);
      lines.push(`args = ${JSON.stringify(server.args ?? [])}`);
    }
    sections.push(lines.join('\n'));
  }
  return `${CODEX_MCP_START}\n${sections.join('\n\n')}\n${CODEX_MCP_END}`;
}

function managedBlockRange(text) {
  const start = text.indexOf(CODEX_MCP_START);
  const endMarker = text.indexOf(CODEX_MCP_END);
  if ((start === -1) !== (endMarker === -1)) throw new JstackError('Codex jstack MCP markers are incomplete.', 1);
  return start === -1 ? null : { start, end: endMarker + CODEX_MCP_END.length };
}

function codexExternalServers(text) {
  const range = managedBlockRange(text);
  const unmanaged = range
    ? `${text.slice(0, range.start)}${text.slice(range.start, range.end).replace(/[^\n]/g, ' ')}${text.slice(range.end)}`
    : text;
  const headings = [...unmanaged.matchAll(/^\[mcp_servers\.(?:"([^"]+)"|([A-Za-z0-9_-]+))\]\s*$/gm)];
  const allHeadings = [...unmanaged.matchAll(/^\[[^\n]+\]\s*$/gm)];
  const servers = new Map();
  for (let index = 0; index < headings.length; index += 1) {
    const match = headings[index];
    const id = match[1] ?? match[2];
    const start = match.index;
    const end = allHeadings.find((heading) => heading.index > start)?.index ?? unmanaged.length;
    const section = unmanaged.slice(start, end);
    const url = section.match(/^url\s*=\s*("(?:\\.|[^"])*")\s*$/m)?.[1];
    const command = section.match(/^command\s*=\s*("(?:\\.|[^"])*")\s*$/m)?.[1];
    const args = section.match(/^args\s*=\s*(\[[^\n]*\])\s*$/m)?.[1];
    servers.set(id, {
      value: {
        ...(url ? { url: JSON.parse(url) } : {}),
        ...(command ? { command: JSON.parse(command), args: args ? JSON.parse(args) : [] } : {}),
      },
      start,
      end,
    });
  }
  return { unmanaged, servers };
}

export function inspectCodexMcp(text, servers) {
  const range = managedBlockRange(text);
  const block = range ? text.slice(range.start, range.end) : '';
  const external = codexExternalServers(text).servers;
  return Object.fromEntries(
    Object.entries(servers).map(([id, desired]) => {
      if (block.includes(`[mcp_servers.${JSON.stringify(id)}]`)) return [id, 'ok'];
      const existing = external.get(id)?.value;
      return [id, !existing ? 'missing' : compatibleMcp(existing, desired) ? 'ok' : 'conflict'];
    }),
  );
}

export function updateCodexMcp(text, servers, force = false) {
  const external = codexExternalServers(text);
  const managedServers = {};
  const removals = [];
  for (const [id, desired] of Object.entries(servers)) {
    const existing = external.servers.get(id);
    if (!existing) managedServers[id] = desired;
    else if (!compatibleMcp(existing.value, desired)) {
      if (!force) throw new JstackError(`Codex MCP server ${id} conflicts with an unmanaged table.`, 1);
      managedServers[id] = desired;
      removals.push({ start: existing.start, end: existing.end, value: '' });
    }
  }
  if (removals.length > 0) text = applyReplacements(text, removals);
  const block = renderCodexMcp(managedServers);
  const range = managedBlockRange(text);
  if (range) return `${text.slice(0, range.start)}${block}${text.slice(range.end)}`;
  const separator = text.length === 0 || text.endsWith('\n\n') ? '' : text.endsWith('\n') ? '\n' : '\n\n';
  return `${text}${separator}${block}\n`;
}

export function opencodeServers(sourceServers) {
  return Object.fromEntries(
    Object.entries(sourceServers).map(([id, server]) => [
      id,
      server.url
        ? { type: 'remote', url: server.url }
        : { type: 'local', command: [server.command, ...(server.args ?? [])] },
    ]),
  );
}

export function opencodeMcpCompatible(existing, desired) {
  if (desired.type !== existing?.type) return false;
  if (desired.type === 'remote') return existing.url === desired.url;
  return JSON.stringify(existing.command) === JSON.stringify(desired.command);
}

export async function ensureParent(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export function configEntry(kind, filePath, value) {
  return { kind: 'config', configKind: kind, filePath, sha256: sha256(JSON.stringify(value)) };
}
