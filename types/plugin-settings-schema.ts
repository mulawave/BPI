export type PluginSettingsSchema = {
  $schema?: string;
  title?: string;
  type: "object";
  additionalProperties?: boolean;
  required?: string[];
  properties: Record<string, PluginSettingsProperty>;
};

export type PluginSettingsProperty = {
  type?: "string" | "number" | "integer" | "boolean" | "array" | "object";
  title?: string;
  description?: string;
  enum?: Array<string | number | boolean>;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  items?: {
    type?: "string" | "number" | "integer" | "boolean";
  };
  properties?: Record<string, PluginSettingsProperty>;
  required?: string[];
  ["x-secret"]?: boolean;
  ["x-readOnly"]?: boolean;
};
