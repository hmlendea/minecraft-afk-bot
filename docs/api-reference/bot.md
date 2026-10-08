# bot.js API reference

Complete reference for all exported symbols from `bot.js`.

## Exports

```js
module.exports = {
    main,
    loadConfiguration,
    registerNightSleepHandler,
    activateBedUnderBot,
    executeCommand,
    isRestrictedByTimeWindow,
    resolveSleepProbability,
    pause,
    randomInteger,
    randomChoice,
    resolveLogFilePath,
    ensureConfigurationExists
}
```

---

## main()

```js
async function main()
```

**Entry point.** Orchestrates the complete bot session lifecycle.

### Behaviour

1. Ensures `configuration.json` exists (copies from template if missing).
2. Loads configuration.
3. Creates logger.
4. Checks time window restriction → exits if restricted.
5. Evaluates skip probability → exits if triggered.
6. Creates Mineflayer bot instance.
7. Registers `kicked`, `error`, `end` event handlers.
8. On `spawn`:
   - Waits `spawnDelayMilliseconds`.
   - Executes `/auth`, `/op`, `/god`, `/zone tp` sequentially with `commandDelayMilliseconds`.
   - Registers night sleep handler.
   - Waits randomised session duration (`minimumOnlineMinutes`–`maximumOnlineMinutes`).
   - Quits with `'Completed'`.
9. Catches any spawn-sequence error → logs → quits with `'Error'`.

### Returns

`Promise<void>` — Resolves when bot quits (completed or error).

### Throws

- Configuration errors (file missing, invalid JSON).
- Validation errors (invalid probability, empty zone command).

### Side effects

- Creates `configuration.json` if missing.
- Writes logs to configured file.
- Opens TCP connection to Minecraft server.
- Sends chat commands to server.

---

## loadConfiguration()

```js
function loadConfiguration()
```

**Loads and parses `configuration.json`.**

### Returns

`object` — Parsed configuration object.

### Throws

- `Error` if file missing (after `ensureConfigurationExists`).
- `SyntaxError` if JSON invalid.

### Side effects

- Reads `configuration.json` from directory containing `bot.js`.

---

## ensureConfigurationExists()

```js
function ensureConfigurationExists()
```

**Creates `configuration.json` from `configuration.example.json` if missing.**

### Returns

`void`

### Throws

- `Error` if template missing or copy fails.

### Side effects

- Writes `configuration.json` if not present.

---

## resolveLogFilePath(configuration)

```js
function resolveLogFilePath(configuration)
```

**Resolves log file path from configuration.**

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `configuration` | `object` | Parsed configuration object. |

### Returns

`string` — Absolute path to log file.

### Logic

1. If `configuration.logging?.filePath` exists and is non-empty string → resolve relative to `bot.js` directory.
2. Else → default to `logfile.log` beside `bot.js`.
3. Ensures parent directory exists (creates recursively).

### Throws

- `TypeError` if `filePath` is not a non-empty string.

---

## isRestrictedByTimeWindow(configuration)

```js
function isRestrictedByTimeWindow(configuration)
```

**Checks if current time falls within restricted execution window.**

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `configuration` | `object` | Parsed configuration with `schedule` section. |

### Returns

`boolean` — `true` if execution should be skipped (time is within window).

### Logic

- Missing `schedule` → `false`.
- `startMinutes === endMinutes` → `false` (disabled).
- Same-day window (start < end): `currentMinutes >= startMinutes && currentMinutes < endMinutes`.
- Overnight window (start > end): `currentMinutes >= startMinutes || currentMinutes < endMinutes`.

### Notes

Uses `new Date()` internally (not injectable). For testing, see `tests/bot.test.js` mock pattern.

---

## executeCommand(bot, commandText, delayMs, logger)

```js
async function executeCommand(bot, commandText, delayMs, logger)
```

**Sends a chat command, waits for delay, logs execution.**

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `bot` | `object` | Mineflayer bot instance (must have `chat` function). |
| `commandText` | `string` | Command to send (e.g., `/auth password`). |
| `delayMs` | `number` | Milliseconds to wait after sending. |
| `logger` | `object` | Logger with `log` and `error` methods. |

### Returns

`Promise<void>`

### Throws

- `TypeError` if `bot` is falsy or `typeof bot.chat !== 'function'`.

