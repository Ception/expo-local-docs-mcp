// src/tools/handlers/listExpoSections.ts
import {
  isIndexReady,
  getSections,
  getDocumentsBySection,
} from "../../searchIndex";
import type { ToolResponse } from "./types";

/**
 * Handle list_expo_sections tool
 */
export function handleListExpoSections(args: {
  section?: string;
}): ToolResponse {
  const { section } = args;

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
