#!/usr/bin/env node
/* Replaces plugins/databrief with a fresh build of the plugin from the DataBrief repository, then checks the marketplace:
 *   node update.cjs PATH-TO-THE-DATABRIEF-REPOSITORY https://YOUR-HOST/mcp
 * The address is the one of YOUR connector server (it ends in /mcp). It ends up in plugins/databrief/.mcp.json, which everybody who installs the
 * plugin receives. Run it after each DataBrief release, then:  git add -A && git commit -m "DataBrief X.Y.Z" && git push
 * Claude Code updates a plugin only when its version changes: the version is DataBrief's (package.json), so a new release is a new version. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const [repo, url] = process.argv.slice(2);
if (!repo || !url) { console.error('Usage: node update.cjs PATH-TO-THE-DATABRIEF-REPOSITORY https://YOUR-HOST/mcp'); process.exit(2); }
const builder = path.join(path.resolve(repo), 'tools', 'build-plugin.cjs');
if (!fs.existsSync(builder)) { console.error('Not a DataBrief repository (tools/build-plugin.cjs is missing): ' + repo); process.exit(2); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'databrief-marketplace-'));
try {
  execFileSync(process.execPath, [builder, '--url', url, tmp], { stdio: ['ignore', 'inherit', 'inherit'] });
  const built = path.join(tmp, 'databrief-plugin');
  if (!fs.existsSync(path.join(built, '.claude-plugin', 'plugin.json'))) throw new Error('The build did not produce a plugin folder');
  const target = path.join(__dirname, 'plugins', 'databrief');
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(built, target, { recursive: true });
  console.log('Updated plugins/databrief (version ' + JSON.parse(fs.readFileSync(path.join(target, '.claude-plugin', 'plugin.json'), 'utf8')).version + ')');
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
process.exit(spawnSync(process.execPath, [path.join(__dirname, 'check.cjs')], { stdio: 'inherit' }).status);
