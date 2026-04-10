export type ProfileStatus = "not_connected" | "connected" | "ai_active";

export interface AssistantConfig {
  name: string;
  type: string;
  provider: string;
  systemPrompt: string;
  knowledgeBase: string;
  webhookUrl?: string;
  voiceResponse: boolean;
  isActive: boolean;
}

export interface Profile {
  id: string;
  name: string;
  status: ProfileStatus;
  assistantConfig?: AssistantConfig;
}
