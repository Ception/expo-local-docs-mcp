// src/tools/handlers/index.ts
import { handleSearchExpoDocs } from "./searchExpoDocs";
import { handleGetExpoDocContent } from "./getExpoDocContent";
import { handleListExpoSections } from "./listExpoSections";
import { handleGetExpoApiReference } from "./getExpoApiReference";
import { handleGetExpoQuickStart } from "./getExpoQuickStart";
import type { ToolResponse } from "./types";

/**
 * Main handler dispatcher
 */
export function handleToolCall(name: string, args: unknown): ToolResponse {
  switch (name) {
    case "search_expo_docs":
      return handleSearchExpoDocs(
        args as {
          query: string;
          section?: string;
          maxResults?: number;
        }
      );

    case "get_expo_doc_content":
      return handleGetExpoDocContent(args as { path: string });

    case "list_expo_sections":
      return handleListExpoSections(args as { section?: string });

    case "get_expo_api_reference":
      return handleGetExpoApiReference(
        args as { module: string; version?: string }
      );

    case "get_expo_quick_start":
      return handleGetExpoQuickStart(args as { topic?: string });

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
