# Contributing to Minecraft AFK Bot

This document covers the guidelines and processes for contributing to this project, including how to report issues, suggest enhancements, submit code changes, and follow project standards.

## 📑 Table of Contents

- [How to Contribute](#-how-to-contribute)
  - [Reporting Issues](#reporting-issues)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Code Contributions](#code-contributions)
    - [Prerequisites](#prerequisites)
    - [Development Setup](#development-setup)
    - [Making Changes](#making-changes)
    - [Pull Request Guidelines](#pull-request-guidelines)
  - [Code Style](#code-style)
  - [Testing](#testing)
  - [Documentation](#documentation)
- [Code of Conduct](#-code-of-conduct)
- [Security](#-security)
- [License](#-license)
- [Recognition](#-recognition)
- [Getting Help](#-getting-help)

## 🤝 How to Contribute

### Reporting Issues

- Search existing issues first.
- Use the issue templates if available.
- Provide clear reproduction steps.
- Include environment details (Node.js version, OS, Minecraft server version).

### Suggesting Enhancements

- Check the roadmap and existing discussions.
- Explain the use case and expected behavior.
- Consider implementation complexity.

### Code Contributions

#### Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0

#### Development Setup

```bash
# Clone the repository
git clone https://github.com/hmlendea/minecraft-afk-bot.git
cd minecraft-afk-bot

# Install dependencies
npm install
```

#### Making Changes

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes.
4. Run tests: `npm test`
5. Commit with clear and descriptive messages.
6. Push to your fork.
7. Open a Pull Request.

#### Pull Request Guidelines

- Target the `master` branch.
- Keep PRs focused and atomic.
- Update documentation if applicable.
- Add tests for any new functionality.
- Ensure the CI checks pass.

### Code Style

Follow the project's coding standards:
- CommonJS modules (`require`/`module.exports`)
- 4-space indentation
- `const`/`let`, no `var`
- JSDoc comments for exported functions
- Async/await over raw promises where readable

### Testing

```bash
# Run all tests
npm test

# Run specific test suite
node --test tests/bot.test.js
```

### Documentation

- Update relevant docs for changes.
- Follow the documentation style guide (kebab-case filenames, sentence-case headings, relative links from `docs/` root).
- Preview changes locally if possible.

## 📋 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## 🔒 Security

Report security vulnerabilities per the [SECURITY.md](SECURITY.md).

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors are recognized in the GitHub contributors list.

## ❓ Getting Help

- GitHub Issues
- Check existing discussions and documentation first.