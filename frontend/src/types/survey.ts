export interface Survey {
  id: number;
  title: string;
  description: string;
  created_by: number;
  created_at: string;
  questions: Question[];
}

export interface Question {
  id: number;
  survey_id: number;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'rating';
  options?: string[];
}

export interface SurveyResponse {
  id: number;
  survey_id: number;
  respondent_id?: number;
  responses: Record<string, any>;
  submitted_at: string;
}

export interface SurveyAnalytics {
  total_responses: number;
  question_analytics: Record<string, QuestionAnalytics>;
}

export interface QuestionAnalytics {
  question_text: string;
  response_distribution: Record<string, number>;
  average_rating?: number;
}

export interface CreateSurveyData {
  title: string;
  description: string;
  questions: {
    question_text: string;
    question_type: 'text' | 'multiple_choice' | 'rating';
    options?: string[];
  }[];
}