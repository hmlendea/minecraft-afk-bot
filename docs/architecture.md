# Architecture (complements root ARCHITECTURE.md)

This document elaborates on the root [ARCHITECTURE.md](../ARCHITECTURE.md) with implementation-level detail. It does not duplicate the root document; it expands on component internals, execution semantics, and cross-cutting concerns.

## Architectural style

Single-process, event-driven batch script with a scheduled execution window. The process:

1. Loads configuration.
2. Evaluates schedule and skip probability.
3. Instantiates a Mineflayer bot.
4. Registers event listeners.
5. Executes a sequential spawn command chain.
6. Handles day/night transitions via a serialised promise sequence.
7. Pauses for a random session duration.
8. Disconnects gracefully.

No background daemons, worker pools, or persistent services.

## Component boundaries

### Application orchestration (`bot.js`)

**Responsibilities:**

- Configuration loading and validation.
- Schedule and probability evaluation.
- Mineflayer bot instantiation.
- Event listener registration (`login`, `spawn`, `time`, `kicked`, `error`, `end`).
- Spawn command sequence (`/auth`, `/op`, `/god`, `/zone tp`).
- Night sleep handler registration.
- Session timer and graceful shutdown.

**Key functions:**

| Function | Role |
|----------|------|
| `main()` | Primary orchestrator; returns `bot` instance or `null` if skipped. |
| `loadConfiguration()` | Reads `configuration.json`, copies template if missing. |
| `ensureConfigurationExists()` | Copies `configuration.example.json` → `configuration.json`. |
| `isRestrictedByTimeWindow()` | Pure function; evaluates current time against schedule window. |
| `executeCommand()` | Sends chat command, pauses for `delayMilliseconds`. |
| `registerNightSleepHandler()` | Registers `time` listener; manages sleep/teleport promise chain. |
| `activateBedUnderBot()` | Searches for bed at bot position, beneath, or within 4.5 blocks; activates first found. |
| `resolveSleepProbability()` | Validates and returns `sleep.probability` (default 0.65). |
| `pause()` | Promise-based sleep; resolves immediately for ≤ 0 ms. |
| `randomInteger()` | Inclusive integer random in `[min, max]`. |
| `randomChoice()` | Random element from array. |
| `resolveLogFilePath()` | Resolves `logging.filePath` relative to `bot.js` directory. |

**State:**

- `isCompleted` — boolean flag preventing duplicate `bot.quit()` calls.
- `previousIsDay` — tracks day/night state to detect transitions.
- `isZoneTeleportPending` — prevents duplicate zone teleport at daybreak.
- `transitionSequence` — promise chain serialising night sleep and daybreak teleport.

### Logging adapter (`logger.js`)

**Responsibilities:**

- Mirrors every `log()` call to `console.log` and appends to file with `[INFO]` prefix.
- Mirrors every `error()` call to `console.error` and appends to file with `[ERROR]` prefix.
- Creates parent directories for log file automatically.
- Uses ISO 8601 timestamp with 7-digit fractional seconds (`YYYY-MM-DDTHH:mm:ss.sssssssZ`).

**Configuration:**

- `logFilePath` — absolute or relative path (relative to `bot.js` directory).
- `dateSupplier` — injectable for testing (default `() => new Date()`).
- `consoleOutput` — injectable for testing (default `console`).

**No rotation, retention, sampling, or async buffering.** Each call performs a synchronous `fs.appendFileSync`.

### Configuration

**Schema (from `configuration.example.json`):**

```json
{
  "server": { "host": "string", "port": "number", "version": "string" },
  "credentials": { "username": "string", "password": "string" },
  "logging": { "filePath": "string?" },
  "zones": ["string"],
  "schedule": { "startHour": "number", "startMinute": "number", "endHour": "number", "endMinute": "number", "skipProbability": "number" },
  "sleep": { "probability": "number?" },
  "session": { "minimumOnlineMinutes": "number", "maximumOnlineMinutes": "number", "spawnDelayMilliseconds": "number", "commandDelayMilliseconds": "number" }
}
```

**Defaults:**

