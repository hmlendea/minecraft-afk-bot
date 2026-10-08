# Configuration

## Path

[`configuration.example.json`](../configuration.example.json) — template (tracked)
[`configuration.json`](../configuration.json) — runtime (git-ignored)

## Responsibility

Defines all runtime parameters for server connectivity, authentication, logging, zone selection, schedule restrictions, sleep behaviour, and session timings.

## Schema

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
    "startHour": "number (0-23)",
    "startMinute": "number (0-59)",
    "endHour": "number (0-23)",
    "endMinute": "number (0-59)",
    "skipProbability": "number (0.0-1.0)"
  },
  "sleep": {
    "probability": "number (0.0-1.0)?"
  },
  "session": {
    "minimumOnlineMinutes": "number",
    "maximumOnlineMinutes": "number",
    "spawnDelayMilliseconds": "number",
    "commandDelayMilliseconds": "number"
  }
}
```

## Field reference

| Section | Key | Type | Default | Required | Description |
|---------|-----|------|---------|----------|-------------|
| `server` | `host` | string | `"mc.nucilandia.ro"` | Yes | Minecraft server hostname or IP. |
| `server` | `port` | number | `25565` | Yes | Minecraft server port. |
| `server` | `version` | string | `"1.20.1"` | Yes | Target Minecraft protocol version. |
| `credentials` | `username` | string | `"WeJoke"` | Yes | Minecraft account username. |
| `credentials` | `password` | string | `"nusuntclonaluihori"` | Yes | Password for `/auth` command. |
| `logging` | `filePath` | string | `"logfile.log"` | No | Log destination. Relative paths resolve from `bot.js` directory; missing parents created automatically. |
| `zones` | (array) | string[] | `[...]` | Yes | Target zone names for `/zone tp`. |
| `schedule` | `startHour` | number | `1` | Yes | Restricted window start hour (0-23). |
| `schedule` | `startMinute` | number | `30` | Yes | Restricted window start minute (0-59). |
| `schedule` | `endHour` | number | `17` | Yes | Restricted window end hour (0-23). |
| `schedule` | `endMinute` | number | `0` | Yes | Restricted window end minute (0-59). |
| `schedule` | `skipProbability` | number | `0.8` | Yes | Probability (0.0-1.0) of random skip. |
| `sleep` | `probability` | number | `0.65` | No | Probability (0.0-1.0) of using `/bed` at night. |
| `session` | `minimumOnlineMinutes` | number | `30` | Yes | Minimum session duration. |
| `session` | `maximumOnlineMinutes` | number | `120` | Yes | Maximum session duration. |
| `session` | `spawnDelayMilliseconds` | number | `5000` | Yes | Delay after spawn before commands. |
| `session` | `commandDelayMilliseconds` | number | `5000` | Yes | Delay between sequential commands. |

## Defaults

| Setting | Default | Source |
|---------|---------|--------|
| `logging.filePath` | `logfile.log` (beside `bot.js`) | `logger.js:DEFAULT_LOG_FILE_PATH` |
| `sleep.probability` | `0.65` | `bot.js:DEFAULT_SLEEP_PROBABILITY` |

## Validation

| Function | Validates |
|----------|-----------|
| `loadConfiguration()` | JSON syntax; file existence (copies template if missing). |
| `resolveSleepProbability()` | `sleep.probability` is finite and in `[0, 1]`. |
| `isRestrictedByTimeWindow()` | Schedule window logic (handles overnight windows). |
| `executeCommand()` | Bot has `chat` function. |
| `registerNightSleepHandler()` | Bot has `on` and `time`; zone command non-empty string; random supplier is function. |
| `activateBedUnderBot()` | Bot has required block interaction methods. |
| `createLogger()` | Log file path is non-empty string. |

## Schedule window semantics

- `startHour:startMinute` to `endHour:endMinute` defines the **restricted** window.
- If current time falls **within** the window, execution is skipped.
- `startMinutes === endMinutes` → window disabled (never restricted).
- Overnight windows supported (e.g., 22:00–06:00).
- Evaluation uses local system time (`new Date()`).

## Zone selection

- `randomChoice(configuration.zones)` selects one zone per session.
- Zone name interpolated into `/zone tp <selectedZone>` command.

## Sleep probability

- Evaluated once per day→night transition.
- `randomSupplier() < sleepProbability` → sleep attempt.
- Dimension check (`overworld` or `minecraft:overworld`) gates the attempt.

## Session duration

- `randomInteger(minimumOnlineMinutes, maximumOnlineMinutes)` selects duration.
- Bot pauses for `onlineMinutes * 60 * 1000` milliseconds.
- Then `bot.quit('Completed')`.

## File lifecycle

1. On first run, `ensureConfigurationExists()` copies `configuration.example.json` → `configuration.json`.
2. Operator edits `configuration.json` with real values.
3. `configuration.json` is git-ignored (see `.gitignore`).
4. `configuration.example.json` remains as template with placeholders.

## Security

- `configuration.json` contains plaintext credentials.
- Must be protected by filesystem permissions.
- Never commit `configuration.json` to version control.
- `/auth` password redacted in logs by `bot.js:redactAuthenticationCommand()`.

## Testing

- `tests/bot.test.js` covers:
  - `ensureConfigurationExists()` creates file from template.
  - `ensureConfigurationExists()` preserves existing file.
  - `loadConfiguration()` parses correctly.
  - `resolveLogFilePath()` resolves relative/absolute paths.
  - `isRestrictedByTimeWindow()` evaluates windows correctly.
  - `resolveSleepProbability()` validates boundaries.

## Related documentation

- [Architecture](../architecture.md)
- [Components: Application orchestration](./application-orchestration.md)
- [Components: Logging](./logging.md)
- [Flows: Session lifecycle](../flows/session-lifecycle.md)
- [Flows: Night sleep](../flows/night-sleep.md)
- [Data model](../data-model.md)
- [Configuration schema](../configuration.md)
- [Error handling](../error-handling.md)
- [Testing](../testing.md)
- [Invariants](../invariants.md)