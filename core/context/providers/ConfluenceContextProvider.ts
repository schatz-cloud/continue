import {
  ContextItem,
  ContextProviderDescription,
  ContextProviderExtras,
  ContextSubmenuItem,
  LoadSubmenuItemsArgs,
} from "../../index.js";
import { BaseContextProvider } from "../index.js";
import {
  ConfluenceClient,
  ConfluencePage,
} from "../../integrations/ConfluenceClient.js";

class ConfluenceContextProvider extends BaseContextProvider {
  static description: ContextProviderDescription = {
    title: "confluence",
    displayTitle: "Confluence ADRs",
    description:
      "Search and reference Architecture Decision Records from Confluence",
    type: "submenu",
  };

  private getClient(): ConfluenceClient {
    return new ConfluenceClient({
      baseUrl: this.options.baseUrl,
      username: this.options.username,
      apiToken: this.options.apiToken,
      spaceKey: this.options.spaceKey,
      requestOptions: this.options.requestOptions,
    });
  }

  async getContextItems(
    query: string,
    extras: ContextProviderExtras,
  ): Promise<ContextItem[]> {
    const client = this.getClient();

    if (query.startsWith("page:")) {
      const pageId = query.split(":")[1];
      const page = await client.getPage(pageId, extras.fetch);

      if (!page) {
        return [];
      }

      return [
        {
          name: `Confluence: ${page.title}`,
          content: this.formatPageContent(page),
          description: `Last modified: ${new Date(page.lastModified).toLocaleDateString()}`,
        },
      ];
    }

    const searchQuery =
      query || 'ADR OR "Architecture Decision" OR "Decision Record"';
    const pages = await client.searchPages(searchQuery, extras.fetch);

    return pages.map((page) => ({
      name: `Confluence: ${page.title}`,
      content: this.formatPageContent(page),
      description: `By ${page.author} on ${new Date(page.lastModified).toLocaleDateString()}`,
    }));
  }

  async loadSubmenuItems(
    args: LoadSubmenuItemsArgs,
  ): Promise<ContextSubmenuItem[]> {
    const client = this.getClient();

    try {
      const adrPages = await client.searchPages(
        'ADR OR "Architecture Decision"',
        args.fetch,
      );

      const items: ContextSubmenuItem[] = [
        {
          id: "search:ADR",
          title: "All Architecture Decision Records",
          description: `Found ${adrPages.length} ADRs`,
        },
      ];

      adrPages.slice(0, 15).forEach((page) => {
        items.push({
          id: `page:${page.id}`,
          title: page.title,
          description: `Modified: ${new Date(page.lastModified).toLocaleDateString()}`,
        });
      });

      return items;
    } catch (error) {
      console.error("Unable to load Confluence pages:", error);
      return [
        {
          id: "error",
          title: "Error loading Confluence pages",
          description: "Check your configuration and network connection",
        },
      ];
    }
  }

  private formatPageContent(page: ConfluencePage): string {
    const cleanContent = page.content
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();

    return `# ${page.title}

**Source:** [Confluence Page](${page.url})
**Last Modified:** ${new Date(page.lastModified).toLocaleDateString()}
**Author:** ${page.author}

---

${cleanContent}`;
  }
}

export default ConfluenceContextProvider;
