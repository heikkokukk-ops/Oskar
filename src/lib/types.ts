// Shapes shared by the API routes and the client.

export type AnswerStyle = "short" | "detailed";
export type Audience = "all" | "manager" | "office" | "it";

export const MAX_MESSAGE_LENGTH = 2000;

export const AUDIENCE_LABELS: Record<Audience, string> = {
  all: "Kõik",
  manager: "Juht",
  office: "Kontoritöötaja",
  it: "IT",
};

export interface ChatSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ChatSettings {
  answerStyle: AnswerStyle;
  personaId: string | null;
  temperature: number;
  topP: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourceTopic: string | null;
  knowledgeEntryId: number | null;
  rating: number | null;
  createdAt: string;
  // Clickable follow-up questions (related questions or fallback suggestions).
  suggestions?: string[];
}

export interface ChatDetail extends ChatSummary, ChatSettings {
  messages: ChatMessage[];
}

export interface Persona {
  id: string;
  name: string;
  content: string;
  audience: Audience;
}
