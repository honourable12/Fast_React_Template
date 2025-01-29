from pydantic import BaseModel, ConfigDict
from typing import Dict, List, Optional, Union
from datetime import datetime

class QuestionBase(BaseModel):
    question_text: str
    question_type: str
    options: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)  # Updated from orm_mode

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    id: int
    survey_id: int

class SurveyBase(BaseModel):
    title: str
    description: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class SurveyCreate(SurveyBase):
    questions: List[QuestionCreate]

class Survey(SurveyBase):
    id: int
    created_at: datetime
    created_by: int
    questions: List[Question]

class SurveyResponseBase(BaseModel):
    survey_id: int
    responses: Dict[int, Union[str, int, float, List[str]]]

class SurveyResponseCreate(SurveyResponseBase):
    pass

class SurveyResponseOut(SurveyResponseBase):
    id: int
    respondent_id: Optional[int]
    submitted_at: datetime
    model_config = ConfigDict(from_attributes=True)

class QuestionAnalytics(BaseModel):
    type: str
    total_responses: int
    analysis: Dict[str, Union[dict, int, float, str]]
    model_config = ConfigDict(from_attributes=True)

class SurveyAnalytics(BaseModel):
    total_responses: int
    completion_rate: float
    average_time: float
    question_analytics: Dict[str, QuestionAnalytics]
    model_config = ConfigDict(from_attributes=True)

class FeedbackAnalysis(BaseModel):
    themes: List[Dict[str, Union[str, float]]]
    suggested_questions: List[Dict[str, str]]
    model_config = ConfigDict(from_attributes=True)