# Contributing to Git-RTS

First off, thank you for considering contributing to Git-RTS! It's people like you that make Git-RTS such a great project. We welcome contributions from everyone, whether you're fixing a typo, adding a feature, or suggesting an improvement.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Issues](#issues)
  - [Pull Requests](#pull-requests)
- [Development Environment](#development-environment)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by the [Git-RTS Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@git-rts.com](mailto:conduct@git-rts.com).

## Getting Started

### Issues

- **Bug Reports**: If you find a bug, please create an issue using the bug report template. Include as much detail as possible, such as steps to reproduce, expected behavior, and actual behavior.
- **Feature Requests**: If you have an idea for a new feature, please create an issue using the feature request template. Describe the feature in detail and explain why it would be valuable.
- **Questions**: If you have a question, please check the documentation first. If you can't find an answer, create an issue with the question template.

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run the tests (`npm test`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Environment

### Prerequisites

- Node.js 14.x or higher
- Git 2.20 or higher
- GitHub account

### Setup

```bash
# Clone your fork of the repository
git clone https://github.com/yourusername/git-rts.git
cd git-rts

# Install dependencies
npm install

# Link the CLI globally
npm link

# Create a test game repository
git-rts create-game https://github.com/yourusername/test-rts-world.git "Test RTS World"
```

### Project Structure

```
git-rts/
├── git-rts-cli/       # Command-line interface
│   ├── index.js       # Main CLI entry point
│   └── commands/      # CLI commands
├── git-rts-mcp/       # MCP server
│   ├── src/           # Source code
│   └── build/         # Compiled code
├── git-rts-web/       # Web interface
│   ├── src/           # Source code
│   └── public/        # Static assets
└── docs/              # Documentation
```

## Coding Standards

We follow a set of coding standards to ensure consistency across the codebase:

### JavaScript/TypeScript

- Use ES6+ features
- Use TypeScript for type safety
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use async/await for asynchronous code
- Document all functions and classes with JSDoc comments

### Git

- Write clear, concise commit messages
- Reference issues and pull requests in commit messages
- Keep commits focused on a single change
- Rebase your branch before submitting a pull request

## Testing

We use Jest for testing. All new features should include tests, and all tests must pass before a pull request can be merged.

```bash
# Run all tests
npm test

# Run tests for a specific component
npm test -- --testPathPattern=git-rts-cli

# Run a specific test
npm test -- -t "should create a new game"
```

## Documentation

Documentation is crucial for Git-RTS. All new features should be documented, and existing documentation should be updated when necessary.

### Code Documentation

- Use JSDoc comments for all functions, classes, and methods
- Include examples where appropriate
- Document parameters, return values, and exceptions

### User Documentation

- Update the README.md file when necessary
- Add new documentation files to the docs/ directory
- Use clear, concise language
- Include screenshots and diagrams where appropriate

## Game Mechanics Development

When developing new game mechanics, consider the following:

1. **Git Integration**: How does the mechanic leverage Git's features?
2. **Balance**: Is the mechanic balanced with existing mechanics?
3. **Usability**: Is the mechanic easy to understand and use?
4. **Performance**: Does the mechanic perform well with large repositories?

## RESTful Hypermedia API Development

When developing the RESTful hypermedia API, consider the following:

1. **Hypermedia Controls**: Include appropriate hypermedia controls for all resources
2. **Self-Discovery**: Ensure the API is self-discoverable
3. **Semantic Meaning**: Use the ontology to provide semantic meaning
4. **Performance**: Optimize API responses for performance

## Community

Join our community to discuss development, ask questions, and get help:

- [Discord Server](https://discord.gg/git-rts)
- [GitHub Discussions](https://github.com/git-rts/git-rts/discussions)
- [Twitter](https://twitter.com/git_rts)

## Recognition

Contributors are recognized in several ways:

- Listed in the [CONTRIBUTORS.md](CONTRIBUTORS.md) file
- Mentioned in release notes
- Given credit in the game's credits screen

Thank you for contributing to Git-RTS!