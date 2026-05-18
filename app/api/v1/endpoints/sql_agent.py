from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.sql_agent import run_sql_agent
from app.core.security import require_admin

router = APIRouter(prefix="/sql-agent")


class AgentQuery(BaseModel):
    question: str


@router.post("/query")
def sql_agent_query(
    body: AgentQuery
):
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Câu hỏi không được để trống")
    return run_sql_agent(body.question)