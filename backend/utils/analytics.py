from collections import Counter
from typing import Dict, List, Union
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
import numpy as np
from textblob import TextBlob
import statistics
from schemas.survey import Survey, SurveyResponseCreate
from fastapi import status, HTTPException


def analyze_survey_responses(responses: List[SurveyResponseCreate]) -> Dict:
	analytics = {
		'total_responses': len(responses),
		'completion_rate': 0.0,
		'average_time': 0.0,
		'question_analytics': {}
	}

	for question_id in responses[0].responses.keys():
		answers = [r.responses.get(question_id) for r in responses]
		analytics['question_analytics'][question_id] = analyze_question(answers)

	return analytics


def analyze_question(answers: List[Union[str, int, float, List[str]]]) -> Dict:
	if isinstance(answers[0], (int, float)):
		return analyze_numeric_responses(answers)
	elif isinstance(answers[0], str):
		return analyze_text_responses(answers)
	elif isinstance(answers[0], list):
		return analyze_multiple_choice_responses(answers)

	return {}


def analyze_numeric_responses(answers: List[Union[int, float]]) -> Dict:
	"""
	Analyze numeric responses with statistical measures
	"""
	valid_answers = [a for a in answers if a is not None]

	if not valid_answers:
		return {
			'type': 'numeric',
			'total_responses': 0,
			'statistics': {}
		}

	return {
		'type': 'numeric',
		'total_responses': len(valid_answers),
		'statistics': {
			'mean': statistics.mean(valid_answers),
			'median': statistics.median(valid_answers),
			'mode': statistics.mode(valid_answers) if len(valid_answers) > 1 else valid_answers[0],
			'std_dev': statistics.stdev(valid_answers) if len(valid_answers) > 1 else 0,
			'min': min(valid_answers),
			'max': max(valid_answers),
			'quartiles': {
				'q1': np.percentile(valid_answers, 25),
				'q2': np.percentile(valid_answers, 50),
				'q3': np.percentile(valid_answers, 75)
			}
		}
	}


def analyze_text_responses(answers: List[str]) -> Dict:
	"""
	Analyze text responses with sentiment and keyword analysis
	"""
	valid_answers = [a for a in answers if a and isinstance(a, str)]

	if not valid_answers:
		return {
			'type': 'text',
			'total_responses': 0,
			'analysis': {}
		}

	# Sentiment analysis
	sentiments = [TextBlob(answer).sentiment.polarity for answer in valid_answers]

	# Word frequency analysis
	all_words = ' '.join(valid_answers).lower().split()
	word_freq = Counter(all_words)

	# Average response length
	avg_length = sum(len(answer.split()) for answer in valid_answers) / len(valid_answers)

	return {
		'type': 'text',
		'total_responses': len(valid_answers),
		'analysis': {
			'sentiment': {
				'average': sum(sentiments) / len(sentiments),
				'positive_responses': sum(1 for s in sentiments if s > 0),
				'negative_responses': sum(1 for s in sentiments if s < 0),
				'neutral_responses': sum(1 for s in sentiments if s == 0)
			},
			'response_length': {
				'average_words': avg_length,
				'min_words': min(len(answer.split()) for answer in valid_answers),
				'max_words': max(len(answer.split()) for answer in valid_answers)
			},
			'common_words': dict(word_freq.most_common(10))
		}
	}


def analyze_multiple_choice_responses(answers: List[List[str]]) -> Dict:
	"""
	Analyze multiple choice responses with frequency analysis
	"""
	# Flatten the list of responses for multiple-selection questions
	all_selections = [choice for answer in answers if answer for choice in answer]

	if not all_selections:
		return {
			'type': 'multiple_choice',
			'total_responses': 0,
			'analysis': {}
		}

	choice_frequency = Counter(all_selections)
	total_responses = len(answers)

	return {
		'type': 'multiple_choice',
		'total_responses': total_responses,
		'analysis': {
			'frequencies': {
				choice: {
					'count': count,
					'percentage': (count / total_responses) * 100
				}
				for choice, count in choice_frequency.items()
			},
			'most_common': choice_frequency.most_common(1)[0][0] if choice_frequency else None,
			'unique_selections': len(choice_frequency),
			'average_selections_per_response': len(all_selections) / total_responses
		}
	}


def get_cluster_keywords(vectorizer: TfidfVectorizer, cluster_center: np.ndarray, num_keywords: int = 5) -> List[str]:
	"""
	Extract the most representative keywords from a cluster center
	"""
	# Get feature names from vectorizer
	feature_names = vectorizer.get_feature_names_out()

	# Get indices of top terms for this cluster
	top_indices = cluster_center.argsort()[-num_keywords:][::-1]

	# Return the actual terms
	return [feature_names[i] for i in top_indices]


