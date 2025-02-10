# FastAPI Authentication & Survey Management API

This project provides authentication services and survey management using FastAPI, SQLAlchemy, and JWT authentication.

## Features

### **Authentication (`auth.py`)**
- **User Registration** (`/auth/register`): Creates a new user account.
- **User Login** (`/auth/token`): Generates a JWT access token for authentication.
- **Get User Profile** (`/auth/profile`): Retrieves the authenticated user’s profile.
- **Change Password** (`/auth/change-password`): Allows users to update their password.
- **Reset Password** (`/auth/reset-password`): Generates a temporary password for a user.
- **Delete Account** (`/auth/delete-account`): Deletes the authenticated user’s account.

### **Survey Management (`survey.py`)**
- **Create Survey** (`/survey/create`): Allows users to create a survey with multiple questions.
- **List Surveys** (`/survey/list`): Retrieves surveys created by the authenticated user.
- **Delete Survey** (`/survey/{survey_id}`): Deletes a survey if the user has permissions.
- **Analyze Feedback** (`/survey/analyze`): Upload a CSV file and analyze customer feedback.
- **Survey Analytics** (`/survey/analytics/{survey_id}`): Provides analytics for a given survey.
- **Submit Survey Response** (`/survey/{survey_id}/respond`): Users can submit survey responses.
- **Share Survey** (`/survey/{survey_id}/share`): Grants permission for another user to access the survey.

## Installation

1. **Clone the repository**:
   ```sh
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Create virtual environment**:
   ```sh
   python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies**:
   ```sh
   pip install -r requirements.txt
   ```

4. **Set up environment variables: Create a .env file with the necessary credentials**:
   ```
   DATABASE_URL=your postresql url
    JWT_SECRET_KEY=your_secret_key
   ```
5.**Run the server **:
 ```
  uvicorn main:app --reload
```
6. **Access the API documentation:**
  Open http://127.0.0.1:8000/docs for Swagger UI.

### **Database Models**
- **User**: Stores user authentication data.
- **Survey**: Stores survey metadata.
- **Question**: Stores questions related to a survey.
- **SurveyResponse**: Stores responses submitted by users.
- **SurveyPermission**: Manages survey sharing permissions.


###  **Security**
- **Uses JWT authentication for secured access**.
- **Passwords are hashed before storing in the database**.
- **Implements access control for survey permissions**.

