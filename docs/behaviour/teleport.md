# Teleport behaviour

## Overview

The bot teleports to a configured zone using `/zone tp <zone>` command at two points in the session lifecycle.

## Triggers

| Trigger | Timing | Command source |
|---------|--------|----------------|
| Spawn | After `/auth`, `/op`, `/god` commands | Randomly selected from `zones[]` array |
| Daybreak | Night → day transition | Same zone command as spawn |

## Zone selection

- At startup: `randomChoice(configuration.zones)` selects one zone.
- Command constructed as `/zone tp <selectedZone>`.
- Same command used for both spawn and daybreak teleports.

## Sequence (spawn)

1. Bot spawns (`spawn` event).
2. Waits `spawnDelayMilliseconds` (default 5000ms).
3. Executes `/auth`, `/op`, `/god` sequentially with `commandDelayMilliseconds`.
4. Executes `/zone tp <zone>` with `commandDelayMilliseconds`.
5. Registers night sleep handler.

## Sequence (daybreak)

1. Night → day transition detected (`time` event, `isDay` becomes `true`).
2. Serialised promise chain ensures previous night sequence completed.
3. Bot sends `zoneTeleportCommand` via `bot.chat()`.
4. Logs teleport.

## Failure modes

| Failure | Handling |
|---------|----------|
| Empty `zones` array | `randomChoice()` throws `TypeError` at startup. |
| Empty zone command | `registerNightSleepHandler()` validates and throws `TypeError`. |
| Command send fails | Caught in spawn sequence → `bot.quit('Error')`; caught in promise chain → logged. |
| Teleport fails server-side | Not detected; bot continues. |

## Configuration

```json
{
  "zones": ["farm_zone", "spawn_zone", "mining_zone"],
  "session": {
    "commandDelayMilliseconds": 5000
  }
}
```

## Logs

| Event | Log message |
|-------|-------------|
| Zone selected | `Selected zone: farm_zone` |
| Spawn teleport | `Executed command: /zone tp farm_zone` |
| Daybreak teleport | `Day has broken. Teleporting to zone...` |
| Daybreak teleport sent | `Executed command: /zone tp farm_zone` |

## Related documentation

- [Flows: Session lifecycle](../flows/session-lifecycle.md)
- [Flows: Night sleep](../flows/night-sleep.md)
- [API: executeCommand](../api-reference/bot.md#executecommandbot-commandtext-delayms-logger)
- [API: registerNightSleepHandler](../api-reference/bot.md#registernightsleephandlerbot-configuration-logger-zoneteleportcommand)
- [Configuration](../configuration.md#zones)