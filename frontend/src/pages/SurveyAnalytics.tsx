import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { useSurveyStore } from '../stores/surveyStore';
import { SurveyAnalytics as SurveyAnalyticsType } from '../types/survey';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

export function SurveyAnalytics() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { getSurveyAnalytics } = useSurveyStore();
  const [analytics, setAnalytics] = useState<SurveyAnalyticsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getSurveyAnalytics(Number(surveyId));
        setAnalytics(data);
      } catch (error) {
        toast.error('Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [surveyId, getSurveyAnalytics]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">No data available</h2>
          <p className="mt-2 text-gray-600">This survey has no responses yet.</p>
        </div>
      </div>
    );
  }

  const renderQuestionAnalytics = (questionId: string, data: any) => {
    const { question_text, response_distribution, average_rating } = data;
    const chartData = Object.entries(response_distribution).map(([label, value]) => ({
      label,
      value,
    }));

    return (
      <div key={questionId} className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{question_text}</h3>
        {average_rating !== undefined ? (
          <div className="flex items-center space-x-4">
            <div className="text-4xl font-bold text-indigo-600">
              {average_rating.toFixed(1)}
            </div>
            <div className="text-gray-600">Average Rating</div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartData.length <= 5 ? (
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ label, percent }) =>
                      `${label}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#6366f1" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Survey Analytics</h2>
          <div className="text-gray-600">
            Total Responses: {analytics.total_responses}
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(analytics.question_analytics).map(([questionId, data]) =>
            renderQuestionAnalytics(questionId, data)
          )}
        </div>
      </div>
    </div>
  );
}