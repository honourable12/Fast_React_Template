from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Survey(Base):
	__tablename__ = "surveys"

	id = Column(Integer, primary_key=True, index=True)
	title = Column(String, nullable=False)
	description = Column(String)
	created_at = Column(DateTime, default=datetime.utcnow)
	created_by = Column(Integer, ForeignKey("users.id"))

	# Relationships
	creator = relationship("User", back_populates="surveys")
	questions = relationship("Question", back_populates="survey", cascade="all, delete-orphan")
	responses = relationship("SurveyResponse", back_populates = "survey")
	permissions = relationship("SurveyPermission", back_populates = "survey")

class Question(Base):
	__tablename__ = "questions"

	id = Column(Integer, primary_key=True, index=True)
	survey_id = Column(Integer, ForeignKey("surveys.id"))
	question_text = Column(String, nullable=False)
	question_type = Column(String, nullable=False)  # multiple_choice, text, rating, etc.
	options = Column(String)  # JSON string for multiple choice options

	# Relationships
	survey = relationship("Survey", back_populates="questions")


class SurveyResponse(Base):
	__tablename__ = "survey_responses"

	id = Column(Integer, primary_key = True, index = True)
	survey_id = Column(Integer, ForeignKey("surveys.id"))
	respondent_id = Column(Integer, ForeignKey("users.id"), nullable = True)
	responses = Column(JSON)
	submitted_at = Column(DateTime, default = datetime.utcnow)

	survey = relationship("Survey", back_populates = "responses")
	respondent = relationship("User", back_populates = "survey_responses")

class SurveyPermission(Base):
	__tablename__ = "survey_permissions"

	id = Column(Integer, primary_key = True, index = True)
	survey_id = Column(Integer, ForeignKey("surveys.id"))
	user_id = Column(Integer, ForeignKey("users.id"))
	permission_type = Column(String)  # "view", "edit", "analyze"

	survey = relationship("Survey", back_populates = "permissions")
	user = relationship("User", back_populates = "survey_permissions")
