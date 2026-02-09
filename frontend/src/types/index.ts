export interface Market {
  name: string;
  location_code: number;
  currency: string;
  currency_symbol: string;
  language: string;
  flag: string;
}

export interface Markets {
  [key: string]: Market;
}

export interface ProjectConfig {
  landing_page_urls: string[];
  market: string;
  competitor_urls: string[];
  project_folder?: string;
}

export interface Project {
  id: string;
  name: string;
  status: string;
  config: ProjectConfig | null;
  created_at: string;
  updated_at: string;
}

export interface AgentProgress {
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress: number;
  message: string;
  timestamp?: string;
}

export interface PipelineStatus {
  project_id: string;
  status: string;
  current_agent: string | null;
  agents: AgentProgress[];
  started_at: string | null;
  completed_at: string | null;
  outputs: Record<string, any>;
}

export interface Persona {
  name: string;
  age_range: string;
  occupation: string;
  description: string;
  goals: string[];
  frustrations: string[];
  search_behavior: string[];
  purchase_triggers: string[];
  preferred_messaging: string;
  sample_search_queries: string[];
}

export interface KeywordItem {
  keyword: string;
  search_volume: number | null;
  cpc: number | null;
  competition: number | null;
  recommended_match_type: string;
  intent: string;
}

export interface KeywordCluster {
  cluster_name: string;
  theme: string;
  keywords: KeywordItem[];
}

export interface AdGroupStrategy {
  name: string;
  theme: string;
  keywords: string[];
  match_types: Record<string, string>;
  target_persona: string;
  messaging_angle: string;
  priority: string;
  suggested_bid: number;
}

export interface RSAHeadline {
  text: string;
}

export interface RSADescription {
  text: string;
}

export interface AdGroupRSA {
  ad_group_name: string;
  keywords: {
    text: string;
    match_type: string;
    cpc: number;
    monthly_volume: number | null;
    currency: string;
  }[];
  cpc_bid: number;
  headlines: RSAHeadline[];
  descriptions: RSADescription[];
}

export type WizardStep = 'setup' | 'running' | 'results';
