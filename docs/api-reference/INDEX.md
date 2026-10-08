# API reference index

Module-by-module symbol catalogue for the Minecraft AFK Bot.

## bot.js

Main orchestration module. Exports functions for configuration, bot lifecycle, command execution, and night sleep handling.

| Symbol | Type | Description |
|--------|------|-------------|
| `main()` | `async function` | Entry point; orchestrates full bot session. |
| `loadConfiguration()` | `function` | Loads and parses `configuration.json`. |
| `ensureConfigurationExists()` | `function` | Creates `configuration.json` from template if missing. |
| `resolveLogFilePath(configuration)` | `function` | Resolves log file path from configuration. |
| `createLogger(options)` | `function` | Creates logger instance (re-exported from `logger.js`). |
| `isRestrictedByTimeWindow(configuration)` | `function` | Checks if current time falls in restricted window. |
| `executeCommand(bot, commandText, delayMs, logger)` | `async function` | Sends chat command, waits delay, logs (redacts `/auth`). |
| `resolveSleepProbability(configuration)` | `function` | Returns validated sleep probability (default 0.65). |
| `pause(ms)` | `async function` | Resolves after `ms` milliseconds (no-op for ≤ 0). |
| `randomInteger(min, max)` | `function` | Returns random integer in `[min, max]`. |
| `randomChoice(array)` | `function` | Returns random element from array. |
| `activateBedUnderBot(bot, logger)` | `async function` | Finds and activates bed at/below/near bot position. |
| `registerNightSleepHandler(bot, configuration, logger, zoneTeleportCommand)` | `function` | Registers `time` event handler for day/night transitions. |

[Full reference →](bot.md)

## logger.js

Logging adapter providing console mirror and synchronous file append.

| Symbol | Type | Description |
|--------|------|-------------|
| `createLogger(options)` | `function` | Factory returning `{ log, error }` logger object. |

### Logger options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `logFilePath` | string | Yes | — | Destination file path. |
| `dateSupplier` | `() => Date` | No | `() => new Date()` | Time source for timestamps. |
| `consoleOutput` | `{ log, error }` | No | `console` | Console destination. |

### Logger methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `log` | `(...values) => void` | Formats with timestamp, writes to console and file. |
| `error` | `(...values) => void` | Same as `log`, uses `console.error`. |

[Full reference →](logger.md)

## Mineflayer bot API (external)

The bot instance from `mineflayer.createBot()` provides:

| Property/Method | Type | Used by |
|-----------------|------|---------|
| `bot.chat(command)` | `function` | `executeCommand()` |
| `bot.blockAt(position)` | `function` | `activateBedUnderBot()` |
| `bot.isABed(block)` | `function` | `activateBedUnderBot()` |
| `bot.activateBlock(block)` | `async function` | `activateBedUnderBot()` |
| `bot.entity.position` | `Vec3` | `activateBedUnderBot()` |
| `bot.time.isDay` | `boolean` | `registerNightSleepHandler()` |
| `bot.game.dimension` | `string` | `registerNightSleepHandler()` |
| `bot.on(event, handler)` | `function` | `main()`, `registerNightSleepHandler()` |
| `bot.once(event, handler)` | `function` | `main()` |
| `bot.quit(reason)` | `function` | `main()` |

See [Mineflayer documentation](https://github.com/PrismarineJS/mineflayer) for complete API.