def generate_question(keywords: List[str]) -> Dict[str, str]:
	"""
	Generate survey questions based on extracted keywords
	"""
	# Template patterns for different question types
	templates = {
		'satisfaction': "How satisfied are you with the {aspect}?",
		'importance': "How important is {aspect} to you?",
		'frequency': "How often do you experience issues with {aspect}?",
		'open_ended': "What suggestions do you have for improving {aspect}?",
		'rating': "On a scale of 1-5, how would you rate the {aspect}?"
	}

	# Combine keywords into a relevant aspect
	aspect = ' and '.join(keywords[:2])  # Use top 2 keywords for clarity

	# Select template based on keywords (could be made more sophisticated)
	if any(word in ['problem', 'issue', 'bug'] for word in keywords):
		template = templates['frequency']
	elif any(word in ['like', 'love', 'hate', 'prefer'] for word in keywords):
		template = templates['satisfaction']
	elif any(word in ['important', 'critical', 'essential'] for word in keywords):
		template = templates['importance']
	elif any(word in ['improve', 'suggest', 'recommend'] for word in keywords):
		template = templates['open_ended']
	else:
		template = templates['rating']

	return {
		'question_text': template.format(aspect = aspect),
		'question_type': 'rating' if 'scale' in template else 'text',
		'theme_keywords': keywords
	}


def analyze_feedback_csv(file_content: str) -> Dict:
	df = pd.read_csv(file_content)

	# Text preprocessing
	vectorizer = TfidfVectorizer(max_features = 1000, stop_words = 'english')
	tfidf_matrix = vectorizer.fit_transform(df['feedback'].fillna(''))

	# Theme extraction using clustering
	n_clusters = min(5, len(df))
	kmeans = KMeans(n_clusters = n_clusters)
	kmeans.fit(tfidf_matrix)

	# Generate suggested questions based on themes
	themes = []
	suggested_questions = []

	for i in range(n_clusters):
		cluster_docs = df[kmeans.labels_ == i]['feedback']
		keywords = get_cluster_keywords(vectorizer, kmeans.cluster_centers_[i])
		themes.append({
			'theme': f"Theme {i + 1}",
			'keywords': keywords,
			'frequency': len(cluster_docs) / len(df)
		})
		suggested_questions.append(generate_question(keywords))

	return {
		'themes': themes,
		'suggested_questions': suggested_questions
	}


def validate_survey_response(survey: Survey, response: Dict[int, Union[str, int, float, List[str]]]) -> None:
	"""
	Validates that survey responses match their question types.
	Raises HTTPException if validation fails.

	Args:
		survey: Survey model instance
		response: Dictionary of question_id: answer pairs
	"""
	question_types = {q.id: q.question_type for q in survey.questions}

	for question_id, answer in response.items():
		if question_id not in question_types:
			raise HTTPException(
				status_code = status.HTTP_400_BAD_REQUEST,
				detail = f"Question {question_id} does not exist in this survey"
			)

		question_type = question_types[question_id]

		# Validate numeric responses
		if question_type == "numeric":
			if not isinstance(answer, (int, float)):
				raise HTTPException(
					status_code = status.HTTP_400_BAD_REQUEST,
					detail = f"Question {question_id} requires a numeric answer"
				)

		# Validate text responses
		elif question_type == "text":
			if not isinstance(answer, str):
				raise HTTPException(
					status_code = status.HTTP_400_BAD_REQUEST,
					detail = f"Question {question_id} requires a text answer"
				)

		# Validate multiple choice responses
		elif question_type == "multiple_choice":
			if isinstance(answer, str):
				# Single selection
				valid_options = survey.questions[question_id].options.split(',') if survey.questions[
					question_id].options else []
				if answer not in valid_options:
					raise HTTPException(
						status_code = status.HTTP_400_BAD_REQUEST,
						detail = f"Invalid option for question {question_id}"
					)
			elif isinstance(answer, list):
				# Multiple selection
				valid_options = survey.questions[question_id].options.split(',') if survey.questions[
					question_id].options else []
				if not all(opt in valid_options for opt in answer):
					raise HTTPException(
						status_code = status.HTTP_400_BAD_REQUEST,
						detail = f"Invalid options for question {question_id}"
					)
			else:
				raise HTTPException(
					status_code = status.HTTP_400_BAD_REQUEST,
					detail = f"Invalid answer format for multiple choice question {question_id}"
				)

		# Validate rating responses
		elif question_type == "rating":
			if not isinstance(answer, int) or answer < 1 or answer > 5:
				raise HTTPException(
					status_code = status.HTTP_400_BAD_REQUEST,
					detail = f"Question {question_id} requires a rating between 1 and 5"
				)

		# Handle boolean responses
		elif question_type == "boolean":
			if not isinstance(answer, bool):
				raise HTTPException(
					status_code = status.HTTP_400_BAD_REQUEST,
					detail = f"Question {question_id} requires a boolean answer"
				)

		# Handle date responses
		elif question_type == "date":
			try:
				datetime.strptime(answer, '%Y-%m-%d')
			except (ValueError, TypeError):
				raise HTTPException(
					status_code = status.HTTP_400_BAD_REQUEST,
					detail = f"Question {question_id} requires a valid date in YYYY-MM-DD format"
				)

		else:
			raise HTTPException(
				status_code = status.HTTP_400_BAD_REQUEST,
				detail = f"Unsupported question type: {question_type}"
			)
