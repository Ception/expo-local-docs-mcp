// Quick test to verify the MCP server loads correctly
import {
  loadSearchIndex,
  searchInIndex,
  getIndexSize,
  getSections,
  getDocumentByPath,
  setDiskCache,
} from "./src/searchIndex/index";
import { config } from "./src/config";
import { DiskCache } from "./src/diskCache";

async function testServer() {
  console.log("🧪 Basic Functionality Tests\n");

  // Initialize cache
  const diskCache = new DiskCache(
    config.cacheDir,
    config.cacheMaxAge,
    config.version
  );
  setDiskCache(diskCache);

  try {
    // Test 1: Load search index
    const startTime = performance.now();
    await loadSearchIndex(config.docsPath);
    const loadTime = Math.round(performance.now() - startTime);
    const indexSize = getIndexSize();
    if (indexSize === 0) {
      throw new Error("Index should contain at least one document");
    }
    console.log(`✓ Index loaded: ${indexSize} entries (${loadTime}ms)`);

    // Test 2: List sections
    const sections = getSections();
    if (sections.length === 0) {
      throw new Error("Sections list should not be empty");
    }
    console.log(`✓ Sections found: ${sections.length}`);

    // Test 3: Search functionality
    const queries = [
      "camera permissions",
      "router navigation",
      "expo location",
    ];

    let searchPassed = 0;
    for (const query of queries) {
      const results = searchInIndex(query, 3);
      if (results.length > 0) searchPassed++;
    }
    if (searchPassed !== queries.length) {
      throw new Error(
        `Expected ${queries.length} successful search queries, got ${searchPassed}`
      );
    }
    console.log(`✓ Search queries: ${searchPassed}/${queries.length} passed`);

    // Test 4: Get specific document
    const testPaths = [
      "/get-started/introduction",
      "/versions/v55.0.0/sdk/camera",
      "/versions/latest/sdk/camera",
      "/router/introduction",
    ];

    let docsPassed = 0;
    for (const path of testPaths) {
      const doc = getDocumentByPath(path);
      if (doc) docsPassed++;
    }
    if (docsPassed !== testPaths.length) {
      throw new Error(
        `Expected ${testPaths.length} documents, got ${docsPassed}`
      );
    }
    console.log(
      `✓ Document retrieval: ${docsPassed}/${testPaths.length} passed`
    );

    // Test 5: Cache validation
    const cacheValid = diskCache.isValid();
    if (!cacheValid) {
      throw new Error("Disk cache should be valid after index load");
    }
    console.log(`✓ Cache validation: ${cacheValid ? "valid" : "invalid"}`);

    console.log("\n✅ All basic tests passed!\n");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("\n❌ Error:", errorMessage);
    console.log("Make sure the expo-sdk folder exists at:", config.docsPath);
    process.exit(1);
  }
}

testServer();