### Side effects

- Calls `bot.chat(commandText)`.
- Waits `delayMs` via `pause()`.
- Logs `Executed command: <command>` (redacts `/auth` password).

### Redaction

```js
const displayCommand = commandText.startsWith('/auth ')
    ? '/auth [REDACTED]'
    : commandText
```

---

## resolveSleepProbability(configuration)

```js
function resolveSleepProbability(configuration)
```

**Returns validated sleep probability from configuration.**

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `configuration` | `object` | Parsed configuration with optional `sleep.probability`. |

### Returns

`number` — Sleep probability in `[0, 1]`.

### Default

`0.65` (defined as `DEFAULT_SLEEP_PROBABILITY`).

### Throws

- `RangeError` if value not finite or outside `[0, 1]`.

---

## pause(ms)

```js
async function pause(ms)
```

**Resolves after specified milliseconds.**

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `ms` | `number` | Milliseconds to wait. |

### Returns

`Promise<void>`

### Behaviour

- `ms <= 0` → resolves immediately.
- `ms > 0` → `await new Promise(resolve => setTimeout(resolve, ms))`.

---

## randomInteger(min, max)

```js
function randomInteger(min, max)
```

**Returns random integer in inclusive range `[min, max]`.**

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `min` | `number` | Lower bound (inclusive). |
| `max` | `number` | Upper bound (inclusive). |

### Returns

`number`

### Throws

- `RangeError` if `min > max`.

---

## randomChoice(array)

```js
function randomChoice(array)
```

**Returns random element from array.**

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `array` | `Array` | Non-empty array. |

### Returns

`any` — Random element.

### Throws

- `TypeError` if not an array or array is empty.

---

## activateBedUnderBot(bot, logger)

```js
async function activateBedUnderBot(bot, logger)
```

**Finds and activates a bed at bot's position, beneath, or within 4.5 blocks.**

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `bot` | `object` | Mineflayer bot instance (requires `blockAt`, `isABed`, `activateBlock`, `entity.position`). |
| `logger` | `object` | Logger with `log` and `error` methods. |

### Returns

`Promise<void>`

### Search order

1. Block at `bot.entity.position` (feet).
2. Block at `position.offset(0, -1, 0)` (beneath feet).
3. Blocks within 4.5 blocks horizontal radius at same Y level (iterates integer offsets).

### Throws

- `TypeError` if `bot` invalid or missing required methods.
- Re-throws activation errors after logging.

### Side effects

- Logs search progress and result.
- Calls `bot.activateBlock(bedBlock)`.

---

## registerNightSleepHandler(bot, configuration, logger, zoneTeleportCommand)

```js
function registerNightSleepHandler(bot, configuration, logger, zoneTeleportCommand)
```

**Registers `time` event handler for day/night transitions.**

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `bot` | `object` | Mineflayer bot instance (requires `time`, `game.dimension`, `on`, `chat`). |
| `configuration` | `object` | Parsed configuration (for `sleep.probability`). |
| `logger` | `object` | Logger with `log` and `error` methods. |
| `zoneTeleportCommand` | `string` | Command to execute at daybreak (e.g., `/zone tp farm`). |

### Returns

`void`

### Behaviour

On `time` event:

1. **Day → Night transition** (`time.isDay` becomes `false`):
   - Checks dimension: `bot.game.dimension === 'overworld' || bot.game.dimension === 'minecraft:overworld'`.
   - If not overworld → logs skip, returns.
   - Evaluates `resolveSleepProbability(configuration)`.
   - If random < probability:
     - Sends `/bed` command.
     - Calls `activateBedUnderBot()`.
     - Logs success/failure.
   - Else → logs skip.

2. **Night → Day transition** (`time.isDay` becomes `true`):
   - Sends `zoneTeleportCommand`.
   - Logs teleport.

### Concurrency control

Uses serialised promise chain (`transitionSequence`) to ensure:
- Only one transition handled at a time.
- Day→night completes before next night→day.
- No overlapping sleep/teleport sequences.

### Validation

Throws `TypeError` if:
- `bot` missing `time`, `game`, `on`, `chat`.
- `zoneTeleportCommand` not a non-empty string.

### Side effects

- Registers persistent `time` event listener.
- Sends `/bed` and zone teleport commands.
- Activates bed block.
- Logs all transitions and actions.