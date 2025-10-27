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
✓ Search index loaded: 958 entries in 3ms
✓ Found 38 sections
✓ Search queries working
✅ All tests passed!
```

**Use case:** Quick sanity check that everything works.

---

### 2. **test-tools.ts** - Comprehensive Tool Test

**Run with:** `bun run test:tools`

**What it tests:**

- ✓ **Tool 1:** search_expo_docs (3 test cases)
- ✓ **Tool 2:** get_expo_doc_content (4 test cases)
- ✓ **Tool 3:** list_expo_sections (3 test cases)
- ✓ **Tool 4:** get_expo_api_reference (4 test cases)
- ✓ **Tool 5:** get_expo_quick_start (3 test cases)

**Total:** 18 comprehensive test cases

**Output:**

```
🔍 Test 1: search_expo_docs - PASSED
📄 Test 2: get_expo_doc_content - PASSED
📚 Test 3: list_expo_sections - PASSED
📖 Test 4: get_expo_api_reference - PASSED
🚀 Test 5: get_expo_quick_start - PASSED
✅ ALL TOOLS PASSED
```

**Use case:** Detailed verification of all MCP tools before deployment.

---

### 3. **test:all** - Run Everything

**Run with:** `bun run test:all`

Runs both test suites sequentially. Perfect for pre-deployment validation.

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

| Tool                   | Test Cases | What It Verifies                           |
| ---------------------- | ---------- | ------------------------------------------ |
| search_expo_docs       | 3          | Search, filtering, SDK search              |
| get_expo_doc_content   | 4          | Doc retrieval, frontmatter, error handling |
| list_expo_sections     | 3          | Section listing, filtering                 |
| get_expo_api_reference | 4          | API lookup, fallback search                |
| get_expo_quick_start   | 3          | Quick start topics                         |

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
- [ ] `bun run test` passes
- [ ] `bun run test:tools` passes (18/18 tests)
- [ ] Cache file exists: `.expo-cache/search-index.json`
- [ ] Cache size is ~2.7MB
- [ ] 958 .mdx files indexed
- [ ] 38 sections found
- [ ] MCP config file updated with correct paths
- [ ] Tested in Cursor/Claude Desktop

---

## 📈 Test Coverage

```
Core Functions:
✓ MDX parsing (frontmatter extraction)
✓ Search index building
✓ Cache management
✓ Document retrieval
✓ Section listing

MCP Tools:
✓ search_expo_docs (3 scenarios)
✓ get_expo_doc_content (4 scenarios)
✓ list_expo_sections (3 scenarios)
✓ get_expo_api_reference (4 scenarios)
✓ get_expo_quick_start (3 scenarios)

Edge Cases:
✓ Non-existent paths
✓ Malformed queries
✓ Cache expiration
✓ Missing files
✓ Empty searches

Total Coverage: 18 comprehensive test cases
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
