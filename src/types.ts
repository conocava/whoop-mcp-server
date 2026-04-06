export interface Env {
  MCP_OBJECT: DurableObjectNamespace;
  WHOOP_TOKENS: KVNamespace;
  WHOOP_CLIENT_ID: string;
  WHOOP_CLIENT_SECRET: string;
  WHOOP_REDIRECT_URI: string;
}

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export interface PaginatedResponse<T> {
  records: T[];
  next_token?: string;
}
