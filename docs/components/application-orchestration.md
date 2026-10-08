# Application orchestration

## Path

[`bot.js`](../bot.js)

## Responsibility

The single orchestration module. It owns configuration loading, bot instantiation, event listener registration, command execution sequencing, night sleep handling, session timing, and graceful shutdown.

## Entry point

```js
if (require.main === module) {
    main().catch(error => {
        defaultApplicationLogger.error('A fatal error has occurred during bot execution:', error)
    })
}
```

When run directly (`node bot.js`), `main()` executes. When imported as a module, only exports are available — no side effects.

## Exports

| Symbol | Type | Description |
|--------|------|-------------|
| `main` | async function | Primary orchestrator. |
| `loadConfiguration` | function | Reads and parses `configuration.json`. |
| `ensureConfigurationExists` | function | Copies template if config missing. |
| `isRestrictedByTimeWindow` | function | Pure time-window check. |
| `executeCommand` | async function | Sends chat command + delay. |
| `registerNightSleepHandler` | function | Registers `time` listener for sleep/teleport. |
| `activateBedUnderBot` | async function | Finds and activates nearest bed. |
| `resolveSleepProbability` | function | Validates sleep probability. |
| `pause` | function | Promise-based delay. |
| `randomInteger` | function | Inclusive random integer. |
| `randomChoice` | function | Random array element. |
| `resolveLogFilePath` | function | Resolves log path relative to `bot.js`. |

## main()

### Signature

```js
async function main(
    customConfiguration,
    botFactory = mineflayer.createBot,
    randomSupplier = Math.random,
    applicationLogger
)
```

### Parameters

| Parameter | Type | Default | Purpose |
|-----------|------|---------|---------|
| `customConfiguration` | object? | loaded from file | Injected config for testing. |
| `botFactory` | function | `mineflayer.createBot` | Injectable bot factory for testing. |
| `randomSupplier` | function | `Math.random` | Injectable RNG for deterministic tests. |
| `applicationLogger` | object? | `defaultApplicationLogger` | Injectable logger for testing. |

### Returns

- `null` — when time restriction applies or random skip triggers.
- `bot` instance — when the bot is created and running.

### Execution sequence

1. **Resolve configuration** — `customConfiguration` or `loadConfiguration()`.
2. **Resolve logger** — `applicationLogger` or create from `configuration.logging.filePath`.
3. **Time window check** — `isRestrictedByTimeWindow(new Date(), configuration.schedule)`. If true, log and return `null`.
4. **Skip probability** — `randomSupplier() < configuration.schedule.skipProbability`. If true, log and return `null`.
5. **Zone selection** — `randomChoice(configuration.zones)`.
6. **Bot instantiation** — `botFactory({ host, port, username, version })`.
7. **Event registration:**
   - `bot.once('login')` — log connection.
   - `bot.once('spawn')` — async spawn sequence.
   - `bot.on('kicked')` — log reason.
   - `bot.on('error')` — log error.
   - `bot.on('end')` — log completion or premature disconnect.
8. **Return `bot`** — caller can emit events for testing.

### Spawn sequence (inside `bot.once('spawn')`)

```js
await pause(configuration.session.spawnDelayMilliseconds)
await executeCommand(bot, `/auth ${configuration.credentials.password}`, commandDelay, logger)
await executeCommand(bot, '/op', commandDelay, logger)
await executeCommand(bot, '/god', commandDelay, logger)
await executeCommand(bot, zoneTeleportCommand, commandDelay, logger)
registerNightSleepHandler(bot, configuration.sleep, commandDelay, zoneTeleportCommand, randomSupplier, logger)
const onlineMinutes = randomInteger(min, max)
await pause(onlineMinutes * 60 * 1000)
isCompleted = true
bot.quit('Completed')
```

**Error handling:** Wrapped in try/catch. On error: log, set `isCompleted = true`, `bot.quit('Error')`.

## registerNightSleepHandler()

### Signature

```js
function registerNightSleepHandler(
    bot,
    sleepConfiguration,
    commandDelayMilliseconds,
    zoneTeleportCommand,
    randomSupplier = Math.random,
    applicationLogger = defaultApplicationLogger
)
```

### Validation

- `bot` must have `on` function and `time` property.
- `zoneTeleportCommand` must be a non-empty string.
- `randomSupplier` must be a function.
- `sleepConfiguration.probability` validated by `resolveSleepProbability()`.

### State

| Variable | Initial | Purpose |
|----------|---------|---------|
| `previousIsDay` | `bot.time.isDay` or `null` | Detects day/night transitions. |
| `isZoneTeleportPending` | `false` | Prevents duplicate daybreak teleport. |
| `transitionSequence` | `Promise.resolve()` | Serialises sleep/teleport operations. |

### Event listener: `bot.on('time')`

```
currentIsDay = bot.time.isDay
if typeof currentIsDay !== 'boolean': return
if previousIsDay === null: previousIsDay = currentIsDay; return
if currentIsDay === previousIsDay: return

previousIsDay = currentIsDay
transitionSequence = transitionSequence.then(async () => {
    if currentIsDay (night → day):
        if isZoneTeleportPending:
            executeCommand(zoneTeleportCommand)
            isZoneTeleportPending = false
    else (day → night):
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
})
```

### Dimension check

