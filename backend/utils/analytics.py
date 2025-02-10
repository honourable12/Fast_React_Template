from collections import Counter
from typing import Dict, List, Union
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
import numpy as np
from textblob import TextBlob
import statistics
from fastapi import status
from fastapi import HTTPException

def analyze_survey_responses(responses: List[dict]) -> Dict:
    """
    Analyze survey responses and generate comprehensive analytics
    """
    analytics = {
        'total_responses': len(responses),
        'completion_rate': 0.0,
        'average_time': 0.0,
        'question_analytics': {}
    }

    for question_id in responses[0]['responses'].keys():
        answers = [r['responses'].get(question_id) for r in responses]
        analytics['question_analytics'][question_id] = analyze_question(answers)

    return analytics


def analyze_question(answers: List[Union[str, int, float, List[str]]]) -> Dict:
    """
    Dispatch analysis based on response type
    """
    if not answers or all(a is None for a in answers):
        return {}

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

    sentiments = [TextBlob(answer).sentiment.polarity for answer in valid_answers]
    all_words = ' '.join(valid_answers).lower().split()
    word_freq = Counter(all_words)

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


def analyze_feedback_csv(file_content: str) -> Dict:
    """
    Analyze CSV feedback using clustering and theme extraction
    """
    df = pd.read_csv(pd.compat.StringIO(file_content))

    vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(df['feedback'].fillna(''))

    n_clusters = min(5, len(df))
    kmeans = KMeans(n_clusters=n_clusters)
    kmeans.fit(tfidf_matrix)

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


def get_cluster_keywords(vectorizer, cluster_center, num_keywords=5):
    """
    Extract most representative keywords from cluster center
    """
    feature_names = vectorizer.get_feature_names_out()
    top_indices = cluster_center.argsort()[-num_keywords:][::-1]
    return [feature_names[i] for i in top_indices]


def generate_question(keywords):
    """
    Generate survey questions based on extracted keywords
    """
    templates = {
        'satisfaction': "How satisfied are you with the {aspect}?",
        'importance': "How important is {aspect} to you?",
        'frequency': "How often do you experience issues with {aspect}?",
        'open_ended': "What suggestions do you have for improving {aspect}?",
        'rating': "On a scale of 1-5, how would you rate the {aspect}?"
    }

    aspect = ' and '.join(keywords[:2])

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
        'question_text': template.format(aspect=aspect),
        'question_type': 'rating' if 'scale' in template else 'text',
        'theme_keywords': keywords
    }


def validate_survey_response(survey, response):
    """
    Validates survey responses against question types
    """
    question_types = {q.id: q.question_type for q in survey.questions}

    for question_id, answer in response.items():
        if question_id not in question_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {question_id} does not exist in this survey"
            )

        question_type = question_types[question_id]

        # Detailed validation for each question type
        validation_checks = {
            "numeric": lambda a: isinstance(a, (int, float)),
            "text": lambda a: isinstance(a, str),
            "multiple_choice": lambda a: isinstance(a, (str, list)),
            "rating": lambda a: isinstance(a, int) and 1 <= a <= 5,
            "boolean": lambda a: isinstance(a, bool)
        }

        if question_type not in validation_checks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported question type: {question_type}"
            )

        if not validation_checks[question_type](answer):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid answer for question {question_id}"
            )