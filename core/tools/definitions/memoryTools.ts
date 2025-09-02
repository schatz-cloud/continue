import { Tool } from "../..";
import { BUILT_IN_GROUP_NAME, BuiltInToolNames } from "../builtIn";

export const searchMemoryTool: Tool = {
  type: "function",
  displayTitle: "Search Memory",
  wouldLikeTo: "search conversation memory for {{{ query }}}",
  isCurrently: "searching conversation memory",
  hasAlready: "searched conversation memory",
  group: "Memory",
  readonly: true,
  isInstant: true,
  function: {
    name: BuiltInToolNames.SearchMemory,
    description:
      "Search through previous conversations and decisions stored in memory",
    parameters: {
      type: "object",
      required: ["query"],
      properties: {
        query: {
          type: "string",
          description:
            "Search query to find relevant conversations or decisions",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return",
          default: 10,
        },
      },
    },
  },
  defaultToolPolicy: "allowedWithoutPermission",
  systemMessageDescription: {
    prefix: `To search conversation memory, use the ${BuiltInToolNames.SearchMemory} tool with a search query. For example:`,
    exampleArgs: [
      ["query", "database migration"],
      ["limit", 5],
    ],
  },
};

export const addMemoryTool: Tool = {
  type: "function",
  displayTitle: "Add to Memory",
  wouldLikeTo: "save {{{ context }}} to conversation memory",
  isCurrently: "saving to conversation memory",
  hasAlready: "saved to conversation memory",
  group: "Memory",
  readonly: false,
  isInstant: true,
  function: {
    name: BuiltInToolNames.AddMemory,
    description:
      "Save important information, decisions, or conversations to memory for future reference",
    parameters: {
      type: "object",
      required: ["context", "query", "response"],
      properties: {
        context: {
          type: "string",
          description: "The context or situation this memory relates to",
        },
        query: {
          type: "string",
          description: "The original question or topic",
        },
        response: {
          type: "string",
          description: "The response or decision that was made",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags to help categorize and find this memory later",
        },
      },
    },
  },
  defaultToolPolicy: "allowedWithoutPermission",
  systemMessageDescription: {
    prefix: `To save information to memory, use the ${BuiltInToolNames.AddMemory} tool with the context and details. For example:`,
    exampleArgs: [
      ["context", "Database architecture discussion"],
      ["query", "Should we use PostgreSQL or MongoDB?"],
      ["response", "Decided on PostgreSQL for ACID compliance"],
      ["tags", '["database", "architecture", "decision"]'],
    ],
  },
};