- `logging.filePath` → `logfile.log` (beside `bot.js`).
- `sleep.probability` → `0.65`.

**Validation:**

- `loadConfiguration()` parses JSON; throws on syntax error.
- `resolveSleepProbability()` enforces `[0, 1]` range.
- `isRestrictedByTimeWindow()` handles overnight windows (e.g., 22:00–06:00).
- `executeCommand()` validates bot has `chat` function.

## Execution flows

### Session lifecycle

```
main()
  → loadConfiguration()
  → isRestrictedByTimeWindow() → if true: log, return null
  → random skip probability → if triggered: log, return null
  → randomChoice(zones) → selectedZone
  → mineflayer.createBot({ host, port, username, version })
  → bot.once('login') → log connection
  → bot.once('spawn') → async spawn sequence:
      pause(spawnDelayMilliseconds)
      executeCommand('/auth <password>')
      executeCommand('/op')
      executeCommand('/god')
      executeCommand('/zone tp <selectedZone>')
      registerNightSleepHandler(bot, sleepConfig, commandDelay, zoneTeleportCommand)
      pause(randomOnlineMinutes * 60 * 1000)
      bot.quit('Completed')
  → bot.on('kicked') → log reason
  → bot.on('error') → log error
  → bot.on('end') → log completion or premature disconnect
```

**Error handling in spawn sequence:** Any exception in the `spawn` handler is caught, logged, and triggers `bot.quit('Error')`.

### Night sleep flow

```
registerNightSleepHandler(bot, sleepConfig, commandDelay, zoneTeleportCommand)
  → registerSleepDiagnosticEvents(bot)  // logs sleep, wake, bed responses
  → bot.on('time', handler)
      handler:
        currentIsDay = bot.time.isDay
        if currentIsDay === previousIsDay: return
        if currentIsDay (night → day):
            if isZoneTeleportPending:
                executeCommand(zoneTeleportCommand)
                isZoneTeleportPending = false
        else (day → night):
            // Check dimension
            currentDimension = bot.game?.dimension ?? null
            isOverworld = currentDimension === 'overworld' || currentDimension === 'minecraft:overworld'
            if !isOverworld:
                log skip (not in overworld)
                return
            if randomSupplier() >= sleepProbability:
                log skip (probability)
                return
            executeCommand('/bed')
            isZoneTeleportPending = true
            wasBedActivated = await activateBedUnderBot(bot)
            if !wasBedActivated:
                executeCommand(zoneTeleportCommand)
                isZoneTeleportPending = false
```

**Serialisation:** All night sleep and daybreak actions run on `transitionSequence` promise chain, ensuring order even if multiple `time` events fire during an active interaction.

**Dimension check:** Sleep is only attempted when `bot.game.dimension` is `'overworld'` or `'minecraft:overworld'`. Other dimensions (Nether, End, custom) skip sleep entirely and do not set `isZoneTeleportPending`.

**Bed search order:**

1. Bot's current position (offset 0, 0, 0).
2. Block directly beneath bot (offset 0, -1, 0).
3. Blocks within 4.5 blocks matching `bot.isABed(block)` (up to 32 results).

**Diagnostics:** Each step logs position, dimension, timeOfDay, isDay, isSleeping, and inspected block details.

## Cross-cutting concerns

### Security and privacy

- Credentials stored in `configuration.json` (git-ignored).
- `/auth` password redacted in logs via `redactAuthenticationCommand()`.
- No telemetry, analytics, or external reporting.
- Logs may contain server address, username, coordinates, error details — operator controls filesystem access.

### Error handling

| Location | Strategy |
|----------|----------|
| `main()` spawn sequence | try/catch → log → `bot.quit('Error')` |
| `executeCommand()` | Validates bot; throws `TypeError` if invalid |
| `activateBedUnderBot()` | Validates bot methods; throws `TypeError` if invalid; logs and re-throws activation errors |
| `registerNightSleepHandler()` | Validates inputs; catches promise chain errors, logs, continues |
| `logger.js` | Synchronous `appendFileSync`; errors propagate to caller |

### Observability

