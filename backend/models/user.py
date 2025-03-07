from sqlalchemy import Column, Integer, String, Boolean
from database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String)

    surveys = relationship("Survey", back_populates = "creator")
    survey_responses = relationship("SurveyResponse", back_populates = "respondent")
    survey_permissions = relationship("SurveyPermission", back_populates = "user")
