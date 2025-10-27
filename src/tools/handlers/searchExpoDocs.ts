// src/tools/handlers/searchExpoDocs.ts
import { searchInIndex, isIndexReady } from "../../searchIndex/index";
import { config } from "../../config";
import type { ToolResponse } from "./types";

/**
 * Handle search_expo_docs tool
 */
export function handleSearchExpoDocs(args: {
  query: string;
  section?: string;
  maxResults?: number;
}): ToolResponse {
  const { query, section, maxResults = 10 } = args;

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

  let results = searchInIndex(query.trim(), maxResults || config.maxResults);

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
