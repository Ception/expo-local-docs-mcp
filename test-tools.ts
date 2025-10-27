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
  console.log("🧪 Testing All MCP Tools\n");
  console.log("=".repeat(60));

  // Load index first
  await loadSearchIndex(config.docsPath);
  console.log(`✓ Index loaded and ready\n`);

  let allTestsPassed = true;

  // Test 1: search_expo_docs
  console.log("🔍 Test 1: search_expo_docs");
  console.log("-".repeat(60));

  try {
    // Test 1a: Basic search
    console.log("\n1a. Basic search: 'camera permissions'");
    const results1 = searchInIndex("camera permissions", 5);
    if (results1.length === 0) {
      console.error("   ❌ ERROR: No results found");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Found ${results1.length} results`);
      results1.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.title} (${r.path}) - score: ${r.score}`);
      });
    }

    // Test 1b: Section-filtered search
    console.log("\n1b. Section-filtered search: 'navigation' in 'router'");
    const results2 = searchInIndex("navigation", 10).filter((r) =>
      r.path.toLowerCase().startsWith("/router/")
    );
    if (results2.length === 0) {
      console.error("   ❌ ERROR: No router results found");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Found ${results2.length} router-specific results`);
      results2.slice(0, 3).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.title} (${r.path})`);
      });
    }

    // Test 1c: SDK version search
    console.log("\n1c. SDK search: 'expo location'");
    const results3 = searchInIndex("expo location", 3);
    if (results3.length === 0) {
      console.error("   ❌ ERROR: No location results found");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Found ${results3.length} results`);
      results3.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.title} (${r.path})`);
      });
    }

    console.log("\n   ✅ search_expo_docs: PASSED\n");
  } catch (error) {
    console.error(`   ❌ search_expo_docs: FAILED - ${error}`);
    allTestsPassed = false;
  }

  // Test 2: get_expo_doc_content
  console.log("\n📄 Test 2: get_expo_doc_content");
  console.log("-".repeat(60));

  try {
    // Test 2a: Get introduction
    console.log("\n2a. Get document: '/get-started/introduction'");
    const doc1 = getDocumentByPath("/get-started/introduction");
    if (!doc1) {
      console.error("   ❌ ERROR: Document not found");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Found document`);
      console.log(`   Title: ${doc1.title}`);
      console.log(`   Description: ${doc1.description || "N/A"}`);
      console.log(`   Content length: ${doc1.content.length} chars`);
      console.log(`   Path: ${doc1.path}`);
    }

    // Test 2b: Get SDK doc
    console.log("\n2b. Get document: '/versions/v54.0.0/sdk/camera'");
    const doc2 = getDocumentByPath("/versions/v54.0.0/sdk/camera");
    if (!doc2) {
      console.error("   ❌ ERROR: Camera SDK doc not found");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Found document`);
      console.log(`   Title: ${doc2.title}`);
      console.log(`   Package: ${doc2.frontmatter.packageName || "N/A"}`);
      console.log(`   Platforms: ${doc2.frontmatter.platforms || "N/A"}`);
      console.log(`   Content length: ${doc2.content.length} chars`);
    }

    // Test 2c: Get router doc
    console.log("\n2c. Get document: '/router/introduction'");
    const doc3 = getDocumentByPath("/router/introduction");
    if (!doc3) {
      console.error("   ❌ ERROR: Router doc not found");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Found document`);
      console.log(`   Title: ${doc3.title}`);
      console.log(`   Content preview: ${doc3.content.slice(0, 100)}...`);
    }

    // Test 2d: Non-existent path (should fail gracefully)
    console.log("\n2d. Get non-existent: '/fake/path'");
    const doc4 = getDocumentByPath("/fake/path");
    if (doc4) {
      console.error("   ❌ ERROR: Should not have found document");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Correctly returned null for non-existent path`);
    }

    console.log("\n   ✅ get_expo_doc_content: PASSED\n");
  } catch (error) {
    console.error(`   ❌ get_expo_doc_content: FAILED - ${error}`);
    allTestsPassed = false;
  }

  // Test 3: list_expo_sections
  console.log("\n📚 Test 3: list_expo_sections");
  console.log("-".repeat(60));

  try {
    // Test 3a: List all sections
    console.log("\n3a. List all sections");
    const allSections = getSections();
    if (allSections.length === 0) {
      console.error("   ❌ ERROR: No sections found");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Found ${allSections.length} sections`);
      console.log(`   Top 10 sections by document count:`);
      allSections.slice(0, 10).forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.name} - ${s.count} docs (${s.path})`);
      });
    }

    // Test 3b: Get documents in specific section
    console.log("\n3b. Get documents in 'router' section");
    const routerDocs = getDocumentsBySection("router");
    if (routerDocs.length === 0) {
      console.error("   ❌ ERROR: No router docs found");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Found ${routerDocs.length} router documents`);
      routerDocs.slice(0, 5).forEach((d, i) => {
        console.log(`   ${i + 1}. ${d.title} (${d.path})`);
      });
    }

    // Test 3c: Get documents in 'guides' section
    console.log("\n3c. Get documents in 'guides' section");
    const guidesDocs = getDocumentsBySection("guides");
    if (guidesDocs.length === 0) {
      console.error("   ❌ ERROR: No guides found");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Found ${guidesDocs.length} guide documents`);
    }

    console.log("\n   ✅ list_expo_sections: PASSED\n");
  } catch (error) {
    console.error(`   ❌ list_expo_sections: FAILED - ${error}`);
    allTestsPassed = false;
  }

  // Test 4: get_expo_api_reference
  console.log("\n📖 Test 4: get_expo_api_reference");
  console.log("-".repeat(60));

  try {
    // Test 4a: Get camera API
    console.log("\n4a. Get API reference: 'camera' (v54.0.0)");
    const apiDoc1 = getDocumentByPath("/versions/v54.0.0/sdk/camera");
    if (!apiDoc1) {
      console.error("   ❌ ERROR: Camera API not found");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Found API reference`);
      console.log(`   Module: camera`);
      console.log(`   Title: ${apiDoc1.title}`);
      console.log(`   Package: ${apiDoc1.frontmatter.packageName}`);
      console.log(`   Platforms: ${apiDoc1.frontmatter.platforms}`);
    }

    // Test 4b: Get location API
    console.log("\n4b. Get API reference: 'location' (v54.0.0)");
    const apiDoc2 = getDocumentByPath("/versions/v54.0.0/sdk/location");
    if (!apiDoc2) {
      console.error("   ❌ ERROR: Location API not found");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Found API reference`);
      console.log(`   Module: location`);
      console.log(`   Title: ${apiDoc2.title}`);
    }

    // Test 4c: Get notifications API
    console.log("\n4c. Get API reference: 'notifications' (v54.0.0)");
    const apiDoc3 = getDocumentByPath("/versions/v54.0.0/sdk/notifications");
    if (!apiDoc3) {
      console.error("   ❌ ERROR: Notifications API not found");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Found API reference`);
      console.log(`   Module: notifications`);
      console.log(`   Title: ${apiDoc3.title}`);
    }

    // Test 4d: Search for module if exact path not found
    console.log("\n4d. Fallback search for 'maps'");
    const searchResults = searchInIndex("maps", 3).filter((r) =>
      r.path.includes("/sdk/")
    );
    if (searchResults.length > 0) {
      console.log(
        `   ✓ Found ${searchResults.length} SDK modules matching 'maps':`
      );
      searchResults.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.title} (${r.path})`);
      });
    } else {
      console.log(`   ℹ️  No exact match, would suggest search`);
    }

    console.log("\n   ✅ get_expo_api_reference: PASSED\n");
  } catch (error) {
    console.error(`   ❌ get_expo_api_reference: FAILED - ${error}`);
    allTestsPassed = false;
  }

  // Test 5: get_expo_quick_start
  console.log("\n🚀 Test 5: get_expo_quick_start");
  console.log("-".repeat(60));

  try {
    // Test 5a: Default quick start (introduction)
    console.log("\n5a. Get quick start: default (introduction)");
    const qs1 = getDocumentByPath("/get-started/introduction");
    if (!qs1) {
      console.error("   ❌ ERROR: Quick start introduction not found");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Found quick start`);
      console.log(`   Title: ${qs1.title}`);
      console.log(`   Content preview: ${qs1.content.slice(0, 150)}...`);
    }

    // Test 5b: Specific topic
    console.log("\n5b. Get quick start: 'create-a-project'");
    const qs2 = getDocumentByPath("/get-started/create-a-project");
    if (!qs2) {
      console.error("   ❌ ERROR: Create project quick start not found");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Found quick start`);
      console.log(`   Title: ${qs2.title}`);
    }

    // Test 5c: List all quick start topics
    console.log("\n5c. List all quick start topics");
    const qsDocs = getDocumentsBySection("get-started");
    if (qsDocs.length === 0) {
      console.error("   ❌ ERROR: No quick start docs found");
      allTestsPassed = false;
    } else {
      console.log(`   ✓ Found ${qsDocs.length} quick start documents:`);
      qsDocs.forEach((d, i) => {
        console.log(`   ${i + 1}. ${d.title} (${d.path})`);
      });
    }

    console.log("\n   ✅ get_expo_quick_start: PASSED\n");
  } catch (error) {
    console.error(`   ❌ get_expo_quick_start: FAILED - ${error}`);
    allTestsPassed = false;
  }

  // Final summary
  console.log("\n" + "=".repeat(60));
  if (allTestsPassed) {
    console.log("✅ ALL TOOLS PASSED - No errors detected!");
    console.log("\n🎉 Your MCP server is ready for production use!");
  } else {
    console.log("❌ SOME TESTS FAILED - Please review errors above");
    process.exit(1);
  }
  console.log("=".repeat(60));
}

testAllTools().catch((error) => {
  console.error("\n💥 Fatal error during testing:", error);
  process.exit(1);
});
