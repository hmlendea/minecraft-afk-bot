[![Donate](https://img.shields.io/badge/-%E2%99%A5%20Donate-%23ff69b4)](https://hmlendea.go.ro/funding)
[![Build Status](https://github.com/hmlendea/minecraft-afk-bot/actions/workflows/build.yml/badge.svg)](https://github.com/hmlendea/minecraft-afk-bot/actions/workflows/build.yml)
[![License](https://img.shields.io/github/license/hmlendea/minecraft-afk-bot)](https://github.com/hmlendea/minecraft-afk-bot/blob/master/LICENSE)

# Minecraft AFK Bot

An automated Minecraft AFK bot powered by Mineflayer to maintain active presence across configured server zones.

## 📑 Table of Contents

- [Capabilities](#-capabilities)
- [Usage](#-usage)
- [System Requirements](#-system-requirements)
- [Installation](#-installation)
  - [Package Manager Installation](#package-manager-installation)
- [Configuration](#-configuration)
  - [Configuration Files](#configuration-files)
  - [Settings](#settings)
- [Development](#-development)
  - [Requirements](#requirements)
  - [Setup](#setup)
  - [Run](#run)
  - [Test](#test)
  - [Dependencies](#dependencies)
- [Architecture](#-architecture)
- [Contributing](#-contributing)
- [Project Engagement](#-project-engagement)
- [License](#-license)

## ✨ Capabilities

- Automated authentication and zone teleportation upon spawning on a Minecraft server
- Schedule-based execution window and random skip condition checks
- Dynamic session duration with configurable online presence bounds
- Extracted JSON configuration for server settings, credentials, zones, schedule, and timings

## 🚀 Usage

Execute the bot using Node.js:

```bash
node bot.js
```

## 🖥️ System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | v18.0.0 | v20.0.0 or later |

## 📦 Installation

[![Obtain it from GitHub](https://raw.githubusercontent.com/hmlendea/readme-assets/master/badges/stores/github.png)](https://github.com/hmlendea/minecraft-afk-bot/releases)

### Package Manager Installation

```bash
npm install
```

## ⚙️ Configuration

The application loads server parameters, account credentials, target zones, execution windows, and session delays from `configuration.json`.

### Configuration Files

| File | Scope | Purpose |
|------|-------|---------|
| `configuration.json` | Application | Defines server connection parameters, account credentials, target zones, schedule execution windows, and session timings. |
| `configuration.example.json` | Application Template | Serves as the template file used to generate `configuration.json` automatically if missing. |

### Settings

The subsequent settings are recognised:

| Section | Key | Type | Default | Required | Description |
|---------|-----|------|---------|----------|-------------|
| `server` | `host` | `String` | `"mc.nucilandia.ro"` | Yes | The Minecraft server hostname or IP address. |
| `server` | `port` | `Number` | `25565` | Yes | The Minecraft server port number. |
| `server` | `version` | `String` | `"1.20.1"` | Yes | The target Minecraft protocol version. |
| `credentials` | `username` | `String` | `"WeJoke"` | Yes | The Minecraft account username. |
| `credentials` | `password` | `String` | `"nusuntclonaluihori"` | Yes | The password for in-game `/auth` authentication. |
| `zones` | `zones` | `Array` | `[...]` | Yes | The list of target zone names for teleportation. |
| `schedule` | `startHour` | `Number` | `1` | Yes | Start hour (0-23) of the restricted execution window. |
| `schedule` | `startMinute` | `Number` | `30` | Yes | Start minute (0-59) of the restricted execution window. |
| `schedule` | `endHour` | `Number` | `17` | Yes | End hour (0-23) of the restricted execution window. |
| `schedule` | `endMinute` | `Number` | `0` | Yes | End minute (0-59) of the restricted execution window. |
| `schedule` | `skipProbability` | `Number` | `0.8` | Yes | Probability (0.0 to 1.0) of randomly skipping execution. |
| `session` | `minimumOnlineMinutes` | `Number` | `30` | Yes | Minimum online session duration in minutes. |
| `session` | `maximumOnlineMinutes` | `Number` | `120` | Yes | Maximum online session duration in minutes. |
| `session` | `spawnDelayMilliseconds` | `Number` | `5000` | Yes | Delay in milliseconds after spawn prior to executing commands. |
| `session` | `commandDelayMilliseconds` | `Number` | `5000` | Yes | Delay in milliseconds between executed commands. |

## 🛠️ Development

### Requirements

- [Node.js v18.0.0 or later](https://nodejs.org/)

### Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/hmlendea/minecraft-afk-bot.git
cd minecraft-afk-bot
npm install
```

### Run

Start the bot locally:

```bash
node bot.js
```

### Test

Execute the unit test suite:

```bash
npm test
```

### Dependencies

| Package | Version | Scope | Purpose |
|---------|---------|-------|---------|
| `mineflayer` | `^4.37.0` | Runtime | Minecraft bot API for connecting and interacting with Minecraft servers. |

## 🏗️ Architecture

See the [architecture documentation](./ARCHITECTURE.md) for the system context, principal components, runtime flows, ownership boundaries, dependencies, constraints, and extension points.

## 🤝 Contributing

You are welcome to submit any suggestion, feedback, or modification to this project.

When doing so, please:
- Maintain cross-platform compatibility
- Submit focused pull requests that conform to the existing code style
- Maintain your branch synchronised with `master`
- Revise the documentation when functionality changes

## 💝 Project Engagement

Discovered a problem or have a suggestion? [Open an issue](https://github.com/hmlendea/minecraft-afk-bot/issues)!

If you find this project useful, consider [funding it](https://hmlendea.go.ro/funding) or starring ⭐️ it on GitHub!

[![Donate](https://raw.githubusercontent.com/hmlendea/readme-assets/master/donate_generic.png)](https://hmlendea.go.ro/funding)

## 📄 License

This project is being distributed under the `GNU General Public License v3.0` or later.
See [LICENSE](./LICENSE) for further information.
