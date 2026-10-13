# Security model

The configuration pipeline operates entirely in the browser. The static host receives ordinary page requests, not pasted/imported config. External documentation links navigate only on user action. The app initiates no fetch, WebSocket, MCP, AI or telemetry connections.

| Asset / threat | Control | Residual risk |
| --- | --- | --- |
| API keys accidentally exposed | Default heuristic redaction; no source values in reports | Unrecognized secrets, source editor visibility, extensions |
| DOM injection | textContent/value rendering; external module scripts; CSP | Host compromise or malicious delivered script |
| Prototype pollution | Reserved-key rejection, own-property checks, no untrusted merges | Future adapters need the same constraints |
| Resource exhaustion | 256 KB payload, depth/node/server budgets | Brief main-thread parsing time |
| Shell injection | No execution; only conservative token-level rewrite | User may later run unsafe exported commands |
| Incorrect migration | Preserve unknown values, warnings, acknowledgment | Target paths, binaries and schemas remain unverified |
| Persistence leakage | No web storage or logs; memory-only state | Browser autofill, clipboard manager, exported files, memory inspection |

The CSP in HTML uses `connect-src 'none'`, `object-src 'none'`, `base-uri 'none'` and `form-action 'none'`; scripts/styles are same-origin. Production response header hardening, including anti-framing and HSTS, depends on the host and is not claimed by the HTML policy.

Redaction covers likely secret field names and recognizable token/private-key/URL-credential patterns. It cannot reliably identify every credential, secret-bearing URL or positional command argument. Keep redaction on, inspect output, and replace placeholders locally. The original input remains visible until cleared or the page reloads.

MCP configs can launch programs with the app's privileges. Portbridge does not establish trust in a package. Verify publisher/version and use narrow server access scopes. Browser-local conversion prevents uploads by this app; it does not sandbox servers run later.

Security reports should contain only sanitized reproductions. Do not paste actual secrets into an issue or support message. For suspected host compromise, stop using the hosted page until verified and use reviewed local source.
