export interface Message {
  text: string;
  created_at: string;
}

export interface AnalyzeResult {
  ok: boolean;
  analysis: string;
  messagesCount: number;
}

export interface ErrorResult {
  ok: false;
  error: string;
}
