from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routes.auth import router as auth_router
from routes.survey import router as survey_router
from database import create_tables

# Create database tables
create_tables()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#routers
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(survey_router, prefix = "/surveys", tags = ["surveys"])

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)