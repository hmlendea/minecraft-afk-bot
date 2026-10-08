# Documentation index

Master navigation for the Minecraft AFK Bot documentation.

## Repository summary

**Minecraft AFK Bot** — A Node.js application that connects to a Minecraft server, authenticates, executes a sequence of commands, optionally sleeps in a bed at night, and disconnects after a randomised session duration. Designed for AFK farming on servers with `/zone`, `/op`, `/god`, and `/bed` commands.

- **Language:** JavaScript (Node.js ≥ 18)
- **Primary dependency:** `mineflayer` (Minecraft protocol client)
- **Architecture:** Single-process scheduled batch script with event-driven bot controller
- **Configuration:** JSON file (git-ignored) with template in `configuration.example.json`
- **Logging:** Console mirror + synchronous file append with timestamps

## Root document map

| Document | Purpose |
|----------|---------|
| [README.md](../README.md) | Project overview, quick start, usage. |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | High-level architecture, component diagram, data flows. |
| [SECURITY.md](../SECURITY.md) | Security policy, vulnerability reporting. |
| [LICENSE](../LICENSE) | MIT licence. |

## Documentation catalogue

### Architecture & design

| Document | Description |
|----------|-------------|
| [Architecture](architecture.md) | Elaborated architecture with implementation detail, component responsibilities, data flows, concurrency model. |
| [Design decisions](design-decisions.md) | Key architectural choices with rationale and alternatives considered. |
| [Invariants](invariants.md) | System invariants that must hold across all executions. |
| [Concurrency and scheduling](concurrency-and-scheduling.md) | Event loop interaction, promise chains, timer management. |

### Components

| Document | Description |
|----------|-------------|
| [Application orchestration](components/application-orchestration.md) | Deep dive on `bot.js` exports: `main()`, `registerNightSleepHandler()`, `activateBedUnderBot()`, helpers. |
| [Logging](components/logging.md) | Deep dive on `logger.js`: `createLogger()`, log format, limitations. |
| [Configuration](components/configuration.md) | Deep dive on config schema, validation, file lifecycle. |
| [Integration models](components/integration-models.md) | External interfaces: Mineflayer bot API, Minecraft server commands, filesystem. |

### Flows

| Document | Description |
|----------|-------------|
| [Session lifecycle](flows/session-lifecycle.md) | Sequence diagram and detailed steps for `main()` flow from startup to completion. |
| [Night sleep](flows/night-sleep.md) | Sequence diagram and detailed behaviour for night sleep handler at day→night transitions. |

### Data & configuration

| Document | Description |
|----------|-------------|
| [Data model](data-model.md) | Persistent/transient state, data flow diagram, transformations. |
| [Configuration](configuration.md) | Complete schema reference with field definitions, validation, example. |
| [State and persistence](state-and-persistence.md) | Runtime state lifecycle, no database, filesystem only. |

### API reference

| Document | Description |
|----------|-------------|
| [API reference index](api-reference/INDEX.md) | Module-by-module symbol catalogue. |
| [bot.js](api-reference/bot.md) | Exported functions, types, usage. |
| [logger.js](api-reference/logger.md) | `createLogger()` factory, options, output format. |

### API usage examples

| Document | Description |
|----------|-------------|
| [API usage examples](api-usage-examples.md) | Code snippets for common integration patterns. |

### Behaviour

| Document | Description |
|----------|-------------|
| [Behaviour index](behaviour/INDEX.md) | User-facing behaviours catalogue. |
| [Sleep behaviour](behaviour/sleep.md) | When and how the bot sleeps. |
| [Teleport behaviour](behaviour/teleport.md) | Zone teleportation at spawn and daybreak. |
| [Schedule behaviour](behaviour/schedule.md) | Time-window restriction and random skip. |

### Operations

| Document | Description |
|----------|-------------|
| [Quick start](quick-start.md) | Minimal steps to run the bot. |
| [Build and deployment](build-and-deployment.md) | Direct execution, systemd, Docker, cron, log rotation. |
| [Logging](logging.md) | Log format, destinations, rotation, analysis. |
| [Troubleshooting](troubleshooting.md) | Common issues, diagnostics, solutions. |
| [FAQ](faq.md) | Frequently asked questions. |

### Development

| Document | Description |
|----------|-------------|
| [Testing](testing.md) | Test framework, organisation, mock patterns, coverage. |
| [Dependencies](dependencies.md) | External and core dependencies, version constraints. |
| [Error handling](error-handling.md) | Error taxonomy, handling patterns, propagation rules. |
| [Change guide](change-guide.md) | How to modify common areas safely. |
| [Documentation maintenance](documentation-maintenance.md) | Conventions, update triggers, review process. |

### Integrations & security

| Document | Description |
|----------|-------------|
| [Integrations](integrations.md) | Mineflayer, Minecraft server commands, filesystem. |
| [Security](security.md) | Threat model, credential handling, file permissions, network. |

### Open items

| Document | Description |
|----------|-------------|
| [Ambiguities and open questions](ambiguities-and-open-questions.md) | Unresolved design questions, known limitations. |

## Cross-reference conventions

- All links are relative to `docs/` root.
- Use `[Link Text](path/to/file.md)` format.
- Root documents referenced as `../FILE.md`.
- Component/flow docs in subdirectories.

## Navigation tips

- Start with [Quick start](quick-start.md) for first-time setup.
- Use [Architecture](architecture.md) for system understanding.
- Reference [Configuration](configuration.md) for schema details.
- Check [Troubleshooting](troubleshooting.md) for runtime issues.
- See [Testing](testing.md) for development workflow.