- Console mirror + file append for every diagnostic.
- Structured diagnostic objects for sleep events (position, dimension, timeOfDay, isDay, isSleeping).
- Bed response logging filters to recognised `block.minecraft.bed.*` translation keys only.
- No correlation IDs, trace IDs, or structured logging beyond timestamp + level + message.

### Concurrency

- Single-threaded Node.js event loop.
- One bot instance per process.
- `transitionSequence` serialises night sleep and daybreak teleport.
- No locks, mutexes, or worker threads.

## Dependency direction

```
tests/bot.test.js  →  bot.js  →  logger.js
tests/logger.test.js  →  logger.js
bot.js  →  mineflayer (external)
bot.js  →  fs, path (Node core)
logger.js  →  fs, path, util (Node core)
```

No circular dependencies. External packages do not import application code.

## Extension points

1. **Custom event handlers** — Register additional listeners on the `bot` instance inside `main()` after `bot.once('spawn')`.
2. **Custom random supplier** — Pass alternative `randomSupplier` to `registerNightSleepHandler()` and `main()` for deterministic testing.
3. **Custom logger** — Pass `applicationLogger` to `main()` or `createLogger()` with custom `consoleOutput`/`dateSupplier`.
4. **Custom bot factory** — Pass `botFactory` to `main()` for testing with mock Mineflayer.

## Design decisions

| Decision | Rationale |
|----------|-----------|
| Single session per invocation | Simplicity; cron/scheduler handles repetition. |
| Synchronous log append | Guarantees ordering; low volume makes performance acceptable. |
| No log rotation | Operator responsibility; avoids complexity. |
| Promise chain for transitions | Preserves command order under burst `time` events. |
| Dimension check before sleep | Beds don't work in Nether/End; prevents wasted commands and errors. |
| Redact `/auth` in logs | Prevents credential leakage in shared logs. |
| Mock-based tests only | Fast, deterministic, no external dependencies. |

## Invariants

1. **At most one sleep attempt per night** — `previousIsDay` tracking prevents duplicate evaluations.
2. **At most one zone teleport per daybreak** — `isZoneTeleportPending` flag prevents duplicates.
3. **Sleep only in overworld** — Dimension check gates the entire sleep branch.
4. **Spawn commands execute sequentially** — Each `executeCommand` awaits its delay before the next.
5. **Bot always quits** — `isCompleted` flag ensures exactly one `bot.quit()` call.
6. **Configuration file created from template if missing** — `ensureConfigurationExists()` runs before parse.
7. **Log directory created automatically** — `logger.js` calls `mkdirSync(recursive: true)`.

## Source map

| Capability | Implementation |
|------------|----------------|
| Configuration loading | `bot.js:loadConfiguration()` |
| Schedule evaluation | `bot.js:isRestrictedByTimeWindow()` |
| Bot instantiation | `bot.js:main()` → `mineflayer.createBot()` |
| Spawn command chain | `bot.js:main()` → `bot.once('spawn')` handler |
| Night sleep handler | `bot.js:registerNightSleepHandler()` |
| Bed activation | `bot.js:activateBedUnderBot()` |
| Sleep diagnostics | `bot.js:registerSleepDiagnosticEvents()`, `getSleepDiagnosticState()` |
| Logging | `logger.js:createLogger()` |
| Command redaction | `bot.js:redactAuthenticationCommand()` |
| Random utilities | `bot.js:randomInteger()`, `randomChoice()` |
| Pause utility | `bot.js:pause()` |

## Related documentation

- [Root ARCHITECTURE.md](../ARCHITECTURE.md) — high-level architecture.
- [Components: Application orchestration](./components/application-orchestration.md)
- [Components: Logging](./components/logging.md)
- [Components: Configuration](./components/configuration.md)
- [Flows: Session lifecycle](./flows/session-lifecycle.md)
- [Flows: Night sleep](./flows/night-sleep.md)
- [Data model](./data-model.md)
- [Configuration schema](./configuration.md)
- [Error handling](./error-handling.md)
- [Testing](./testing.md)
- [Dependencies](./dependencies.md)
- [Design decisions](./design-decisions.md)
- [Invariants](./invariants.md)