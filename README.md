# Expo Local Docs MCP Server

An MCP (Model Context Protocol) server that provides access to your local Expo documentation at `http://localhost:3002`.

## Overview

This MCP server allows you to:

- Search your local Expo documentation
- Retrieve full content from specific documentation pages
- Works alongside the remote `expo-docs-mcp` but uses your local docs instance

## Prerequisites

1. Have Expo docs running locally at `http://localhost:3002`
2. Install Bun (package manager)
3. Have the MCP server configuration set up in your Cursor/Claude Desktop settings

## Setup

1. **Clone and navigate to the project:**

   ```bash
   cd /Users/x./Documents/repos/mcps/expo-local-mcp
   ```

2. **Install dependencies:**

   ```bash
   bun install
   ```

3. **Build the MCP server:**

   ```bash
   bun run build
   ```

4. **Ensure your local Expo docs are running:**
   ```bash
   # Make sure your Next.js server is running on port 3002
   # The server will crawl your docs and build a search index automatically
   ```

## Configuration

Add this to your Cursor MCP configuration (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "expo-docs": {
      "command": "bun",
      "args": ["/Users/x./Documents/repos/mcps/expo-local-mcp/dist/server.js"],
      "env": {},
      "headers": {}
    }
  }
}
```

## Available Tools

### 1. `search_expo_docs`

Search the Expo documentation for relevant pages.

**Parameters:**

- `query` (string, required): The search query to find relevant documentation
- `maxResults` (number, optional): Maximum number of results to return (default: 10)

**Example:**

```
Search for "expo camera permissions"
```

### 2. `get_expo_doc_content`

Retrieve the full content of a specific Expo documentation page.

**Parameters:**

- `path` (string, required): The URL path of the documentation page

**Example:**

```
Get content for "/versions/latest/sdk/camera"
```

## Development

- **Run in development mode:**

  ```bash
  bun run dev
  ```

- **Build for production:**

  ```bash
  bun run build
  ```

- **Start the built server:**
  ```bash
  bun run start
  ```

## How It Works

1. On startup, the server automatically crawls your local Expo docs:

   - Fetches the home page to discover navigation links
   - Scrapes up to 100 documentation pages
   - Extracts title and content from each page
   - Builds an in-memory search index

2. The index is built in the background, so the server starts immediately
3. When you search, it uses a keyword matching algorithm to find relevant pages
4. When you request specific content, it fetches the HTML from your local server and extracts the main content

## Troubleshooting

- **Server not starting:** Make sure your local Expo docs are running at `http://localhost:3002`
- **Search not working:** Wait a moment for the search index to finish building. You'll see "Search index built successfully" in the console when ready
- **"Search index is still being built" message:** Wait 30-60 seconds for the initial index build on first startup
- **Index building takes time:** This is normal - the server scrapes all doc pages on startup. Check your Expo docs server logs to see which pages are being crawled
- **Wrong content:** Check that the HTML selectors (`.markdown-body`, `.docs-content`, `main`) match your docs structure

## Configuration

You can change the BASE_URL in `src/server.ts` to point to a different port or server:

```typescript
const BASE_URL = "http://localhost:3002";
```
