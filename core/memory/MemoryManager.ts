import * as fs from "fs";
import * as path from "path";

export interface MemoryEntry {
  id: string;
  timestamp: number;
  context: string;
  query: string;
  response: string;
  tags: string[];
  relevanceScore?: number;
}

export interface MemorySearchResult {
  entry: MemoryEntry;
  score: number;
}

export class MemoryManager {
  private memoryDir: string;
  private memoryFile: string;
  private maxEntries: number;

  constructor(workspaceDir: string = "", maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
    this.memoryDir = path.join(workspaceDir, ".continue", "memory");
    this.memoryFile = path.join(this.memoryDir, "conversations.json");
    this.ensureMemoryDir();
  }

  private ensureMemoryDir(): void {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }

  private loadMemories(): MemoryEntry[] {
    try {
      if (!fs.existsSync(this.memoryFile)) {
        return [];
      }
      const data = fs.readFileSync(this.memoryFile, "utf-8");
      return JSON.parse(data) as MemoryEntry[];
    } catch (error) {
      console.error("Failed to load memories:", error);
      return [];
    }
  }

  private saveMemories(memories: MemoryEntry[]): void {
    try {
      fs.writeFileSync(this.memoryFile, JSON.stringify(memories, null, 2));
    } catch (error) {
      console.error("Failed to save memories:", error);
    }
  }

  addMemory(
    context: string,
    query: string,
    response: string,
    tags: string[] = [],
  ): void {
    const memories = this.loadMemories();
    const newMemory: MemoryEntry = {
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
  }

  searchMemories(query: string, limit: number = 10): MemorySearchResult[] {
    const memories = this.loadMemories();
    const queryLower = query.toLowerCase();

    const results: MemorySearchResult[] = memories
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

  getRecentMemories(limit: number = 10): MemoryEntry[] {
    const memories = this.loadMemories();
    return memories.slice(0, limit);
  }

  getMemoryById(id: string): MemoryEntry | undefined {
    const memories = this.loadMemories();
    return memories.find((memory) => memory.id === id);
  }

  deleteMemory(id: string): boolean {
    const memories = this.loadMemories();
    const index = memories.findIndex((memory) => memory.id === id);

    if (index !== -1) {
      memories.splice(index, 1);
      this.saveMemories(memories);
      return true;
    }

    return false;
  }

  clearMemories(): void {
    this.saveMemories([]);
  }

  getMemoryStats(): {
    total: number;
    oldestTimestamp: number;
    newestTimestamp: number;
  } {
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
