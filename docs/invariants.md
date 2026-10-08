# Invariants

## System invariants

These properties must hold for all valid executions of the Minecraft AFK Bot.

### Configuration invariants

| Invariant | Enforced by |
|-----------|-------------|
| `configuration.json` exists and is valid JSON | `ensureConfigurationExists()`, `loadConfiguration()` |
| `sleep.probability` ∈ [0, 1] | `resolveSleepProbability()` |
| `schedule.startHour` ∈ [0, 23] | Not explicitly validated (assumed valid) |
| `schedule.startMinute` ∈ [0, 59] | Not explicitly validated |
| `schedule.endHour` ∈ [0, 23] | Not explicitly validated |
| `schedule.endMinute` ∈ [0, 59] | Not explicitly validated |
| `schedule.skipProbability` ∈ [0, 1] | Not explicitly validated (used in `Math.random()` comparison) |
| `zones` is non-empty array | `randomChoice()` throws if empty |
| `session.minimumOnlineMinutes` ≤ `session.maximumOnlineMinutes` | Not explicitly validated |
| `logging.filePath` is non-empty string | `createLogger()` |

### Runtime invariants

| Invariant | Enforced by |
|-----------|-------------|
| Bot connects to exactly one server per run | `main()` creates single `mineflayer.createBot()` |
| Spawn sequence executes in order: auth → op → god → zone tp | `main()` sequential `await executeCommand()` |
| Night sleep handler registered exactly once per session | `registerNightSleepHandler()` called once in spawn handler |
| Day→night transition handled before next night→day | `transitionSequence` promise chain serialisation |
| Sleep only attempted in overworld dimension | `registerNightSleepHandler()` dimension check |
| `/auth` password never appears in logs | `executeCommand()` redaction logic |
| Log file parent directory exists before write | `resolveLogFilePath()`, `createLogger()` |
| Bot quits with reason on all exit paths | `bot.quit('Completed')` or `bot.quit('Error')` |

### Concurrency invariants

| Invariant | Enforced by |
|-----------|-------------|
| At most one transition sequence executes at a time | `transitionSequence` promise chain |
| No overlapping `activateBedUnderBot()` calls | Serialised via `transitionSequence` |
| Spawn sequence commands do not overlap | Sequential `await` in spawn handler |

### Data flow invariants

| Invariant | Enforced by |
|-----------|-------------|
| Configuration loaded before any use | `main()` calls `loadConfiguration()` first |
| Logger created before any logging | `main()` creates logger before use |
| Zone command constructed before sleep handler registration | `main()` selects zone, then calls `registerNightSleepHandler()` |
| Random session duration chosen once per run | `randomInteger()` called once in spawn handler |

### Error handling invariants

| Invariant | Enforced by |
|-----------|-------------|
| Spawn sequence errors → `bot.quit('Error')` | `try/catch` in spawn handler |
| Night sleep errors → logged, bot continues | `.catch()` on `transitionSequence` |
| Configuration errors → process exits before connect | Thrown before `mineflayer.createBot()` |
| Logger errors → propagate (may crash) | Synchronous `fs.appendFileSync` |

### Testing invariants

| Invariant | Verified by |
|-----------|-------------|
| All exported functions tested | `tests/bot.test.js`, `tests/logger.test.js` |
| Mock bot mirrors required Mineflayer API | `createSleepBot()`, `createBot()` helpers |
| Deterministic tests via injected suppliers | `randomSupplier`, `dateSupplier`, `consoleOutput` |
| No external dependencies in tests | No network, no filesystem (except temp logs) |

## Invariant violation consequences

| Invariant violated | Consequence |
|-------------------|-------------|
| Config missing/invalid | Process exits with error before connect. |
| Sleep probability invalid | `RangeError` thrown at startup. |
| Zones empty | `TypeError` at zone selection. |
| Log path invalid | `TypeError` at logger creation. |
| Dimension check bypassed | Bed explosion in Nether/End (server-side). |
| Promise chain broken | Overlapping sleep/teleport, undefined behaviour. |
| Auth not redacted | Password in log files (security issue). |
| Bot doesn't quit | Process hangs, no clean disconnect. |

## Related documentation

- [Architecture](../architecture.md)
- [Error handling](../error-handling.md)
- [Testing](../testing.md)
- [Components: Application orchestration](../components/application-orchestration.md)
- [Flows: Session lifecycle](../flows/session-lifecycle.md)
- [Flows: Night sleep](../flows/night-sleep.md)