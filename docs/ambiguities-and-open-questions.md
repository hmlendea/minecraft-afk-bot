# Ambiguities and open questions

## Unresolved design questions

### 1. Bed activation in other dimensions

**Question:** Should the bot attempt bed activation in dimensions other than overworld?

**Current behaviour:** Sleep is skipped entirely outside overworld (`'overworld'` or `'minecraft:overworld'`).

**Open issue:** Bed activation in Nether/End causes explosions in vanilla Minecraft. However, some servers may have custom bed mechanics. Should this be configurable?

**Recommendation:** Keep overworld-only restriction. Add `sleep.dimensions` config array if server-specific bed mechanics are needed.

### 2. Command response validation

**Question:** Should the bot verify command success before proceeding?

**Current behaviour:** Commands are sent with fixed delay; success assumed.

**Open issue:** If `/auth` fails, bot continues to `/op`, `/god`, `/zone tp` and logs success. No server response parsing.

**Recommendation:** Keep current behaviour (simple, robust). Add optional `validateCommands: true` config for strict mode if needed.

### 3. Random session duration distribution

**Question:** Should session duration use uniform or non-uniform distribution?

**Current behaviour:** Uniform distribution via `randomInteger(min, max)`.

**Open issue:** Uniform may create predictable patterns. Non-uniform (e.g., triangular, normal) could be more realistic.

**Recommendation:** Keep uniform for simplicity. Document that distribution is uniform.

### 4. Time window timezone

**Question:** Which timezone does the time window use?

**Current behaviour:** Uses `new Date()` → local system timezone.

**Open issue:** Server time may differ from bot's local timezone. No timezone configuration.

**Recommendation:** Add `schedule.timezone` config option (e.g., `'UTC'`, `'Europe/Bucharest'`) if needed.

### 5. Log file rotation

**Question:** Should the bot implement log rotation?

**Current behaviour:** No rotation; file grows indefinitely. External logrotate recommended.

**Open issue:** Long-running deployments may fill disk.

**Recommendation:** Keep external logrotate. Document rotation config in build-and-deployment.md.

### 6. Multiple bot instances

**Question:** Should the bot support running multiple instances?

**Current behaviour:** Single process, single bot.

**Open issue:** No coordination for multiple instances (same zone, same server).

**Recommendation:** Keep single-instance. Document that multiple instances require different zones/credentials.

### 7. Configuration hot-reload

**Question:** Should the bot reload configuration without restart?

**Current behaviour:** Config loaded once at startup.

**Open issue:** Changing `sleep.probability` requires restart.

**Recommendation:** Keep single-load. Document restart requirement.

### 8. Error recovery after kick

**Question:** Should the bot reconnect after being kicked?

**Current behaviour:** `kicked` event logged; process exits via `end`.

**Open issue:** No automatic reconnection.

**Recommendation:** Keep single-session model. Document manual restart.

### 9. Zone teleport at daybreak

**Question:** Should daybreak teleport use same zone as spawn or random zone?

**Current behaviour:** Same zone command as spawn.

**Open issue:** Some servers may want random zone at daybreak.

**Recommendation:** Keep same zone. Add `daybreakZone` config if needed.

### 10. Bed search radius

**Question:** Is 4.5 blocks search radius appropriate?

**Current behaviour:** Searches at feet, beneath, and within 4.5 blocks horizontal radius at same Y level.

**Open issue:** Radius may be too large/small for some server layouts.

**Recommendation:** Keep 4.5 (vanilla bed reach). Add `bedSearchRadius` config if needed.

## Known limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| No log rotation | Disk growth over time | Use external logrotate |
| No command response validation | Silent failures possible | Monitor logs for errors |
| No timezone config | Time window uses local TZ | Set system timezone correctly |
| No automatic reconnection | Manual restart needed | Use systemd `Restart=on-failure` |
| No config hot-reload | Restart needed for changes | Restart process |
| No multi-bot coordination | Zone conflicts possible | Use different zones/credentials |
| No structured logging | Harder log analysis | Use logrotate + grep |
| No TLS support | Unencrypted connection | Standard Minecraft protocol limitation |
| No proxy support | Direct connection only | Use network proxy at OS level |
| No command queue | Commands sent immediately | Fixed delays suffice |

## Future enhancements (not planned)

- [ ] Command response validation
- [ ] Timezone configuration
- [ ] Log rotation built-in
- [ ] Automatic reconnection
- [ ] Config hot-reload
- [ ] Multi-bot coordination
- [ ] Structured (JSON) logging
- [ ] WebSocket/proxy support
- [ ] Command queue with retries
- [ ] Metrics/telemetry export

## Related documentation

- [Design decisions](../design-decisions.md)
- [Architecture](../architecture.md)
- [Troubleshooting](../troubleshooting.md)
- [FAQ](../faq.md)