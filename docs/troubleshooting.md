# Troubleshooting

## Common issues

### Bot exits immediately

**Symptom:** Process starts and exits without connecting.

**Causes:**
1. Time window restriction active
2. Random skip triggered
3. Configuration error

**Diagnosis:**
- Check logs for: `Current time falls within the restricted execution window. Exiting.` or `Randomly skipping execution based on skip probability.`
- Verify `configuration.json` syntax: `node -e "require('./bot').loadConfiguration()"`

**Solutions:**
- Adjust `schedule` in config (set start/end to 0:0 to disable).
- Set `skipProbability: 0` for testing.
- Fix JSON syntax errors.

### Connection refused / ECONNREFUSED

**Symptom:** `error` event with `ECONNREFUSED`.

**Causes:**
- Wrong host/port in config.
- Server offline.
- Firewall blocking connection.

**Solutions:**
- Verify `server.host` and `server.port` in config.
- Test connectivity: `nc -zv host port`.
- Check server status.

### Authentication failed

**Symptom:** Bot connects but gets kicked after `/auth`.

**Causes:**
- Wrong password in config.
- Server uses different auth plugin.
- Account already logged in elsewhere.

**Solutions:**
- Verify `credentials.password` matches server.
- Check server auth plugin (AuthMe, etc.).
- Ensure account not logged in elsewhere.

### Commands not executing

**Symptom:** Commands sent but no effect in game.

**Causes:**
- Insufficient permissions (need `/op` first).
- Command delay too short.
- Plugin not installed.

**Solutions:**
- Ensure `/op` succeeds before other commands.
- Increase `session.commandDelayMilliseconds`.
- Verify required plugins installed.

### Bed not found / sleep fails

**Symptom:** `No bed found at bot's position, beneath, or within 4.5 blocks.`

**Causes:**
- No bed near bot position.
- Bot not in overworld.
- Bed search radius too small.

**Solutions:**
- Place bed at zone teleport destination.
- Verify bot is in overworld (dimension check).
- Check zone has bed within 4.5 blocks.

### Bot explodes in Nether/End

**Symptom:** Bot dies when night falls in Nether/End.

**Cause:** Sleep attempted in non-overworld dimension.

**Solution:** Current code prevents this (dimension check). If occurring, verify `bot.game.dimension` value.

### Log file not created

**Symptom:** No log file appears.

**Causes:**
- `logging.filePath` invalid.
- Parent directory missing.
- Permission denied.

**Solutions:**
- Verify `logging.filePath` in config.
- Ensure directory exists and is writable.
- Check file permissions.

### High memory usage

**Symptom:** Process memory grows over time.

**Causes:**
- Log file on slow network filesystem.
- Event listener leak (unlikely).

**Solutions:**
- Move log file to local disk.
- Restart bot periodically (cron/systemd).

### Process hangs

**Symptom:** Bot doesn't quit after session.

**Causes:**
- Unhandled promise rejection.
- `bot.quit()` not called.

**Solutions:**
- Check for unhandled rejection warnings.
- Verify `isCompleted` flag logic.

## Debugging tips

### Enable verbose logging

```bash
# Run with Node.js debug
node --trace-warnings bot.js
```

### Test configuration only

```bash
node -e "
const { loadConfiguration, isRestrictedByTimeWindow } = require('./bot')
const config = loadConfiguration()
console.log('Config:', JSON.stringify(config, null, 2))
console.log('Restricted:', isRestrictedByTimeWindow(config))
"
```

### Test logger only

```bash
node -e "
const { createLogger } = require('./logger')
const logger = createLogger({ logFilePath: 'test.log' })
logger.log('Test message')
logger.error('Test error')
"
```

### Mock bot test

```bash
# Run specific test
node --test tests/bot.test.js --test-name-pattern="sleep"
```

## Getting help

1. Check logs first.
2. Verify configuration.
3. Test with minimal config (disable schedule, skip).
4. Check server plugin compatibility.
5. Review [FAQ](../faq.md) and [Ambiguities](../ambiguities-and-open-questions.md).

## Related documentation

- [Configuration](../configuration.md)
- [Build and deployment](../build-and-deployment.md)
- [Error handling](../error-handling.md)
- [Logging](../logging.md)
- [FAQ](../faq.md)