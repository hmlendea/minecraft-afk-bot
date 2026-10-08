# Frequently asked questions

## General

### What does this bot do?

Connects to a Minecraft server, authenticates, runs commands (`/op`, `/god`, `/zone tp`), optionally sleeps in a bed at night, and disconnects after a randomised duration. Designed for AFK farming.

### What Minecraft version does it support?

Any version supported by Mineflayer. Configure via `server.version` in `configuration.json` (default: `1.20.1`).

### Does it work on Bedrock Edition?

No. Mineflayer only supports Java Edition protocol.

### Is it a cheat/hack client?

No. It uses standard Minecraft protocol via Mineflayer. Server-side plugins handle commands (`/op`, `/god`, `/zone`, `/bed`). No client-side modifications.

## Configuration

### Where is the configuration file?

`configuration.json` in the same directory as `bot.js`. Copy from `configuration.example.json` on first run.

### Why does the bot exit immediately?

Two common reasons:
1. **Time window restriction** - Default restricts 01:30–17:00. Change `schedule` or run outside window.
2. **Random skip** - Default 80% skip probability. Set `skipProbability: 0` to disable.

### How do I disable the time restriction?

Set `startHour`, `startMinute`, `endHour`, `endMinute` all to `0`:
```json
"schedule": { "startHour": 0, "startMinute": 0, "endHour": 0, "endMinute": 0, "skipProbability": 0 }
```

### What zones should I configure?

Any zone name your server's zone plugin recognises for `/zone tp <zone>`. The bot picks one randomly per session.

### Can I use multiple zones in one session?

No. One zone per session (selected at spawn). Same zone used for daybreak teleport.

### How do I change sleep probability?

Set `sleep.probability` (0.0–1.0). Default: 0.65. Set to 0 to disable sleep entirely.

## Operation

### How do I run it continuously?

Use cron, systemd timer, or Docker with restart policy. The bot runs once per invocation.

```bash
# Cron: every hour
0 * * * * /usr/bin/node /path/to/bot.js
```

### Does it reconnect if disconnected?

No. Single session per run. Use external scheduler for retries (systemd `Restart=on-failure`).

### Can I run multiple bots?

Yes, but each needs:
- Separate directory with own `configuration.json`
- Different bot account
- Different zone (to avoid conflicts)

### Why does the bot need `/op` and `/god`?

Server-dependent. Some AFK farms require operator status and god mode for protection. Remove from spawn sequence if not needed.

### What happens if the bot is kicked?

Logs kick reason, exits. No automatic reconnection.

## Sleep behaviour

### Why doesn't the bot sleep?

1. Not in overworld dimension (Nether/End skip sleep).
2. Sleep probability check failed (random).
3. No bed found within 4.5 blocks.
4. `/bed` command not supported by server.

### Can it sleep in the Nether/End?

No. Beds explode in vanilla Nether/End. Bot explicitly skips sleep outside overworld.

### How does bed detection work?

Searches:
1. Block at bot's feet position.
2. Block beneath feet (`offset(0, -1, 0)`).
3. Blocks within 4.5 blocks horizontal radius at same Y level.

### Can I change the bed search radius?

Not currently configurable. Hardcoded to 4.5 blocks (vanilla reach distance).

## Logs

### Where are logs written?

`logging.filePath` in config (default: `logfile.log` beside `bot.js`).

### Why is `/auth` password not in logs?

Redacted automatically: `/auth [REDACTED]`. Other commands logged in full.

### How do I rotate logs?

Use `logrotate` (see [Build and deployment](../build-and-deployment.md#log-management)).

## Development

### How do I run tests?

```bash
npm test
```

### Can I test without a Minecraft server?

Yes. All tests use mock bots. No network connection required.

### How do I add a new command?

Edit `main()` spawn sequence, add `await executeCommand(bot, '/command', delay, logger)`.

### Why CommonJS not ES modules?

Simpler, no build step, Mineflayer ecosystem uses CommonJS.

## Security

### Is the password stored securely?

Plaintext in `configuration.json`. Protect with filesystem permissions (`chmod 600`). Never commit to git.

### Is the connection encrypted?

No. Standard Minecraft protocol is unencrypted TCP. No TLS support.

### Can I use environment variables for credentials?

Not currently. Only `configuration.json` supported.

## Troubleshooting

### Bot says "Kicked from the server: ..."

Check the kick reason. Common: "Authentication failed", "Flying not enabled", "Disconnected".

### "ECONNREFUSED" error

Wrong host/port, server offline, or firewall.

### "No bed found" error

Place bed at zone destination. Ensure bot in overworld.

### Tests fail

Run `npm test`. Check Node.js version ≥ 18. Ensure dependencies installed.

## Related documentation

- [Quick start](../quick-start.md)
- [Configuration](../configuration.md)
- [Troubleshooting](../troubleshooting.md)
- [Build and deployment](../build-and-deployment.md)
- [Security](../security.md)