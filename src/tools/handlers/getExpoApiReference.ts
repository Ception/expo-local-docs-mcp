// src/tools/handlers/getExpoApiReference.ts
import {
  isIndexReady,
  getDocumentByPath,
  searchInIndex,
} from "../../searchIndex/index";
import type { ToolResponse } from "./types";

function normalizeVersion(version?: string): string {
  const trimmed = version?.trim();
  if (!trimmed) {
    return "latest";
  }

  if (trimmed.toLowerCase() === "latest") {
    return "latest";
  }

  if (/^v\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(trimmed)) {
    return `v${trimmed}`;
  }

  return trimmed;
}

function normalizeModuleCandidates(module: string): string[] {
  const normalizedInput = module.trim();

  const packageLeaf = normalizedInput.includes("/")
    ? normalizedInput.split("/").at(-1) || normalizedInput
    : normalizedInput;

  const baseModule = packageLeaf.replace(/^expo-/i, "");
  const lowercaseModule = baseModule.toLowerCase();
  const camelFromPascal =
    baseModule.length > 0
      ? baseModule.charAt(0).toLowerCase() + baseModule.slice(1)
      : baseModule;

  const candidates = [
    // Preserve caller-provided casing first for case-sensitive path segments.
    baseModule,
    camelFromPascal,
    baseModule.replace(/_/g, "-"),
    baseModule.replace(/-/g, ""),
    lowercaseModule,
    lowercaseModule.replace(/_/g, "-"),
    lowercaseModule.replace(/-/g, ""),
  ];

  return Array.from(new Set(candidates.filter(Boolean)));
}

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

  const verPath = normalizeVersion(version);
  const moduleCandidates = normalizeModuleCandidates(module);
  const attemptedPaths = moduleCandidates.map(
    (candidate) => `/versions/${verPath}/sdk/${candidate}`
  );

  let doc = null;
  let resolvedModule = moduleCandidates[0];

  for (let i = 0; i < attemptedPaths.length; i++) {
    const candidateDoc = getDocumentByPath(attemptedPaths[i]);
    if (candidateDoc) {
      doc = candidateDoc;
      resolvedModule = moduleCandidates[i];
      break;
    }
  }

  if (!doc) {
    // Try searching for it
    const searchResults = searchInIndex(module, 5);
    const sdkResults = searchResults.filter((r) => r.path.includes("/sdk/"));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: `API reference not found for module: ${module}`,
            attemptedPaths,
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
            module: resolvedModule,
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
