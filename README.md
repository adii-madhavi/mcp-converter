# Portbridge

Browser-local Windows ↔ macOS ↔ Linux configuration migration. No runtime dependencies, build step, remote AI, accounts, or configuration backend.

## Run

Requires Node 20+ for tests and Python 3 for the local server.

```sh
npm run check
npm start
```

Open http://localhost:4173. Serve `dist/` as static files in production. Do not open index.html directly: browsers restrict ES modules on file URLs.

## Supported scope

- Strict MCP JSON using `mcpServers` or `servers` (Claude Desktop / Cursor / VS Code configuration shapes).
- Windows home paths, Unix home paths, known runtime command suffixes and simple `cmd /c` wrappers.
- Optional server-map conversion and VS Code transport type insertion.
- Generic JSON: recognizable absolute home paths only; not app schema conversion.
- Review report, local file import, clipboard copy, JSON download, likely credential redaction.

Unknown drive paths, network mounts, unsupported binaries, shell expressions, host-specific variables and app-data estimates require review. Dependencies are not installed or tested. Converted JSON is not a guarantee a server will run. Other app formats such as TOML, YAML, INI and VS Code tasks are future adapters, not implemented capabilities.

## Project map

- `dist/index.html`: accessible app shell and help views.
- `dist/styles.css`: responsive layout.
- `dist/converter.js`: pure conversion and validation engine.
- `dist/app.js`: browser-only interaction and export lifecycle.
- `tests/converter.test.mjs`: functional/security regression tests.
- `plan.md`: architecture, security, acceptance criteria and roadmap.
- `docs/SECURITY.md`: threat model and limitations.
- `docs/ARCHITECTURE.md`: data flow and adapter strategy.
- `docs/CONTRIBUTING.md`: extension and review rules.
- `.openai/hosting.json`: private Sites hosting identity and static output directory.

Configuration values never go into logs or analytics. User data is held in memory only. Deployments ship source, sample data and static assets only.

## Format references

Checked on 2026-10-13:

- https://modelcontextprotocol.io/docs/develop/connect-local-servers
- https://cursor.com/docs/mcp
- https://code.visualstudio.com/docs/agents/reference/mcp-configuration

Client formats evolve. Verify the destination application's documentation before importing; especially remote transport types, interactive inputs and sandbox settings.

## Continuous integration

GitHub Actions runs syntax checks and the Node regression suite on push and pull requests. No dependency installation or secrets are needed. Duplicate JSON keys and nonfinite numbers are rejected.
