# DataBrief plugins

A plugin marketplace for [Claude Code](https://code.claude.com): one plugin, **DataBrief**, which turns a data file (CSV, Excel, Parquet, SQLite, SQL or PostgreSQL
dumps, JSON, PDF, Word and many more formats) into a prompt that describes it, with the data in it or, with "Do not share data", without a single record.

The plugin is built from the [DataBrief project](https://github.com/Arfo-du-blo/DataBrief) (GPL-3.0-or-later). This repository only holds the catalogue and a built copy of the plugin.

## Install

In Claude Code:

```
/plugin marketplace add Arfo-du-blo/databrief-marketplace
/plugin install databrief@databrief-plugins
```

Or from a shell:

```bash
claude plugin marketplace add Arfo-du-blo/databrief-marketplace
claude plugin install databrief@databrief-plugins
```

To update later: `/plugin marketplace update databrief-plugins` in a session, then `claude plugin update databrief@databrief-plugins` in a shell. Automatic updates are off
by default: turn them on under **Marketplaces** in `/plugin`.

In Claude on the web or in Claude Desktop, marketplaces are not added by name: download `databrief-plugin.zip` from a
[DataBrief release](https://github.com/Arfo-du-blo/DataBrief/releases) and use **Customize**, **Plugins**, **Add**, **Upload plugin**.

## What you get

- **The connector:** the DataBrief page as a widget in the chat ("Open DataBrief"). The page reads your file in your browser; the connector's server never receives the file.
- **The skill:** where Claude can run code and the file is on its disk (Claude Code, Cowork), Claude asks you only whether the data may be shared, then runs the tool bundled in
  the plugin, offline.
- **The command** `/databrief:databrief <path>`: a shortcut for the skill.

Which piece is for what, what works where and what was tested: [the plugin's guide](https://github.com/Arfo-du-blo/DataBrief/blob/main/docs/plugin.md). Only Claude (web and Desktop)
and ChatGPT (web) were tested for the DataBrief page; this marketplace and the plugin installed from it have not been tried in every Claude app.

## What data it sends

The connector's server serves the DataBrief page and nothing else: it never receives your files, stores nothing and logs only request names, timings and the name of the calling app,
never content or IP addresses. The bundled tool runs where Claude runs code, reads the file there, opens no connection and writes nothing. Details:
[What data it sends](https://github.com/Arfo-du-blo/DataBrief/blob/main/docs/plugin.md#what-data-it-sends).

## For the maintainer

- `node check.cjs` checks the catalogue and the plugin (names, paths, icon, the connector's address, version). `claude plugin validate .` is the authority; run both.
- After each DataBrief release: `node update.cjs PATH-TO-DATABRIEF https://YOUR-HOST/mcp`, then commit and push. Claude Code gives users a new copy of a plugin only when its version changes,
  and the plugin's version is DataBrief's (`package.json`): a change to the plugin without a new DataBrief version does not reach people who already installed it.
- The connector's address is inside `plugins/databrief/.mcp.json`, in this public repository: it is the address of a server that anybody who installs the plugin will call.
