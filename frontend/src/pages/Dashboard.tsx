import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, BarChart2, Share } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useSurveyStore } from '../stores/surveyStore';
import { CreateSurveyModal } from '../components/CreateSurveyModal';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { surveys, isLoading, listSurveys, deleteSurvey } = useSurveyStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    listSurveys().catch(() => {
      toast.error('Failed to load surveys');
    });
  }, [listSurveys]);

  const handleDelete = async (surveyId: number) => {
    if (window.confirm('Are you sure you want to delete this survey?')) {
      try {
        await deleteSurvey(surveyId);
        toast.success('Survey deleted successfully');
      } catch (error) {
        toast.error('Failed to delete survey');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.full_name}!
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Survey
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : surveys.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-600">You haven't created any surveys yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create your first survey
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {survey.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{survey.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {new Date(survey.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDelete(survey.id)}
                        className="p-2 text-gray-400 hover:text-red-500"
                        title="Delete survey"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/analytics/${survey.id}`)}
                        className="p-2 text-gray-400 hover:text-indigo-500"
                        title="View analytics"
                      >
                        <BarChart2 className="h-5 w-5" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-indigo-500"
                        title="Share survey"
                      >
                        <Share className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <CreateSurveyModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    </div>
  );
}