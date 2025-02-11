import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import Dict, Generator
import json
from datetime import datetime

from main import app  # Your FastAPI app
from database import Base, get_db
from models.user import User
from models.survey import Survey, Question, SurveyResponse

# Test database setup
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db() -> Generator:
    Base.metadata.create_all(bind=engine)
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client(db: TestingSessionLocal) -> Generator:
    def override_get_db():
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture(scope="module")
def test_user(client: TestClient) -> Dict[str, str]:
    user_data = {
        "username": "testuser",
        "password": "testpass123",
        "email": "test@example.com",
        "full_name": "Test User"
    }
    response = client.post("/auth/register", data=user_data)
    assert response.status_code == 200
    return user_data

@pytest.fixture(scope="module")
def auth_headers(client: TestClient, test_user: Dict[str, str]) -> Dict[str, str]:
    response = client.post("/auth/token", 
        data={
            "username": test_user["username"],
            "password": test_user["password"]
        }
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

class TestAuthentication:
    def test_register_user(self, client: TestClient):
        response = client.post("/auth/register", data={
            "username": "newuser",
            "password": "newpass123",
            "email": "new@example.com",
            "full_name": "New User"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["message"] == "User registered successfully"

    def test_register_duplicate_username(self, client: TestClient, test_user: Dict[str, str]):
        response = client.post("/auth/register", data={
            "username": test_user["username"],
            "password": "anotherpass123",
            "email": "another@example.com"
        })
        assert response.status_code == 400
        assert "Username already exists" in response.json()["detail"]

    def test_login_success(self, client: TestClient, test_user: Dict[str, str]):
        response = client.post("/auth/token", data={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self, client: TestClient):
        response = client.post("/auth/token", data={
            "username": "wronguser",
            "password": "wrongpass"
        })
        assert response.status_code == 400
        assert "Incorrect username or password" in response.json()["detail"]

    def test_get_profile(self, client: TestClient, auth_headers: Dict[str, str]):
        response = client.get("/auth/profile", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "username" in data
        assert "email" in data

class TestSurvey:
    @pytest.fixture(scope="class")
    def test_survey(self, client: TestClient, auth_headers: Dict[str, str]) -> Dict:
        survey_data = {
            "title": "Test Survey",
            "description": "Survey for testing",
            "questions": [
                {
                    "question_text": "What is your favorite color?",
                    "question_type": "multiple_choice",
                    "options": ["Red", "Blue", "Green"]
                },
                {
                    "question_text": "Any additional comments?",
                    "question_type": "text",
                    "options": []
                }
            ]
        }
        response = client.post("/survey/create", 
            json=survey_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        return response.json()

    def test_create_survey(self, client: TestClient, auth_headers: Dict[str, str]):
        survey_data = {
            "title": "Another Survey",
            "description": "Testing survey creation",
            "questions": [
                {
                    "question_text": "Rate our service",
                    "question_type": "rating",
                    "options": ["1", "2", "3", "4", "5"]
                }
            ]
        }
        response = client.post("/survey/create", 
            json=survey_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == survey_data["title"]
        assert len(data["questions"]) == len(survey_data["questions"])

    def test_list_surveys(self, client: TestClient, auth_headers: Dict[str, str], test_survey: Dict):
        response = client.get("/survey/list", headers=auth_headers)
        assert response.status_code == 200
        surveys = response.json()
        assert len(surveys) > 0
        assert any(s["id"] == test_survey["id"] for s in surveys)

    def test_submit_survey_response(self, client: TestClient, auth_headers: Dict[str, str], test_survey: Dict):
        response_data = {
            "responses": {
                "1": "Blue",
                "2": "Great survey!"
            }
        }
        response = client.post(
            f"/survey/{test_survey['id']}/respond",
            json=response_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["survey_id"] == test_survey["id"]
        assert "submitted_at" in data

    def test_get_survey_analytics(self, client: TestClient, auth_headers: Dict[str, str], test_survey: Dict):
        response = client.get(
            f"/survey/analytics/{test_survey['id']}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "response_rate" in data
        assert "question_breakdown" in data

    def test_delete_survey(self, client: TestClient, auth_headers: Dict[str, str], test_survey: Dict):
        response = client.delete(
            f"/survey/{test_survey['id']}",
            headers=auth_headers
        )
        assert response.status_code == 204

        # Verify survey is deleted
        response = client.get(
            f"/survey/analytics/{test_survey['id']}",
            headers=auth_headers
        )
        assert response.status_code == 404

if __name__ == "__main__":
    pytest.main(["-v"])