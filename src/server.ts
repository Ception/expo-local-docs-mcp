// src/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as cheerio from "cheerio";
import { loadSearchIndex, searchInIndex } from "./searchIndex";

const BASE_URL = "http://localhost:3002";

// Create a new MCP server
const server = new Server(
  {
    name: "expo-local-docs",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let indexReady = false;

// Pre-load search index on startup (don't block server startup)
loadSearchIndex(BASE_URL)
  .then(() => {
    indexReady = true;
    console.error("Search index built successfully");
  })
  .catch((e: unknown) => {
    console.error("Failed to build search index – search will be disabled", e);
    indexReady = false;
  });

// Helper function to extract text from HTML
function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);
  // Remove script and style elements
  $("script, style").remove();
  // Get text from common content containers
  const content = $("main, article, .markdown-body, .docs-content, body")
    .first()
    .text()
    .replace(/\s+/g, " ")
    .trim();
  return content;
}

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
              "Documentation section (home, guides, eas, reference, learn, versions)",
            enum: ["home", "guides", "eas", "reference", "learn", "versions"],
          },
          version: {
            type: "string",
            description: "SDK version (e.g., latest, v51.0.0, v50.0.0)",
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
              "Path within docs (e.g., 'guides/routing' or '/versions/latest/sdk/camera')",
          },
          url: {
            type: "string",
            description: "Full URL of the documentation page",
          },
          version: {
            type: "string",
            description: "SDK version",
          },
        },
      },
    },
    {
      name: "list_expo_sections",
      description: "List all available documentation sections and topics.",
      inputSchema: {
        type: "object",
        properties: {
          section: {
            type: "string",
            description:
              "Section to list contents for (home, guides, eas, reference, learn, versions)",
            enum: ["home", "guides", "eas", "reference", "learn", "versions"],
          },
          version: {
            type: "string",
            description: "SDK version",
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
            description: "Module name (e.g., 'expo-camera', 'expo-location')",
          },
          version: {
            type: "string",
            description: "SDK version",
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
          platform: {
            type: "string",
            description: "Target platform",
            enum: ["ios", "android", "web", "all"],
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
        version,
        maxResults = 10,
      } = args as {
        query: string;
        section?: string;
        version?: string;
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

      if (!indexReady) {
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

      let results = searchInIndex(query.trim(), maxResults);

      // Filter by section if provided
      if (section) {
        results = results.filter((r) => r.path?.includes(`/${section}/`));
      }

      // Filter by version if provided
      if (version) {
        const versionPath = `/versions/${version}`;
        results = results.filter((r) => r.path?.includes(versionPath));
      }

      const formattedResults = results.map((r: any) => ({
        title: r.title,
        path: r.path,
        excerpt:
          (r.content || "").slice(0, 200) +
          ((r.content || "").length > 200 ? "…" : ""),
        score: r.score,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ results: formattedResults }, null, 2),
          },
        ],
      };
    }

    // Get Expo doc content
    if (name === "get_expo_doc_content") {
      const { path, url, version } = args as {
        path?: string;
        url?: string;
        version?: string;
      };

      let docPath = "";
      if (url) {
        docPath = url.replace(BASE_URL, "");
      } else if (path) {
        docPath = path.startsWith("/") ? path : `/${path}`;
      } else {
        throw new Error("path or url is required");
      }

      // Handle version if provided
      if (version && !docPath.includes("/versions/")) {
        docPath = `/versions/${version}${docPath}`;
      }

      const { data } = await axios.get(`${BASE_URL}${docPath}`);
      const $ = cheerio.load(data);

      const title = $("h1").first().text().trim() || "Untitled";
      const htmlContent =
        $(".markdown-body, .docs-content, main").first().html() || "";
      const textContent = extractTextFromHtml(htmlContent);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { title, content: textContent, url: `${BASE_URL}${docPath}` },
              null,
              2
            ),
          },
        ],
      };
    }

    // List Expo sections
    if (name === "list_expo_sections") {
      const { section, version } = args as {
        section?: string;
        version?: string;
      };

      try {
        let url = BASE_URL;
        if (version) {
          url = `${BASE_URL}/versions/${version}`;
        }
        if (section) {
          url = `${url}/${section}`;
        }

        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Extract navigation/sidebar links
        const links: Array<{ text: string; href: string }> = [];
        $("nav a, .sidebar a, .navigation a").each((_, el) => {
          const text = $(el).text().trim();
          const href = $(el).attr("href") || "";
          if (text && href) {
            links.push({ text, href });
          }
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ section, sections: links }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Failed to list sections: ${error.message}`,
              }),
            },
          ],
          isError: true,
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

      const verPath = version ? `/versions/${version}` : "/versions/latest";
      const apiPath = `${verPath}/sdk/${module.replace("expo-", "")}`;

      try {
        const { data } = await axios.get(`${BASE_URL}${apiPath}`);
        const $ = cheerio.load(data);

        const title = $("h1").first().text().trim() || module;
        const htmlContent =
          $(".markdown-body, .docs-content, main, article").first().html() ||
          "";
        const textContent = extractTextFromHtml(htmlContent);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  module,
                  title,
                  content: textContent,
                  url: `${BASE_URL}${apiPath}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Failed to fetch API reference: ${error.message}`,
              }),
            },
          ],
          isError: true,
        };
      }
    }

    // Get Expo quick start
    if (name === "get_expo_quick_start") {
      const { platform = "all" } = args as { platform?: string };

      let quickStartPath = "/";
      if (platform === "ios") {
        quickStartPath = "/guides/ios";
      } else if (platform === "android") {
        quickStartPath = "/guides/android";
      } else if (platform === "web") {
        quickStartPath = "/guides/web";
      }

      try {
        const { data } = await axios.get(`${BASE_URL}${quickStartPath}`);
        const $ = cheerio.load(data);

        const title = $("h1").first().text().trim() || "Quick Start";
        const htmlContent =
          $(".markdown-body, .docs-content, main, article").first().html() ||
          "";
        const textContent = extractTextFromHtml(htmlContent);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  platform,
                  title,
                  content: textContent,
                  url: `${BASE_URL}${quickStartPath}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Failed to fetch quick start: ${error.message}`,
              }),
            },
          ],
          isError: true,
        };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (err: any) {
    console.error("Error handling tool request:", err);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${err.message}`,
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
  console.error("Expo Local Docs MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
