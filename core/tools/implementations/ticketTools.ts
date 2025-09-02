import { ContextItem, ToolExtras } from "../..";
import {
  createTicketSystemClient,
  CreateTicketRequest,
  UpdateTicketRequest,
} from "../../integrations/TicketSystemClient.js";

export async function createTicketImpl(
  parameters: any,
  extras: ToolExtras,
): Promise<ContextItem[]> {
  const {
    title,
    description,
    type,
    priority = "medium",
    assignee,
    labels,
  } = parameters;

  const config = (extras.config as any)?.ticketSystem;
  if (!config) {
    return [
      {
        name: "Error",
        description: "Ticket system not configured",
        content:
          "No ticket system configuration found. Please configure a ticket system in your Continue settings.",
      },
    ];
  }

  try {
    const client = createTicketSystemClient(config);

    const request: CreateTicketRequest = {
      title,
      description,
      type,
      priority,
      assignee,
      labels,
    };

    const ticket = await client.createTicket(request, extras.fetch);

    if (!ticket) {
      return [
        {
          name: "Error",
          description: "Failed to create ticket",
          content:
            "Failed to create ticket. Please check your configuration and try again.",
        },
      ];
    }

    return [
      {
        name: `Ticket Created: ${ticket.key}`,
        description: `${ticket.type} ticket created successfully`,
        content: `# Ticket Created Successfully

**Ticket:** [${ticket.key}](${ticket.url})
**Title:** ${ticket.title}
**Type:** ${ticket.type}
**Priority:** ${ticket.priority}
**Status:** ${ticket.status}
${ticket.assignee ? `**Assignee:** ${ticket.assignee}` : ""}

**Description:**
${ticket.description}

**Created:** ${new Date(ticket.createdAt).toLocaleString()}`,
      },
    ];
  } catch (error) {
    return [
      {
        name: "Error",
        description: "Failed to create ticket",
        content: `Error creating ticket: ${error}`,
      },
    ];
  }
}

export async function updateTicketImpl(
  parameters: any,
  extras: ToolExtras,
): Promise<ContextItem[]> {
  const { ticketId, title, description, status, assignee, priority, labels } =
    parameters;

  const config = (extras.config as any)?.ticketSystem;
  if (!config) {
    return [
      {
        name: "Error",
        description: "Ticket system not configured",
        content:
          "No ticket system configuration found. Please configure a ticket system in your Continue settings.",
      },
    ];
  }

  try {
    const client = createTicketSystemClient(config);

    const request: UpdateTicketRequest = {
      title,
      description,
      status,
      assignee,
      priority,
      labels,
    };

    const ticket = await client.updateTicket(ticketId, request, extras.fetch);

    if (!ticket) {
      return [
        {
          name: "Error",
          description: "Failed to update ticket",
          content: `Failed to update ticket ${ticketId}. Please check the ticket ID and try again.`,
        },
      ];
    }

    return [
      {
        name: `Ticket Updated: ${ticket.key}`,
        description: `Ticket updated successfully`,
        content: `# Ticket Updated Successfully

**Ticket:** [${ticket.key}](${ticket.url})
**Title:** ${ticket.title}
**Type:** ${ticket.type}
**Priority:** ${ticket.priority}
**Status:** ${ticket.status}
${ticket.assignee ? `**Assignee:** ${ticket.assignee}` : ""}

**Description:**
${ticket.description}

**Last Updated:** ${new Date(ticket.updatedAt).toLocaleString()}`,
      },
    ];
  } catch (error) {
    return [
      {
        name: "Error",
        description: "Failed to update ticket",
        content: `Error updating ticket: ${error}`,
      },
    ];
  }
}
