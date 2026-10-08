# Configuration schema

This document provides a complete reference for the configuration schema used by the Minecraft AFK Bot.

## File locations

| File | Tracked | Purpose |
|------|---------|---------|
| `configuration.example.json` | Yes | Template with placeholder values. |
| `configuration.json` | No (git-ignored) | Runtime configuration with real values. |

## Complete schema

```json
{
  "server": {
    "host": "string",
    "port": "number",
    "version": "string"
  },
  "credentials": {
    "username": "string",
    "password": "string"
  },
  "logging": {
    "filePath": "string?"
  },
  "zones": ["string"],
  "schedule": {
    "startHour": "number",
    "startMinute": "number",
    "endHour": "number",
    "endMinute": "number",
    "skipProbability": "number"
  },
  "sleep": {
    "probability": "number?"
  },
  "session": {
    "minimumOnlineMinutes": "number",
    "maximumOnlineMinutes": "number",
    "spawnDelayMilliseconds": "number",
    "commandDelayMilliseconds": "number"
  }
}
```

## Field definitions

### server

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `host` | string | Yes | `"mc.nucilandia.ro"` | Minecraft server hostname or IP address. |
| `port` | number | Yes | `25565` | Minecraft server port. |
| `version` | string | Yes | `"1.20.1"` | Target Minecraft protocol version (must be supported by Mineflayer). |

### credentials

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `username` | string | Yes | `"WeJoke"` | Minecraft account username. |
| `password` | string | Yes | `"nusuntclonaluihori"` | Password for in-game `/auth` command. |

### logging

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `filePath` | string | No | `"logfile.log"` | Log destination. Relative paths resolve from the directory containing `bot.js`. Missing parent directories are created automatically. |

### zones

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| (array) | string[] | Yes | `[...]` | List of target zone names for `/zone tp` teleportation. One zone is randomly selected per session. |

### schedule

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `startHour` | number (0-23) | Yes | `1` | Start hour of the restricted execution window. |
| `startMinute` | number (0-59) | Yes | `30` | Start minute of the restricted execution window. |
| `endHour` | number (0-23) | Yes | `17` | End hour of the restricted execution window. |
| `endMinute` | number (0-59) | Yes | `0` | End minute of the restricted execution window. |
| `skipProbability` | number (0.0-1.0) | Yes | `0.8` | Probability of randomly skipping execution entirely. |

**Window semantics:** The window defines when execution is **restricted** (skipped). If current time falls within the window, the bot exits without connecting. `startMinutes === endMinutes` disables the restriction. Overnight windows (e.g., 22:00–06:00) are supported.

### sleep

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `probability` | number (0.0-1.0) | No | `0.65` | Probability of using `/bed` and activating a bed at each day→night transition. Only evaluated when the bot is in the overworld dimension. |

### session

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `minimumOnlineMinutes` | number | Yes | `30` | Minimum online session duration in minutes. |
| `maximumOnlineMinutes` | number | Yes | `120` | Maximum online session duration in minutes. |
| `spawnDelayMilliseconds` | number | Yes | `5000` | Delay after `spawn` event before executing first command. |
| `commandDelayMilliseconds` | number | Yes | `5000` | Delay between sequential commands (`/auth`, `/op`, `/god`, `/zone tp`, `/bed`). |

## Defaults summary

| Setting | Default | Source |
|---------|---------|--------|
| `logging.filePath` | `logfile.log` (beside `bot.js`) | `logger.js:DEFAULT_LOG_FILE_PATH` |
| `sleep.probability` | `0.65` | `bot.js:DEFAULT_SLEEP_PROBABILITY` |

## Validation rules

| Rule | Enforced by |
|------|-------------|
| JSON syntax valid | `loadConfiguration()` |
| `sleep.probability` in [0, 1] | `resolveSleepProbability()` |
| Schedule window logic correct | `isRestrictedByTimeWindow()` |
| `logging.filePath` non-empty string | `createLogger()` |
| `zoneTeleportCommand` non-empty string | `registerNightSleepHandler()` |
| Bot has required methods | `executeCommand()`, `activateBedUnderBot()` |

## Example configuration.json

```json
{
  "server": {
    "host": "mc.example.com",
    "port": 25565,
    "version": "1.20.1"
  },
  "credentials": {
    "username": "MyBot",
    "password": "secret123"
  },
  "logging": {
    "filePath": "logs/bot.log"
  },
  "zones": [
    "farm_zone",
    "spawn_zone",
    "mining_zone"
  ],
  "schedule": {
    "startHour": 1,
    "startMinute": 30,
    "endHour": 17,
    "endMinute": 0,
    "skipProbability": 0.8
  },
  "sleep": {
    "probability": 0.65
  },
  "session": {
    "minimumOnlineMinutes": 30,
    "maximumOnlineMinutes": 120,
    "spawnDelayMilliseconds": 5000,
    "commandDelayMilliseconds": 5000
  }
}
```

## Security notes

- `configuration.json` contains plaintext credentials.
- Must be protected by filesystem permissions (e.g., `chmod 600 configuration.json`).
- Never commit to version control (listed in `.gitignore`).
- `/auth` password is redacted in logs by `bot.js:redactAuthenticationCommand()`.

## Related documentation

- [Components: Configuration](../components/configuration.md)
- [Data model](../data-model.md)
- [Architecture](../architecture.md)
- [Flows: Session lifecycle](../flows/session-lifecycle.md)
- [Flows: Night sleep](../flows/night-sleep.md)