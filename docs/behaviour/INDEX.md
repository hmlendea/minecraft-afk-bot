# Behaviour index

Catalogue of user-facing behaviours for the Minecraft AFK Bot.

## Behaviours

| Behaviour | Document | Trigger | Description |
|-----------|----------|---------|-------------|
| Sleep | [sleep.md](sleep.md) | Day → night transition in overworld | Bot uses `/bed` and activates nearby bed with configured probability. |
| Teleport | [teleport.md](teleport.md) | Spawn, night → day transition | Bot executes `/zone tp <zone>` to teleport to random zone. |
| Schedule | [schedule.md](schedule.md) | Startup | Bot checks time window and skip probability; may exit without connecting. |

## Common patterns

- All behaviours are **opt-in** via configuration.
- Behaviours execute **sequentially** in spawn sequence.
- Night sleep and daybreak teleport use **serialised promise chain** to prevent overlap.
- All actions are **logged** with timestamps.

## Configuration mapping

| Behaviour | Configuration section | Key fields |
|-----------|----------------------|------------|
| Sleep | `sleep` | `probability` (default 0.65) |
| Teleport | `zones`, `schedule` | `zones[]`, `commandDelayMilliseconds` |
| Schedule | `schedule` | `startHour`, `startMinute`, `endHour`, `endMinute`, `skipProbability` |

## Related documentation

- [Flows: Session lifecycle](../flows/session-lifecycle.md)
- [Flows: Night sleep](../flows/night-sleep.md)
- [Configuration](../configuration.md)
- [Architecture](../architecture.md)