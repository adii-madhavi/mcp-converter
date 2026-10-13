# Architecture

The current implementation intentionally separates a pure conversion function from browser interactions. `convert(input, options)` returns output JSON, changes, issues, server count and a review-required flag. It performs no I/O and mutates no global state.

The UI owns a single current result. Input or options changes discard it. It displays issues using DOM text nodes, enables export only for a current result and acknowledged warnings, and never persists editor content. The converter redacts sensitive values before transformations; reports contain field locations and explanations, not original values.

## Future adapter contract

An adapter should declare id, supported client versions, format parser, detection criteria, schema validator, canonical model normalization, target serializer and safety constraints. Keep parsing and serialization separate from OS transformation. Canonical fields should represent command, tokenized arguments, env, cwd, endpoint, transport and preserved extensions. No adapter may resolve secrets, launch processes, fetch endpoints or silently discard unsupported fields.

A conversion rule should return a value plus an explanation, confidence category and manual-review requirement. Unknown rules preserve input. Low-confidence estimates always require review. App directory maps and executable maps must be versioned fixtures rather than guessed substitutions.

Generic JSON currently walks strings and maps only recognizable absolute home paths. It is not a general app migration adapter. URLs, ordinary text and unknown paths remain data. Other app formats need dedicated parsers and schemas.
