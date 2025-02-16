import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PlusCircle, ClipboardList, BarChart2, Share2, Trash2 } from 'lucide-react';
import axiosInstance from '../lib/axios';
import { Survey } from '../types/survey';

export function Dashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const response = await axiosInstance.get('/survey/list');
      setSurveys(response.data);
    } catch (error) {
      toast.error('Failed to fetch surveys');
    } finally {
      setLoading(false);
    }
  };

  const deleteSurvey = async (id: number) => {
    try {
      await axiosInstance.delete(`/survey/${id}`);
      toast.success('Survey deleted successfully');
      fetchSurveys();
    } catch (error) {
      toast.error('Failed to delete survey');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Surveys</h1>
          <Link
            to="/create-survey"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Create Survey
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No surveys</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new survey.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
              >
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 truncate">{survey.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{survey.description}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    Created on {new Date(survey.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex justify-between">
                    <Link
                      to={`/survey/${survey.id}`}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center"
                    >
                      <ClipboardList className="h-4 w-4 mr-1" />
                      View
                    </Link>
                    <Link
                      to={`/survey/${survey.id}/analytics`}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center"
                    >
                      <BarChart2 className="h-4 w-4 mr-1" />
                      Analytics
                    </Link>
                    <button
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/survey/${survey.id}`;
                        navigator.clipboard.writeText(shareUrl);
                        toast.success('Survey link copied to clipboard');
                      }}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center"
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this survey?')) {
                          deleteSurvey(survey.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900 flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}