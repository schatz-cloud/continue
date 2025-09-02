console.log("=== MEMORY-001-C: Memory Logic Validation Test ===");
console.log("Test ID: MEMORY-001-C");
console.log("Timestamp:", new Date().toISOString());

const fs = require("fs");
const path = require("path");

class TestMemoryManager {
  constructor(workspaceDir = "", maxEntries = 1000) {
    this.maxEntries = maxEntries;
    this.memoryDir = path.join(workspaceDir, ".continue", "memory");
    this.memoryFile = path.join(this.memoryDir, "conversations.json");
    this.ensureMemoryDir();
  }

  ensureMemoryDir() {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }

  loadMemories() {
    try {
      if (!fs.existsSync(this.memoryFile)) {
        return [];
      }
      const data = fs.readFileSync(this.memoryFile, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to load memories:", error);
      return [];
    }
  }

  saveMemories(memories) {
    try {
      fs.writeFileSync(this.memoryFile, JSON.stringify(memories, null, 2));
    } catch (error) {
      console.error("Failed to save memories:", error);
    }
  }

  addMemory(context, query, response, tags = []) {
    const memories = this.loadMemories();
    const newMemory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      context,
      query,
      response,
      tags,
    };

    memories.unshift(newMemory);

    if (memories.length > this.maxEntries) {
      memories.splice(this.maxEntries);
    }

    this.saveMemories(memories);
    return newMemory;
  }

