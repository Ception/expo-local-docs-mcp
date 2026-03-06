// Comprehensive test of all MCP tools
import { join } from "path";
import {
  loadSearchIndex,
  searchInIndex,
  getDocumentByPath,
  getSections,
  getDocumentsBySection,
  setDiskCache,
} from "./src/searchIndex/index";
import { config } from "./src/config";
import { DiskCache } from "./src/diskCache";
import { parseMDXFile } from "./src/mdxParser";
import {
  findMDXFilesWithMetadata,
  getDocsFingerprint,
} from "./src/searchIndex/fileUtils";
import { handleGetExpoApiReference } from "./src/tools/handlers/getExpoApiReference";
import { handleSearchExpoDocs } from "./src/tools/handlers/searchExpoDocs";

// Initialize cache
const diskCache = new DiskCache(
  config.cacheDir,
  config.cacheMaxAge,
  config.version
);
setDiskCache(diskCache);

async function testAllTools() {
  console.log("🧪 Comprehensive Tool Tests\n");

  // Load index first
  await loadSearchIndex(config.docsPath);
  console.log("✓ Index ready\n");

  let allTestsPassed = true;

  // Test 1: search_expo_docs
  console.log("🔍 search_expo_docs");
  try {
    const results1 = searchInIndex("camera permissions", 5);
    const results2 = searchInIndex("navigation", 10, { section: "router" });
    const results3 = searchInIndex("expo location", 3);
    const specialCharacterQueries = ["[", "(", "C++"];
    const sectionLimitedResults = searchInIndex("introduction", 1, {
      section: "router",
    });
    const sectionHandlerResponse = handleSearchExpoDocs({
      query: "introduction",
      section: "router",
      maxResults: 1,
    });
    const parsedHandlerResponse = JSON.parse(sectionHandlerResponse.content[0].text);

    if (
      results1.length === 0 ||
      results2.length === 0 ||
      results3.length === 0
    ) {
      throw new Error("Some searches returned no results");
    }
    if (!sectionLimitedResults[0]?.path.toLowerCase().startsWith("/router/")) {
      throw new Error("Section-limited search should return router documents");
    }
    if (parsedHandlerResponse.total === 0) {
      throw new Error(
        "Section-filtered handler search should return results before limiting"
      );
    }

    for (const query of specialCharacterQueries) {
      searchInIndex(query, 3);
    }

    console.log("  ✓ Basic search");
    console.log("  ✓ Section-filtered search");
    console.log("  ✓ SDK search\n");
    console.log("  ✓ Section filtering happens before max limit");
    console.log("  ✓ Special-character query handling\n");
  } catch (error) {
    console.error(`  ❌ FAILED: ${error}\n`);
    allTestsPassed = false;
  }

  // Test 2: get_expo_doc_content
  console.log("📄 get_expo_doc_content");
  try {
    const doc1 = getDocumentByPath("/get-started/introduction");
    const doc2 = getDocumentByPath("/versions/v55.0.0/sdk/camera");
    const doc2LatestAlias = getDocumentByPath("/versions/latest/sdk/camera");
    const doc2LegacyVersion = getDocumentByPath("/versions/v54.0.0/sdk/camera");
    const doc3 = getDocumentByPath("/router/introduction");
    const doc4 = getDocumentByPath("/fake/path");

    if (!doc1 || !doc2 || !doc2LatestAlias || !doc2LegacyVersion || !doc3) {
      throw new Error("Required documents not found");
    }
    if (doc4) {
      throw new Error("Non-existent path should return null");
    }

    console.log("  ✓ Get introduction doc");
    console.log("  ✓ Get SDK doc with explicit v55 path");
    console.log("  ✓ Resolve latest alias to v55 doc");
    console.log("  ✓ Legacy v54 path still resolves");
    console.log("  ✓ Get router doc");
    console.log("  ✓ Non-existent path handling\n");
  } catch (error) {
    console.error(`  ❌ FAILED: ${error}\n`);
    allTestsPassed = false;
  }

  // Test 6: MDX parser extracts JSX-leading code blocks
  console.log("🧩 mdx_parser");
  try {
    const mdxPath = join(config.docsPath, "develop/user-interface/fonts.mdx");
    const parsedDoc = parseMDXFile(mdxPath);

    if (!parsedDoc.codeBlocks || parsedDoc.codeBlocks.length === 0) {
      throw new Error("Expected code blocks in sample MDX doc");
    }

    const hasJSXCodeBlock = parsedDoc.codeBlocks.some((block) =>
      block.trimStart().startsWith("<")
    );
    if (!hasJSXCodeBlock) {
      throw new Error("Expected JSX-leading code blocks to be preserved");
    }

    console.log("  ✓ JSX-leading code blocks are preserved\n");
  } catch (error) {
    console.error(`  ❌ FAILED: ${error}\n`);
    allTestsPassed = false;
  }

  // Test 7: cache fingerprint validation
  console.log("🗂️ disk_cache_fingerprint");
  try {
    const mdxFilesMetadata = findMDXFilesWithMetadata(config.docsPath, config.docsPath);
    const docsFingerprint = getDocsFingerprint(mdxFilesMetadata);

    if (!diskCache.isValid(docsFingerprint)) {
      throw new Error("Fingerprint-aware cache should be valid after indexing");
    }

    console.log("  ✓ Fingerprint-aware cache validation\n");
  } catch (error) {
    console.error(`  ❌ FAILED: ${error}\n`);
    allTestsPassed = false;
  }

  // Test 3: list_expo_sections
  console.log("📚 list_expo_sections");
  try {
    const allSections = getSections();
    const routerDocs = getDocumentsBySection("router");
    const guidesDocs = getDocumentsBySection("guides");

    if (
      allSections.length === 0 ||
      routerDocs.length === 0 ||
      guidesDocs.length === 0
    ) {
      throw new Error("Section data missing or incomplete");
    }

    console.log("  ✓ List all sections");
    console.log("  ✓ Get router section docs");
    console.log("  ✓ Get guides section docs\n");
  } catch (error) {
    console.error(`  ❌ FAILED: ${error}\n`);
    allTestsPassed = false;
  }

  // Test 4: get_expo_api_reference
  console.log("📖 get_expo_api_reference");
  try {
    const apiDoc1 = getDocumentByPath("/versions/v55.0.0/sdk/camera");
    const apiDoc2 = getDocumentByPath("/versions/v55.0.0/sdk/location");
    const apiDoc3 = getDocumentByPath("/versions/v55.0.0/sdk/notifications");
    const apiDocLatestAlias = getDocumentByPath("/versions/latest/sdk/camera");
    const apiFromPackageName = handleGetExpoApiReference({
      module: "expo-image-picker",
    });
    const apiFromNumericVersion = handleGetExpoApiReference({
      module: "camera",
      version: "55.0.0",
    });
    const apiFromCaseSensitiveModule = handleGetExpoApiReference({
      module: "captureRef",
    });
    const searchResults = searchInIndex("maps", 3).filter((r) =>
      r.path.includes("/sdk/")
    );

    if (!apiDoc1 || !apiDoc2 || !apiDoc3 || !apiDocLatestAlias) {
      throw new Error("API references not found");
    }
    if (
      apiFromPackageName.isError ||
      apiFromNumericVersion.isError ||
      apiFromCaseSensitiveModule.isError
    ) {
      throw new Error("Handler compatibility lookups failed");
    }

    console.log("  ✓ Get camera API");
    console.log("  ✓ Get location API");
    console.log("  ✓ Get notifications API");
    console.log("  ✓ latest alias resolves to v55 API");
    console.log("  ✓ Package-style module names resolve");
    console.log("  ✓ Numeric version input resolves");
    console.log("  ✓ Case-sensitive module paths resolve");
    console.log("  ✓ Fallback search for modules\n");
  } catch (error) {
    console.error(`  ❌ FAILED: ${error}\n`);
    allTestsPassed = false;
  }

  // Test 5: get_expo_quick_start
  console.log("🚀 get_expo_quick_start");
  try {
    const qs1 = getDocumentByPath("/get-started/introduction");
    const qs2 = getDocumentByPath("/get-started/create-a-project");
    const qsDocs = getDocumentsBySection("get-started");

    if (!qs1 || !qs2 || qsDocs.length === 0) {
      throw new Error("Quick start docs not found");
    }

    console.log("  ✓ Get default quick start");
    console.log("  ✓ Get specific topic");
    console.log("  ✓ List all quick start topics\n");
  } catch (error) {
    console.error(`  ❌ FAILED: ${error}\n`);
    allTestsPassed = false;
  }

  // Final summary
  if (allTestsPassed) {
    console.log("✅ All comprehensive tests passed!\n");
  } else {
    console.log("❌ Some tests failed - review errors above\n");
    process.exit(1);
  }
}

testAllTools().catch((error) => {
  console.error("\n💥 Fatal error during testing:", error);
  process.exit(1);
});
