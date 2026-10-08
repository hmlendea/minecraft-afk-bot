# Security

## Threat model

| Asset | Threat | Mitigation |
|-------|--------|------------|
| Minecraft credentials | Theft from config file | Filesystem permissions (600), gitignore, no logging. |
| Log files | Credential leakage | `/auth` password redacted in logs. |
| Server connection | MITM, spoofing | Mineflayer handles protocol; no TLS for Minecraft protocol. |
| Bot process | Unauthorised execution | Run as dedicated user, systemd service. |
| Configuration | Tampering | File permissions, audit trail. |

## Credential handling

### Storage

- Credentials stored in `configuration.json` (git-ignored).
- Plaintext in file; protected by OS permissions.
- No encryption at rest (Minecraft protocol requires plaintext for `/auth`).

### In-memory

- Password held in `configuration.credentials.password` variable.
- Passed to `executeCommand()` for `/auth` command.
- Not retained after spawn sequence completes.

### Logging

```js
// bot.js:redactAuthenticationCommand()
const displayCommand = commandText.startsWith('/auth ')
    ? '/auth [REDACTED]'
    : commandText
```

- Only `/auth` command is redacted.
- Other commands (`/op`, `/god`, `/zone tp`, `/bed`) logged in full.

## File permissions

```bash
# Configuration
chmod 600 configuration.json
chown botuser:botuser configuration.json

# Logs
chmod 640 logfile.log
chown botuser:botuser logfile.log
```

## Network security

- Minecraft protocol (TCP 25565) is unencrypted.
- No TLS/SSL support in standard Minecraft protocol.
- Bot connects to configured `server.host:server.port`.
- No certificate validation (protocol limitation).

## Process isolation

- Run as non-root user (`botuser`).
- systemd service with `User=botuser`.
- No capabilities beyond network access.
- Working directory restricted to bot directory.

## Input validation

| Input | Validation |
|-------|------------|
| Configuration JSON | `JSON.parse()` throws on invalid syntax. |
| `sleep.probability` | Range [0, 1] enforced by `resolveSleepProbability()`. |
| `logging.filePath` | Non-empty string enforced by `createLogger()`. |
| Bot methods | `typeof bot.chat === 'function'` checked in `executeCommand()`. |
| Zone command | Non-empty string checked in `registerNightSleepHandler()`. |

## Audit logging

Key security-relevant events logged:

| Event | Logged |
|-------|--------|
| Bot startup | Yes |
| Configuration load | Yes (path only) |
| Authentication attempt | Yes (redacted) |
| Command execution | Yes |
| Connection errors | Yes |
| Disconnection | Yes |

## Vulnerability management

- Run `npm audit` periodically.
- Update `mineflayer` for protocol/security fixes.
- Monitor Node.js security advisories.

## Incident response

1. **Credential compromise:** Rotate Minecraft password, update `configuration.json`.
2. **Log exposure:** Rotate logs, verify no credentials in logs (only `/auth` redacted).
3. **Unauthorised access:** Check systemd service status, audit user accounts.

## Related documentation

- [Configuration](../configuration.md)
- [Components: Configuration](../components/configuration.md)
- [Components: Logging](../components/logging.md)
- [Build and deployment](../build-and-deployment.md)
- [Architecture](../architecture.md)