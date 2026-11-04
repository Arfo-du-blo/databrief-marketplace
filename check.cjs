#!/usr/bin/env node
/* Checks the marketplace the way `claude plugin validate` would, and a little more:   node check.cjs
 * It needs only Node.js 18 or newer. Run it after every change (the GitHub workflow runs it on every push).
 * `claude plugin validate .` is the authority; this catches the same mistakes without Claude Code, and the ones that are about this repository (the
 * plugin's address, its icon, its version). */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
let failed = 0, total = 0;
const check = (name, ok, detail) => { total++; if (!ok) { failed++; console.log('FAIL ' + name + (detail ? ' :: ' + detail : '')); } else console.log('ok   ' + name); };
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = (p) => { try { return JSON.parse(read(p)); } catch (e) { return null; } };

const ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const RESERVED = ['claude-code-marketplace', 'claude-code-plugins', 'claude-plugins-official', 'anthropic-marketplace', 'anthropic-plugins', 'agent-skills', 'anthropic-agent-skills',
  'life-sciences', 'knowledge-work-plugins', 'claude-for-legal', 'claude-for-financial-services', 'financial-services-plugins', 'first-party-plugins', 'claude-tag-plugins',
  'claude-community', 'claude-plugins-community', 'healthcare', 'anthropic-plugin-directory', 'claude-plugin-directory', 'inline', 'builtin', 'skills-dir', 'synced', 'claude-plugin-test',
  'npm', 'pip', 'uv', 'cargo', 'github', 'gh'];

const mp = json('.claude-plugin/marketplace.json');
check('marketplace.json is valid JSON', !!mp);
if (mp) {
  check('name: letters, digits, . _ -, starts with a letter or digit, no "..", not a reserved name, does not start with claudeai-', ID.test(mp.name || '') && !String(mp.name).includes('..') && !RESERVED.includes(String(mp.name).toLowerCase()) && !/^claudeai-/i.test(mp.name), String(mp.name));
  check('owner.name and a description are set', !!(mp.owner && mp.owner.name) && !!mp.description);
  check('plugins: at least one entry, no duplicate name', Array.isArray(mp.plugins) && mp.plugins.length > 0 && new Set(mp.plugins.map((p) => p.name)).size === mp.plugins.length);
  const keys = new Set(['name', 'description', 'owner', 'plugins', '$schema', 'version', 'metadata', 'forceRemoveDeletedPlugins', 'allowCrossMarketplaceDependenciesOn', 'renames']);
  check('no unknown top-level key (Claude Code ignores a typo silently)', Object.keys(mp).every((k) => keys.has(k)), Object.keys(mp).filter((k) => !keys.has(k)).join());
  for (const p of mp.plugins || []) {
    const tag = 'plugin "' + p.name + '": ';
    check(tag + 'name is a valid id', ID.test(p.name || ''));
    check(tag + 'source is a relative path from this folder: starts with ./, no "..", no backslash, and the folder exists', typeof p.source === 'string' && /^\.\//.test(p.source) && !p.source.includes('..') && !p.source.includes('\\') && fs.existsSync(path.join(ROOT, p.source, '.claude-plugin', 'plugin.json')), String(p.source));
    const dir = typeof p.source === 'string' ? p.source : '';
    const man = json(path.join(dir, '.claude-plugin', 'plugin.json'));
    check(tag + 'plugin.json has the same name as the entry (people install by the entry name; the skills are prefixed by the manifest name)', !!man && man.name === p.name, man && man.name);
    check(tag + 'the entry sets no version (plugin.json\'s wins and a difference is a warning)', p.version === undefined);
    check(tag + 'plugin.json has a version like 1.2.3', !!man && /^\d+\.\d+\.\d+$/.test(man.version || ''), man && man.version);
    check(tag + 'icon is a PNG inside the plugin, 512 to 2048 px, under 2 MB', (() => {
      if (!man || !man.icon) return false;
      const f = path.join(ROOT, dir, man.icon);
      if (!fs.existsSync(f)) return false;
      const b = fs.readFileSync(f);
      return b.slice(1, 4).toString() === 'PNG' && b.length < 2 * 1024 * 1024 && b.readUInt32BE(16) === b.readUInt32BE(20) && b.readUInt32BE(16) >= 512 && b.readUInt32BE(16) <= 2048;
    })());
    check(tag + 'privacyPolicyUrl is an https address', !!man && /^https:\/\/[^\s]+$/.test(man.privacyPolicyUrl || ''));
    const mcp = json(path.join(dir, '.mcp.json'));
    const servers = (mcp && mcp.mcpServers) || {};
    const urls = Object.values(servers).map((s) => s.url);
    check(tag + '.mcp.json: every server is type http, an https address ending in /mcp, with nothing else (everybody who installs the plugin receives this file: no key, no token)',
      Object.keys(servers).length > 0 && Object.values(servers).every((s) => s.type === 'http' && JSON.stringify(Object.keys(s).sort()) === '["type","url"]' && /^https:\/\/[^/@?#\s]+\/mcp$/.test(s.url)), urls.join());
    check(tag + 'no bin/ folder at the top of the plugin (it stops claude.ai and Cowork from installing it)', !fs.existsSync(path.join(ROOT, dir, 'bin')));
    check(tag + 'README of at least 40 words, LICENSE and a skill are there', fs.existsSync(path.join(ROOT, dir, 'skills')) && fs.existsSync(path.join(ROOT, dir, 'LICENSE')) && read(path.join(dir, 'README.md')).replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length >= 40);
  }
}
check('LICENSE (GPL-3.0) and README.md are at the top of this repository', /GNU GENERAL PUBLIC LICENSE/.test(read('LICENSE')) && fs.existsSync(path.join(ROOT, 'README.md')));

console.log('\n' + (total - failed) + '/' + total + ' checks passed');
process.exit(failed ? 1 : 0);
