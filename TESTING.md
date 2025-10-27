# Testing Guide

Complete guide for testing your Expo Docs MCP Server.

---

## 🧪 Available Test Suites

### 1. **test-server.ts** - Basic Functionality Test

**Run with:** `bun run test`

**What it tests:**

- ✓ Index loading (from cache or fresh build)
- ✓ Section listing (all 38 sections)
- ✓ Search functionality (3 different queries)
- ✓ Document retrieval (3 different paths)
- ✓ Cache validation

**Output:**

```
🧪 Basic Functionality Tests

✓ Index loaded: 958 entries (3ms)
✓ Sections found: 38
✓ Search queries: 3/3 passed
✓ Document retrieval: 3/3 passed
✓ Cache validation: valid

✅ All basic tests passed!
```

**Use case:** Quick sanity check that everything works.

---

### 2. **test-tools.ts** - Comprehensive Tool Test

**Run with:** `bun run test:tools`

**What it tests:**

- ✓ **Tool 1:** search_expo_docs (3 test cases)
  - Basic search
  - Section-filtered search
  - SDK version search
- ✓ **Tool 2:** get_expo_doc_content (4 test cases)
  - Introduction document
  - SDK document with frontmatter
  - Router document
  - Non-existent path (error handling)
- ✓ **Tool 3:** list_expo_sections (3 test cases)
  - List all sections
  - Get documents in specific section (router)
  - Get documents in specific section (guides)
- ✓ **Tool 4:** get_expo_api_reference (4 test cases)
  - Camera API reference
  - Location API reference
  - Notifications API reference
  - Fallback search when exact match not found
- ✓ **Tool 5:** get_expo_quick_start (3 test cases)
  - Default quick start (introduction)
  - Specific topic (create-a-project)
  - List all quick start topics

**Total:** 17 comprehensive test cases

**Output:**

```
🧪 Comprehensive Tool Tests

✓ Index ready

🔍 search_expo_docs
  ✓ Basic search
  ✓ Section-filtered search
  ✓ SDK search

📄 get_expo_doc_content
  ✓ Get introduction doc
  ✓ Get SDK doc with frontmatter
  ✓ Get router doc
  ✓ Non-existent path handling

📚 list_expo_sections
  ✓ List all sections
  ✓ Get router section docs
  ✓ Get guides section docs

📖 get_expo_api_reference
  ✓ Get camera API
  ✓ Get location API
  ✓ Get notifications API
  ✓ Fallback search for modules

🚀 get_expo_quick_start
  ✓ Get default quick start
  ✓ Get specific topic
  ✓ List all quick start topics

✅ All comprehensive tests passed!
```

**Use case:** Detailed verification of all MCP tools before deployment.

---

### 3. **test:all** - Run Everything

**Run with:** `bun run test:all`

Runs both test suites sequentially (basic + comprehensive). Perfect for pre-deployment validation.

---

## 📋 Test Commands

```bash
# Quick basic test
bun run test

# Comprehensive tool test
bun run test:tools

# Run all tests
bun run test:all

# Clear cache and test fresh build
bun run clear-cache && bun run test
```

---

## ✅ What Each Test Verifies

### test-server.ts

| Test               | What It Checks         | Expected Result           |
| ------------------ | ---------------------- | ------------------------- |
| Index Loading      | Cache loads correctly  | 958 entries in 3ms        |
| Section Listing    | All sections found     | 38 sections               |
| Search             | Queries return results | 3 queries, all successful |
| Document Retrieval | Specific docs found    | 3 paths, all found        |
| Cache Validation   | Cache is valid         | ✓ Valid                   |

### test-tools.ts

| Tool                   | Test Cases | What It Verifies                                   |
| ---------------------- | ---------- | -------------------------------------------------- |
| search_expo_docs       | 3          | Basic search, section filtering, SDK search        |
| get_expo_doc_content   | 4          | Doc retrieval, frontmatter parsing, error handling |
| list_expo_sections     | 3          | All sections, section-specific document listing    |
| get_expo_api_reference | 4          | API lookup by module name, fallback search         |
| get_expo_quick_start   | 3          | Default/specific quick start topics, topic listing |
| **Total**              | **17**     | **17 comprehensive test cases**                    |

