import { RequestOptions } from "../index.js";

interface ConfluenceClientOptions {
  baseUrl: string;
  username: string;
  apiToken: string;
  spaceKey: string;
  requestOptions?: RequestOptions;
}

export interface ConfluencePage {
  id: string;
  title: string;
  content: string;
  url: string;
  lastModified: string;
  author: string;
}

export interface ADRTemplate {
  title: string;
  status: "proposed" | "accepted" | "deprecated" | "superseded";
  context: string;
  decision: string;
  consequences: string;
  alternatives?: string;
}

export class ConfluenceClient {
  private readonly options: Required<ConfluenceClientOptions>;
  private authHeader: Record<string, string>;

  constructor(options: ConfluenceClientOptions) {
    this.options = {
      requestOptions: {},
      ...options,
    };

    this.authHeader = {
      Authorization: `Basic ${btoa(`${this.options.username}:${this.options.apiToken}`)}`,
      "Content-Type": "application/json",
    };
  }

  async searchPages(
    query: string,
    customFetch: (url: string | URL, init: any) => Promise<any>,
  ): Promise<ConfluencePage[]> {
    const searchUrl = new URL(
      `${this.options.baseUrl}/rest/api/content/search`,
    );
    searchUrl.searchParams.set(
      "cql",
      `space = "${this.options.spaceKey}" AND text ~ "${query}"`,
    );
    searchUrl.searchParams.set(
      "expand",
      "body.storage,history.lastUpdated,history.createdBy",
    );

    try {
      const response = await customFetch(searchUrl, {
        method: "GET",
        headers: this.authHeader,
      });

      if (!response.ok) {
        console.error(
          `Confluence search failed: ${response.status} ${response.statusText}`,
        );
        return [];
      }

      const data = await response.json();

      return (
        data.results?.map((page: any) => ({
          id: page.id,
          title: page.title,
          content: page.body?.storage?.value || "",
          url: `${this.options.baseUrl}${page._links.webui}`,
          lastModified: page.history?.lastUpdated?.when || "",
          author: page.history?.createdBy?.displayName || "Unknown",
        })) || []
      );
    } catch (error) {
      console.error("Error searching Confluence pages:", error);
      return [];
    }
  }

  async getPage(
    pageId: string,
    customFetch: (url: string | URL, init: any) => Promise<any>,
  ): Promise<ConfluencePage | null> {
    const pageUrl = new URL(
      `${this.options.baseUrl}/rest/api/content/${pageId}`,
    );
    pageUrl.searchParams.set(
      "expand",
      "body.storage,history.lastUpdated,history.createdBy",
    );

    try {
      const response = await customFetch(pageUrl, {
        method: "GET",
        headers: this.authHeader,
      });

      if (!response.ok) {
        console.error(
          `Failed to get Confluence page: ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const page = await response.json();

      return {
        id: page.id,
        title: page.title,
        content: page.body?.storage?.value || "",
        url: `${this.options.baseUrl}${page._links.webui}`,
        lastModified: page.history?.lastUpdated?.when || "",
        author: page.history?.createdBy?.displayName || "Unknown",
      };
    } catch (error) {
      console.error("Error getting Confluence page:", error);
      return null;
    }
  }

  async createADR(
    adr: ADRTemplate,
    customFetch: (url: string | URL, init: any) => Promise<any>,
  ): Promise<string | null> {
    const adrContent = this.formatADRContent(adr);

    const createUrl = new URL(`${this.options.baseUrl}/rest/api/content`);

    const payload = {
      type: "page",
      title: `ADR: ${adr.title}`,
      space: {
        key: this.options.spaceKey,
      },
      body: {
        storage: {
          value: adrContent,
          representation: "storage",
        },
      },
    };

    try {
      const response = await customFetch(createUrl, {
        method: "POST",
        headers: this.authHeader,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to create ADR: ${response.status} ${response.statusText}`,
          errorText,
        );
        return null;
      }

      const result = await response.json();
      return `${this.options.baseUrl}${result._links.webui}`;
    } catch (error) {
      console.error("Error creating ADR:", error);
      return null;
    }
  }

  private formatADRContent(adr: ADRTemplate): string {
    const date = new Date().toISOString().split("T")[0];

    return `
<h1>Architecture Decision Record: ${adr.title}</h1>

<table>
<tr><td><strong>Status:</strong></td><td><span style="background-color: ${this.getStatusColor(adr.status)}; padding: 2px 8px; border-radius: 3px;">${adr.status.toUpperCase()}</span></td></tr>
<tr><td><strong>Date:</strong></td><td>${date}</td></tr>
</table>

<h2>Context</h2>
<p>${adr.context.replace(/\n/g, "</p><p>")}</p>

<h2>Decision</h2>
<p>${adr.decision.replace(/\n/g, "</p><p>")}</p>

<h2>Consequences</h2>
<p>${adr.consequences.replace(/\n/g, "</p><p>")}</p>

${adr.alternatives ? `<h2>Alternatives Considered</h2><p>${adr.alternatives.replace(/\n/g, "</p><p>")}</p>` : ""}

<hr/>
<p><em>This ADR was generated automatically by Continue Extension</em></p>
    `.trim();
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case "proposed":
        return "#FFF3CD";
      case "accepted":
        return "#D4EDDA";
      case "deprecated":
        return "#F8D7DA";
      case "superseded":
        return "#E2E3E5";
      default:
        return "#E2E3E5";
    }
  }
}
