# Components index

Catalogue of components for the Minecraft AFK Bot.

## Components

| Component | Document | Description |
|-----------|----------|-------------|
| Application orchestration | [application-orchestration.md](application-orchestration.md) | Main module `bot.js`: configuration, bot lifecycle, command execution, night sleep handling. |
| Logging | [logging.md](logging.md) | Logging adapter `logger.js`: console mirror, synchronous file append, timestamp formatting. |
| Configuration | [configuration.md](configuration.md) | Configuration schema, validation, file lifecycle (`configuration.json` + template). |
| Integration models | [integration-models.md](integration-models.md) | External interfaces: Mineflayer bot API, Minecraft server commands, filesystem. |

## Component responsibilities

| Component | Inputs | Outputs | Dependencies |
|-----------|--------|---------|--------------|
| `bot.js` | Config, bot events | Commands, logs, bot lifecycle | `logger.js`, `mineflayer`, `fs`, `path` |
| `logger.js` | Log messages, file path | Console output, file append | `fs`, `path`, `util` |
| Config file | JSON schema | Parsed object | `fs` |
| Mineflayer bot | Events, commands | Bot instance, events | Network, Minecraft server |

## Data flow between components

```
bot.js ──► logger.js ──► Filesystem (log file)
   │
   ├──► Config file (read/write)
   │
   └──► Mineflayer bot ──► Minecraft server
```

## Related documentation

- [Architecture](../architecture.md)
- [Repository structure](../repository-structure.md)
- [Dependencies](../dependencies.md)
- [Integration models](integration-models.md)