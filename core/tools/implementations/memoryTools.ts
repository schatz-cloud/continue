import { ContextItem, ToolExtras } from "../..";
import { MemoryManager } from "../../memory/MemoryManager.js";

export async function searchMemoryImpl(
  parameters: any,
  extras: ToolExtras,
): Promise<ContextItem[]> {
  const { query, limit = 10 } = parameters;

  try {
    const workspaceDirs = await extras.ide.getWorkspaceDirs();
    const workspaceDir = workspaceDirs.length > 0 ? workspaceDirs[0] : "";
    const memoryManager = new MemoryManager(workspaceDir, 1000);

    const searchResults = memoryManager.searchMemories(query, limit);

    if (searchResults.length === 0) {
      return [
        {
          name: "No Results",
          description: "No matching memories found",
          content: `No memories found matching "${query}". Try different search terms or add some memories first.`,
        },
      ];
    }

    return searchResults.map((result, index) => ({
      name: `Memory ${index + 1}: ${result.entry.query.substring(0, 50)}...`,
      description: `Score: ${result.score} | ${new Date(result.entry.timestamp).toLocaleDateString()}`,
      content: `# Memory Search Result (Score: ${result.score})

**Original Query:** ${result.entry.query}
**Date:** ${new Date(result.entry.timestamp).toLocaleString()}
**Tags:** ${result.entry.tags.join(", ")}

## Context
${result.entry.context}

## Response
${result.entry.response}`,
    }));
  } catch (error) {
    return [
      {
        name: "Error",
        description: "Failed to search memory",
        content: `Error searching memory: ${error}`,
      },
    ];
  }
}

export async function addMemoryImpl(
  parameters: any,
  extras: ToolExtras,
): Promise<ContextItem[]> {
  const { context, query, response, tags = [] } = parameters;

  try {
    const workspaceDirs = await extras.ide.getWorkspaceDirs();
    const workspaceDir = workspaceDirs.length > 0 ? workspaceDirs[0] : "";
    const memoryManager = new MemoryManager(workspaceDir, 1000);

    memoryManager.addMemory(context, query, response, tags);

    const stats = memoryManager.getMemoryStats();

    return [
      {
        name: "Memory Added",
        description: "Successfully saved to conversation memory",
        content: `# Memory Saved Successfully

**Query:** ${query}
**Context:** ${context}
**Tags:** ${tags.join(", ")}

The conversation has been saved to memory and can be retrieved later using the search memory tool.

**Memory Stats:**
- Total memories: ${stats.total}
- Oldest: ${stats.oldestTimestamp ? new Date(stats.oldestTimestamp).toLocaleDateString() : "N/A"}
- Newest: ${new Date(stats.newestTimestamp).toLocaleDateString()}`,
      },
    ];
  } catch (error) {
    return [
      {
        name: "Error",
        description: "Failed to add memory",
        content: `Error adding memory: ${error}`,
      },
    ];
  }
}
