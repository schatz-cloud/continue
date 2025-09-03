import { Tool } from "../..";
import { BUILT_IN_GROUP_NAME, BuiltInToolNames } from "../builtIn";

export const createTicketTool: Tool = {
  type: "function",
  displayTitle: "Create Ticket",
  wouldLikeTo: "create a new ticket with title {{{ title }}}",
  isCurrently: "creating a new ticket",
  hasAlready: "created a new ticket",
  group: "Project Management",
  readonly: false,
  isInstant: false,
  function: {
    name: BuiltInToolNames.CreateTicket,
    description:
      "Create a new ticket in the configured ticket system (Jira, GitHub Issues, etc.)",
    parameters: {
      type: "object",
      required: ["title", "description", "type"],
      properties: {
        title: {
          type: "string",
          description: "The title/summary of the ticket",
        },
        description: {
          type: "string",
          description: "Detailed description of the ticket",
        },
        type: {
          type: "string",
          enum: ["bug", "feature", "task", "story"],
          description: "The type of ticket to create",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Priority level of the ticket",
          default: "medium",
        },
        assignee: {
          type: "string",
          description:
            "Username or email of the person to assign the ticket to",
        },
        labels: {
          type: "array",
          items: { type: "string" },
          description: "Labels or tags to add to the ticket",
        },
      },
    },
  },
  defaultToolPolicy: "allowedWithPermission",
  systemMessageDescription: {
    prefix: `To create a new ticket, use the ${BuiltInToolNames.CreateTicket} tool with the title, description, and type. For example:`,
    exampleArgs: [
      ["title", "Fix login bug"],
      [
        "description",
        "Users cannot log in with special characters in password",
      ],
      ["type", "bug"],
      ["priority", "high"],
    ],
  },
};

export const updateTicketTool: Tool = {
  type: "function",
  displayTitle: "Update Ticket",
  wouldLikeTo: "update ticket {{{ ticketId }}}",
  isCurrently: "updating ticket {{{ ticketId }}}",
  hasAlready: "updated ticket {{{ ticketId }}}",
  group: "Project Management",
  readonly: false,
  isInstant: false,
  function: {
    name: BuiltInToolNames.UpdateTicket,
    description: "Update an existing ticket in the configured ticket system",
    parameters: {
      type: "object",
      required: ["ticketId"],
      properties: {
        ticketId: {
          type: "string",
          description: "The ID or key of the ticket to update",
        },
        title: {
          type: "string",
          description: "New title/summary for the ticket",
        },
        description: {
          type: "string",
          description: "New description for the ticket",
        },
        status: {
          type: "string",
          description:
            "New status for the ticket (e.g., 'In Progress', 'Done')",
        },
        assignee: {
          type: "string",
          description: "New assignee for the ticket",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "New priority level",
        },
        labels: {
          type: "array",
          items: { type: "string" },
          description: "New labels for the ticket",
        },
      },
    },
  },
  defaultToolPolicy: "allowedWithPermission",
  systemMessageDescription: {
    prefix: `To update an existing ticket, use the ${BuiltInToolNames.UpdateTicket} tool with the ticket ID and fields to update. For example:`,
    exampleArgs: [
      ["ticketId", "PROJ-123"],
      ["status", "In Progress"],
      ["assignee", "john.doe"],
    ],
  },
};