---

## 🎯 Testing Workflow

### Before Deployment

```bash
1. bun run build           # Build the server
2. bun run test:all        # Run all tests
3. # If all pass, deploy!
```

### After Code Changes

```bash
1. bun run clear-cache     # Clear cache
2. bun run build           # Rebuild
3. bun run test:all        # Verify all works
```

### Debugging Issues

```bash
# Test just the basics
bun run test

# Test specific tool behavior
bun run test:tools

# Force fresh index build
bun run clear-cache && bun run test
```

---

## 🔍 Understanding Test Output

### Success Output

```
✅ All tests passed!
🎉 Your MCP server is ready for production use!
```

### If Tests Fail

```
❌ ERROR: [specific error message]
```

Look for the error details and check:

1. Is `expo-sdk/` folder present?
2. Are there .mdx files in it?
3. Is the cache corrupted? (try `clear-cache`)
4. Are file permissions correct?

---

## 📊 Performance Benchmarks

### Expected Performance

- **First run** (no cache): 70-80ms
- **Cached run**: 3-5ms
- **Search query**: 5-10ms
- **Document retrieval**: <1ms (in-memory)

### If Performance is Slow

```bash
# Check cache
ls -lh .expo-cache/

# Rebuild cache
bun run clear-cache
bun run test

# Check file count
find expo-sdk -name "*.mdx" | wc -l
# Should show: 958
```

---

## 🐛 Common Issues

### Issue: "No cached index found"

**Solution:** First run always builds from scratch. This is normal.

```bash
bun run test  # Will build cache
bun run test  # Will use cache (faster)
```

### Issue: "Failed to parse [file]"

**Solution:** One or more .mdx files may be malformed. The server skips them automatically.

### Issue: Cache always rebuilding

**Cause:** Cache might be >24 hours old or corrupted.
**Solution:**

```bash
bun run clear-cache
bun run test
```

### Issue: Tests pass but MCP doesn't work in Cursor

**Cause:** Tests verify logic, not MCP protocol integration.
**Solution:** Check your MCP config in Cursor:

- Correct path to `dist/server.js`
- Environment variables set
- Cursor restarted after config change

---

## 🚀 Pre-Production Checklist

- [ ] `bun run build` completes successfully
- [ ] `bun run test` passes (5 basic tests)
- [ ] `bun run test:tools` passes (17/17 tests)
- [ ] Cache file exists: `.expo-cache/search-index.json`
- [ ] Cache size is ~2.7MB
- [ ] 958 .mdx files indexed
- [ ] 38 sections found
- [ ] MCP config file updated with correct paths
- [ ] Server tested in Cursor/Claude Desktop

---

## 📈 Test Coverage

```
Core Functions:
✓ MDX parsing (frontmatter extraction, content stripping)
✓ Search index building (from files)
✓ Cache management (load/save/validation)
✓ Document retrieval (by path)
✓ Section listing and filtering

MCP Tools (test-tools.ts):
✓ search_expo_docs (3 test cases)
✓ get_expo_doc_content (4 test cases)
✓ list_expo_sections (3 test cases)
✓ get_expo_api_reference (4 test cases)
✓ get_expo_quick_start (3 test cases)

Basic Tests (test-server.ts):
✓ Index loading (cache + fresh build)
✓ Section listing (all 38 sections)
✓ Search functionality (3 queries)
✓ Document retrieval (3 paths)
✓ Cache validation

Edge Cases:
✓ Non-existent paths (null handling)
✓ Empty search queries
✓ Cache expiration and rebuild
✓ Missing/malformed .mdx files
✓ Section filtering

Total Coverage: 17 comprehensive tool tests + 5 basic functionality tests
```

---

## 💡 Tips

1. **Run tests after every code change**
2. **Clear cache when testing indexing changes**
3. **Use `test:tools` for detailed debugging**
4. **Check test output for performance regressions**
5. **Always test in actual Cursor/Claude after passing unit tests**

---

**Happy Testing!** 🎉
