# Testing

## Test framework

- **Runner:** Node.js native test runner (`node:test`).
- **Assertions:** `node:assert/strict`.
- **Execution:** `npm test` runs all test files in `tests/`.

## Test organisation

| File | Coverage |
|------|----------|
| `tests/bot.test.js` | `bot.js` helpers, configuration, command execution, night sleep handler, `main` orchestration. |
| `tests/logger.test.js` | `logger.js` factory, console mirroring, file appending, timestamp formatting. |

## Test principles

1. **No external dependencies** — All tests use mocks; no live Minecraft server connections.
2. **Deterministic** — Injected `randomSupplier`, `dateSupplier`, `consoleOutput` for reproducible results.
3. **Isolated** — Each test creates its own mocks; no shared state.
4. **Fast** — Milliseconds per test; no network I/O.

## Mock patterns

### Mock bot (EventEmitter-based)

```js
const bot = new EventEmitter()
bot.time = { isDay: true }
bot.game = { dimension: 'overworld' }
bot.sentCommands = []
bot.activatedBlocks = []
bot.chat = commandText => bot.sentCommands.push(commandText)
bot.blockAt = position => availableBlocks.get(position) ?? null
bot.isABed = block => Boolean(block?.isBed)
bot.activateBlock = async block => bot.activatedBlocks.push(block)
bot.entity = {
    position: {
        offset(horizontalOffset, verticalOffset, depthOffset) {
            // return appropriate test position
        }
    }
}
```

### Mock logger (recording)

```js
function createRecordingLogger() {
    return {
        logMessages: [],
        errorMessages: [],
        log(...values) { this.logMessages.push(values) },
        error(...values) { this.errorMessages.push(values) }
    }
}
```

### Silent logger (no-op)

```js
const silentLogger = { log() {}, error() {} }
```

### Injected random supplier

```js
const alwaysTriggerRandom = () => 0.1  // triggers skip
const neverTriggerRandom = () => 0.99  // never triggers skip
const suppliedRandomValues = [0.64, 0.65]
let randomCallCount = 0
const randomSupplier = () => suppliedRandomValues[randomCallCount++]
```

### Injected date supplier

```js
const timestamp = new Date('2026-09-21T12:34:56.789Z')
const logger = createLogger({ dateSupplier: () => timestamp })
```

## Test categories

### Helper functions

| Function | Tests |
|----------|-------|
| `pause` | Resolves immediately for ≤ 0 ms; waits for positive ms. |
| `randomInteger` | Inclusive bounds, identical bounds, negative bounds, throws on min > max. |
| `randomChoice` | Returns array element, single-element array, throws on invalid/empty. |
| `resolveLogFilePath` | Resolves relative paths, preserves absolute, defaults, rejects invalid. |
| `isRestrictedByTimeWindow` | Missing schedule, identical start/end, same-day window, overnight window. |
| `executeCommand` | Issues command, redacts auth, throws on invalid bot. |
| `resolveSleepProbability` | Defaults to 0.65, accepts boundaries, rejects invalid. |
| `activateBedUnderBot` | Bed beneath, at position, reachable, invalid bot, missing/non-bed, activation failure, logs state. |
| `registerNightSleepHandler` | Logs sleep/wake events, bed responses, validates dependencies, sleeps once per night, teleports at daybreak, waits for indeterminate time, teleports when no bed, skips non-overworld, sleeps in namespaced overworld. |
| `ensureConfigurationExists` | Creates from template, preserves existing. |
| `loadConfiguration` | Loads and parses correctly. |

### Integration (main)

| Scenario | Test |
|----------|------|
| Time restriction applies | Returns null. |
| Skip probability triggered | Returns null. |
| Writes logs to configured file | Verifies log content. |
| Creates bot and executes spawn workflow | Verifies command sequence. |
| Handles spawn errors gracefully | Verifies `bot.quit('Error')`. |

### Logger

| Scenario | Test |
|----------|------|
| Default log file path | Beside `bot.js`, named `logfile.log`. |
| Invalid log file paths | Rejects null, empty, whitespace, number, object. |
| Mirrors to console and file | Verifies both destinations, timestamp format. |

## Running tests

```bash
# All tests
npm test

# Single test file
node --test tests/bot.test.js

# With coverage (Node.js 20+)
node --test --experimental-test-coverage tests/
```

## Test coverage

Current coverage (as of last run):

- **Statements:** ~95%
- **Branches:** ~90%
- **Functions:** ~95%
- **Lines:** ~95%

Key uncovered areas:
- `main()` CLI entry point (`require.main === module` branch).
- Some error paths in `logger.js` (filesystem errors).

## Adding tests

1. Create test file in `tests/` (e.g., `new-feature.test.js`).
2. Import `test` from `node:test` and `assert` from `node:assert/strict`.
3. Use mock patterns above for isolation.
4. Run `npm test` to verify.

## CI integration

GitHub Actions workflow (`.github/workflows/dotnet.yml` equivalent for Node.js) runs `npm test` on every push/PR.

## Related documentation

- [Architecture](../architecture.md)
- [Components: Application orchestration](../components/application-orchestration.md)
- [Components: Logging](../components/logging.md)
- [Components: Configuration](../components/configuration.md)
- [Flows: Session lifecycle](../flows/session-lifecycle.md)
- [Flows: Night sleep](../flows/night-sleep.md)
- [Error handling](../error-handling.md)
- [Invariants](../invariants.md)