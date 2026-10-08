# Integrations

## Overview

Summary of all external integrations for the Minecraft AFK Bot.

## Mineflayer (Minecraft protocol client)

| Aspect | Details |
|--------|---------|
| Package | `mineflayer` |
| Version | ^4.x |
| Purpose | Minecraft protocol implementation, event emission, block interaction |
| Integration | `mineflayer.createBot()` in `main()` |
| Events used | `spawn`, `kicked`, `error`, `end`, `time` |
| Methods used | `chat()`, `blockAt()`, `isABed()`, `activateBlock()`, `quit()` |
| Properties used | `time.isDay`, `game.dimension`, `entity.position` |

## Minecraft server commands

| Command | Plugin requirement | Purpose |
|---------|-------------------|---------|
| `/auth <password>` | AuthMe or similar | Authenticate bot account |
| `/op` | Permissions plugin | Grant operator status |
| `/god` | Essentials or similar | Enable god mode |
| `/zone tp <zone>` | Zone/WorldGuard plugin | Teleport to zone |
| `/bed` | Sleep plugin or vanilla | Initiate bed sleep |

## Filesystem

| Path | Operation | Purpose |
|------|-----------|---------|
| `configuration.json` | Read/write | Runtime configuration |
| `configuration.example.json` | Read | Template for config creation |
| `logging.filePath` | Append | Log output |

## Network

| Endpoint | Protocol | Port | Purpose |
|----------|----------|------|---------|
| `server.host:server.port` | TCP (Minecraft) | 25565 (default) | Game connection |

## Node.js core modules

| Module | Used by | Purpose |
|--------|---------|---------|
| `fs` | `bot.js`, `logger.js` | File I/O |
| `path` | `bot.js`, `logger.js` | Path resolution |
| `util` | `logger.js` | Message formatting |
| `events` | Tests | Mock bot EventEmitter |

## No other integrations

- No databases
- No message queues
- No HTTP APIs
- No cloud services
- No metrics/telemetry
- No authentication providers (beyond Minecraft `/auth`)

## Related documentation

- [Components: Integration models](../components/integration-models.md)
- [Dependencies](../dependencies.md)
- [Architecture](../architecture.md)
- [Build and deployment](../build-and-deployment.md)