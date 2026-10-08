# Privacy and Personal Data

[[[Brief summary of the document scope, covered application, deployment model, and personal-data handling approach.]]]

**Information reviewed:** 2026-10-08

## 📑 Table of Contents

<!-- Generate one entry per ##/###/#### heading present in the final output, in order. Do not include emojis here. -->

## 🔎 What This Document Covers

This document describes how the Minecraft AFK Bot at https://github.com/hmlendea/minecraft-afk-bot handles personal data. It covers the application behaviour and verified integrations described below. Where the software is self-hosted, the instance operator may have separate responsibilities described below.

## 🏠 Self-Hosted Deployments

This document covers both the project maintainers and self-hosted instance operators. The project maintainers do not control any data processed by self-hosted instances. Self-hosted instance operators control their instance's configuration, local storage, logs, backups, access controls, retention, and request handling. A self-hosted instance does not transmit any data to project maintainers or external services.

## 📥 Data We Handle

### Data Provided to the Application

- Username and password for Minecraft authentication, as configured in `configuration.json`. These are provided by the instance operator at setup.
- No other personal data is requested from users or administrators.

### Data Generated or Collected by the Application

- Log entries written to the configured log file (`logging.filePath`, default `logfile.log` beside `bot.js`). Log entries include timestamps and command executions (e.g., `/auth`, `/op`, `/god`, `/zone tp`, `/bed`). The `/auth` command password is redacted in logs to `/auth [REDACTED]`.
- No other personal data is generated or collected automatically.

### Data Received from Integrations

- No personal data is received from integrations or third parties. The bot only connects to a Minecraft server using the Mineflayer library and sends configured commands.

## 🧭 Processing and Use

The application processes the data described above for these verified functions:
- Authentication to Minecraft server via `/auth` command — username and password
- Granting operator status via `/op` command — no personal data
- Enabling god mode via `/god` command — no personal data
- Teleporting to configured zones via `/zone tp <zone>` command — no personal data
- Sleeping in a bed at night via `/bed` command — no personal data

## 🗄️ Storage, Retention, and Deletion

- **Log file**: Written to the path configured in `logging.filePath` (default: `logfile.log` beside `bot.js`). The instance operator controls the log file, its retention, and deletion. No automatic rotation or deletion is performed by the application.
- **Configuration**: Stored in `configuration.json` in the instance directory. The instance operator controls this file, its retention, and deletion.
- **In-memory session data**: All session state (transition chains, timers, flags) exists only in memory during a single process run and is not persisted to any storage.
- No database, no persistent session state, no cross-run state.

## 🔗 External Processing and Integrations

| Service or integration | Purpose | Data involved | Configuration or documentation |
|-----------------------|---------|---------------|--------------------------------|
| Mineflayer | Minecraft protocol client | None (bot credentials from `configuration.json`) | npm package, no configuration |
| Minecraft server | Game connection | Connection address (host:port) from `server.host` / `server.port` | Configured in `configuration.json` |

The application has no built-in external data transfer. The only external connection is the TCP connection to the configured Minecraft server for game play.

## ⚙️ User Controls and Requests

The following documented controls or request procedures are available:
- Instance operators can edit `configuration.json` to change credentials, server address, zones, and sleep probability.
- Instance operators can delete `configuration.json` and the log file to remove stored data.
- Instance operators can set `skipProbability: 0` and adjust `schedule` to control when the bot runs.

## 🌍 International Transfers

No data is transferred across national or regional borders. The only network connection is the TCP connection to the configured Minecraft server.

## 🧒 Children

The service is not directed to children, and no age-related controls or restrictions are applied.

## 🛡️ Data Protection and Security

- Instance operators are responsible for securing `configuration.json` with filesystem permissions (recommended: `chmod 600`).
- Instance operators are responsible for updating the Node.js runtime and `mineflayer` dependency to receive security fixes.
- Instance operators are responsible for protecting the log file from unauthorized access.
- The application does not transmit secrets, credentials, or private contact data in network traffic or logs (the `/auth` password is redacted to `/auth [REDACTED]`).
- No encryption is used for the Minecraft connection (standard protocol limitation).

## 🔄 Document Changes

Update this document when application data flows, storage, integrations, or deployment responsibilities change. The current version is published at `PRIVACY.md` in the repository.

## 📬 Contact

For questions about application data handling, contact the project maintainers via the GitHub repository issues. For a self-hosted instance, contact the instance operator.