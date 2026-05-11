# Contributing to Vibe Dev Template

Thank you for your interest in contributing to the Vibe Dev Template! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Style Guidelines](#style-guidelines)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. By participating, you agree to:

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Types of Contributions

We welcome various types of contributions:

1. **Bug Reports** - Report issues with existing configurations
2. **Feature Requests** - Suggest new features or improvements
3. **Documentation** - Improve or add documentation
4. **Code Contributions** - Fix bugs or implement features
5. **Configuration Improvements** - Enhance existing configs (gitignore, editorconfig, etc.)
6. **Template Testing** - Test the template with different project types

## Getting Started

### Prerequisites

- Git installed on your system
- Basic understanding of development tools and configurations
- Familiarity with the technologies used in the template

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

   ```bash
   git clone https://github.com/yourusername/vibe_dev_template.git
   cd vibe_dev_template
   ```

3. Add the upstream repository:

   ```bash
   git remote add upstream https://github.com/original-owner/vibe_dev_template.git
   ```

4. Keep your fork synchronized:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

## Development Workflow

### Creating a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
# or
git checkout -b docs/your-documentation-update
```

Branch naming conventions:

- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests

### Making Changes

1. Make your changes in your feature branch
2. Test your changes thoroughly
3. Ensure your changes don't break existing functionality
4. Keep commits focused and atomic
5. Write clear, descriptive commit messages

### Commit Message Guidelines

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no code change)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

Examples:

```bash
git commit -m "feat(vscode): add Go language settings file"
git commit -m "fix(gitignore): correct Python bytecode patterns"
git commit -m "docs(readme): improve installation instructions"
```

## Style Guidelines

### General Principles

- **Universality** - Keep the template language-agnostic where possible
- **Modularity** - Organize configurations into logical, reusable components
- **Clarity** - Use clear, descriptive names and comprehensive comments
- **Standards** - Follow industry best practices and standards

### File-Specific Guidelines

#### .gitignore

- Group patterns by category with clear section headers
- Add comments for non-obvious patterns
- Keep universal patterns at the top
- Language-specific patterns in commented sections at bottom

#### VSCode Settings

- Universal settings in `settings.json`
- Language-specific settings in `settings.<language>.json`
- Include comments explaining non-obvious configurations
- Follow JSON formatting standards

#### Documentation

- Use clear, concise language
- Include code examples where appropriate
- Keep line length reasonable (80-120 characters)
- Use proper markdown formatting

#### Makefiles

- Include clear comments for each target
- Add help text with `##` for all public targets
- Follow standard Make conventions
- Test on multiple platforms when possible

## Submitting Changes

### Before Submitting

1. **Test your changes** - Ensure everything works as expected
2. **Update documentation** - Update relevant documentation
3. **Check for conflicts** - Rebase on latest main if needed
4. **Review your changes** - Self-review your code

### Pull Request Process

1. Push your changes to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a Pull Request on GitHub

3. Fill out the PR template completely:

   - Clear title describing the change
   - Detailed description of what changed and why
   - Reference any related issues
   - Include screenshots if relevant

4. Ensure CI checks pass (if applicable)

5. Respond to review feedback promptly

6. Once approved, a maintainer will merge your PR

### Pull Request Checklist

- [ ] Branch is up to date with main
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] Changes are tested
- [ ] No unnecessary files included
- [ ] PR description is clear and complete

## Reporting Issues

### Bug Reports

When reporting bugs, include:

- Clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Environment details (OS, tool versions, etc.)
- Screenshots if applicable

### Feature Requests

When suggesting features:

- Clear description of the feature
- Use case and benefits
- Potential implementation approach
- Examples from other projects (if applicable)

## Questions?

If you have questions about contributing:

1. Check existing issues and discussions
2. Review the documentation
3. Open a new discussion or issue

## Recognition

Contributors will be recognized in:

- GitHub contributors list
- Release notes for significant contributions
- Project documentation (if appropriate)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing to make this template better for everyone!
