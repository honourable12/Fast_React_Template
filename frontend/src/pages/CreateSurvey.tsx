import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { PlusCircle, Trash2, GripVertical } from 'lucide-react';
import axiosInstance from '../lib/axios';
import { QuestionType } from '../types/survey';

interface QuestionField {
  question_text: string;
  question_type: QuestionType;
  options?: string;
}

interface SurveyForm {
  title: string;
  description: string;
  questions: QuestionField[];
}

export function CreateSurvey() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<SurveyForm>({
    defaultValues: {
      questions: [{ question_text: '', question_type: 'TEXT' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions"
  });

  const watchQuestionTypes = watch("questions");

  const onSubmit = async (data: SurveyForm) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        questions: data.questions.map(question => ({
          question_text: question.question_text,
          question_type: question.question_type,
          options: ['MULTIPLE_CHOICE', 'DROPDOWN'].includes(question.question_type) && question.options
            ? question.options.split('\n').filter(Boolean)
            : undefined
        }))
      };

      const response = await axiosInstance.post('/surveys/create', payload);
      toast.success('Survey created successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to create survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Survey</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Survey Title</label>
              <input
                type="text"
                {...register('title', { required: 'Title is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Questions</h2>
                <button
                  type="button"
                  onClick={() => append({ question_text: '', question_type: 'TEXT' })}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Question
                </button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 p-4 rounded-lg relative">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                  </div>

                  <div className="ml-8 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Question {index + 1}
                      </label>
                      <input
                        type="text"
                        {...register(`questions.${index}.question_text` as const, {
                          required: 'Question text is required'
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      {errors.questions?.[index]?.question_text && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.questions[index]?.question_text?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Question Type
                      </label>
                      <select
                        {...register(`questions.${index}.question_type` as const)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="TEXT">Text Answer</option>
                        <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                        <option value="RATING">Rating (1-5)</option>
                        <option value="BOOLEAN">Yes/No</option>
                        <option value="DROPDOWN">Dropdown</option>
                      </select>
                    </div>

                    {(watchQuestionTypes[index]?.question_type === 'MULTIPLE_CHOICE' ||
                      watchQuestionTypes[index]?.question_type === 'DROPDOWN') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Options (one per line)
                        </label>
                        <textarea
                          {...register(`questions.${index}.options` as const, {
                            required: 'Options are required for choice questions'
                          })}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="Enter each option on a new line"
                        />
                        {errors.questions?.[index]?.options && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.questions[index]?.options?.message}
                          </p>
                        )}
                      </div>
                    )}

                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="inline-flex items-center text-sm text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove Question
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isSubmitting ? 'Creating...' : 'Create Survey'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}