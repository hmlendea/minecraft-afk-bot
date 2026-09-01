# Minecraft AFK Bot Architecture

This document describes the current architecture, component responsibilities, runtime execution flows, data models, configuration boundaries, and verification strategies for the Minecraft AFK Bot.

## 📑 Table of Contents

- [Purpose](#purpose)
- [System Context](#system-context)
- [Architectural Style](#architectural-style)
- [Runtime Flow](#runtime-flow)
- [Components](#components)
- [Architectural Areas](#architectural-areas)
  - [Application Entry Point](#application-entry-point)
  - [Configuration Management](#configuration-management)
  - [Automated Test Suite](#automated-test-suite)
- [Data Architecture](#data-architecture)
- [Interfaces and Integrations](#interfaces-and-integrations)
- [Key Flows](#key-flows)
  - [Session Lifecycle Flow](#session-lifecycle-flow)
- [Cross-Cutting Concerns](#cross-cutting-concerns)
  - [Security and Privacy](#security-and-privacy)
  - [Error Handling](#error-handling)
  - [Observability](#observability)
  - [Configuration](#configuration)
  - [Concurrency and Resource Use](#concurrency-and-resource-use)
- [Dependency Direction and Rules](#dependency-direction-and-rules)
- [External Dependencies](#external-dependencies)
- [Deployment and Operations](#deployment-and-operations)
- [Compatibility Contracts](#compatibility-contracts)
- [Testing and Verification](#testing-and-verification)
- [Design Constraints](#design-constraints)
- [Extension Points](#extension-points)
  - [Custom Bot Event Handlers](#custom-bot-event-handlers)
- [Architecture Decisions](#architecture-decisions)
- [Source Map](#source-map)
- [Related Documentation](#related-documentation)

## 🎯 Purpose

The Minecraft AFK Bot is a lightweight automation utility constructed to maintain an active player presence across designated zones on a Minecraft server utilizing Mineflayer. This document records the architectural design, component boundaries, execution flows, and system constraints to guide contributors and maintainers.

## 🌐 System Context

The application operates as an independent client process connecting to a remote Minecraft server. It interacts with the local filesystem to load configuration and emits diagnostic output to standard output and standard error.

```mermaid
graph TD
    User["Operator or GitHub Actions"] -->|Invokes process| Bot["Minecraft AFK Bot Application"]
    Bot -->|Reads configuration| ConfigFile["configuration.json"]
    Bot -->|Fallback template copy| ConfigTemplate["configuration.example.json"]
    Bot -->|Minecraft Protocol over TCP Port 25565| Server["Minecraft Server"]
```

The principal external boundaries are:
- **Minecraft Server Boundary:** Communicates with remote server instances via the Minecraft protocol over TCP port 25565 utilizing Mineflayer.
- **Local Filesystem Boundary:** Reads runtime settings from [configuration.json](configuration.json) and copies [configuration.example.json](configuration.example.json) when the configuration file is absent.

## 🏗️ Architectural Style

The repository implements a single-process scheduled batch script pattern with an event-driven bot controller. The application lifecycle progresses sequentially through schedule and skip evaluations, connection establishment, spawn event handling, command execution, timed presence, and graceful disconnection.

```mermaid
graph LR
    subgraph Core
        Entry["Application Entry Point (bot.js)"]
        Config["Configuration Engine"]
    end
    subgraph External
        Mineflayer["Mineflayer Library"]
        MCServer["Minecraft Server"]
    end
    Entry -->|Loads| Config
    Entry -->|Instantiates| Mineflayer
    Mineflayer -->|Establishes connection| MCServer
```

The principal architecture boundaries are:
- **Configuration Boundary:** Encapsulates settings validation, template generation, and JSON parsing in isolated helper functions.
- **Bot Orchestration Boundary:** Manages Mineflayer event listeners, command execution sequencing, timer pauses, and clean process termination.

## 🔄 Runtime Flow

```mermaid
sequenceDiagram
    autonumber
    participant CLI as Process Runner
    participant Main as bot.js main()
    participant Config as Configuration
    participant Bot as Mineflayer Bot
    participant Server as Minecraft Server

    CLI->>Main: Execute main()
    Main->>Config: loadConfiguration()
    Config-->>Main: Return configuration object
    Main->>Main: Evaluate isRestrictedByTimeWindow()
    Main->>Main: Evaluate random skip probability
    Main->>Bot: mineflayer.createBot()
    Bot->>Server: Establish TCP connection
    Server-->>Bot: Emit 'login' event
    Server-->>Bot: Emit 'spawn' event
    Bot->>Server: Send /auth command
    Bot->>Server: Send /op command
    Bot->>Server: Send /god command
    Bot->>Server: Send /zone tp <selectedZone> command
    Bot->>Bot: Pause for calculated session duration
    Bot->>Server: bot.quit('Completed')
```

The principal runtime sequence is:
1. Process initialisation and configuration loading via `loadConfiguration()`.
2. Schedule validation via `isRestrictedByTimeWindow()` to verify the current time does not fall within the restricted execution window.
3. Probability evaluation against `schedule.skipProbability` to determine if the random skip condition triggers.
4. Selection of a target zone via `randomChoice()` from the configured zone array.
5. Bot instantiation via `mineflayer.createBot()`.
6. Event listener registration for `login`, `spawn`, `kicked`, `error`, and `end` events.
7. Upon the `spawn` event, sequential execution of `/auth`, `/op`, `/god`, and `/zone tp` commands with configured delay intervals.
8. Timed presence pause for a random duration between `minimumOnlineMinutes` and `maximumOnlineMinutes`.
9. Session conclusion and graceful disconnect via `bot.quit('Completed')`.

## 🧩 Components

| Component | Responsibility | Principal Dependencies | Lifetime or Ownership |
|-----------|----------------|------------------------|-----------------------|
| `loadConfiguration` | Ensures configuration file existence and parses [configuration.json](configuration.json). | `fs`, `path` | Transient function invocation on process startup. |
| `isRestrictedByTimeWindow` | Evaluates whether current date and time fall within the restricted execution window. | Date API | Pure helper function invoked during main execution. |
| `main` | Orchestrates schedule evaluations, bot instantiation, event listeners, command sequences, and teardown. | `mineflayer`, `fs`, `path` | Primary process orchestrator function. |
| `executeCommand` | Dispatches in-game chat commands and pauses for specified delay intervals. | `mineflayer` Bot instance | Asynchronous helper function invoked during session execution. |

## 🗂️ Architectural Areas

### Application Entry Point

Paths:
- [bot.js](bot.js)

Responsibilities:
- Contains application orchestration, helper functions, and CLI entry point logic.

Boundary rules:
- Directly imports Node.js core modules (`fs`, `path`) and `mineflayer`.
- Exports helper functions and `main` for automated testing without triggering execution when imported as a module.

### Configuration Management

Paths:
- [configuration.example.json](configuration.example.json)
- [configuration.json](configuration.json)

Responsibilities:
- Defines runtime parameters for server connectivity, authentication credentials, zone lists, time restrictions, and session delays.

Boundary rules:
- [configuration.json](configuration.json) is excluded from version control via [.gitignore](.gitignore) to protect local credentials.
- [configuration.example.json](configuration.example.json) is tracked in version control as a default schema template.

### Automated Test Suite

Paths:
- [tests/bot.test.js](tests/bot.test.js)

Responsibilities:
- Verifies helper functions, exception handling, configuration loading, and main orchestration using mock bot instances and virtual timers.

Boundary rules:
- Utilises Node.js native test runner (`node:test`) and assertion library (`node:assert/strict`).
- Must not connect to live Minecraft servers during unit test execution.

## 💾 Data Architecture

The application persists no internal database state. System state is defined entirely by static configuration structures and transient memory during process execution.

```mermaid
graph LR
    Template["configuration.example.json"] -->|Copied if configuration.json missing| ActiveConfig["configuration.json"]
    ActiveConfig -->|Parsed into memory| Memory["Runtime Configuration Object"]
    Memory -->|Server & Credentials| BotOpts["Mineflayer Bot Options"]
    Memory -->|Zone List| ZoneSel["Zone Selection"]
```

| Data or Store | Owner | Representation and Storage | Lifecycle or Consistency |
|---------------|-------|----------------------------|--------------------------|
| `configuration.example.json` | Repository | File on disk (JSON format) | Immutable version-controlled template. |
| `configuration.json` | Application Host | File on disk (JSON format) | Local file created on demand or edited by operator. |
| Configuration Object | [bot.js](bot.js) | In-memory JavaScript Object | Created at process startup and discarded at process exit. |

## 🔌 Interfaces and Integrations

| Interface or Integration | Direction | Contract | Owner | Failure Semantics |
|--------------------------|-----------|----------|-------|-------------------|
| Minecraft Server TCP | Bidirectional | Minecraft Protocol (Port 25565) | `mineflayer` | Logs error or kick events and terminates process. |
| Chat Commands | Outbound | Minecraft In-Game Commands (`/auth`, `/op`, `/god`, `/zone tp`) | `executeCommand` | Logs command error and issues `bot.quit('Error')`. |

## 🔀 Key Flows

### Session Lifecycle Flow

```mermaid
sequenceDiagram
    autonumber
    participant App as bot.js
    participant Server as Minecraft Server

    App->>Server: Connect (TCP)
    Server-->>App: 'login' Event
    Server-->>App: 'spawn' Event
    App->>Server: /auth <password>
    App->>Server: /op
    App->>Server: /god
    App->>Server: /zone tp <selectedZone>
    Note over App: Pause for calculated onlineMinutes
    App->>Server: Quit ('Completed')
```

The session lifecycle flow executes sequentially after connection establishment. If an exception occurs during the spawn command chain, the exception is caught, logged to standard error, and the process issues `bot.quit('Error')` to ensure clean disconnection.

## 🧵 Cross-Cutting Concerns

### Security and Privacy

- Server credentials (`username`, `password`) are persisted in [configuration.json](configuration.json) which is ignored by [.gitignore](.gitignore).
- No sensitive credentials or tokens are committed to version control.
- [configuration.example.json](configuration.example.json) contains placeholder values for public inspection.

### Error Handling

- Errors originating from Mineflayer events (`kicked`, `error`, `end`) are caught and logged to standard output or standard error.
- Command execution failures during the spawn sequence trigger a try-catch block, logging the error and invoking `bot.quit('Error')`.
- Helper functions enforce parameter validation and throw explicit `TypeError` or `RangeError` exceptions for invalid arguments.

### Observability

- Standard output (`console.log`) reports process status, selected zone, connection events, command executions, and session completion messages.
- Standard error (`console.error`) records runtime exceptions, bot errors, and fatal failures.

### Configuration

| Configuration Area | Source | Responsibility | Override or Secret Policy |
|--------------------|--------|----------------|---------------------------|
| Connection & Auth | [configuration.json](configuration.json) | Defines host, port, version, username, and password. | Read from disk; excluded from git tracking. |
| Execution Schedule | [configuration.json](configuration.json) | Controls restricted hours and skip probability. | Operator configurable via local file. |
| Session Timings | [configuration.json](configuration.json) | Sets spawn delay, command delay, and online duration limits. | Operator configurable via local file. |

### Concurrency and Resource Use

- The application executes as a single-threaded asynchronous Node.js process.
- Only one Minecraft bot instance is maintained per process invocation.
- Memory consumption is minimal (< 100 MB) and process lifetime is bounded by the configured session duration.

## 🧭 Dependency Direction and Rules

```mermaid
graph TD
    Tests["tests/bot.test.js"] -->|Imports for verification| Main["bot.js"]
    Main -->|Loads settings| Config["configuration.json"]
    Main -->|Utilises for protocol| Mineflayer["mineflayer"]
```

The principal dependency rules are:
- [bot.js](bot.js) depends on Node.js core modules (`fs`, `path`) and external package `mineflayer`.
- [tests/bot.test.js](tests/bot.test.js) imports exported functions from [bot.js](bot.js) for unit testing.
- External dependencies must not import application code.

## 📦 External Dependencies

| Dependency | Responsibility | Integration Boundary | Architectural Consequence |
|------------|----------------|----------------------|---------------------------|
| `mineflayer` | Handles Minecraft protocol communication, packet parsing, and bot event emission. | [bot.js](bot.js) (`createBot`) | Core runtime framework for server interaction. |

## 🚀 Deployment and Operations

| Concern | Current Design | Architectural Consequence |
|---------|----------------|---------------------------|
| Process Topology | Single Node.js CLI process executed on demand or via cron scheduler. | Simple execution model without background daemon requirements. |
| Persistence | Local file configuration only; no database requirements. | Zero external database infrastructure required. |
| Operating System | Cross-platform (Linux, macOS, Windows). | Native execution on any system supporting Node.js v18.0.0 or later. |

## 🛡️ Compatibility Contracts

| Contract | Owner | Invariant | Verification | Change Policy |
|----------|-------|-----------|--------------|---------------|
| Configuration Schema | [configuration.example.json](configuration.example.json) | JSON structure with `server`, `credentials`, `zones`, `schedule`, and `session` keys. | Automated tests ([tests/bot.test.js](tests/bot.test.js)) | Backwards-compatible additions permitted. |
| Exported Functions | [bot.js](bot.js) | Module exports `pause`, `randomInteger`, `randomChoice`, `isRestrictedByTimeWindow`, `executeCommand`, `ensureConfigurationExists`, `loadConfiguration`, and `main`. | Automated tests ([tests/bot.test.js](tests/bot.test.js)) | Function signatures must remain stable. |

## ✅ Testing and Verification

Automated testing is implemented utilizing Node.js native test runner (`node:test`) and assertion library (`node:assert/strict`). Tests verify configuration management, helper functions, boundary conditions, and mock bot event lifecycle flows.

Execute the principal automated verification with:

```bash
npm test
```

Execute syntax verification with:

```bash
npm run build
```

## ⚠️ Design Constraints

- **Single Session Execution:** Constructed to execute a single AFK session per invocation rather than maintaining a persistent multi-bot pool.
- **Node.js Runtime Dependency:** Requires Node.js v18.0.0 or later for `node:test` support and modern ES syntax.
- **Protocol Compatibility:** Depends on Mineflayer for Minecraft version protocol support.

## 🔧 Extension Points

### Custom Bot Event Handlers

1. Export or modularise additional event handlers within [bot.js](bot.js).
2. Register event listeners on the `bot` instance created inside `main()`.
3. Add unit tests in [tests/bot.test.js](tests/bot.test.js) to verify event handling logic utilizing mock event emitters.

Extension implementations must preserve non-blocking asynchronous execution and graceful teardown semantics.

## 📝 Architecture Decisions

| Decision | Rationale | Consequence | Record |
|----------|-----------|-------------|--------|
| Extracted Configuration | Prevent hardcoding credentials and server settings in application code. | Enables deployment across environments via [configuration.json](configuration.json). | Documented here |
| Native Test Runner | Refrain from external testing framework dependencies like Jest or Mocha. | Reduces dependency footprint and leverages Node.js built-in capabilities. | Documented here |

## 🗺️ Source Map

| Area | Path |
|------|------|
| Entry Point & Core Logic | [bot.js](bot.js) |
| Configuration Template | [configuration.example.json](configuration.example.json) |
| Configuration File | [configuration.json](configuration.json) |
| Package Manifest | [package.json](package.json) |
| CI Workflow | [.github/workflows/build.yml](.github/workflows/build.yml) |
| Test Suite | [tests/bot.test.js](tests/bot.test.js) |

## 📚 Related Documentation

- [README.md](./README.md): Project overview, capabilities, usage guidelines, configuration reference, and development instructions.
- [LICENSE](./LICENSE): GNU General Public License v3.0 text.
