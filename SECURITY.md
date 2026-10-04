# Security

## Reporting a vulnerability

Please report vulnerabilities privately through
[GitHub Security Advisories](https://github.com/sapientpants/number-guess/security/advisories/new)
rather than opening a public issue.

## Threat model

Number Guess is a static, client-only single-page app. It has no backend, no authentication and
handles no personal data beyond the player names a user types in.

- **`localStorage` is untrusted input.** It can be edited by the user, corrupted, full or
  unavailable. `src/utils/storage.ts` validates every record on load, drops malformed ones and
  never throws on read or write.
- **Rendering** goes through React, which escapes text by default. Do not introduce
  `dangerouslySetInnerHTML`.
- **Randomness** uses `Math.random()` deliberately; predictability is not a security concern for
  this game.

## Automated checks

- `pnpm audit` in the pre-commit hook and CI
- [OSV-Scanner](https://google.github.io/osv-scanner/) and [CodeQL](https://codeql.github.com/) in CI
- Dependabot for npm packages and GitHub Actions
- CI workflows run with least-privilege (`contents: read`) permissions