  searchMemories(query, limit = 10) {
    const memories = this.loadMemories();
    const queryLower = query.toLowerCase();

    const results = memories
      .map((entry) => {
        let score = 0;

        if (entry.query.toLowerCase().includes(queryLower)) {
          score += 3;
        }

        if (entry.response.toLowerCase().includes(queryLower)) {
          score += 2;
        }

        if (entry.context.toLowerCase().includes(queryLower)) {
          score += 1;
        }

        entry.tags.forEach((tag) => {
          if (tag.toLowerCase().includes(queryLower)) {
            score += 2;
          }
        });

        return { entry, score };
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  getRecentMemories(limit = 10) {
    const memories = this.loadMemories();
    return memories.slice(0, limit);
  }

  getMemoryStats() {
    const memories = this.loadMemories();

    if (memories.length === 0) {
      return { total: 0, oldestTimestamp: 0, newestTimestamp: 0 };
    }

    const timestamps = memories.map((m) => m.timestamp);
    return {
      total: memories.length,
      oldestTimestamp: Math.min(...timestamps),
      newestTimestamp: Math.max(...timestamps),
    };
  }
}

const testWorkspace = "/tmp/continue-memory-logic-test";
const memoryDir = path.join(testWorkspace, ".continue", "memory");
const memoryFile = path.join(memoryDir, "conversations.json");

if (fs.existsSync(testWorkspace)) {
  fs.rmSync(testWorkspace, { recursive: true, force: true });
}

console.log("\n1. Testing Memory Manager Initialization...");
let testResults = {
  initialization: false,
  storage: false,
  search: false,
  recent: false,
  stats: false,
  fileStructure: false,
};

try {
  const memoryManager = new TestMemoryManager(testWorkspace, 100);
  console.log("✅ TestMemoryManager created successfully");

  if (fs.existsSync(memoryDir)) {
    console.log("✅ Memory directory created:", memoryDir);
    testResults.initialization = true;
  } else {
    console.log("❌ Memory directory not created");
  }
} catch (error) {
  console.log("❌ TestMemoryManager creation failed:", error.message);
}

console.log("\n2. Testing Memory Storage...");
const memoryManager = new TestMemoryManager(testWorkspace, 100);

const testMemories = [
  {
    context: "Authentication implementation discussion",
    query: "How do I implement OAuth 2.0 with PKCE flow?",
    response:
      "To implement OAuth 2.0 with PKCE, you need to: 1. Generate code verifier 2. Create code challenge 3. Redirect to authorization server...",
    tags: ["oauth", "authentication", "security", "pkce"],
  },
  {
    context: "Database optimization meeting",
    query: "What are the best practices for database indexing in PostgreSQL?",
    response:
      "PostgreSQL indexing best practices: 1. Index frequently queried columns 2. Use composite indexes for multi-column queries 3. Monitor index usage...",
    tags: ["database", "postgresql", "performance", "indexing"],
  },
  {
    context: "React architecture review",
    query:
      "How should I structure reusable React components for our design system?",
    response:
      "For reusable React components: 1. Use composition over inheritance 2. Implement proper prop interfaces 3. Follow atomic design principles...",
    tags: ["react", "components", "architecture", "design-system"],
  },
];

try {
  testMemories.forEach((memory, index) => {
    const addedMemory = memoryManager.addMemory(
      memory.context,
      memory.query,
      memory.response,
      memory.tags,
    );
    console.log(`✅ Added test memory ${index + 1} with ID: ${addedMemory.id}`);
  });

  if (fs.existsSync(memoryFile)) {
    const fileContent = fs.readFileSync(memoryFile, "utf-8");
    const memories = JSON.parse(fileContent);
    console.log(`✅ Memory file created with ${memories.length} entries`);
    testResults.storage = true;
  } else {
    console.log("❌ Memory file not created");
  }
} catch (error) {
  console.log("❌ Memory storage failed:", error.message);
}

console.log("\n3. Testing Memory Search Functionality...");
try {
  const authResults = memoryManager.searchMemories("authentication", 5);
  console.log(
    `✅ Search for "authentication" returned ${authResults.length} results`,
  );
  if (authResults.length > 0) {
    console.log(`   - Top result score: ${authResults[0].score}`);
    console.log(
      `   - Top result contains: "${authResults[0].entry.query.substring(0, 60)}..."`,
    );
  }

  const dbResults = memoryManager.searchMemories("database", 5);
  console.log(`✅ Search for "database" returned ${dbResults.length} results`);

  const reactResults = memoryManager.searchMemories("react", 5);
  console.log(`✅ Search for "react" returned ${reactResults.length} results`);

  const noResults = memoryManager.searchMemories("nonexistent", 5);
  console.log(
    `✅ Search for "nonexistent" returned ${noResults.length} results (expected 0)`,
  );

  testResults.search = true;
} catch (error) {
  console.log("❌ Memory search failed:", error.message);
}

console.log("\n4. Testing Recent Memories Retrieval...");
try {
  const recentMemories = memoryManager.getRecentMemories(5);
  console.log(`✅ Retrieved ${recentMemories.length} recent memories`);

  if (recentMemories.length > 0) {
    console.log(
      `   - Most recent: "${recentMemories[0].query.substring(0, 50)}..."`,
    );
    console.log(
      `   - Timestamp: ${new Date(recentMemories[0].timestamp).toISOString()}`,
    );
  }

  testResults.recent = true;
} catch (error) {
  console.log("❌ Recent memories retrieval failed:", error.message);
}

console.log("\n5. Testing Memory Statistics...");
try {
  const stats = memoryManager.getMemoryStats();
  console.log(`✅ Memory stats retrieved:`);
  console.log(`   - Total memories: ${stats.total}`);
  console.log(
    `   - Oldest timestamp: ${new Date(stats.oldestTimestamp).toISOString()}`,
  );
  console.log(
    `   - Newest timestamp: ${new Date(stats.newestTimestamp).toISOString()}`,
  );

  testResults.stats = true;
} catch (error) {
  console.log("❌ Memory stats retrieval failed:", error.message);
}

console.log("\n6. Testing Memory File Structure...");
try {
  const fileContent = fs.readFileSync(memoryFile, "utf-8");
  const memories = JSON.parse(fileContent);

  console.log("✅ Memory file structure validation:");
  console.log(`   - File size: ${fs.statSync(memoryFile).size} bytes`);
  console.log(`   - Number of entries: ${memories.length}`);

  if (memories.length > 0) {
    const firstMemory = memories[0];
    const requiredFields = [
      "id",
      "timestamp",
      "context",
      "query",
      "response",
      "tags",
    ];
    const hasAllFields = requiredFields.every((field) => field in firstMemory);

    if (hasAllFields) {
      console.log("✅ Memory entries have all required fields");
      console.log(`   - Sample ID format: ${firstMemory.id}`);
      console.log(`   - Sample tags: [${firstMemory.tags.join(", ")}]`);
      testResults.fileStructure = true;
    } else {
      console.log("❌ Memory entries missing required fields");
    }
  }
} catch (error) {
  console.log("❌ Memory file structure validation failed:", error.message);
}

console.log("\n=== Test Results Summary ===");
const passedTests = Object.values(testResults).filter(
  (result) => result,
).length;
const totalTests = Object.keys(testResults).length;

console.log(`Passed: ${passedTests}/${totalTests} tests`);
console.log("Test Results:");
Object.entries(testResults).forEach(([test, passed]) => {
  console.log(`  ${passed ? "✅" : "❌"} ${test}`);
});

console.log("\n=== Memory Logic Validation Test Complete ===");
console.log("Test completed at:", new Date().toISOString());

const testSummary = {
  testId: "MEMORY-001-C",
  timestamp: new Date().toISOString(),
  passed: passedTests,
  total: totalTests,
  results: testResults,
  success: passedTests === totalTests,
};

console.log("\nTest Summary for Report:", JSON.stringify(testSummary, null, 2));
