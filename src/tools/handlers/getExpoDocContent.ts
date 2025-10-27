// src/tools/handlers/getExpoDocContent.ts
import { isIndexReady, getDocumentByPath } from "../../searchIndex/index";
import type { ToolResponse } from "./types";

/**
 * Handle get_expo_doc_content tool
 */
export function handleGetExpoDocContent(args: { path: string }): ToolResponse {
  const { path } = args;

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
