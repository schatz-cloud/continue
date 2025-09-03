import {
  ContextItem,
  ContextProviderDescription,
  ContextProviderExtras,
  ContextSubmenuItem,
  LoadSubmenuItemsArgs,
} from "../../index.js";
import { BaseContextProvider } from "../index.js";
import { MemoryManager } from "../../memory/MemoryManager.js";

class MemoryContextProvider extends BaseContextProvider {
  static description: ContextProviderDescription = {
    title: "memory",
    displayTitle: "Conversation Memory",
    description: "Access previous conversations and decisions",
    type: "submenu",
  };

  constructor(options: any) {
    super(options);
  }

  private async getMemoryManager(
    extras: ContextProviderExtras,
  ): Promise<MemoryManager> {
    const workspaceDirs = await extras.ide.getWorkspaceDirs();
    const workspaceDir = workspaceDirs.length > 0 ? workspaceDirs[0] : "";
    return new MemoryManager(workspaceDir, this.options.maxEntries || 1000);
  }

  async getContextItems(
    query: string,
    extras: ContextProviderExtras,
  ): Promise<ContextItem[]> {
    const memoryManager = await this.getMemoryManager(extras);

    if (query.startsWith("recent:")) {
      const limit = parseInt(query.split(":")[1]) || 10;
      const recentMemories = memoryManager.getRecentMemories(limit);

      return recentMemories.map((memory) => ({
        name: `Memory: ${memory.query.substring(0, 50)}...`,
        content: `# Memory Entry (${new Date(memory.timestamp).toLocaleString()})

## Original Query
${memory.query}

## Context
${memory.context}

## Response
${memory.response}

## Tags
${memory.tags.join(", ")}`,
        description: `From ${new Date(memory.timestamp).toLocaleDateString()}`,
      }));
    }

    if (query.startsWith("id:")) {
      const memoryId = query.split(":")[1];
      const memory = memoryManager.getMemoryById(memoryId);

      if (!memory) {
        return [];
      }

      return [
        {
          name: `Memory: ${memory.query.substring(0, 50)}...`,
          content: `# Memory Entry (${new Date(memory.timestamp).toLocaleString()})

## Original Query
${memory.query}

## Context
${memory.context}

## Response
${memory.response}

## Tags
${memory.tags.join(", ")}`,
          description: `From ${new Date(memory.timestamp).toLocaleDateString()}`,
        },
      ];
    }

    const searchResults = memoryManager.searchMemories(query, 10);

    return searchResults.map((result) => ({
      name: `Memory: ${result.entry.query.substring(0, 50)}... (Score: ${result.score})`,
      content: `# Memory Entry (${new Date(result.entry.timestamp).toLocaleString()})

## Original Query
${result.entry.query}

## Context
${result.entry.context}

## Response
${result.entry.response}

## Tags
${result.entry.tags.join(", ")}

## Relevance Score
${result.score}/10`,
      description: `From ${new Date(result.entry.timestamp).toLocaleDateString()} - Score: ${result.score}`,
    }));
  }

  async loadSubmenuItems(
    args: LoadSubmenuItemsArgs,
  ): Promise<ContextSubmenuItem[]> {
    const workspaceDirs = await args.ide.getWorkspaceDirs();
    const workspaceDir = workspaceDirs.length > 0 ? workspaceDirs[0] : "";
    const memoryManager = new MemoryManager(
      workspaceDir,
      this.options.maxEntries || 1000,
    );
    const stats = memoryManager.getMemoryStats();
    const recentMemories = memoryManager.getRecentMemories(20);

    const items: ContextSubmenuItem[] = [
      {
        id: "recent:10",
        title: "Recent 10 conversations",
        description: `Total memories: ${stats.total}`,
      },
      {
        id: "recent:20",
        title: "Recent 20 conversations",
        description: "More conversation history",
      },
    ];

    recentMemories.forEach((memory, index) => {
      if (index < 10) {
        items.push({
          id: `id:${memory.id}`,
          title: `${memory.query.substring(0, 40)}...`,
          description: `${new Date(memory.timestamp).toLocaleDateString()} - ${memory.tags.join(", ")}`,
        });
      }
    });

    return items;
  }
}

export default MemoryContextProvider;
