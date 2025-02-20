import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Survey } from '../types/survey';
import axiosInstance from '../lib/axios';
import { ClipboardList, Loader } from 'lucide-react';

export function SurveyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

  useEffect(() => {
    fetchSurvey();
  }, [id]);

  const fetchSurvey = async () => {
    try {
      const response = await axiosInstance.get(`/surveys/${id}`, { withCredentials: false });
      setSurvey(response.data);
    } catch (error) {
      toast.error('Failed to fetch survey');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const formattedResponses: Record<string, any> = {};

      // Format responses based on question type
      survey?.questions.forEach((question) => {
        let response = data[question.id];

        switch (question.question_type) {
          case 'RATING':
            formattedResponses[question.id] = parseInt(response);
            break;
          case 'BOOLEAN':
            formattedResponses[question.id] = response === 'true';
            break;
          case 'MULTIPLE_CHOICE':
            formattedResponses[question.id] = Array.isArray(response) ? response : [response];
            break;
          default:
            formattedResponses[question.id] = response;
        }
      });

      await axiosInstance.post(`/surveys/${id}/respond`, { responses: formattedResponses }, { withCredentials: false });

      toast.success('Response submitted successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Survey not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{survey.title}</h1>
          <p className="text-gray-600 mb-6">{survey.description}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {survey.questions.map((question, index) => (
              <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {index + 1}. {question.question_text}
                </label>

                {/* Text Input */}
                {question.question_type === 'TEXT' && (
                  <textarea
                    {...register(`${question.id}`, { required: 'This field is required' })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                )}

                {/* Multiple Choice (Checkboxes) */}
                {question.question_type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-2">
                    {question.options?.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center">
                        <input
                          type="checkbox"
                          value={option}
                          {...register(`${question.id}`)}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          onChange={(e) => {
                            const selectedOptions = watch(question.id) || [];
                            const updatedOptions = e.target.checked
                              ? [...selectedOptions, option]
                              : selectedOptions.filter((o: string) => o !== option);
                            setValue(question.id, updatedOptions);
                          }}
                        />
                        <label className="ml-3 block text-sm text-gray-700">{option}</label>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dropdown */}
                {question.question_type === 'DROPDOWN' && (
                  <select
                    {...register(`${question.id}`, { required: 'This field is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select an option</option>
                    {question.options?.map((option, optionIndex) => (
                      <option key={optionIndex} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}

                {/* Rating */}
                {question.question_type === 'RATING' && (
                  <div className="flex space-x-4">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <label key={value} className="flex flex-col items-center">
                        <input
                          type="radio"
                          {...register(`${question.id}`, { required: 'Please select a rating' })}
                          value={value}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                        />
                        <span className="text-sm text-gray-600 mt-1">{value}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Boolean (Yes/No) */}
                {question.question_type === 'BOOLEAN' && (
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register(`${question.id}`, { required: 'Please select an option' })}
                        value="true"
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register(`${question.id}`, { required: 'Please select an option' })}
                        value="false"
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                )}

                {errors[question.id] && (
                  <p className="text-red-500 text-xs mt-1">{errors[question.id]?.message as string}</p>
                )}
              </div>
            ))}

            <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-4 py-2 rounded shadow">
              {submitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
