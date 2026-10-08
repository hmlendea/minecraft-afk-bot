# Build and deployment

## Build process

This is a Node.js application with **no build step**. Source files run directly via Node.js.

```bash
# No build required
# Just ensure dependencies are installed
npm install
```

## Runtime requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | ≥ 18.0.0 | Required for `node:test`, native ES modules, modern syntax. |
| npm | ≥ 9.0.0 | Bundled with Node.js. |

## Deployment options

### Direct execution (development)

```bash
# From project root
node bot.js
```

### Production service (systemd)

```ini
# /etc/systemd/system/minecraft-afk-bot.service
[Unit]
Description=Minecraft AFK Bot
After=network.target

[Service]
Type=simple
User=botuser
WorkingDirectory=/opt/minecraft-afk-bot
ExecStart=/usr/bin/node bot.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now minecraft-afk-bot
```

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY bot.js logger.js configuration.example.json ./

# configuration.json must be mounted at runtime
VOLUME ["/app/configuration.json", "/app/logs"]

CMD ["node", "bot.js"]
```

```bash
docker build -t minecraft-afk-bot .
docker run -d \
  -v /host/configuration.json:/app/configuration.json \
  -v /host/logs:/app/logs \
  minecraft-afk-bot
```

### Cron (scheduled execution)

```bash
# Run every hour, but bot's internal schedule controls actual execution
0 * * * * /usr/bin/node /opt/minecraft-afk-bot/bot.js >> /var/log/minecraft-afk-bot/cron.log 2>&1
```

## Configuration deployment

1. Copy template:
   ```bash
   cp configuration.example.json configuration.json
   ```

2. Edit with real values:
   ```bash
   vim configuration.json
   ```

3. Secure permissions:
   ```bash
   chmod 600 configuration.json
   ```

## Log management

- Logs written to `logging.filePath` (default: `logfile.log` beside `bot.js`).
- Use logrotate for production:

```conf
# /etc/logrotate.d/minecraft-afk-bot
/opt/minecraft-afk-bot/logfile.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 640 botuser botuser
}
```

## Health checks

The bot logs key lifecycle events:

| Event | Log message |
|-------|-------------|
| Startup | `Bot started` |
| Time restricted | `Current time falls within the restricted execution window. Exiting.` |
| Random skip | `Randomly skipping execution based on skip probability.` |
| Connected | `Bot spawned` (via spawn sequence) |
| Commands sent | `Executed command: /auth [REDACTED]`, etc. |
| Sleep attempt | `Night has fallen. Evaluating sleep probability...` |
| Sleep success | `Successfully used /bed and activated a bed.` |
| Daybreak | `Day has broken. Teleporting to zone...` |
| Completion | `The bot session has concluded.` |
| Error | `An error has occurred during bot execution:` |

Monitor for "The bot session has concluded." as success indicator.

## Updating

```bash
cd /opt/minecraft-afk-bot
git pull
npm ci --omit=dev
# Restart service if using systemd
sudo systemctl restart minecraft-afk-bot
```

## Rollback

```bash
git checkout <previous-tag>
npm ci --omit=dev
sudo systemctl restart minecraft-afk-bot
```

## Related documentation

- [Architecture](../architecture.md)
- [Dependencies](../dependencies.md)
- [Configuration](../configuration.md)
- [Testing](../testing.md)
- [Security](../security.md)