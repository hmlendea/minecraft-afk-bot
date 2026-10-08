# Documentation maintenance

## Conventions

### File naming

- Kebab-case: `session-lifecycle.md`, `api-reference.md`
- Plural directory names: `components/`, `flows/`, `api-reference/`, `behaviour/`
- Sentence-case headings: `# Session lifecycle`, not `# Session Lifecycle`

### Linking

- All links relative to `docs/` root.
- Root documents: `../README.md`, `../ARCHITECTURE.md`
- Cross-references: `[Link Text](path/to/file.md)`

### Structure

Each document should have:
1. Clear heading matching filename.
2. Overview/summary section.
3. Detailed sections with tables where appropriate.
4. "Related documentation" section at end.

## Update triggers

Update documentation when:

| Change | Documents to update |
|--------|---------------------|
| New exported function | API reference, component doc, INDEX.md |
| Configuration field added/removed | Configuration schema, components/configuration.md, INDEX.md |
| New behaviour added | Behaviour doc, flows doc, INDEX.md |
| Error handling changed | Error handling, component doc, testing |
| Architecture changed | Architecture, design decisions, invariants |
| New test patterns | Testing, component doc |

## Review process

1. **Self-review:** Author verifies links, accuracy, completeness.
2. **Cross-reference check:** Ensure all links resolve.
3. **Consistency check:** Terminology, formatting, heading levels.
4. **Completeness check:** All specification sections covered.

## Documentation structure (per specification)

```
docs/
├── INDEX.md                          # Master index
├── architecture.md                   # Elaborated architecture
├── repository-overview.md            # Purpose, scope, entry points
├── repository-structure.md           # Source tree, module organisation
├── components/
│   ├── INDEX.md
│   ├── application-orchestration.md
│   ├── logging.md
│   ├── configuration.md
│   └── integration-models.md
├── flows/
│   ├── INDEX.md
│   ├── session-lifecycle.md
│   └── night-sleep.md
├── api-reference/
│   ├── INDEX.md
│   ├── bot.md
│   └── logger.md
├── behaviour/
│   ├── INDEX.md
│   ├── sleep.md
│   ├── teleport.md
│   └── schedule.md
├── data-model.md
├── configuration.md
├── state-and-persistence.md
├── testing.md
├── dependencies.md
├── build-and-deployment.md
├── security.md
├── error-handling.md
├── invariants.md
├── concurrency-and-scheduling.md
├── design-decisions.md
├── change-guide.md
├── documentation-maintenance.md
├── api-usage-examples.md
├── ambiguities-and-open-questions.md
├── integrations.md
├── logging.md
├── quick-start.md
├── troubleshooting.md
├── faq.md
```

## Current status

| Document | Status |
|----------|--------|
| INDEX.md | ✅ Created |
| architecture.md | ✅ Created |
| repository-overview.md | ✅ Created |
| repository-structure.md | ✅ Created |
| components/INDEX.md | ❌ Missing |
| components/application-orchestration.md | ✅ Created |
| components/logging.md | ✅ Created |
| components/configuration.md | ✅ Created |
| components/integration-models.md | ✅ Created |
| flows/INDEX.md | ❌ Missing |
| flows/session-lifecycle.md | ✅ Created |
| flows/night-sleep.md | ✅ Created |
| api-reference/INDEX.md | ✅ Created |
| api-reference/bot.md | ✅ Created |
| api-reference/logger.md | ✅ Created |
| behaviour/INDEX.md | ✅ Created |
| behaviour/sleep.md | ✅ Created |
| behaviour/teleport.md | ✅ Created |
| behaviour/schedule.md | ✅ Created |
| data-model.md | ✅ Created |
| configuration.md | ✅ Created |
| state-and-persistence.md | ✅ Created |
| testing.md | ✅ Created |
| dependencies.md | ✅ Created |
| build-and-deployment.md | ✅ Created |
| security.md | ✅ Created |
| error-handling.md | ✅ Created |
| invariants.md | ✅ Created |
| concurrency-and-scheduling.md | ✅ Created |
| design-decisions.md | ✅ Created |
| change-guide.md | ✅ Created |
| documentation-maintenance.md | ✅ Created |
| api-usage-examples.md | ✅ Created |
| ambiguities-and-open-questions.md | ✅ Created |
| integrations.md | ❌ Missing |
| logging.md | ❌ Missing (components/logging.md exists) |
| quick-start.md | ❌ Missing |
| troubleshooting.md | ❌ Missing |
| faq.md | ❌ Missing |

## Missing documents to create

1. `components/INDEX.md` - Component catalogue
2. `flows/INDEX.md` - Flow catalogue
3. `integrations.md` - External integrations summary
4. `logging.md` - Operations logging guide (distinct from components/logging.md)
5. `quick-start.md` - Minimal setup steps
6. `troubleshooting.md` - Common issues and solutions
7. `faq.md` - Frequently asked questions

## Link validation

```bash
# Check for broken links (requires markdown-link-check)
npx markdown-link-check docs/**/*.md
```

## Related documentation

- [INDEX.md](../INDEX.md)
- [Architecture](../architecture.md)
- [Change guide](../change-guide.md)