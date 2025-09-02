import { ContextItem, ToolExtras } from "../..";
import {
  ConfluenceClient,
  ADRTemplate,
} from "../../integrations/ConfluenceClient.js";

export async function createADRImpl(
  parameters: any,
  extras: ToolExtras,
): Promise<ContextItem[]> {
  const {
    title,
    status = "proposed",
    context,
    decision,
    consequences,
    alternatives,
  } = parameters;

  const config = (extras.config as any)?.confluence;
  if (!config) {
    return [
      {
        name: "Error",
        description: "Confluence not configured",
        content:
          "No Confluence configuration found. Please configure Confluence in your Continue settings.",
      },
    ];
  }

  try {
    const client = new ConfluenceClient(config);

    const adr: ADRTemplate = {
      title,
      status,
      context,
      decision,
      consequences,
      alternatives,
    };

    const adrUrl = await client.createADR(adr, extras.fetch);

    if (!adrUrl) {
      return [
        {
          name: "Error",
          description: "Failed to create ADR",
          content:
            "Failed to create Architecture Decision Record. Please check your Confluence configuration and permissions.",
        },
      ];
    }

    return [
      {
        name: `ADR Created: ${title}`,
        description: "Architecture Decision Record created successfully",
        content: `# Architecture Decision Record Created

**Title:** ${title}
**Status:** ${status.toUpperCase()}
**URL:** [View ADR in Confluence](${adrUrl})

## Context
${context}

## Decision
${decision}

## Consequences
${consequences}

${alternatives ? `## Alternatives Considered\n${alternatives}` : ""}

---
*ADR created successfully in Confluence*`,
      },
    ];
  } catch (error) {
    return [
      {
        name: "Error",
        description: "Failed to create ADR",
        content: `Error creating Architecture Decision Record: ${error}`,
      },
    ];
  }
}
