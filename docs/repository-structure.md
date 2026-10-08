# Repository structure

## Source tree

```
minecraft-afk-bot/
├── bot.js                      # Application entry point, orchestration, helpers
├── logger.js                   # Logging adapter (console mirror + file append)
├── configuration.example.json  # Version-controlled configuration template
├── configuration.json          # Local runtime configuration (git-ignored)
├── package.json                # npm metadata, scripts, dependencies
├── README.md                   # User-facing documentation
├── ARCHITECTURE.md             # Architectural design document
├── SECURITY.md                 # Security model
├── LICENSE                     # License terms
├── tests/
│   ├── bot.test.js             # Unit tests for bot.js helpers and flows
│   └── logger.test.js          # Unit tests for logger.js
└── docs/                       # Generated documentation (this directory)
    ├── INDEX.md
    ├── repository-overview.md
    ├── repository-structure.md
    ├── architecture.md
    ├── components/
    │   ├── application-orchestration.md
    │   ├── logging.md
    │   └── configuration.md
    ├── flows/
    │   ├── session-lifecycle.md
    │   └── night-sleep.md
    ├── data-model.md
    ├── configuration.md
    ├── error-handling.md
    ├── logging.md
    ├── testing.md
    ├── dependencies.md
    ├── design-decisions.md
    ├── invariants.md
    ├── change-guide.md
    ├── build-and-deployment.md
    ├── troubleshooting.md
    ├── faq.md
    ├── ambiguities-and-open-questions.md
    └── documentation-maintenance.md
```

## Module organisation

| Path | Role | Exports |
|------|------|---------|
| `bot.js` | Application orchestration, bot lifecycle, command execution, night sleep logic | `main`, `loadConfiguration`, `ensureConfigurationExists`, `registerNightSleepHandler`, `activateBedUnderBot`, `executeCommand`, `isRestrictedByTimeWindow`, `resolveSleepProbability`, `pause`, `randomInteger`, `randomChoice`, `resolveLogFilePath` |
| `logger.js` | Logging factory and default instance | `createLogger`, `applicationLogger`, `DEFAULT_LOG_FILE_PATH` |
| `tests/bot.test.js` | Unit tests for `bot.js` | — |
| `tests/logger.test.js` | Unit tests for `logger.js` | — |

## Configuration files

| File | Tracked | Purpose |
|------|---------|---------|
| `configuration.example.json` | Yes | Template with placeholder values; copied to `configuration.json` on first run. |
| `configuration.json` | No (git-ignored) | Runtime configuration with real credentials and settings. |

## Test organisation

- Uses Node.js native test runner (`node:test`) and assertions (`node:assert/strict`).
- All tests are mock-based; no live Minecraft server connections.
- `tests/bot.test.js` covers helpers, configuration, command execution, night sleep handler, and `main` orchestration.
- `tests/logger.test.js` covers logger factory, console mirroring, file appending, and timestamp formatting.

## Build artefacts

No compilation step. `npm run build` runs a syntax check (`node --check bot.js && node --check logger.js`).

## External dependencies

| Package | Purpose |
|---------|---------|
| `mineflayer` | Minecraft protocol client, event emission, block interaction. |

## Node.js version

Requires Node.js ≥ 18.0.0 (for `node:test` and modern ES syntax).