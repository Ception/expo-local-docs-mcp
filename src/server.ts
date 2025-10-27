// src/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { loadSearchIndex, setDiskCache } from "./searchIndex/index";
import { config } from "./config";
import { DiskCache } from "./diskCache";
import { toolDefinitions } from "./tools/definitions";
import { handleToolCall } from "./tools/handlers/index";

// Initialize disk cache
const diskCache = new DiskCache(config.cacheDir, config.cacheMaxAge);
setDiskCache(diskCache);

// Create MCP server
const server = new Server(
  {
    name: "expo-docs",
    version: "2.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Pre-load search index on startup
const startTime = performance.now();
loadSearchIndex(config.docsPath)
  .then(() => {
    const duration = Math.round(performance.now() - startTime);
    console.error(`✓ Search index ready in ${duration}ms`);
  })
  .catch((error: unknown) => {
    console.error("Failed to build search index:", error);
  });

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolDefinitions,
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const response = handleToolCall(name, args);
    return {
      content: response.content,
      isError: response.isError,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Error handling tool request:", err);
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server using stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Expo Docs MCP server running on stdio");
  console.error(`Docs path: ${config.docsPath}`);
  console.error(`Cache dir: ${config.cacheDir}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
