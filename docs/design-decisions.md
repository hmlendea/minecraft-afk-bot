# Design decisions

## 1. Single-process batch script (not daemon)

**Decision:** Run as a one-shot process that connects, performs session, and exits.

**Rationale:**
- Simpler deployment (cron, systemd, Docker).
- No state persistence needed across runs.
- Natural fit for AFK farming: connect, farm, disconnect.
- Avoids memory leaks, connection drift over long runs.

**Alternatives considered:**
- Long-running daemon with reconnection logic — more complex, harder to debug.
- Process manager (PM2) — adds dependency, same complexity.

## 2. Mineflayer for Minecraft protocol

**Decision:** Use `mineflayer` library instead of raw protocol implementation.

**Rationale:**
- Mature, well-tested, actively maintained.
- Handles protocol versions, encryption, compression.
- Event-driven API matches bot's needs.
- Large community, extensive documentation.

**Alternatives considered:**
- `prismarine-js/minecraft-protocol` (lower-level) — more boilerplate.
- Custom WebSocket/TCP implementation — not feasible.

## 3. Synchronous file logging

**Decision:** Use `fs.appendFileSync` for log writes.

**Rationale:**
- Simplicity: no async coordination, no buffering.
- Low log volume (few entries per session).
- Deterministic ordering with console output.
- Acceptable performance impact for this use case.

**Alternatives considered:**
- Async `fs.appendFile` with queue — more complex, no benefit at this scale.
- Winston/Pino — overkill, adds dependencies.
- Log rotation built-in — external logrotate is standard.

## 4. Serialised promise chain for night transitions

**Decision:** Use a single `transitionSequence` promise chain to serialise day/night handlers.

**Rationale:**
- Prevents overlapping sleep/teleport sequences.
- Guarantees day→night completes before next night→day.
- Simple implementation: `sequence = sequence.then(...).catch(...)`.
- No need for mutex/lock primitives.

**Alternatives considered:**
- Boolean flag (`isHandlingTransition`) — race conditions possible.
- Async mutex library — extra dependency.
- Separate handlers with state machine — more complex.

## 5. Dimension check for sleep (overworld only)

**Decision:** Only attempt sleep when `bot.game.dimension === 'overworld' || 'minecraft:overworld'`.

**Rationale:**
- Beds explode in Nether/End (vanilla mechanic).
- `/bed` command may not work or be dangerous in other dimensions.
- Configuration-driven probability only makes sense in overworld.

**Alternatives considered:**
- Try sleep in all dimensions, catch explosions — wasteful, dangerous.
- Configurable dimension list — YAGNI, overworld is the only valid case.

## 6. Configuration via JSON file (not env vars)

**Decision:** Use `configuration.json` file with `configuration.example.json` template.

**Rationale:**
- Structured configuration with nested objects.
- Easy to version-control template.
- Supports comments in example (JSONC-style documentation).
- Familiar pattern for Node.js applications.

**Alternatives considered:**
- Environment variables — flat, no nesting, harder for arrays/objects.
- YAML — requires parser dependency.
- Command-line args — too many parameters.

## 7. Time-window restriction (not cron-only)

**Decision:** Implement time-window check inside bot, not rely solely on cron.

**Rationale:**
- Self-contained: bot knows when it should run.
- Works with any scheduler (cron, systemd timer, manual).
- Skip probability adds randomness within allowed window.
- Overnight window support (e.g., restrict daytime).

**Alternatives considered:**
- Cron only — less flexible, no random skip.
- External scheduler with complex rules — moves logic out of bot.

## 8. Randomised session duration

**Decision:** Session length = random integer between `minimumOnlineMinutes` and `maximumOnlineMinutes`.

**Rationale:**
- Avoids predictable patterns detectable by anti-AFK.
- Simple implementation: `randomInteger(min, max)`.
- Configurable range for different server rules.

**Alternatives considered:**
- Fixed duration — predictable.
- Exponential/normal distribution — overcomplicated.

## 9. Command delay between sequential commands

**Decision:** Fixed `commandDelayMilliseconds` between each spawn command.

**Rationale:**
- Server needs time to process each command.
- Simple, predictable timing.
- Configurable for different server latencies.

**Alternatives considered:**
- Wait for command response — requires parsing chat, complex.
- Adaptive delay — overengineered.

## 10. Redact only `/auth` in logs

**Decision:** Only redact `/auth <password>` command; log other commands fully.

**Rationale:**
- `/auth` contains plaintext password (highest sensitivity).
- Other commands (`/op`, `/god`, `/zone tp`, `/bed`) contain no secrets.
- Simpler than full command sanitisation.

**Alternatives considered:**
- Redact all commands — loses debugging value.
- Configurable redaction patterns — YAGNI.

## 11. No database, no persistent state

**Decision:** All state in memory; configuration and logs on filesystem only.

**Rationale:**
- Simplicity: no schema, migrations, backup.
- Session is self-contained; no cross-session state needed.
- Fits batch script model.

**Alternatives considered:**
- SQLite for session history — adds dependency, complexity.
- Redis for distributed coordination — not needed (single bot).

## 12. Native Node.js test runner

**Decision:** Use `node:test` and `node:assert/strict` (Node.js ≥ 18).

**Rationale:**
- Zero dependencies.
- Fast, built-in, modern API.
- Adequate for unit/integration testing.
- No Jest/Mocha configuration needed.

**Alternatives considered:**
- Jest — adds dependency, slower startup.
- Mocha/Chai — adds dependencies.
- Vitest — adds dependency.

## 13. Mock-based testing (no live server)

**Decision:** All tests use mock EventEmitter bots; no integration tests against real server.

**Rationale:**
- Fast, deterministic, CI-friendly.
- Tests logic, not protocol.
- Mineflayer itself is tested separately.

**Alternatives considered:**
- Testcontainers with Minecraft server — slow, flaky, heavy.
- Mock server (Prismarine) — still integration, more complex.

## 14. No TypeScript

**Decision:** Plain JavaScript (ES modules not used; CommonJS).

**Rationale:**
- Small codebase (~500 lines).
- No build step.
- JSDoc comments provide type hints.
- Team familiarity.

**Alternatives considered:**
- TypeScript — adds build step, config, complexity for marginal benefit.
- JSDoc + TypeScript check — still adds tooling.

## 15. CommonJS modules

**Decision:** Use `require`/`module.exports` instead of ES modules.

**Rationale:**
- Node.js ≥ 18 supports both.
- Mineflayer ecosystem predominantly CommonJS.
- No `"type": "module"` in package.json needed.
- Simpler for `node:test` native runner.

**Alternatives considered:**
- ES modules — requires `.mjs` or `"type": "module"`, breaks some tooling.
- Dual package — unnecessary complexity.

## Related documentation

- [Architecture](../architecture.md)
- [Components: Application orchestration](../components/application-orchestration.md)
- [Concurrency and scheduling](../concurrency-and-scheduling.md)
- [Testing](../testing.md)