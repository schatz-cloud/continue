import { Tool } from "../..";
import { BUILT_IN_GROUP_NAME, BuiltInToolNames } from "../builtIn";

export const createADRTool: Tool = {
  type: "function",
  displayTitle: "Create Architecture Decision Record",
  wouldLikeTo: "create an ADR for {{{ title }}}",
  isCurrently: "creating an Architecture Decision Record",
  hasAlready: "created an Architecture Decision Record",
  group: "Architecture",
  readonly: false,
  isInstant: false,
  function: {
    name: BuiltInToolNames.CreateADR,
    description:
      "Create a new Architecture Decision Record (ADR) in Confluence",
    parameters: {
      type: "object",
      required: ["title", "context", "decision", "consequences"],
      properties: {
        title: {
          type: "string",
          description: "The title of the architecture decision",
        },
        status: {
          type: "string",
          enum: ["proposed", "accepted", "deprecated", "superseded"],
          description: "The status of the decision",
          default: "proposed",
        },
        context: {
          type: "string",
          description: "The context and background that led to this decision",
        },
        decision: {
          type: "string",
          description: "The architectural decision that was made",
        },
        consequences: {
          type: "string",
          description: "The consequences and implications of this decision",
        },
        alternatives: {
          type: "string",
          description: "Alternative solutions that were considered",
        },
      },
    },
  },
  defaultToolPolicy: "allowedWithPermission",
  systemMessageDescription: {
    prefix: `To create an Architecture Decision Record, use the ${BuiltInToolNames.CreateADR} tool with the decision details. For example:`,
    exampleArgs: [
      ["title", "Use React for Frontend Framework"],
      [
        "context",
        "We need to choose a frontend framework for our new web application",
      ],
      ["decision", "We will use React as our primary frontend framework"],
      [
        "consequences",
        "Team needs React training, but we get better component reusability",
      ],
    ],
  },
};
