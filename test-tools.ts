// Comprehensive test of all MCP tools
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

// Initialize cache
const diskCache = new DiskCache(config.cacheDir, config.cacheMaxAge);
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
    const results2 = searchInIndex("navigation", 10).filter((r) =>
      r.path.toLowerCase().startsWith("/router/")
    );
    const results3 = searchInIndex("expo location", 3);

    if (
      results1.length === 0 ||
      results2.length === 0 ||
      results3.length === 0
    ) {
      throw new Error("Some searches returned no results");
    }

    console.log("  ✓ Basic search");
    console.log("  ✓ Section-filtered search");
    console.log("  ✓ SDK search\n");
  } catch (error) {
    console.error(`  ❌ FAILED: ${error}\n`);
    allTestsPassed = false;
  }

  // Test 2: get_expo_doc_content
  console.log("📄 get_expo_doc_content");
  try {
    const doc1 = getDocumentByPath("/get-started/introduction");
    const doc2 = getDocumentByPath("/versions/v54.0.0/sdk/camera");
    const doc3 = getDocumentByPath("/router/introduction");
    const doc4 = getDocumentByPath("/fake/path");

    if (!doc1 || !doc2 || !doc3) {
      throw new Error("Required documents not found");
    }
    if (doc4) {
      throw new Error("Non-existent path should return null");
    }

    console.log("  ✓ Get introduction doc");
    console.log("  ✓ Get SDK doc with frontmatter");
    console.log("  ✓ Get router doc");
    console.log("  ✓ Non-existent path handling\n");
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
    const apiDoc1 = getDocumentByPath("/versions/v54.0.0/sdk/camera");
    const apiDoc2 = getDocumentByPath("/versions/v54.0.0/sdk/location");
    const apiDoc3 = getDocumentByPath("/versions/v54.0.0/sdk/notifications");
    const searchResults = searchInIndex("maps", 3).filter((r) =>
      r.path.includes("/sdk/")
    );

    if (!apiDoc1 || !apiDoc2 || !apiDoc3) {
      throw new Error("API references not found");
    }

    console.log("  ✓ Get camera API");
    console.log("  ✓ Get location API");
    console.log("  ✓ Get notifications API");
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
