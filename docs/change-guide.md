# Change guide

## Common modification patterns

### Adding a new command to spawn sequence

1. Add command to `main()` spawn handler:
```js
await executeCommand(bot, '/newcommand', commandDelay, logger)
```

2. Update `configuration.example.json` if command needs config.
3. Add test in `tests/bot.test.js` for new command.
4. Update [API usage examples](../api-usage-examples.md).

### Adding a new configuration field

1. Add field to `configuration.example.json` with default.
2. Add validation in appropriate function (e.g., `resolveSleepProbability` pattern).
3. Update [Configuration schema](../configuration.md).
4. Update [Components: Configuration](../components/configuration.md).
5. Add test for validation.

### Adding a new event handler

1. Register in `main()` or `registerNightSleepHandler()`.
2. Follow serialised promise chain pattern if concurrent with night transitions.
3. Add logger calls for observability.
4. Add test with mock bot emitting event.

### Modifying sleep behaviour

1. Update `registerNightSleepHandler()` and/or `activateBedUnderBot()`.
2. Update dimension check if needed.
3. Update probability logic if needed.
4. Add tests for new behaviour.
5. Update [Sleep behaviour](../behaviour/sleep.md).
6. Update [Flows: Night sleep](../flows/night-sleep.md).

### Modifying time window logic

1. Update `isRestrictedByTimeWindow()`.
2. Add tests for new window types.
3. Update [Schedule behaviour](../behaviour/schedule.md).
4. Update [Configuration schema](../configuration.md#schedule).

## Safe modification checklist

Before committing changes:

- [ ] All tests pass: `npm test`
- [ ] Configuration schema updated if fields added/removed
- [ ] Documentation updated for user-facing changes
- [ ] No secrets in code or logs
- [ ] Error handling follows existing patterns
- [ ] No breaking changes to exported API (or version bump)

## Testing changes

```bash
# Run all tests
npm test

# Run specific test file
node --test tests/bot.test.js

# Check for linting issues (if configured)
npm run lint  # if available
```

## Versioning

- No formal versioning scheme currently.
- Changes to `configuration.json` schema should be backward compatible.
- Breaking changes to exported functions require coordination.

## Code style

- CommonJS modules (`require`/`module.exports`).
- 4-space indentation.
- JSDoc comments for exported functions.
- `const`/`let`, no `var`.
- Async/await over raw promises where readable.

## Related documentation

- [Architecture](../architecture.md)
- [Components: Application orchestration](../components/application-orchestration.md)
- [Testing](../testing.md)
- [API reference](../api-reference/INDEX.md)