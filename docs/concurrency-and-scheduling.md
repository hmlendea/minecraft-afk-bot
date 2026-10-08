# Concurrency and scheduling

## Execution model

The bot runs as a single Node.js process with an event-driven architecture built on Mineflayer's event emitter.

### Event loop interaction

```
┌─────────────────────────────────────────────────────────────┐
│                    Node.js Event Loop                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Timers    │  │   I/O       │  │   Check/Close       │  │
│  │  (setTimeout)│  │  (TCP, FS)  │  │   Callbacks         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │               │                    │               │
│         ▼               ▼                    ▼               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Mineflayer Event Emitter               │    │
│  │  spawn │ kicked │ error │ end │ time │ chat │ ...  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Concurrency primitives used

| Primitive | Usage | Location |
|-----------|-------|----------|
| `Promise` | Sequential command execution, delays | `main()`, `executeCommand()`, `pause()` |
| `Promise` chain | Serialised night transitions | `registerNightSleepHandler()` |
| `async/await` | Linear async flow | Throughout |
| `EventEmitter` | Mineflayer bot events | `bot.on()`, `bot.once()` |
| `setTimeout` | Delays via `pause()` | `pause()` |

### No concurrency primitives used

- No `worker_threads`
- No `child_process`
- No `async-mutex` or locks
- No `Promise.all()` for parallel execution (all sequences are serial)

## Scheduling

### Startup scheduling (external)

The bot itself does not schedule recurring runs. External schedulers invoke the process:

| Scheduler | Mechanism |
|-----------|-----------|
| cron | `0 * * * * node bot.js` |
| systemd timer | `OnCalendar=hourly` |
| Manual | `node bot.js` |

### Internal scheduling (time window)

At startup, `isRestrictedByTimeWindow()` evaluates:

```js
const now = new Date()
const currentMinutes = now.getHours() * 60 + now.getMinutes()
// ... window logic
```

- Uses system clock at process start.
- No recurring timer; single check per run.

### Internal scheduling (random skip)

```js
if (Math.random() < configuration.schedule.skipProbability) {
    // exit
}
```

- Evaluated once per run after time window check.
- Independent of time window.

### Internal scheduling (session duration)

```js
const onlineMinutes = randomInteger(min, max)
await pause(onlineMinutes * 60 * 1000)
```

- Single random duration chosen at spawn.
- `pause()` uses `setTimeout` internally.

### Internal scheduling (command delays)

```js
await executeCommand(bot, cmd, delay, logger)
// executeCommand does: await pause(delay)
```

- Fixed delay between each sequential command.
- Configurable via `session.commandDelayMilliseconds`.

### Internal scheduling (spawn delay)

```js
await pause(configuration.session.spawnDelayMilliseconds)
```

- Delay after `spawn` event before first command.

## Promise chain serialisation (night transitions)

### Problem

Multiple `time` events can fire rapidly. Day→night and night→day handlers must not overlap.

### Solution

```js
let transitionSequence = Promise.resolve()

bot.on('time', () => {
    transitionSequence = transitionSequence.then(async () => {
        // handle transition
    }).catch(error => {
        logger.error('The night sleep sequence failed:', error)
    })
})
```

### Guarantees

1. **Sequential execution:** Each transition handler waits for previous to complete.
2. **Error isolation:** Errors caught, logged, chain continues.
3. **Order preservation:** Day→night always before next night→day.
4. **No dropped events:** All `time` events queued in chain.

### Timeline example

```
Time:     T0        T1        T2        T3        T4
Event:    spawn    day→night night→day day→night night→day
Chain:    ────────►────────►────────►────────►────────►
          (sleep)  (teleport) (sleep)   (teleport)
```

## Timer management

### Active timers per session

| Timer | Created by | Duration | Cleanup |
|-------|------------|----------|---------|
| Spawn delay | `pause(spawnDelay)` | ~5s | Auto |
| Command delays | `pause(commandDelay)` × 4 | ~5s each | Auto |
| Session duration | `pause(onlineMinutes * 60 * 1000)` | 30-120 min | Auto |
| Sleep sequence | `pause()` in `activateBedUnderBot` | Negligible | Auto |

### Timer cleanup

- All timers are `setTimeout` via `pause()`.
- No persistent timers; all resolve or are abandoned on process exit.
- `bot.quit()` triggers `end` event; no explicit timer cancellation needed.

## Race conditions avoided

| Potential race | Prevention |
|----------------|------------|
| Two `time` events overlapping | `transitionSequence` promise chain |
| Spawn commands overlapping | Sequential `await` in spawn handler |
| Config read vs write | Synchronous `fs.readFileSync`/`writeFileSync` |
| Log writes interleaved | Synchronous `fs.appendFileSync` |

## Scalability limits

| Limit | Value | Reason |
|-------|-------|--------|
| Concurrent bot instances | 1 per process | Single `mineflayer.createBot()` |
| Concurrent sessions | 1 per process | Batch script model |
| Event queue depth | Unbounded | `transitionSequence` chains all `time` events |
| Memory growth | Minimal | No accumulation; logs written synchronously |

## Related documentation

- [Architecture](../architecture.md)
- [Components: Application orchestration](../components/application-orchestration.md)
- [Flows: Session lifecycle](../flows/session-lifecycle.md)
- [Flows: Night sleep](../flows/night-sleep.md)
- [Design decisions](../design-decisions.md)
- [Invariants](../invariants.md)