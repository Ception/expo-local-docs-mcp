# Expo Docs MCP Server

A blazing-fast MCP (Model Context Protocol) server for Expo documentation that reads directly from local `.mdx` files.

## 🚀 Key Features

- **Lightning Fast**: Reads directly from local `.mdx` files - no HTTP server needed
- **Smart Caching**: Disk-based cache with version + docs fingerprint invalidation
- **Full-Text Search**: Powerful search with intelligent scoring algorithm
- **Zero Network**: Works completely offline
- **Optimized for Bun**: Built specifically for Bun's performance

## 📊 Performance

| Metric       | First Run         | Cached Run       |
| ------------ | ----------------- | ---------------- |
| Index Build  | ~90-120ms         | ~12-20ms         |
| Search Query | ~1-10ms           | ~1-10ms          |
| Documents    | 997 .mdx files    | 997 .mdx files   |
| Cache Size   | ~4.4MB            | ~4.4MB           |

Measured on the current local docs snapshot.

## 🛠️ Setup

Choose your preferred installation method:

### Option 1: npx (Zero Install)

No installation needed! Just add to your Cursor MCP configuration:

```json
{
  "mcpServers": {
    "expo-docs": {
      "command": "npx",
      "args": ["expo-local-docs-mcp"]
    }
  }
}
```

✅ Always uses latest version  
✅ No manual updates needed  
⚠️ Slight delay on first run (cached after)

### Option 2: Global Install (Recommended)

Install once, use everywhere:

```bash
npm install -g expo-local-docs-mcp
# or with pnpm
pnpm install -g expo-local-docs-mcp
```

Then add to your Cursor MCP configuration:

```json
{
  "mcpServers": {
    "expo-docs": {
      "command": "expo-local-docs-mcp"
    }
  }
}
```

✅ Instant startup (no download)  
✅ Cleaner config  
⚠️ Manual updates: `npm update -g expo-local-docs-mcp`

### Option 3: Local Project Install

Install in your project:

```bash
cd ~/my-expo-project
npm install expo-local-docs-mcp
```

Then add to your Cursor MCP configuration:

```json
{
  "mcpServers": {
    "expo-docs": {
      "command": "node",
      "args": [
        "/absolute/path/to/node_modules/expo-local-docs-mcp/dist/server.js"
      ]
    }
  }
}
```

✅ Version locked to project  
⚠️ Must install per project  
⚠️ Need absolute path in config

---

That's it! The package includes 997 Expo SDK docs in the current snapshot and works out of the box with any method.

### For Contributors: Local Development

If you want to contribute or customize:

#### Prerequisites

