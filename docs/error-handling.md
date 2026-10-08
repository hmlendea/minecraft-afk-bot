# Error handling

## Error taxonomy

| Category | Examples | Handling |
|----------|----------|----------|
| Configuration errors | Missing file, invalid JSON, invalid values | Thrown at startup; process exits. |
| Validation errors | Invalid probability, empty zone command, missing bot methods | Thrown at call site; caught by caller or process exits. |
| Network errors | Connection refused, timeout, kick | Logged via `error`/`kicked` events; process exits via `end`. |
| Command execution errors | Chat send failure, delay interruption | Caught in spawn sequence; triggers `bot.quit('Error')`. |
| Sleep sequence errors | Bed activation failure, command failure | Caught in promise chain; logged; bot continues. |
| Filesystem errors | Log file write failure, config read failure | Propagated to caller; may crash process. |

## Handling patterns

### Startup validation (fail-fast)

```js
// loadConfiguration()
if (!fileSystem.existsSync(configurationFilePath)) {
    // copies template, then parses
}
const rawConfigurationContent = fileSystem.readFileSync(configurationFilePath, 'utf8')
return JSON.parse(rawConfigurationContent)  // throws on invalid JSON
```

### Parameter validation (explicit exceptions)

```js
// executeCommand()
if (!bot || typeof bot.chat !== 'function') {
    throw new TypeError('A valid bot instance with a chat method is required.')
}

// resolveSleepProbability()
if (!Number.isFinite(sleepProbability) || sleepProbability < 0 || sleepProbability > 1) {
    throw new RangeError(`The sleep probability must be a finite number between 0 and 1. Received: ${sleepProbability}.`)
}

// createLogger()
if (typeof logFilePath !== 'string' || logFilePath.trim().length === 0) {
    throw new TypeError(`The log file path must be a non-empty string. Received: ${logFilePath}.`)
}
```

### Spawn sequence (try/catch with graceful quit)

```js
bot.once('spawn', async () => {
    try {
        await pause(spawnDelay)
        await executeCommand(bot, `/auth ${password}`, commandDelay, logger)
        await executeCommand(bot, '/op', commandDelay, logger)
        await executeCommand(bot, '/god', commandDelay, logger)
        await executeCommand(bot, zoneTeleportCommand, commandDelay, logger)
        registerNightSleepHandler(...)
        await pause(onlineMinutes * 60 * 1000)
        isCompleted = true
        bot.quit('Completed')
    } catch (error) {
        logger.error('An error has occurred during bot execution:', error)
        isCompleted = true
        bot.quit('Error')
    }
})
```

### Night sleep handler (promise chain with catch)

```js
transitionSequence = transitionSequence
    .then(async () => {
        // sleep/teleport logic
    })
    .catch(error => {
        applicationLogger.error('The night sleep sequence failed:', error)
    })
```

### Event-based errors (Mineflayer)

```js
bot.on('kicked', reason => {
    logger.log('Kicked from the server:', reason)
})

bot.on('error', error => {
    logger.error('The bot has encountered an error:', error)
})

bot.on('end', () => {
    if (!isCompleted) {
        logger.log('Disconnected prior to normal completion.')
    } else {
        logger.log('The bot session has concluded.')
    }
})
```

### Logger errors (synchronous propagation)

```js
// logger.js
fileSystem.appendFileSync(logFilePath, ...)  // throws on filesystem error
```

## Error propagation rules

1. **Configuration/validation errors** → throw immediately; process exits.
2. **Spawn sequence errors** → caught, logged, `bot.quit('Error')`, process exits via `end`.
3. **Night sleep errors** → caught in promise chain, logged, bot continues running.
4. **Network errors** → Mineflayer emits `error`/`kicked` → logged → `end` event fires.
5. **Logger errors** → synchronous; propagate to caller (may crash process).

## Recovery strategies

| Error type | Recovery |
|------------|----------|
| Config missing | Auto-create from template; continue. |
| Config invalid JSON | No recovery; fix file and re-run. |
| Time restricted | No recovery; wait for window to pass. |
| Random skip | No recovery; re-run for another chance. |
| Connection failure | No automatic retry; re-run process. |
| Authentication failure | No automatic retry; check credentials. |
| Spawn command failure | Graceful quit; re-run process. |
| Bed activation failure | Logged; zone teleport attempted; bot continues. |
| Log write failure | No recovery; check disk/permissions. |

## Testing error paths

`tests/bot.test.js` covers:

- `executeCommand` throws `TypeError` for invalid bot.
- `resolveSleepProbability` throws `RangeError` for invalid values.
- `activateBedUnderBot` throws `TypeError` for invalid bot.
- `activateBedUnderBot` logs and re-throws activation errors.
- `registerNightSleepHandler` validates dependencies.
- `main` handles spawn sequence errors gracefully.
- `createLogger` rejects invalid log file paths.

## Related documentation

- [Architecture](../architecture.md)
- [Components: Application orchestration](../components/application-orchestration.md)
- [Components: Logging](../components/logging.md)
- [Components: Configuration](../components/configuration.md)
- [Flows: Session lifecycle](../flows/session-lifecycle.md)
- [Flows: Night sleep](../flows/night-sleep.md)
- [Testing](../testing.md)
- [Invariants](../invariants.md)