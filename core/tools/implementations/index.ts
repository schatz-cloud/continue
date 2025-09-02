import { ContextItem, ToolExtras } from "../..";

export type ToolImpl = (
  parameters: any,
  extras: ToolExtras,
) => Promise<ContextItem[]>;

export { createTicketImpl, updateTicketImpl } from "./ticketTools.js";
export { createADRImpl } from "./confluenceTools.js";
export { searchMemoryImpl, addMemoryImpl } from "./memoryTools.js";
