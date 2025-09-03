import { RequestOptions } from "../index.js";

export interface TicketSystemClientOptions {
  type: "jira" | "github" | "linear";
  baseUrl: string;
  username?: string;
  apiToken: string;
  projectKey?: string;
  requestOptions?: RequestOptions;
}

export interface Ticket {
  id: string;
  key: string;
  title: string;
  description: string;
  status: string;
  assignee?: string;
  priority: string;
  type: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  type: "bug" | "feature" | "task" | "story";
  priority: "low" | "medium" | "high" | "critical";
  assignee?: string;
  labels?: string[];
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  status?: string;
  assignee?: string;
  priority?: string;
  labels?: string[];
}

export abstract class TicketSystemClient {
  protected options: TicketSystemClientOptions & {
    requestOptions: RequestOptions;
  };
  protected authHeader: Record<string, string>;

  constructor(options: TicketSystemClientOptions) {
    this.options = {
      requestOptions: {},
      ...options,
    };
    this.authHeader = this.buildAuthHeader();
  }

  protected abstract buildAuthHeader(): Record<string, string>;

  abstract createTicket(
    request: CreateTicketRequest,
    customFetch: (url: string | URL, init: any) => Promise<any>,
  ): Promise<Ticket | null>;

  abstract updateTicket(
    ticketId: string,
    request: UpdateTicketRequest,
    customFetch: (url: string | URL, init: any) => Promise<any>,
  ): Promise<Ticket | null>;

  abstract getTicket(
    ticketId: string,
    customFetch: (url: string | URL, init: any) => Promise<any>,
  ): Promise<Ticket | null>;

  abstract searchTickets(
    query: string,
    customFetch: (url: string | URL, init: any) => Promise<any>,
  ): Promise<Ticket[]>;
}

export class JiraTicketClient extends TicketSystemClient {
  protected buildAuthHeader(): Record<string, string> {
    return this.options.username
      ? {
          Authorization: `Basic ${btoa(`${this.options.username}:${this.options.apiToken}`)}`,
          "Content-Type": "application/json",
        }
      : {
          Authorization: `Bearer ${this.options.apiToken}`,
          "Content-Type": "application/json",
        };
  }

  async createTicket(
    request: CreateTicketRequest,
    customFetch: (url: string | URL, init: any) => Promise<any>,
  ): Promise<Ticket | null> {
    const createUrl = new URL(`${this.options.baseUrl}/rest/api/3/issue`);

    const payload = {
      fields: {
        project: { key: this.options.projectKey },
        summary: request.title,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: request.description }],
            },
          ],
        },
        issuetype: { name: this.mapTypeToJira(request.type) },
        priority: { name: this.mapPriorityToJira(request.priority) },
        ...(request.assignee && { assignee: { name: request.assignee } }),
        ...(request.labels && {
          labels: request.labels.map((label) => ({ name: label })),
        }),
      },
    };

    try {
      const response = await customFetch(createUrl, {
        method: "POST",
        headers: this.authHeader,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(
          `Failed to create Jira ticket: ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const result = await response.json();
      return this.mapJiraToTicket(result);
    } catch (error) {
      console.error("Error creating Jira ticket:", error);
      return null;
    }
  }

  async updateTicket(
    ticketId: string,
    request: UpdateTicketRequest,
    customFetch: (url: string | URL, init: any) => Promise<any>,
  ): Promise<Ticket | null> {
    const updateUrl = new URL(
      `${this.options.baseUrl}/rest/api/3/issue/${ticketId}`,
    );

    const fields: any = {};
    if (request.title) fields.summary = request.title;
    if (request.description) {
      fields.description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: request.description }],
          },
        ],
      };
    }
    if (request.priority)
      fields.priority = { name: this.mapPriorityToJira(request.priority) };
    if (request.assignee) fields.assignee = { name: request.assignee };

    const payload = { fields };

    try {
      const response = await customFetch(updateUrl, {
        method: "PUT",
        headers: this.authHeader,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(
          `Failed to update Jira ticket: ${response.status} ${response.statusText}`,
        );
        return null;
      }

      return this.getTicket(ticketId, customFetch);
    } catch (error) {
      console.error("Error updating Jira ticket:", error);
      return null;
    }
  }

  async getTicket(
    ticketId: string,
    customFetch: (url: string | URL, init: any) => Promise<any>,
  ): Promise<Ticket | null> {
    const ticketUrl = new URL(
      `${this.options.baseUrl}/rest/api/3/issue/${ticketId}`,
    );

    try {
      const response = await customFetch(ticketUrl, {
        method: "GET",
        headers: this.authHeader,
      });

      if (!response.ok) {
        console.error(
          `Failed to get Jira ticket: ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const result = await response.json();
      return this.mapJiraToTicket(result);
    } catch (error) {
      console.error("Error getting Jira ticket:", error);
      return null;
    }
  }

  async searchTickets(
    query: string,
    customFetch: (url: string | URL, init: any) => Promise<any>,
  ): Promise<Ticket[]> {
    const searchUrl = new URL(`${this.options.baseUrl}/rest/api/3/search`);
    searchUrl.searchParams.set(
      "jql",
      `project = "${this.options.projectKey}" AND text ~ "${query}"`,
    );

    try {
      const response = await customFetch(searchUrl, {
        method: "GET",
        headers: this.authHeader,
      });

      if (!response.ok) {
        console.error(
          `Failed to search Jira tickets: ${response.status} ${response.statusText}`,
        );
        return [];
      }

      const result = await response.json();
      return (
        result.issues?.map((issue: any) => this.mapJiraToTicket(issue)) || []
      );
    } catch (error) {
      console.error("Error searching Jira tickets:", error);
      return [];
    }
  }

  private mapJiraToTicket(jiraIssue: any): Ticket {
    return {
      id: jiraIssue.id,
      key: jiraIssue.key,
      title: jiraIssue.fields.summary,
      description: this.extractTextFromADF(jiraIssue.fields.description),
      status: jiraIssue.fields.status.name,
      assignee: jiraIssue.fields.assignee?.displayName,
      priority: jiraIssue.fields.priority?.name || "Medium",
      type: jiraIssue.fields.issuetype.name,
      url: `${this.options.baseUrl}/browse/${jiraIssue.key}`,
      createdAt: jiraIssue.fields.created,
      updatedAt: jiraIssue.fields.updated,
    };
  }

  private extractTextFromADF(adf: any): string {
    if (!adf || typeof adf === "string") return adf || "";

    if (adf.content) {
      return adf.content
        .map((node: any) => this.extractTextFromADF(node))
        .join(" ");
    }

    if (adf.text) return adf.text;

    return "";
  }

  private mapTypeToJira(type: string): string {
    const typeMap: Record<string, string> = {
      bug: "Bug",
      feature: "Story",
      task: "Task",
      story: "Story",
    };
    return typeMap[type] || "Task";
  }

  private mapPriorityToJira(priority: string): string {
    const priorityMap: Record<string, string> = {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Highest",
    };
    return priorityMap[priority] || "Medium";
  }
}

export function createTicketSystemClient(
  options: TicketSystemClientOptions,
): TicketSystemClient {
  switch (options.type) {
    case "jira":
      return new JiraTicketClient(options);
    default:
      throw new Error(`Unsupported ticket system type: ${options.type}`);
  }
}
