export interface User {
  _id?: string;
  username: string;
  email: string;
  password: string;
  createdAt?: Date;
}

export interface ControlDefinition {
  type: 'buttons' | 'select' | 'form' | 'none';
  options?: string[];
  fields?: FormField[];
  status: 'pending' | 'answered';
  answered_value?: string;
  needs_count_first?: boolean;
  count_prompt?: string;
  total_cards?: number;
  partial_values?: Record<string, string>[];
}

export interface FormField {
  label: string;
  key: string;
  required: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  controls?: ControlDefinition;
}

export interface TimelineEvent {
  status: string;
  timestamp: Date;
  actor: string;
}

export interface EscalationDetails {
  reason: string;
  priority: string;
  urgency: string;
  impact: string;
  support_group: string;
  description?: string;
}

export interface ResolutionDetails {
  summary: string;
}

export interface FeedbackData {
  rating: number;
  comment: string;
  submittedAt?: Date;
}

export interface Incident {
  _id?: string;
  incidentId: string;
  userId: string;
  status: 'Open' | 'Escalated' | 'Resolved';
  category: string;
  history: ChatMessage[];
  escalationDetails?: EscalationDetails;
  resolutionDetails?: ResolutionDetails;
  feedback?: FeedbackData;
  timeline: TimelineEvent[];
  lastupdatedby: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LLMResponse {
  response: string;
  user_probable_options: string[];
  input_card_variables: FormField[];
  needs_count_first: boolean;
  count_prompt: string;
  total_cards: number;
  should_escalate: boolean;
  escalation_data: EscalationDetails | null;
  should_resolve: boolean;
}

export interface SessionUser {
  id: string;
  email: string;
  username: string;
}
