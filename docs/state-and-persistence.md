# State and persistence

## Overview

The Minecraft AFK Bot maintains no persistent state across runs. All state is transient, held in memory during a single session.

## State categories

### Persistent (filesystem)

| State | Location | Lifetime |
|-------|----------|----------|
| Configuration | `configuration.json` | Until modified/deleted |
| Configuration template | `configuration.example.json` | Permanent (tracked in git) |
| Logs | `logging.filePath` | Until rotated/deleted |

### Transient (in-memory, per session)

| State | Variable | Lifetime |
|-------|----------|----------|
| Parsed configuration | `configuration` object | Process lifetime |
| Logger instance | `applicationLogger` | Process lifetime |
| Mineflayer bot instance | `bot` | From `createBot()` to `quit()` |
| Session completion flag | `isCompleted` | From spawn to quit |
| Transition promise chain | `transitionSequence` | From first `time` event to quit |
| Random session duration | `onlineMinutes` | From spawn to quit |
| Selected zone command | `zoneTeleportCommand` | From spawn to quit |
| Sent commands history | `bot.sentCommands` (test only) | Process lifetime |
| Activated blocks history | `bot.activatedBlocks` (test only) | Process lifetime |

## Data flow

```
┌─────────────────┐
│ configuration.json │
└────────┬────────┘
         │ loadConfiguration()
         ▼
┌─────────────────┐
│  configuration  │ (in-memory object)
└────────┬────────┘
         │ resolveLogFilePath()
         ▼
┌─────────────────┐     ┌─────────────────┐
│  log file path  │────►│   Log file      │
└─────────────────┘     └─────────────────┘
         │
         │ createLogger()
         ▼
┌─────────────────┐
│   logger obj    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ mineflayer bot  │◄─── TCP connection
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Session state  │ (isCompleted, transitionSequence, etc.)
└─────────────────┘
```

## Transformations

| Transformation | Input | Output | Location |
|----------------|-------|--------|----------|
| File → Object | `configuration.json` | `configuration` | `loadConfiguration()` |
| Template → File | `configuration.example.json` | `configuration.json` | `ensureConfigurationExists()` |
| Config → Path | `configuration.logging.filePath` | Absolute log path | `resolveLogFilePath()` |
| Config → Probability | `configuration.sleep.probability` | Validated number | `resolveSleepProbability()` |
| Config → Boolean | `configuration.schedule` | `isRestricted` | `isRestrictedByTimeWindow()` |
| Config → Command | `configuration.zones` | `/zone tp <zone>` | `main()` |
| Time → Boolean | `bot.time.isDay` | Transition detected | `registerNightSleepHandler()` |
| Dimension → Boolean | `bot.game.dimension` | Overworld check | `registerNightSleepHandler()` |
| Random → Minutes | `min, max` | `onlineMinutes` | `randomInteger()` |
| Command → Log | `commandText` | Redacted log entry | `executeCommand()` |

## No database

- No SQLite, Redis, or other database.
- No session history persisted.
- No metrics/telemetry stored.

## No cross-session state

- Each run is independent.
- No resume capability.
- No accumulated statistics.

## Filesystem requirements

| Path | Permissions | Created by |
|------|-------------|------------|
| `configuration.json` | 600 (read/write owner) | `ensureConfigurationExists()` |
| `logging.filePath` parent | 755 (read/write/execute owner) | `resolveLogFilePath()` / `createLogger()` |
| `logging.filePath` | 644 (read owner, read group) | `createLogger()` (first write) |

## Cleanup

- No explicit cleanup needed.
- Process exit closes TCP connection, file handles.
- Log file remains for analysis.
- Configuration unchanged.

## Related documentation

- [Data model](../data-model.md)
- [Configuration](../configuration.md)
- [Components: Configuration](../components/configuration.md)
- [Components: Logging](../components/logging.md)
- [Build and deployment](../build-and-deployment.md)