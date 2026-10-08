# Schedule behaviour

## Overview

The bot evaluates two schedule-based conditions at startup that may cause it to exit without connecting to the server.

## Time window restriction

### Configuration

```json
{
  "schedule": {
    "startHour": 1,
    "startMinute": 30,
    "endHour": 17,
    "endMinute": 0,
    "skipProbability": 0.8
  }
}
```

### Logic

- Window defines when execution is **restricted** (bot should NOT run).
- If current time falls within window → bot exits with log message.
- `startMinutes === endMinutes` → restriction disabled (always runs).
- Supports overnight windows (e.g., 22:00–06:00).

### Algorithm

```js
const now = new Date()
const currentMinutes = now.getHours() * 60 + now.getMinutes()
const startMinutes = startHour * 60 + startMinute
const endMinutes = endHour * 60 + endMinute

if (startMinutes === endMinutes) return false  // disabled

if (startMinutes < endMinutes) {
    // Same-day window (e.g., 01:30–17:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
} else {
    // Overnight window (e.g., 22:00–06:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
}
```

### Examples

| Window | Current time | Restricted? |
|--------|--------------|-------------|
| 01:30–17:00 | 12:00 | Yes |
| 01:30–17:00 | 18:00 | No |
| 22:00–06:00 | 23:00 | Yes |
| 22:00–06:00 | 12:00 | No |
| 12:00–12:00 | Any | No (disabled) |

### Log message

```
Current time falls within the restricted execution window. Exiting.
```

## Random skip probability

### Configuration

```json
{
  "schedule": {
    "skipProbability": 0.8
  }
}
```

### Logic

- Independent of time window.
- Evaluated after time window check (only if not restricted).
- `Math.random() < skipProbability` → bot exits.
- Default: `0.8` (80% chance to skip).

### Log message

```
Randomly skipping execution based on skip probability.
```

## Combined behaviour

```
Startup
  │
  ├─► Time window restricted? ──Yes──► Exit
  │
  No
  │
  ├─► Random skip triggered? ──Yes──► Exit
  │
  No
  │
  └─► Connect to server, run session
```

## Use cases

| Scenario | Configuration |
|----------|---------------|
| Run only at night | `startHour: 7, endHour: 22` (restricted during day) |
| Run only during day | `startHour: 22, endHour: 7` (restricted at night) |
| Disable time restriction | `startHour: 0, startMinute: 0, endHour: 0, endMinute: 0` |
| Run rarely | `skipProbability: 0.95` |
| Run every time | `skipProbability: 0` |

## Testing

`tests/bot.test.js` covers:
- Missing schedule → not restricted.
- Identical start/end → not restricted.
- Same-day window (inside/outside/boundaries).
- Overnight window (inside/outside/boundaries).

## Related documentation

- [API: isRestrictedByTimeWindow](../api-reference/bot.md#isrestrictedbytimewindowconfiguration)
- [Configuration](../configuration.md#schedule)
- [Flows: Session lifecycle](../flows/session-lifecycle.md)
- [Testing](../testing.md)