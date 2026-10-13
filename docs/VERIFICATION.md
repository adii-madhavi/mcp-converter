# Verification report — 2026-10-13

## Result

Local syntax checks, 33 engine regression tests, browser functional checks and source security review passed. This is a bounded software review, not a third-party security certification or a guarantee that every destination MCP client can run the exported configuration.

## Issues corrected

- Reject duplicate JSON keys (including escaped equivalents) instead of silently overwriting values.
- Reject numbers that overflow to Infinity instead of exporting null.
- Preserve MCP server objects whose names resemble secret fields.
- Preserve VS Code boolean password-prompt flags during redaction.
- Refuse automatic cmd-wrapper conversion for quoting, caret escaping, variable expansion and command grouping.
- Support Windows home paths written with forward slashes.
- Restrict app-data substitutions to complete directory names.
- Validate ambiguous command/URL definitions, incompatible known transport types, cwd/envFile/type and header value types.
- Flag unknown transport types and filenames restricted on Windows.
- Prevent asynchronous imports from overwriting a newer edited/converted state.
- Clear obsolete reports and errors when conversion state changes.

## Automated checks

`npm run check` checks both JavaScript modules and runs 33 Node tests. Tests cover all nine OS pairs, runtime wrappers, schemas, unknown-field preservation, redaction, URLs, object-key safety, duplicate keys, limits and path mapping. `git diff --check` passes.

GitHub Actions runs the same command on pushes and pull requests, using Node 22, read-only repository permissions and verified immutable action commit IDs. The application has no npm runtime or development dependencies; no dependency install or package audit is necessary.

## Browser checks

- Sample MCP conversion, Windows launcher removal and target-account mapping.
- Secret placeholder generation and review acknowledgment before export.
- Clipboard action completed with success feedback. Browser automation's clipboard API uses a different clipboard surface, so clipboard bytes were not independently verified.
- Download completed; downloaded JSON was parsed and its command and redaction values verified from disk.
- Input/account edits invalidate output and disable export.
- Duplicate-key error appears without a stale output.
- Local file import works, including a server named token-service.
- File larger than 256 KB is rejected.
- Generic JSON template loads and converts; MCP output-format selector is disabled in this mode.
- Guide navigation and help views render.
- Narrow single-pane and desktop two-pane layouts show no horizontal document overflow at measured CSS widths of 226 and 837 pixels. The in-app browser scales viewport overrides; requested device sizes are not the same as measured CSS widths.
- No captured browser console errors in the tested interactions.

## Source security review

No converter networking, remote script/font dependency, eval, untrusted HTML rendering, configuration logging or browser persistence was found. User content goes through text/value DOM APIs. HTML CSP denies network connections and object content. Downloads are explicit and blob URLs are revoked. Repository content is synthetic sample data and application/docs only; no user config or authentication credential is included.

## Remaining limits

Real MCP server execution, package trust, destination app support, OS filesystem existence and permissions were not tested. App-data mappings remain estimates. Credential detection remains heuristic. The hosted HTML CSP cannot enforce anti-framing or HSTS; those require hosting response headers. Real configurations remain in the source editor until cleared or refreshed. Review exported files before running them.
