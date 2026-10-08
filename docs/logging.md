# Operations logging guide

## Overview

This document describes how to use and manage logs for the Minecraft AFK Bot.

## Log destinations

| Destination | Path | Description |
|-----------|------|-------------|
| Console | Terminal where bot runs | Real-time log output |
| File | `logging.filePath` (default: `logfile.log`) | Persistent log storage |

## Log format

```
[YYYY-MM-DDTHH:mm:ss.sssssssZ] message
```

- ISO 8601 timestamp with 7-digit fractional seconds.
- Message: `util.format(...values)` - supports `%s`, `%d`, `%j`.
- Example: `[2026-09-21T12:34:56.1234567Z] Bot started`

## Log rotation

- **Recommended:** Use external `logrotate` utility.
- **Configuration example** (`/etc/logrotate.d/minecraft-afk-bot`):
  ```
  /home/horatiu/Proiecte/minecraft/minecraft-afk-bot/logfile.log {
      daily
      rotate 30
      compress
      delaycompress
      missingok
      notifempty
      create 640 botuser botuser
  }
  ```

## Log analysis

- **grep** for error patterns:
  ```bash
  grep -i "error" logfile.log
  ```
- **tail** for recent entries:
  ```bash
  tail -n 20 logfile.log
  ```
- **grep** for specific events:
  ```bash
  grep "Spawn" logfile.log
  ```

## Common log messages

| Event | Log message |
|-------|-------------|
| Startup | `Bot started` |
| Time restriction | `Current time falls within the restricted execution window. Exiting.` |
| Random skip | `Randomly skipping execution based on skip probability.` |
| Spawn | `Bot spawned` |
| Command | `Executed command: /auth [REDACTED]` |
| Sleep | `Attempting to sleep...` |
| Bed activation | `Successfully used /bed and activated a bed.` |
| Daybreak | `Day has broken. Teleporting to zone...` |
| Completion | `The bot session has concluded.` |
| Error | `An error has occurred during bot execution:` |

## Log troubleshooting

| Symptom | Likely cause | Solution |
|---------|--------------|----------|
| No log file created | `logging.filePath` invalid or directory missing | Verify config, ensure directory exists |
| Log file empty | Bot never ran or crashed immediately | Check exit code, verify configuration |
| Logs not updating | Process not running | Verify bot is running |
| High CPU usage | Log file on network share with slow I/O | Move log file to local disk |
| Permission denied | Insufficient file permissions | `chmod 640 logfile.log` and ensure user owns file |

## Log retention

- Keep logs for 30 days (default `logrotate` config).
- Archive older logs for audit/compliance.
- Do not manually delete logs while bot is running.

## Related documentation

- [Configuration](../configuration.md#logging)
- [Build and deployment](../build-and-deployment.md#log-management)
- [Error handling](../error-handling.md)
- [Troubleshooting](../troubleshooting.md)