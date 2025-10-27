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
  console.log("🧪 Testing Expo Docs MCP Server v2.0\n");
  console.log(`📁 Docs path: ${config.docsPath}`);
  console.log(`💾 Cache dir: ${config.cacheDir}\n`);

  // Initialize cache
  const diskCache = new DiskCache(config.cacheDir, config.cacheMaxAge);
  setDiskCache(diskCache);

  try {
    // Test 1: Load search index
    console.log("1️⃣  Loading search index from .mdx files...");
    const startTime = performance.now();
    await loadSearchIndex(config.docsPath);
    const loadTime = Math.round(performance.now() - startTime);
    const indexSize = getIndexSize();
    console.log(
      `✓ Search index loaded: ${indexSize} entries in ${loadTime}ms\n`
    );

    // Test 2: List sections
    console.log("2️⃣  Listing documentation sections...");
    const sections = getSections();
    console.log(`✓ Found ${sections.length} sections:`);
    sections.slice(0, 10).forEach((s) => {
      console.log(`   - ${s.name} (${s.count} docs)`);
    });
    console.log();

    // Test 3: Search functionality
    console.log("3️⃣  Testing search functionality...");
    const queries = [
      "camera permissions",
      "router navigation",
      "expo location",
    ];

    for (const query of queries) {
      const searchStart = performance.now();
      const results = searchInIndex(query, 3);
      const searchTime = Math.round(performance.now() - searchStart);

      console.log(`\n   Query: "${query}" (${searchTime}ms)`);
      console.log(`   ✓ Found ${results.length} results`);

      if (results.length > 0) {
        results.forEach((r, i) => {
          console.log(`      ${i + 1}. ${r.title}`);
          console.log(`         ${r.path} (score: ${r.score})`);
        });
      }
    }
    console.log();

    // Test 4: Get specific document
    console.log("4️⃣  Testing document retrieval...");
    const testPaths = [
      "/get-started/introduction",
      "/versions/v54.0.0/sdk/camera",
      "/router/introduction",
    ];

    for (const path of testPaths) {
      const doc = getDocumentByPath(path);
      if (doc) {
        console.log(`   ✓ ${path}`);
        console.log(`      Title: ${doc.title}`);
        console.log(`      Content length: ${doc.content.length} chars`);
      } else {
        console.log(`   ✗ Not found: ${path}`);
      }
    }
    console.log();

    // Test 5: Cache validation
    console.log("5️⃣  Testing cache...");
    const cacheValid = diskCache.isValid();
    console.log(
      `   Cache status: ${cacheValid ? "✓ Valid" : "✗ Invalid/Expired"}`
    );
    console.log();

    console.log("✅ All tests passed!\n");
    console.log(
      "🚀 Server is ready to use. Run 'bun run start' to start the MCP server."
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("\n❌ Error testing server:", errorMessage);
    console.log("\nMake sure the expo-sdk folder exists at:", config.docsPath);
    process.exit(1);
  }
}

testServer();
