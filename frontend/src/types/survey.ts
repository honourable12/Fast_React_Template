export interface Survey {
  id: number;
  title: string;
  description: string;
  created_at: string;
  created_by: number;
  questions: Question[];
}

export interface Question {
  id: number;
  survey_id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'text' | 'rating';
  options?: string[];
}

export interface SurveyCreate {
  title: string;
  description: string;
  questions: QuestionCreate[];
}

export interface QuestionCreate {
  question_text: string;
  question_type: 'multiple_choice' | 'text' | 'rating';
  options?: string[];
}

export interface SurveyResponse {
  id: number;
  survey_id: number;
  respondent_id?: number;
  responses: Record<string, string | string[]>;
  submitted_at: string;
}

export interface SurveyResponseCreate {
  responses: Record<string, string | string[]>;
}

export interface SurveyAnalytics {
  total_responses: number;
  question_analytics: Record<string, QuestionAnalytics>;
}

export interface QuestionAnalytics {
  responses: number;
  data: Record<string, number>;
}

export interface SurveyPermission {
  survey_id: number;
  user_id: number;
  permission_type: string;
}