// Quick test to verify the MCP server loads correctly
import { loadSearchIndex, searchInIndex } from "./src/searchIndex";

async function testServer() {
  console.log("Testing MCP server...\n");

  try {
    console.log("1. Loading search index from http://localhost:3002...");
    await loadSearchIndex("http://localhost:3002");
    console.log("✓ Search index loaded successfully\n");

    console.log("2. Testing search functionality...");
    const results = searchInIndex("camera", 5);
    console.log(`✓ Found ${results.length} results for "camera"\n`);

    if (results.length > 0) {
      console.log("Sample results:");
      results.slice(0, 3).forEach((r, i) => {
        console.log(`\n${i + 1}. ${r.title}`);
        console.log(`   Path: ${r.path}`);
        console.log(`   Score: ${r.score}`);
      });
    }

    console.log("\n✓ Server is working correctly!");
  } catch (error) {
    console.error("\n✗ Error testing server:", error);
    console.log(
      "\nMake sure your Expo docs are running at http://localhost:3002"
    );
  }
}

testServer();
