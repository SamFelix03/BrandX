// Simple AI Bounty Suggestion interface
export interface AIBountySuggestion {
  id: number;
  created_at: string;
  business_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_reward: number;
  target_audience: string;
  success_metrics: string[];
}
