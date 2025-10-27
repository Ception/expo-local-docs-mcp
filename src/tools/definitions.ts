// src/tools/definitions.ts
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
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
            "Path to the documentation page (e.g., '/guides/routing' or '/versions/latest/sdk/camera')",
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
];
