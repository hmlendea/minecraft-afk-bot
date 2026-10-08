# Flows index

Catalogue of execution flows for the Minecraft AFK Bot.

## Flows

| Flow | Document | Trigger | Description |
|------|----------|---------|-------------|
| Session lifecycle | [session-lifecycle.md](session-lifecycle.md) | Process startup | Complete bot session from startup to completion. |
| Night sleep | [night-sleep.md](night-sleep.md) | Day → night transition | Sleep handling at night, teleport at daybreak. |

## Flow relationships

```
Session lifecycle
    │
    ├──► Spawn sequence
    │       │
    │       └──► Registers night sleep handler
    │
    └──► Night sleep flow (triggered by time events)
            │
            ├──► Day → Night: Sleep attempt
            │
            └──► Night → Day: Zone teleport
```

## Common patterns

- All flows use **serialised promise chains** for concurrency control.
- All flows **log** key events with timestamps.
- All flows **handle errors** gracefully (log, continue or quit).
- Flows are **configuration-driven** (probabilities, delays, commands).

## Related documentation

- [Architecture](../architecture.md)
- [Components: Application orchestration](../components/application-orchestration.md)
- [Behaviours](../behaviour/INDEX.md)
- [Concurrency and scheduling](../concurrency-and-scheduling.md)