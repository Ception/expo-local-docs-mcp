// src/tools/handlers/types.ts

export type ToolResponse = {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
};
