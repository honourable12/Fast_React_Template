from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models.user import User
from models.survey import Survey, SurveyResponse, SurveyPermission, Question
from schemas.survey import (
    SurveyCreate, Survey as SurveySchema,
    SurveyAnalytics, FeedbackAnalysis,
    SurveyResponseCreate, SurveyResponseOut
)
from utils.analytics import (
    analyze_survey_responses,
    analyze_feedback_csv,
    validate_survey_response
)
from core.security import get_current_active_user, get_current_user

router = APIRouter()

@router.post("/create", response_model=SurveySchema)
def create_survey(
    survey: SurveyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_survey = Survey(
        title=survey.title,
        description=survey.description,
        created_by=current_user.id
    )
    db.add(db_survey)
    db.commit()
    db.refresh(db_survey)

    # Add questions
    for question in survey.questions:
        db_question = Question(
            survey_id=db_survey.id,
            question_text=question.question_text,
            question_type=question.question_type,
            options=question.options
        )
        db.add(db_question)

    db.commit()
    db.refresh(db_survey)
    return db_survey

@router.get("/list", response_model=List[SurveySchema])
def list_surveys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    surveys = db.query(Survey).filter(Survey.created_by == current_user.id).all()
    return surveys

@router.delete("/{survey_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_survey(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    if survey.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this survey")

    db.delete(survey)
    db.commit()
    return None

@router.post("/analyze")
async def analyze_feedback(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    content_str = content.decode('utf-8')

    analysis_results = analyze_feedback_csv(content_str)
    return analysis_results

@router.post("/{survey_id}/respond", response_model=SurveyResponseOut)
async def submit_survey_response(
    survey_id: int,
    response: SurveyResponseCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    # Validate the response against question types
    validate_survey_response(survey, response.responses)

    db_response = SurveyResponse(
        survey_id=survey_id,
        respondent_id=current_user.id if current_user else None,
        responses=response.responses,
        submitted_at=datetime.utcnow()
    )

    db.add(db_response)
    db.commit()
    db.refresh(db_response)

    return db_response

@router.get("/analytics/{survey_id}", response_model=SurveyAnalytics)
async def get_survey_analytics(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    # Check permissions
    if not has_survey_permission(db, current_user.id, survey_id, "analyze"):
        raise HTTPException(status_code=403, detail="Not authorized to view analytics")

    responses = db.query(SurveyResponse).filter(SurveyResponse.survey_id == survey_id).all()
    analytics = analyze_survey_responses(responses)

    return SurveyAnalytics(**analytics)

@router.post("/{survey_id}/share")
async def share_survey(
    survey_id: int,
    user_id: int,
    permission_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey or survey.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to share this survey")

    permission = SurveyPermission(
        survey_id=survey_id,
        user_id=user_id,
        permission_type=permission_type
    )

    db.add(permission)
    db.commit()

    return {"message": "Survey shared successfully"}

def has_survey_permission(db: Session, user_id: int, survey_id: int, permission_type: str) -> bool:
    # Check if user is the creator
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if survey and survey.created_by == user_id:
        return True

    # Check if user has explicit permission
    permission = db.query(SurveyPermission).filter(
        SurveyPermission.survey_id == survey_id,
        SurveyPermission.user_id == user_id,
        SurveyPermission.permission_type == permission_type
    ).first()

    return permission is not None