- [Bun](https://bun.sh) installed (recommended) or Node.js
- Expo documentation `.mdx` files in the `expo-sdk/` folder

#### Installation

```bash
cd /path/to/expo-local-docs-mcp
bun install
bun run build
```

#### Test It Works

```bash
bun run test
```

You should see:

```
✅ All tests passed!
✓ Index loaded: 997 entries (~90-120ms first run)
✓ Index loaded: 997 entries (~12-20ms cached run)
```

#### Configuration for Local Development

Add to your Cursor MCP configuration (`~/.cursor/mcp.json` or `~/.config/cursor/mcp.json`):

```json
{
  "mcpServers": {
    "expo-docs": {
      "command": "bun",
      "args": ["/<workingdirectory>/expo-local-docs-mcp/dist/server.js"],
      "env": {
        "EXPO_DOCS_PATH": "/<workingdirectory>/expo-local-docs-mcp/expo-sdk",
        "EXPO_CACHE_DIR": "/<workingdirectory>/expo-local-docs-mcp/.expo-cache"
      }
    }
  }
}
```

**Important**: Update the paths to match your actual installation location.

## 📚 Available Tools

### 1. `search_expo_docs`

Search the Expo documentation with intelligent ranking.

**Parameters:**

- `query` (string, required): Search query
- `section` (string, optional): Filter by section (e.g., 'guides', 'router', 'versions')
- `maxResults` (number, optional): Max results (default: 10)

**Example:**

```json
{
  "query": "camera permissions",
  "section": "guides",
  "maxResults": 5
}
```

### 2. `get_expo_doc_content`

Get the full content of a specific documentation page.

**Parameters:**

- `path` (string, required): Document path (e.g., `/versions/latest/sdk/camera`)

**Example:**

```json
{
  "path": "/get-started/introduction"
}
```

### 3. `list_expo_sections`

List all documentation sections or get documents in a specific section.

**Parameters:**

- `section` (string, optional): Get documents in this section

**Example:**

```json
{
  "section": "router"
}
```

### 4. `get_expo_api_reference`

Get API reference for a specific Expo SDK module.

**Parameters:**

- `module` (string, required): Module name (e.g., 'camera', 'expo-camera')
- `version` (string, optional): SDK version (e.g., 'latest', 'v55.0.0', or '55.0.0')

**Example:**

```json
{
  "module": "camera"
}
```

### 5. `get_expo_quick_start`

Get quick start documentation.

**Parameters:**

- `topic` (string, optional): Specific topic (e.g., 'create-a-project')

**Example:**

```json
{
  "topic": "create-a-project"
}
```

## 🏗️ Architecture

```
expo-local-docs-mcp/
├── src/
│   ├── server.ts              # MCP server implementation
│   ├── config.ts              # Configuration management
│   ├── diskCache.ts           # Disk cache management
│   ├── mdxParser.ts           # MDX file parser (frontmatter + content)
│   ├── searchIndex/           # Search index module
│   │   ├── index.ts           # Public API exports
│   │   ├── types.ts           # TypeScript types
│   │   ├── state.ts           # Index state management
│   │   ├── loader.ts          # Index building and loading
│   │   ├── search.ts          # Search algorithm
│   │   ├── query.ts           # Document queries
│   │   └── fileUtils.ts       # File system utilities
│   └── tools/                 # MCP tool handlers
│       ├── definitions.ts     # Tool schemas
│       └── handlers/          # Tool implementations
│           ├── index.ts       # Handler dispatcher
│           ├── types.ts       # Handler types
│           ├── searchExpoDocs.ts
│           ├── getExpoDocContent.ts
│           ├── listExpoSections.ts
│           ├── getExpoApiReference.ts
│           └── getExpoQuickStart.ts
├── expo-sdk/                  # Your Expo documentation .mdx files
│   ├── get-started/
│   ├── guides/
│   ├── router/
│   ├── versions/
│   └── ...
├── .expo-cache/               # Generated cache (auto-created)
│   └── search-index.json
├── dist/                      # Built server
│   └── server.js
├── test-server.ts             # Basic functionality tests
├── test-tools.ts              # Comprehensive tool tests
└── package.json
```

## 🔧 Development

```bash
# Run in development mode
bun run dev

# Build for production
bun run build

# Start built server
bun run start

# Run tests
bun run test
bun run test:tools
bun run test:all

# Clear cache (force rebuild)
bun run clear-cache
```

## 🎯 Environment Variables

| Variable                  | Default         | Description                                   |
| ------------------------- | --------------- | --------------------------------------------- |
| `EXPO_DOCS_PATH`          | `./expo-sdk`    | Path to expo-sdk folder containing .mdx files |
| `EXPO_CACHE_DIR`          | `./.expo-cache` | Cache directory location                      |
| `EXPO_DOCS_MAX_RESULTS`   | `20`            | Max search results to return                  |
| `EXPO_DOCS_CACHE_MAX_AGE` | `86400000`      | Cache age in ms (24 hours)                    |

## 📦 Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `@types/node` - TypeScript Node.js types
- `typescript` - TypeScript compiler

**That's it!** No HTTP clients, no HTML parsers, just fast file I/O.

## 🐛 Troubleshooting

### Index not building

- Ensure `expo-sdk/` folder exists and contains `.mdx` files
- Check file permissions on the directory
- Try `bun run clear-cache` and restart

### Search returning no results

- Wait for index to build (check console output)
- Verify .mdx files have content
- Try broader search terms

### Cache rebuilding every time

- Check `.expo-cache/` folder permissions
- Verify cache file is being created: `ls -lh .expo-cache/`
- Check disk space

### "Cannot find module" errors

- Run `bun install` to ensure dependencies are installed
- Run `bun run build` to rebuild

## 📝 How It Works

1. **Startup**: Server initializes and attempts to load from disk cache
2. **Cache Check**: Cache is valid only when version, age, and docs fingerprint all match (typically ~12-20ms load)
3. **Fresh Build**: If no valid cache, scans `expo-sdk/` recursively for all `.mdx` files (currently 997 files)
4. **Parsing**: Extracts YAML frontmatter and strips MDX/JSX to get clean text content
5. **Indexing**: Builds in-memory search index with path mapping (~90-120ms)
6. **Caching**: Saves complete index to `search-index.json` (~4.4MB)
7. **Search**: Uses optimized scoring algorithm (exact matches > word matches)

### MDX Parsing

Each `.mdx` file's frontmatter is parsed:

```yaml
---
title: Camera
description: A React component that renders a preview...
packageName: expo-camera
platforms: ["android", "ios", "web"]
---
```

This metadata is used for better search results and filtering.

### Search Scoring Algorithm

The search uses a dual-layer scoring system for maximum relevance:

**Exact Phrase Matches:**

- Title contains exact query: **1000 points**
- Description contains exact query: **500 points**
- Path contains exact query: **300 points**
- Content contains exact query: **100 points**

**Individual Word Matches (with boundary detection):**

- Word match in title: **50 points** per occurrence
- Word match in description: **25 points** per occurrence
- Word match in path: **15 points** per occurrence
- Word match in content: **1 point** per occurrence

**Performance Optimizations:**

- Pre-compiles escaped regex patterns for each search word
- Uses `for...of` loop instead of `.map()` for better performance
- Only creates scored objects for entries with matches (score > 0)
- Single-pass algorithm with early section filtering

## 🔄 Updating Documentation

To update the Expo docs:

1. Replace/update files in `expo-sdk/` folder
2. Clear the cache: `bun run clear-cache`
3. Restart the MCP server

The index will automatically rebuild on next startup.

## ❓ FAQ

**Q: Should I use npx or install globally?**  
A: Global install (`npm install -g`) is recommended for faster startup and cleaner config. Use npx if you want automatic updates.

**Q: How do I update to the latest version?**  
A:

- **npx**: Automatic (always uses latest)
- **Global**: `npm update -g expo-local-docs-mcp`
- **Local**: `npm update expo-local-docs-mcp` in your project

**Q: How do I test npx execution?**  
A: Run `npx expo-local-docs-mcp` directly in your terminal. It should start the MCP server on stdio.

**Q: Do I need the localhost:3002 server running?**  
A: No! That was the old v1.x architecture. v2.0 reads files directly.

**Q: Can I delete the cache folder?**  
A: Yes! It will automatically rebuild (typically ~90-120ms). Cache locations:

- **npm/npx**: `/tmp/expo-local-docs-mcp-cache/` (macOS/Linux)
- **Local dev**: `.expo-cache/` (project root)

**Q: What happens if an .mdx file is missing?**  
A: The server gracefully skips it and continues indexing other files.

**Q: Can I use this with Node.js instead of Bun?**  
A: Yes! The npm package is built to work with Node.js. Local development can use either Bun or Node.

**Q: How big is the npm package?**  
A: It depends on the included docs snapshot. The current repo snapshot indexes 997 `.mdx` docs and builds a ~4.4MB cache file.

## 📈 Indexed Content

```
Total documents: 997 .mdx files
Total sections: 40
Cache size: ~4.4MB

Top sections:
  - versions: 602 docs (SDK API references)
  - guides: 59 docs
  - router: 47 docs (Expo Router)
  - eas: 35 docs (EAS services)
  - eas-update: 27 docs
  - tutorial: 25 docs
  - develop: 21 docs
  - build-reference: 21 docs
  - archive: 18 docs
  - modules: 17 docs
```

## 🎉 Benefits vs v1.x

| Feature            | v1.x (HTTP)          | v2.0 (Files) |
| ------------------ | -------------------- | ------------ |
| Speed (first run)  | 5-10s                | 90-120ms     |
| Speed (cached)     | 1-2s                 | 12-20ms      |
| Network required   | Yes                  | No           |
| Dependencies       | axios, cheerio       | None         |
| HTTP server needed | Yes (localhost:3002) | No           |
| Offline support    | No                   | Yes          |
| Search quality     | Good                 | Better       |

## 📄 License

MIT

## 🤝 Contributing

This is a personal MCP server optimized for local Expo documentation access. Feel free to fork and adapt for your needs!

---

**Version**: 2.0.3  
**Built with**: Bun + TypeScript  
**Performance**: 🚀 Blazing Fast
