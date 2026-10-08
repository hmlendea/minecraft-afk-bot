# Sleep behaviour

## Overview

The bot attempts to sleep in a bed when night falls in the overworld dimension.

## Trigger

- **Event:** `time` event from Mineflayer (day → night transition).
- **Condition:** `bot.time.isDay` changes from `true` to `false`.
- **Dimension gate:** Only executes if `bot.game.dimension === 'overworld' || bot.game.dimension === 'minecraft:overworld'`.

## Probability

- Configured via `sleep.probability` (default: `0.65`).
- Evaluated via `resolveSleepProbability(configuration)`.
- Random check: `Math.random() < probability`.

## Sequence

1. Night falls (day → night transition detected).
2. Dimension check passes (overworld).
3. Random probability check passes.
4. Bot sends `/bed` command via `bot.chat('/bed')`.
5. Bot calls `activateBedUnderBot(bot, logger)`:
   - Searches for bed at bot's feet position.
   - Searches block beneath feet (`offset(0, -1, 0)`).
   - Searches within 4.5 blocks horizontal radius at same Y level.
   - Activates first bed found via `bot.activateBlock(bedBlock)`.
6. Logs success or failure.

## Failure modes

| Failure | Handling |
|---------|----------|
| Not in overworld | Logs `Bot is in dimension '<dim>', skipping sleep.` |
| Probability check fails | Logs `Sleep probability check failed. Not sleeping this night.` |
| `/bed` command fails | Caught in promise chain, logged, bot continues. |
| No bed found | Logs `No bed found at bot's position, beneath, or within 4.5 blocks.` |
| Bed activation fails | Logs error, re-throws (caught by promise chain). |

## Concurrency

- Serialised via `transitionSequence` promise chain.
- Only one sleep sequence runs at a time.
- Day→night completes before next night→day.

## Configuration

```json
{
  "sleep": {
    "probability": 0.65
  }
}
```

## Logs

| Event | Log message |
|-------|-------------|
| Night falls | `Night has fallen. Evaluating sleep probability...` |
| Dimension skip | `Bot is in dimension 'the_nether', skipping sleep.` |
| Probability skip | `Sleep probability check failed. Not sleeping this night.` |
| Sleep attempt | `Attempting to sleep...` |
| `/bed` sent | `Executed command: /bed` |
| Bed activated | `Successfully used /bed and activated a bed.` |
| Bed not found | `No bed found at bot's position, beneath, or within 4.5 blocks.` |
| Activation error | `Failed to activate bed: <error>` |

## Related documentation

- [Flows: Night sleep](../flows/night-sleep.md)
- [API: activateBedUnderBot](../api-reference/bot.md#activatebedunderbotbot-logger)
- [API: registerNightSleepHandler](../api-reference/bot.md#registernightsleephandlerbot-configuration-logger-zoneteleportcommand)
- [Configuration](../configuration.md#sleep)