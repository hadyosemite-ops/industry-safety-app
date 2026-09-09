// ─────────────────────────────────────────────────────────────────────────────
// types — Formes minimales des blocs de contenu de l'API Messages d'Anthropic
// utilisées par l'Assistant HSE. On ne modélise que ce dont le client a
// besoin (pas de SDK Anthropic ajouté comme dépendance, cf. api/claude.ts).
// ─────────────────────────────────────────────────────────────────────────────

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: ContentBlock[];
  /**
   * true pour les messages `user` générés en interne pour transporter des
   * `tool_result` vers Claude (par opposition à un message réellement tapé
   * par l'utilisateur) — permet à l'UI de ne pas les afficher comme des
   * bulles de conversation.
   */
  synthetic?: boolean;
}

export interface AnthropicMessagesResponse {
  id?: string;
  content: ContentBlock[];
  stop_reason?: string | null;
  error?: { message?: string; type?: string };
}
