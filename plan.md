# Portbridge implementation and security plan

## Purpose

Move supported MCP configuration and recognizable paths in other JSON app settings between Windows, macOS and Linux. “Any configuration” is an extensibility goal, not a compatibility promise: operating systems have different executables, permissions, directories, shells and client schemas.

## Delivered version

A static, browser-local application with an editable source pane, destination settings, read-only output, local JSON import, samples, migration report, redaction, copy/export, security information and installation guide. Implemented adapters accept the common `mcpServers` map and VS Code `servers` map. A generic JSON mode migrates recognizable home paths without interpreting an arbitrary app's settings.

Supported safe rules:

1. Map recognized absolute user-home paths using the target account name.
2. Map AppData paths to estimated target configuration locations with explicit warnings.
3. Remove known Windows runtime suffixes for bare runtime commands.
4. Unwrap only simple tokenized `cmd /c` calls to known runtimes, rejecting shell operator patterns.
5. Preserve unknown fields, nonpath text and remote URLs; redact likely credential fields by default.
6. Change the server-map key on request; add required transport types for the VS Code shape.
7. Flag unknown drives, network shares, platform binaries, shell launchers and variable expansion.

## Architecture and structure

```text
portbridge/
  dist/
    index.html       semantic shell, local views and official help links
    styles.css       responsive design and focus states
    converter.js     pure parse / validate / transform / report function
    app.js           memory-only state, file input and explicit exports
  tests/             Node built-in regression tests
  docs/
    SECURITY.md      assets, threats, mitigations and residual risks
    ARCHITECTURE.md  conversion pipeline and future adapter contract
    CONTRIBUTING.md extension requirements
  plan.md
  README.md
  package.json
  .openai/hosting.json
```

Data flow: local text/file → size check → strict JSON parse → structural validation → conservative transformations → change/warning report → acknowledgment if needed → explicit local clipboard/download. No configuration travels to the host. No input command is executed. No dynamic code evaluation or server connection occurs.

## Security requirements

- No network conversion, telemetry, external scripts/fonts or third-party runtime dependencies.
- CSP denies connections, object content, inline scripts and form submission; same-origin script/style only.
- Strict JSON, 256 KB limit, 40-level maximum depth, 20,000-value traversal budget, maximum 100 MCP servers.
- Reject reserved prototype keys; use own-property inspection and rebuild objects rather than merging untrusted objects.
- Render all user-derived content using textContent/value, never innerHTML.
- Never interpolate input into a shell, execute a command, probe URLs or auto-install dependencies.
- Redact likely credentials before rendering output; do not put source values in reports.
- Every change to input/options invalidates output and export permission.
- Require warning acknowledgment before copy/download; revoke download blob URLs.
- Do not persist user configuration. Refresh clears state.
- Production host should supply CSP, HSTS, frame-ancestors 'none', nosniff and Permissions-Policy headers. The buildless deployment currently provides CSP via HTML; frame-ancestors requires an HTTP header and is a host-hardening follow-up, not an implemented guarantee.

## Threat model

Protect pasted credentials and paths against accidental uploads, stored state, DOM injection and command execution by the converter. Treat source configs as untrusted data. Hosted code delivery, browser extensions, device compromise and intentionally executing untrusted MCP packages are outside the local conversion boundary. Redaction is heuristic, not a complete secret scanner. Browser clipboard history and downloaded files are controlled by the OS. See docs/SECURITY.md.

## Validation and release criteria

- Test transformations in both directions and preserve unknown settings.
- Test wrapper refusal, malicious object keys, invalid types, payload limits and secrets.
- Browser-check sample loading, conversion, warning acknowledgment, export invalidation, navigation, import, narrow layout and CSP compatibility.
- Confirm static page serves successfully and pure engine tests pass before publication.
- Publish privately by default with Sites; public access requires an explicit audience change.
- Never include real configs, credentials or tokens in source or deployment archives.

## Product limits

No TOML/YAML/INI parsing, binary conversion, executable replacement, package installation, filesystem existence checks, permissions migration, registry migration, MCP connection probing or automatic installation into a destination app. Strict JSON only: comments are rejected. Duplicate JSON keys use the platform parser's last-key behavior; avoid duplicate keys. AppData and Linux XDG defaults are estimates. Cross-host schema conversion preserves fields that may be unsupported; review them manually.

## Roadmap

1. Introduce versioned, fixture-tested adapter registry for each supported app and client version.
2. Add explicit user-defined root mappings for other drives/mounts; never infer them.
3. Add a robust duplicate-key-aware JSON/JSONC parser and source-position diagnostics.
4. Add host-specific secret references with opt-in prompts; preserve the rule that credentials stay local.
5. Add audited TOML/YAML/INI parsers under strict resource budgets and adapters for app settings.
6. Add reviewed offline desktop packaging only if filesystem integration is needed; require per-file permission and backup/rollback.
7. Add runtime dependency manifests and a user-readable installation checklist, without autoexecuting scripts.
8. Add hosting response security headers and CI checks. Continue dependency-free operation where possible.

## Operational policy

No database or API is required. Review static code updates as security changes because delivered scripts can read editor contents. Maintain package provenance, private deployment access and a tested rollback version. Never ask users to submit real configs with security reports; request minimal sanitized reproductions.
