# Logging

## Path

[`logger.js`](../logger.js)

## Responsibility

Provides a logging adapter that mirrors every diagnostic message to the console and appends a timestamped, levelled record to a configured file. No rotation, retention, sampling, or async buffering.

## Exports

| Symbol | Type | Description |
|--------|------|-------------|
| `createLogger` | function | Factory creating a logger instance. |
| `applicationLogger` | object | Default logger instance (uses `DEFAULT_LOG_FILE_PATH`). |
| `DEFAULT_LOG_FILE_PATH` | string | Default log file path (`logfile.log` beside `bot.js`). |

## createLogger()

### Signature

```js
function createLogger({
    logFilePath = DEFAULT_LOG_FILE_PATH,
    dateSupplier = () => new Date(),
    consoleOutput = console
} = {})
```

### Parameters

| Parameter | Type | Default | Purpose |
|-----------|------|---------|---------|
| `logFilePath` | string | `DEFAULT_LOG_FILE_PATH` | Absolute or relative path. Relative paths resolve from `bot.js` directory. |
| `dateSupplier` | function | `() => new Date()` | Injectable timestamp source for testing. |
| `consoleOutput` | object | `console` | Injectable console for testing (must have `log` and `error` methods). |

### Validation

- `logFilePath` must be a non-empty string. Throws `TypeError` otherwise.
- Parent directories are created via `fs.mkdirSync(path.dirname(logFilePath), { recursive: true })`.

### Returns

Object with two methods:

```js
{
    log(...values),
    error(...values)
}
```

### log(...values)

1. `consoleOutput.log(...values)` — mirrors to stdout.
2. `appendLog('INFO', values)` — appends to file.

### error(...values)

1. `consoleOutput.error(...values)` — mirrors to stderr.
2. `appendLog('ERROR', values)` — appends to file.

### appendLog(logLevel, values)

```js
const timestamp = formatTimestamp(dateSupplier())
const message = util.format(...values)
fs.appendFileSync(logFilePath, `${timestamp} [${logLevel}] ${message}\n`, 'utf8')
```

- Synchronous append — guarantees ordering and durability.
- No buffering, batching, or async I/O.

## formatTimestamp(date)

```js
date.toISOString().replace(/(\.\d{3})Z$/, '$10000Z')
```

Converts ISO 8601 timestamp to 7-digit fractional seconds (e.g., `2026-10-08T12:34:56.7890000Z`).

## Log format

```
2026-10-08T12:34:56.7890000Z [INFO] Selected zone: zone_one
2026-10-08T12:34:57.1230000Z [ERROR] The bot has encountered an error: Error: Connection failure
```

- Timestamp: ISO 8601 with 7-digit fractional seconds, UTC.
- Level: `[INFO]` or `[ERROR]`.
- Message: `util.format(...values)` — supports multiple arguments, objects, errors.

## Constants

| Constant | Value |
|----------|-------|
| `DEFAULT_LOG_FILE_NAME` | `'logfile.log'` |
| `DEFAULT_LOG_FILE_PATH` | `path.join(__dirname, 'logfile.log')` |
| `INFORMATION_LOG_LEVEL` | `'INFO'` |
| `ERROR_LOG_LEVEL` | `'ERROR'` |
| `LOG_FILE_ENCODING` | `'utf8'` |

## Integration with bot.js

- `bot.js` imports `createLogger`, `applicationLogger`, `DEFAULT_LOG_FILE_PATH`.
- `main()` resolves log path via `resolveLogFilePath(configuration.logging)`.
- If `configuredLogFilePath === DEFAULT_LOG_FILE_PATH`, uses `defaultApplicationLogger`.
- Otherwise creates new logger: `createLogger({ logFilePath: configuredLogFilePath })`.
- `/auth` commands are redacted by `bot.js:redactAuthenticationCommand()` before reaching logger.

## Security and privacy

- No automatic redaction beyond what callers provide.
- `bot.js` redacts `/auth` passwords before logging.
- Logs may contain: server address, username, coordinates, error stack traces.
- Operator controls filesystem permissions and retention.

## Performance

- Synchronous `fs.appendFileSync` on every call.
- Low volume (tens of messages per session) makes this acceptable.
- No measurable impact on bot responsiveness.

## Testing

- `tests/logger.test.js` covers:
  - Default log file path resolution.
  - Invalid path rejection.
  - Console mirroring and file appending.
  - Timestamp formatting with injected `dateSupplier`.
  - Isolated temporary directory for file I/O.

## Limitations

| Limitation | Impact |
|------------|--------|
| No log rotation | Files grow unbounded; operator must manage. |
| No retention policy | Old logs never auto-deleted. |
| No structured fields | Only timestamp, level, formatted message. |
| No correlation IDs | Cannot trace requests across components. |
| No sampling | All messages logged. |
| No async I/O | Blocks event loop during append (negligible at low volume). |

## Related documentation

- [Architecture](../architecture.md)
- [Components: Application orchestration](./application-orchestration.md)
- [Components: Configuration](./configuration.md)
- [Error handling](../error-handling.md)
- [Testing](../testing.md)
- [Invariants](../invariants.md)