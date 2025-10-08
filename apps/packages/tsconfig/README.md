# @taskscore/tsconfig

> Shared TypeScript configurations for the monorepo

## Overview

This package provides base TypeScript configurations that are extended by all services in the coreTasks monorepo.

## Configurations

### `base.json`
Base configuration for all TypeScript projects

### `nest.json`
Extends `base.json` with NestJS-specific settings

### `react.json`
Extends `base.json` with React-specific settings

## Usage

### NestJS Services

```json
{
  "extends": "@taskscore/tsconfig/nest.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### React App

```json
{
  "extends": "@taskscore/tsconfig/react.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

[← Back to Main README](../../../README.md)