Sleep is only attempted when `bot.game.dimension` is `'overworld'` or `'minecraft:overworld'`. This covers both vanilla and namespaced dimension identifiers. Other dimensions (Nether, End, custom) skip sleep entirely.

### Error handling

The promise chain has a `.catch()` that logs errors without terminating the process. This ensures a failed sleep attempt doesn't crash the bot.

## activateBedUnderBot()

### Signature

```js
async function activateBedUnderBot(bot, applicationLogger = defaultApplicationLogger)
```

### Validation

Bot must have: `entity.position`, `entity.position.offset`, `blockAt`, `isABed`, `activateBlock`.

### Bed search order

1. `bot.entity.position.offset(0, 0, 0)` — current position.
2. `bot.entity.position.offset(0, -1, 0)` — block beneath.
3. `bot.findBlocks({ matching: block => bot.isABed(block), maxDistance: 4.5, count: 32 })` — reachable beds.

### Returns

- `true` — bed found and activated.
- `false` — no bed found within range.

### Error handling

- Activation errors are logged and re-thrown.
- Missing/non-bed blocks are skipped (continue loop).

## executeCommand()

### Signature

```js
async function executeCommand(bot, command, delayMilliseconds, applicationLogger = defaultApplicationLogger)
```

### Validation

Bot must have `chat` function.

### Behaviour

1. Log command (with `/auth` redacted).
2. `bot.chat(command)`.
3. `await pause(delayMilliseconds)`.

## Helper functions

### pause(milliseconds)

- ≤ 0: resolves immediately.
- > 0: `setTimeout`-based promise.

### randomInteger(minimum, maximum)

- Inclusive bounds.
- Throws `RangeError` if `minimum > maximum`.

### randomChoice(array)

- Throws `TypeError` if array is empty or not an array.

### resolveSleepProbability(sleepConfiguration)

- Defaults to `0.65`.
- Throws `RangeError` if not finite or outside `[0, 1]`.

### redactAuthenticationCommand(command)

- Matches `/^\/auth(?:\s|$)/i`.
- Returns `'/auth [REDACTED]'` for auth commands.

### resolveLogFilePath(loggingConfiguration, baseDirectoryPath)

- Defaults to `DEFAULT_LOG_FILE_PATH` (from `logger.js`).
- Resolves relative paths from `baseDirectoryPath` (defaults to `__dirname`).
- Throws `TypeError` for invalid paths.

### getDiagnosticPosition(position)

- Returns `{ x, y, z }` with `null` for missing values.

### getSleepDiagnosticState(bot)

- Returns `{ position, dimension, timeOfDay, isDay, isSleeping }` with `null` for missing values.

### registerSleepDiagnosticEvents(bot, applicationLogger)

Registers three listeners:

- `sleep` — logs "The server confirmed sleep via the sleep event."
- `wake` — logs "The server reported waking via the wake event."
- `message` — logs recognised bed response translation keys matching `/^block\.minecraft\.bed\.(?:not_safe|not_valid|occupied|too_far_away|no_sleep|obstructed)$/`.

## Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `DEFAULT_CONFIGURATION_FILE_NAME` | `'configuration.json'` | Config file name. |
| `DEFAULT_CONFIGURATION_TEMPLATE_FILE_NAME` | `'configuration.example.json'` | Template file name. |
| `MINUTES_PER_HOUR` | `60` | Time conversion. |
| `SECONDS_PER_MINUTE` | `60` | Time conversion. |
| `MILLISECONDS_PER_SECOND` | `1000` | Time conversion. |
| `ZERO_MILLISECONDS` | `0` | Pause threshold. |
| `DEFAULT_SLEEP_PROBABILITY` | `0.65` | Default sleep probability. |
| `BED_COMMAND` | `'/bed'` | In-game bed command. |
| `BLOCK_BELOW_VERTICAL_OFFSET` | `-1` | Vertical offset for bed search. |
| `CURRENT_BLOCK_VERTICAL_OFFSET` | `0` | Vertical offset for current position. |
| `HORIZONTAL_OR_DEPTH_POSITION_OFFSET` | `0` | Horizontal/depth offset. |
| `BED_INTERACTION_RANGE` | `4.5` | Max distance for bed search. |
| `MAXIMUM_BED_SEARCH_RESULTS` | `32` | Max results from `findBlocks`. |
| `AUTHENTICATION_COMMAND_PATTERN` | `/^\/auth(?:\s|$)/i` | Pattern for redaction. |
| `REDACTED_AUTHENTICATION_COMMAND` | `'/auth [REDACTED]'` | Redacted form. |
| `BED_RESPONSE_TRANSLATION_PATTERN` | `/^block\.minecraft\.bed\.(?:not_safe|not_valid|occupied|too_far_away|no_sleep|obstructed)$/` | Bed rejection keys. |

## Related documentation

- [Architecture](../architecture.md)
- [Flows: Session lifecycle](../flows/session-lifecycle.md)
- [Flows: Night sleep](../flows/night-sleep.md)
- [Components: Logging](./logging.md)
- [Components: Configuration](./configuration.md)
- [Data model](../data-model.md)
- [Configuration schema](../configuration.md)
- [Error handling](../error-handling.md)
- [Testing](../testing.md)
- [Invariants](../invariants.md)