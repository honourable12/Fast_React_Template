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
  question_type: QuestionType;
  options?: string[];
}

export type QuestionType = 'MULTIPLE_CHOICE' | 'TEXT' | 'RATING' | 'BOOLEAN' | 'DROPDOWN';

export interface SurveyCreate {
  title: string;
  description: string;
  questions: QuestionCreate[];
}

export interface QuestionCreate {
  question_text: string;
  question_type: QuestionType;
  options?: string[];
}

export interface SurveyResponse {
  id: number;
  survey_id: number;
  respondent_id?: number;
  responses: Record<string, string | string[] | number | boolean>;
  submitted_at: string;
}

export interface SurveyResponseCreate {
  responses: Record<string, string | string[] | number | boolean>;
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
  permission_type: 'view' | 'analyze';
}

export interface ShareSurveyRequest {
  email: string;
  permission_type: 'view' | 'analyze';
}