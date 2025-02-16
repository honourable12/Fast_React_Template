export interface Survey {
  id: number;
  title: string;
  description: string;
  created_at: string;
  questions: Question[];
}

export interface Question {
  id: number;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'single_choice';
  options?: string[];
}

export interface SurveyResponse {
  id: number;
  survey_id: number;
  responses: Record<string, string | string[]>;
  submitted_at: string;
}

export interface SurveyAnalytics {
  total_responses: number;
  question_analytics: Record<string, QuestionAnalytics>;
}

export interface QuestionAnalytics {
  responses: number;
  data: Record<string, number>;
}