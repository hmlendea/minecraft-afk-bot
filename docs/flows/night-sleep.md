# Night sleep flow

## Overview

The night sleep flow handles the behaviour at each day-to-night transition: optionally sleep in a bed (only in the overworld) and return to the selected zone at daybreak.

## Sequence diagram

```mermaid
sequenceDiagram
    autonumber
    participant Server as Minecraft Server
    participant Handler as Night Sleep Handler
    participant Bot as Mineflayer Bot
    participant Logger as logger.js

    Server-->>Handler: time event (day → night)
    Handler->>Handler: Evaluate dimension
    alt Not in overworld
        Handler->>Logger: Log skip (not in overworld)
    else In overworld
        Handler->>Handler: Evaluate sleep probability
        alt Sleep skipped (probability)
            Handler->>Logger: Log skip (probability)
        else Sleep selected
            Handler->>Bot: /bed command
            Handler->>Logger: Log command
            Bot->>Bot: pause(commandDelayMilliseconds)
            Handler->>Logger: Log bed command delay elapsed
            Handler->>Bot: activateBedUnderBot()
            alt Bed activated
                Handler->>Logger: Log bed activation
                Handler->>Handler: Set isZoneTeleportPending = true
            else No bed found
                Handler->>Logger: Log no bed found
                Handler->>Bot: zoneTeleportCommand
                Handler->>Logger: Log command
                Bot->>Bot: pause(commandDelayMilliseconds)
                Handler->>Logger: Log zone teleport delay elapsed
                Handler->>Handler: Set isZoneTeleportPending = false
            end
    end
    Server-->>Handler: time event (night → day)
    Handler->>Handler: Check isZoneTeleportPending
    alt Pending
        Handler->>Bot: zoneTeleportCommand
        Handler->>Logger: Log command
        Bot->>Bot: pause(commandDelayMilliseconds)
        Handler->>Logger: Log zone teleport delay elapsed
        Handler->>Handler: Set isZoneTeleportPending = false
    else Not pending
        Handler->>Logger: Log nothing to do
    end
```

## Detailed behaviour

### Trigger

- Fired by Mineflayer `time` event when `bot.time.isDay` changes.
- Handler detects transition by comparing `currentIsDay` with `previousIsDay`.
- Only acts on transitions (ignores repeated same-state events).

### State variables

| Variable | Initial | Purpose |
|----------|---------|---------|
| `previousIsDay` | `bot.time.isDay` or `null` | Tracks last known day state. |
| `isZoneTeleportPending` | `false` | Flags that a zone teleport is owed after sleep. |
| `transitionSequence` | `Promise.resolve()` | Chains async operations to preserve order. |

### Day → night transition

1. **Dimension check**
   - `currentDimension = bot.game?.dimension ?? null`
   - `isOverworld = currentDimension === 'overworld' || currentDimension === 'minecraft:overworld'`
   - If not overworld: log skip, return (no further action, `isZoneTeleportPending` unchanged).

2. **Sleep probability**
   - `sleepProbability = resolveSleepProbability(sleepConfiguration)` (default 0.65)
   - If `randomSupplier() >= sleepProbability`: log skip, return.

3. **Sleep selected**
   - Log "Night sleep was selected. Issuing the bed command."
   - `executeCommand(bot, BED_COMMAND, commandDelayMilliseconds, logger)`
   - Log "The bed command delay elapsed:"
   - Set `isZoneTeleportPending = true`
   - `wasBedActivated = await activateBedUnderBot(bot, logger)`
     - If true: bed found and activated.
     - If false: no bed found within interaction range.

4. **No bed found**
   - If `!wasBedActivated`:
     - Log "Returning to the selected zone because no bed block was available."
     - `executeCommand(bot, zoneTeleportCommand, commandDelayMilliseconds, logger)`
     - Log delay elapsed.
     - Set `isZoneTeleportPending = false`

### Night → day transition

- If `isZoneTeleportPending` is true:
  - Log "Returning to the selected zone after the night:"
  - `executeCommand(bot, zoneTeleportCommand, commandDelayMilliseconds, logger)`
  - Log delay elapsed.
  - Set `isZoneTeleportPending = false`
- Else: no action (either sleep was skipped/blocked, or no bed was found and we already teleported).

## Serialisation

All operations (bed activation, zone teleport) are chained on `transitionSequence`:

```js
transitionSequence = transitionSequence.then(async () => { ... })
```

This ensures that even if multiple `time` events fire during an active interaction (e.g., lag spikes), the handler processes them in order:
- Only one sleep attempt per night.
- At most one zone teleport per daybreak.
- Commands execute in the correct sequence.

## Diagnostics

The handler uses `getSleepDiagnosticState(bot)` to log:

```js
{
    position: { x, y, z } or null,
    dimension: string or null,
    timeOfDay: number or null,
    isDay: boolean or null,
    isSleeping: boolean or null
}
```

Logged at:
- Day/night state change.
- Bed block inspection (position, blockName, isBed, properties).
- Bed found.
- Bed activation request completed.
- Night sleep skipped (probability or dimension).
- Bed command delay elapsed.
- Returning to zone after night.
- Returning to zone because no bed found.

Bed response logging (via `registerSleepDiagnosticEvents`) captures recognised `block.minecraft.bed.*` translation keys with the same diagnostic state.

## Error handling

- The `transitionSequence` has a `.catch()` that logs errors without terminating the process.
- Errors in `executeCommand`, `activateBedUnderBot`, or promise resolution are caught and logged.
- A failed sleep attempt does not cancel the owed zone teleport (the chain continues).

## Invariants

1. **At most one sleep attempt per night** — `previousIsDay` tracking prevents re-entry on same state.
2. **At most one zone teleport per daybreak** — `isZoneTeleportPending` flag prevents duplicate teleport.
3. **Sleep only attempted in overworld** — dimension check gates the entire sleep branch.
4. **Zone teleport owed iff sleep selected and bed activated** — `isZoneTeleportPending` set only on successful bed activation.
5. **If no bed found, zone teleport happens immediately** — same night, before daybreak.
6. **All async operations serialised** — `transitionSequence` preserves order under burst events.

## Related documentation

- [Architecture](../architecture.md)
- [Components: Application orchestration](../components/application-orchestration.md)
- [Components: Configuration](../components/configuration.md)
- [Components: Logging](../components/logging.md)
- [Flows: Session lifecycle](../flows/session-lifecycle.md)
- [Data model](../data-model.md)
- [Error handling](../error-handling.md)
- [Testing](../testing.md)
- [Invariants](../invariants.md)