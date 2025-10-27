// src/tools/handlers/getExpoQuickStart.ts
import {
  isIndexReady,
  getDocumentByPath,
  getDocumentsBySection,
} from "../../searchIndex";
import type { ToolResponse } from "./types";

/**
 * Handle get_expo_quick_start tool
 */
export function handleGetExpoQuickStart(args: {
  topic?: string;
}): ToolResponse {
  const { topic } = args;

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
            error: `Quick start topic not found: ${topic || "introduction"}`,
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
