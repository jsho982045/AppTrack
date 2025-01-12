# server/ml-service/src/api/routes.py
from typing import Dict
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from src.models.job_parser import JobParser
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
parser = JobParser()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EmailData(BaseModel):
    subject: str
    content: str
    from_email: str

@app.post("/parse")
async def parse_email(email_data: EmailData) -> Dict:
    """Parse job application email and extract relevant information"""
    try:
        result = parser.parse_email({
            'subject': email_data.subject,
            'content': email_data.content,
            'from': email_data.from_email
        })
        
        if result is None:
            raise HTTPException(status_code=422, detail="Could not parse email")
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))