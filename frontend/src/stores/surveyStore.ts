import { create } from 'zustand';
import axios from '../lib/axios';
import { Survey, CreateSurveyData, SurveyResponse, SurveyAnalytics } from '../types/survey';

interface SurveyState {
  surveys: Survey[];
  isLoading: boolean;
  error: string | null;
  createSurvey: (data: CreateSurveyData) => Promise<Survey>;
  listSurveys: () => Promise<void>;
  deleteSurvey: (id: number) => Promise<void>;
  submitResponse: (surveyId: number, responses: Record<string, any>) => Promise<void>;
  getSurveyAnalytics: (surveyId: number) => Promise<SurveyAnalytics>;
  shareSurvey: (surveyId: number, userId: number, permissionType: string) => Promise<void>;
  analyzeFeedback: (file: File) => Promise<any>;
}

export const useSurveyStore = create<SurveyState>((set, get) => ({
  surveys: [],
  isLoading: false,
  error: null,

  createSurvey: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post<Survey>('/survey/create', data);
      const surveys = [...get().surveys, response.data];
      set({ surveys });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create survey' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  listSurveys: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get<Survey[]>('/survey/list');
      set({ surveys: response.data });
    } catch (error) {
      set({ error: 'Failed to fetch surveys' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteSurvey: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/survey/${id}`);
      const surveys = get().surveys.filter(survey => survey.id !== id);
      set({ surveys });
    } catch (error) {
      set({ error: 'Failed to delete survey' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  submitResponse: async (surveyId, responses) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`/survey/${surveyId}/respond`, { responses });
    } catch (error) {
      set({ error: 'Failed to submit response' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getSurveyAnalytics: async (surveyId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get<SurveyAnalytics>(`/survey/analytics/${surveyId}`);
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch analytics' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  shareSurvey: async (surveyId, userId, permissionType) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`/survey/${surveyId}/share`, {
        user_id: userId,
        permission_type: permissionType,
      });
    } catch (error) {
      set({ error: 'Failed to share survey' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  analyzeFeedback: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('/survey/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to analyze feedback' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));