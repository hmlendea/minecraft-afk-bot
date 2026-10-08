# Quick start

## Prerequisites

- Node.js ≥ 18.0.0
- Minecraft server with required plugins (AuthMe, Essentials, Zone plugin)
- Bot account with password

## Installation

```bash
# Clone or navigate to project
cd minecraft-afk-bot

# Install dependencies
npm install
```

## Configuration

1. Copy template:
   ```bash
   cp configuration.example.json configuration.json
   ```

2. Edit with your values:
   ```bash
   vim configuration.json
   ```

3. Secure the file:
   ```bash
   chmod 600 configuration.json
   ```

### Required configuration

```json
{
  "server": {
    "host": "your-server.com",
    "port": 25565,
    "version": "1.20.1"
  },
  "credentials": {
    "username": "YourBotName",
    "password": "your-auth-password"
  },
  "zones": ["your_zone_name"]
}
```

## Run

```bash
node bot.js
```

## Verify

Check logs for:
```
Bot started
Bot spawned
Executed command: /auth [REDACTED]
Executed command: /op
Executed command: /god
Executed command: /zone tp your_zone_name
The bot session has concluded.
```

## Schedule (optional)

The bot may exit immediately if:
- Current time is in restricted window (default: 01:30–17:00)
- Random skip triggers (default: 80% chance)

To run immediately for testing, adjust `schedule` in config:
```json
{
  "schedule": {
    "startHour": 0,
    "startMinute": 0,
    "endHour": 0,
    "endMinute": 0,
    "skipProbability": 0
  }
}
```

## Next steps

- Read [Configuration](../configuration.md) for all options.
- Read [Build and deployment](../build-and-deployment.md) for production setup.
- Read [Troubleshooting](../troubleshooting.md) if issues arise.