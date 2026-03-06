# Testing Guide

Complete guide for testing your Expo Docs MCP Server.

---

## 🧪 Available Test Suites

### 1. **test-server.ts** - Basic Functionality Test

**Run with:** `bun run test`

**What it tests:**

- ✓ Index loading (from cache or fresh build)
- ✓ Section listing (all indexed sections, currently 40)
- ✓ Search functionality (3 different queries)
- ✓ Document retrieval (4 different paths, including `/versions/latest` alias)
- ✓ Cache validation

**Output:**

```
🧪 Basic Functionality Tests

✓ Index loaded: 997 entries (time depends on cache state)
✓ Sections found: 40
✓ Search queries: 3/3 passed
✓ Document retrieval: 4/4 passed
✓ Cache validation: valid

✅ All basic tests passed!
```

**Use case:** Quick sanity check that everything works.

---

### 2. **test-tools.ts** - Comprehensive Tool Test

**Run with:** `bun run test:tools`

**What it tests:**

- ✓ `search_expo_docs` (5 test cases)
  - Basic search
  - Section-filtered search
  - SDK version search
  - Section filtering before max result limiting
  - Special-character query handling (`[`, `(`, `C++`)
- ✓ `get_expo_doc_content` (6 test cases)
  - Introduction document
  - SDK document with explicit version path
  - `latest` alias resolution
  - Legacy version path resolution
  - Router document
  - Non-existent path (error handling)
- ✓ `mdx_parser` (1 test case)
  - JSX-leading fenced code blocks are preserved
- ✓ `disk_cache_fingerprint` (1 test case)
  - Fingerprint-aware cache validation
- ✓ `list_expo_sections` (3 test cases)
  - List all sections
  - Get documents in specific section (router)
  - Get documents in specific section (guides)
- ✓ `get_expo_api_reference` (7 test cases)
  - Camera API reference
  - Location API reference
  - Notifications API reference
  - `latest` alias resolution
  - Package-style module name lookup
  - Numeric version input normalization
  - Fallback search when exact match not found
- ✓ `get_expo_quick_start` (3 test cases)
  - Default quick start (introduction)
  - Specific topic (create-a-project)
  - List all quick start topics

**Total:** 26 comprehensive tool checks

**Output:**

```
🧪 Comprehensive Tool Tests

✓ Index ready

🔍 search_expo_docs
  ✓ Basic search
  ✓ Section-filtered search
  ✓ SDK search
  ✓ Section filtering happens before max limit
  ✓ Special-character query handling

📄 get_expo_doc_content
  ✓ Get introduction doc
  ✓ Get SDK doc with explicit v55 path
  ✓ Resolve latest alias to v55 doc
  ✓ Legacy v54 path still resolves
  ✓ Get router doc
  ✓ Non-existent path handling

🧩 mdx_parser
  ✓ JSX-leading code blocks are preserved

🗂️ disk_cache_fingerprint
  ✓ Fingerprint-aware cache validation

📚 list_expo_sections
  ✓ List all sections
  ✓ Get router section docs
  ✓ Get guides section docs

📖 get_expo_api_reference
  ✓ Get camera API
  ✓ Get location API
  ✓ Get notifications API
  ✓ latest alias resolves to v55 API
  ✓ Package-style module names resolve
  ✓ Numeric version input resolves
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

| Test               | What It Checks             | Expected Result                              |
| ------------------ | -------------------------- | -------------------------------------------- |
| Index Loading      | Cache/fresh load path      | Index contains docs (currently ~997 entries) |
| Section Listing    | Sections are discoverable  | Non-empty section list (currently ~40)       |
| Search             | Queries return results     | 3 queries, all successful                    |
| Document Retrieval | Specific docs found        | 4 paths, all found                           |
| Cache Validation   | Cache is valid after index | ✓ Valid                                      |

### test-tools.ts

| Tool / Area            | Checks | What It Verifies                                                     |
| ---------------------- | ------ | -------------------------------------------------------------------- |
| search_expo_docs       | 5      | Search relevance, section filtering, ordering-before-limit, regex safety |
| get_expo_doc_content   | 6      | Path lookup, latest alias, legacy version, error handling           |
| mdx_parser             | 1      | JSX-leading code fence preservation                                  |
| disk_cache_fingerprint | 1      | Fingerprint-aware cache validity                                     |
| list_expo_sections     | 3      | All sections, section-specific document listing                      |
| get_expo_api_reference | 7      | API lookup, aliasing, package names, numeric versions, fallback      |
| get_expo_quick_start   | 3      | Default/specific quick start topics, topic listing                   |
| **Total**              | **26** | **26 comprehensive tool checks**                                     |

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

- **First run** (no cache): ~90-120ms
- **Cached run** (disk cache): ~12-20ms
- **Search query**: ~1-10ms
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
# Should show: 997 (for current docs snapshot)
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

**Cause:** Cache might be >24 hours old, version-mismatched, fingerprint-mismatched, or corrupted.
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
- [ ] `bun run test:tools` passes (all comprehensive checks)
- [ ] Cache file exists: `.expo-cache/search-index.json`
- [ ] Cache size is approximately 4-5MB (current snapshot ~4.4MB)
- [ ] 997 .mdx files indexed (for current snapshot)
- [ ] 40 sections found (for current snapshot)
- [ ] MCP config file updated with correct paths
- [ ] Server tested in Cursor/Claude Desktop

---

## 📈 Test Coverage

```
Core Functions:
✓ MDX parsing (frontmatter extraction, content stripping)
✓ MDX code block extraction (including JSX-leading fences)
✓ Search index building (from files)
✓ Cache management (load/save/validation + docs fingerprint checks)
✓ Document retrieval (by path)
✓ Section listing and filtering

MCP Tools (test-tools.ts):
✓ search_expo_docs (5 checks)
✓ get_expo_doc_content (6 checks)
✓ mdx_parser (1 check)
✓ disk_cache_fingerprint (1 check)
✓ list_expo_sections (3 test cases)
✓ get_expo_api_reference (7 checks)
✓ get_expo_quick_start (3 test cases)

Basic Tests (test-server.ts):
✓ Index loading (cache + fresh build)
✓ Section listing (all indexed sections, currently 40)
✓ Search functionality (3 queries)
✓ Document retrieval (4 paths)
✓ Cache validation

Edge Cases:
✓ Non-existent paths (null handling)
✓ Empty search queries
✓ Cache expiration and rebuild
✓ Cache invalidation on docs fingerprint changes
✓ Missing/malformed .mdx files
✓ Section filtering before max result limiting
✓ Special-character search queries (`[`, `(`, `C++`)

Total Coverage: 26 comprehensive tool checks + 5 basic functionality checks
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
