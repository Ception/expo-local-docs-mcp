// src/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  loadSearchIndex,
  searchInIndex,
  isIndexReady,
  setDiskCache,
  getDocumentByPath,
  getSections,
  getDocumentsBySection,
} from "./searchIndex";
import { config } from "./config";
import { DiskCache } from "./diskCache";

// Initialize disk cache
const diskCache = new DiskCache(config.cacheDir, config.cacheMaxAge);
setDiskCache(diskCache);

// Create MCP server
const server = new Server(
  {
    name: "expo-docs",
    version: "2.0.0",
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
  tools: [
    {
      name: "search_expo_docs",
      description:
        "Search the Expo documentation. Returns a list of relevant documentation pages matching the query.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant documentation",
          },
          section: {
            type: "string",
            description:
              "Optional: Filter by documentation section (e.g., 'guides', 'router', 'versions')",
          },
          maxResults: {
            type: "number",
            description: "Maximum number of results to return",
            default: 10,
          },
        },
        required: ["query"],
      },
    },
    {
      name: "get_expo_doc_content",
      description:
        "Retrieve the full content of a specific Expo documentation page by path.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Path to the documentation page (e.g., '/guides/routing' or '/versions/v54.0.0/sdk/camera')",
          },
        },
        required: ["path"],
      },
    },
    {
      name: "list_expo_sections",
      description:
        "List all available documentation sections and their document counts.",
      inputSchema: {
        type: "object",
        properties: {
          section: {
            type: "string",
            description:
              "Optional: Get documents in a specific section (e.g., 'guides', 'router')",
          },
        },
      },
    },
    {
      name: "get_expo_api_reference",
      description: "Get API reference for a specific Expo SDK module.",
      inputSchema: {
        type: "object",
        properties: {
          module: {
            type: "string",
            description:
              "Module name (e.g., 'camera', 'location'). Automatically handles 'expo-' prefix.",
          },
          version: {
            type: "string",
            description: "SDK version (e.g., 'v54.0.0'). Defaults to latest.",
          },
        },
        required: ["module"],
      },
    },
    {
      name: "get_expo_quick_start",
      description: "Get quick start guide for Expo.",
      inputSchema: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description:
              "Specific quick start topic (e.g., 'create-a-project', 'start-developing')",
          },
        },
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Search Expo docs
    if (name === "search_expo_docs") {
      const {
        query,
        section,
        maxResults = 10,
      } = args as {
        query: string;
        section?: string;
        maxResults?: number;
      };

      if (!query?.trim()) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ results: [] }),
            },
          ],
        };
      }

      if (!isIndexReady()) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error:
                  "Search index is still being built. Please wait a moment and try again.",
                results: [],
              }),
            },
          ],
        };
      }

      let results = searchInIndex(
        query.trim(),
        maxResults || config.maxResults
      );

      // Filter by section if provided
      if (section) {
        results = results.filter((r) =>
          r.path.toLowerCase().startsWith(`/${section.toLowerCase()}/`)
        );
      }

      const formattedResults = results.map((r) => ({
        title: r.title,
        path: r.path,
        description: r.description,
        excerpt: r.content.slice(0, 250) + (r.content.length > 250 ? "…" : ""),
        score: r.score,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                query,
                results: formattedResults,
                total: formattedResults.length,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Get Expo doc content
    if (name === "get_expo_doc_content") {
      const { path } = args as { path: string };

      if (!path) {
        throw new Error("path is required");
      }

      if (!isIndexReady()) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Search index is not ready yet. Please wait.",
              }),
            },
          ],
          isError: true,
        };
      }

      const doc = getDocumentByPath(path);

      if (!doc) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Document not found at path: ${path}`,
                suggestion: "Try using search_expo_docs to find the right path",
              }),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                title: doc.title,
                description: doc.description,
                content: doc.content,
                path: doc.path,
                frontmatter: doc.frontmatter,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // List Expo sections
    if (name === "list_expo_sections") {
      const { section } = args as { section?: string };

      if (!isIndexReady()) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Search index is not ready yet. Please wait.",
              }),
            },
          ],
          isError: true,
        };
      }

      if (section) {
        // Get documents in a specific section
        const docs = getDocumentsBySection(section);
        const formattedDocs = docs.map((d) => ({
          title: d.title,
          path: d.path,
          description: d.description,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  section,
                  documents: formattedDocs,
                  total: formattedDocs.length,
                },
                null,
                2
              ),
            },
          ],
        };
      } else {
        // List all sections
        const sections = getSections();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  sections,
                  total: sections.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }

    // Get Expo API reference
    if (name === "get_expo_api_reference") {
      const { module, version } = args as {
        module: string;
        version?: string;
      };

      if (!module) {
        throw new Error("module is required");
      }

      if (!isIndexReady()) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Search index is not ready yet. Please wait.",
              }),
            },
          ],
          isError: true,
        };
      }

      // Normalize module name (remove 'expo-' prefix if present)
      const moduleName = module.replace(/^expo-/, "");

      // Build path
      const verPath = version || "v54.0.0"; // Default to latest
      const apiPath = `/versions/${verPath}/sdk/${moduleName}`;

      const doc = getDocumentByPath(apiPath);

      if (!doc) {
        // Try searching for it
        const searchResults = searchInIndex(module, 5);
        const sdkResults = searchResults.filter((r) =>
          r.path.includes("/sdk/")
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `API reference not found at: ${apiPath}`,
                suggestion:
                  sdkResults.length > 0
                    ? `Did you mean one of these?\n${sdkResults
                        .map((r) => `- ${r.title} (${r.path})`)
                        .join("\n")}`
                    : "Try using search_expo_docs to find the module",
                searchResults: sdkResults.slice(0, 3),
              }),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                module: moduleName,
                title: doc.title,
                description: doc.description,
                content: doc.content,
                path: doc.path,
                frontmatter: doc.frontmatter,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Get Expo quick start
    if (name === "get_expo_quick_start") {
      const { topic } = args as { topic?: string };

      if (!isIndexReady()) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Search index is not ready yet. Please wait.",
              }),
            },
          ],
          isError: true,
        };
      }

      // Default to introduction
      const quickStartPath = topic
        ? `/get-started/${topic}`
        : "/get-started/introduction";

      const doc = getDocumentByPath(quickStartPath);

      if (!doc) {
        // Get all quick start docs
        const quickStartDocs = getDocumentsBySection("get-started");

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Quick start topic not found: ${
                  topic || "introduction"
                }`,
                availableTopics: quickStartDocs.map((d) => ({
                  title: d.title,
                  path: d.path,
                  description: d.description,
                })),
              }),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                title: doc.title,
                description: doc.description,
                content: doc.content,
                path: doc.path,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Error handling tool request:", err);
    return {
      content: [
        {
          type: "text",
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
