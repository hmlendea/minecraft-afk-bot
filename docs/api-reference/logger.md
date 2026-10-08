# logger.js API reference

Complete reference for `logger.js` exports.

## Exports

```js
module.exports = { createLogger }
```

---

## createLogger(options)

```js
function createLogger(options)
```

**Factory function returning a logger instance with `log` and `error` methods.**

### Parameters

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `logFilePath` | `string` | Yes | — | Absolute or relative path to log file. Relative paths resolved from `bot.js` directory. |
| `dateSupplier` | `() => Date` | No | `() => new Date()` | Function returning timestamp for each log entry. Enables deterministic testing. |
| `consoleOutput` | `{ log: function, error: function }` | No | `console` | Console destination. Allows injection of mock console for testing. |

### Returns

`object` — Logger instance with methods:

| Method | Signature | Description |
|--------|-----------|-------------|
| `log` | `(...values: any[]) => void` | Formats values with timestamp, writes to console and file. |
| `error` | `(...values: any[]) => void` | Same as `log`, but uses `consoleOutput.error`. |

### Throws

- `TypeError` if `logFilePath` is not a non-empty string.

### Log format

```
[YYYY-MM-DDTHH:mm:ss.sssssssZ] formatted message
```

- Timestamp: ISO 8601 with 7-digit fractional seconds (e.g., `2026-09-21T12:34:56.1234567Z`).
- Message: `util.format(...values)` — supports `%s`, `%d`, `%j`, etc.

### File output

- Synchronous append: `fs.appendFileSync(logFilePath, formattedMessage + '\n')`.
- Parent directories created recursively if missing (`fs.mkdirSync(..., { recursive: true })`).
- UTF-8 encoding.

### Console output

- `log` → `consoleOutput.log(formattedMessage)`
- `error` → `consoleOutput.error(formattedMessage)`

### Example usage

```js
const { createLogger } = require('./logger')

const logger = createLogger({
    logFilePath: 'logs/bot.log',
    dateSupplier: () => new Date('2026-09-21T12:34:56.789Z')
})

logger.log('Bot started')
// Console: [2026-09-21T12:34:56.7890000Z] Bot started
// File:    [2026-09-21T12:34:56.7890000Z] Bot started

logger.error('Connection failed:', new Error('ECONNREFUSED'))
// Console: [2026-09-21T12:34:56.7890000Z] Connection failed: Error: ECONNREFUSED
// File:    [2026-09-21T12:34:56.7890000Z] Connection failed: Error: ECONNREFUSED
```

### Testing support

```js
// Inject fixed timestamp
const logger = createLogger({
    logFilePath: 'test.log',
    dateSupplier: () => new Date('2026-09-21T12:34:56.789Z')
})

// Inject mock console
const mockConsole = { log: [], error: [] }
const logger = createLogger({
    logFilePath: 'test.log',
    consoleOutput: {
        log: (...args) => mockConsole.log.push(args),
        error: (...args) => mockConsole.error.push(args)
    }
})
```

### Limitations

1. **Synchronous I/O** — `fs.appendFileSync` blocks event loop. Acceptable for low-volume bot logging.
2. **No log rotation** — File grows indefinitely. Use external logrotate.
3. **No structured logging** — Plain text only. No JSON/levels/context fields.
4. **No buffering** — Each call writes immediately. No batching.
5. **Error propagation** — Filesystem errors (disk full, permissions) throw synchronously and may crash process.

### Internal constants

| Constant | Value | Description |
|----------|-------|-------------|
| `DEFAULT_LOG_FILE_PATH` | `'logfile.log'` | Default used by `bot.js:resolveLogFilePath()`. |

### Related documentation

- [Components: Logging](../components/logging.md)
- [Configuration](../configuration.md)
- [Testing](../testing.md)
- [Error handling](../error-handling.md)