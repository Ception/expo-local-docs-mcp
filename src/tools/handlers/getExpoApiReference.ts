// src/tools/handlers/getExpoApiReference.ts
import {
  isIndexReady,
  getDocumentByPath,
  searchInIndex,
} from "../../searchIndex";
import type { ToolResponse } from "./types";

/**
 * Handle get_expo_api_reference tool
 */
export function handleGetExpoApiReference(args: {
  module: string;
  version?: string;
}): ToolResponse {
  const { module, version } = args;

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
    const sdkResults = searchResults.filter((r) => r.path.includes("/sdk/"));

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
