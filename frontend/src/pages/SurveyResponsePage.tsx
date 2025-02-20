import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options?: string[];
}

interface Survey {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

const SurveyResponsePage = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<{ [key: number]: any }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch survey details (allowing public access)
useEffect(() => {
  axios
    .get(`http://localhost:8000/surveys/${surveyId}`, { withCredentials: false }) // Ensure public access
    .then((res) => setSurvey(res.data))
    .catch(() => setError("Failed to load survey"))
    .finally(() => setLoading(false));
}, [surveyId]);

  // Handle input changes
  const handleChange = (questionId: number, value: any) => {
    setResponses((prevResponses) => ({ ...prevResponses, [questionId]: value }));
  };

  // Submit response (anonymous users allowed)
  const handleSubmit = async () => {
    try {
      await axios.post(
        `http://localhost:8000/surveys/${surveyId}/respond`,
        { responses },
        { withCredentials: false } // Ensure it works for unauthenticated users
      );
      setSuccessMessage("Survey submitted successfully!");
      toast.success("Survey response submitted!");
    } catch (err) {
      setError("Failed to submit response. Please try again.");
      toast.error("Failed to submit response.");
    }
  };

  if (loading) return <p>Loading survey...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold">{survey?.title}</h1>
      <p className="text-gray-600 mb-4">{survey?.description}</p>

      {survey?.questions.map((q) => (
        <div key={q.id} className="mb-4">
          <label className="block font-medium">{q.question_text}</label>
          {q.question_type === "TEXT" ? (
            <input
              type="text"
              className="w-full border p-2 rounded"
              onChange={(e) => handleChange(q.id, e.target.value)}
            />
          ) : q.question_type === "MULTIPLE_CHOICE" && q.options ? (
            <select
              className="w-full border p-2 rounded"
              onChange={(e) => handleChange(q.id, e.target.value)}
            >
              {q.options.map((opt, idx) => (
                <option key={idx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : q.question_type === "RATING" ? (
            <input
              type="number"
              min="1"
              max="5"
              className="w-full border p-2 rounded"
              onChange={(e) => handleChange(q.id, Number(e.target.value))}
            />
          ) : null}
        </div>
      ))}

      {successMessage && <p className="text-green-500">{successMessage}</p>}
      {error && <p className="text-red-500">{error}</p>}

      <button
        className="bg-blue-500 text-white p-2 rounded mt-4"
        onClick={handleSubmit}
      >
        Submit Response
      </button>
    </div>
  );
};

export default SurveyResponsePage;
