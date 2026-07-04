from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Any, List, Dict, Optional
from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.gemini_service import generate_sql_from_text, generate_business_insight
from app.core.cache import query_cache
from app.core.limiter import limiter
from fastapi import Request

router = APIRouter(prefix="/ask", tags=["AI Analyst"])

class AnalysisModel(BaseModel):
    summary: str
    insight: str
    recommendation: str

class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    results: List[Dict[str, Any]]
    analysis: Optional[AnalysisModel] = None

# A simple string representation of our database schema to feed to Gemini
SCHEMA_CONTEXT = """
Table: users
Columns: id (INTEGER), email (VARCHAR), is_active (BOOLEAN)

Table: customers
Columns: id (INTEGER), name (VARCHAR), email (VARCHAR), company (VARCHAR)

Table: products
Columns: id (INTEGER), name (VARCHAR), category (VARCHAR), price (DECIMAL)

Table: sales
Columns: id (INTEGER), user_id (INTEGER), customer_id (INTEGER), product_id (INTEGER), quantity (INTEGER), total_amount (DECIMAL), sale_date (TIMESTAMP)
"""

@limiter.limit("20/minute")
@router.post("/", response_model=AskResponse)
def ask_sales_analyst( 
    raw_request: Request,
    request: AskRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_prompt = request.question
    last_error = ""

    # ⚡ Check Redis Cache First!
    cached_payload = query_cache.get(request.question)
    if cached_payload:
        print(f"⚡ REDIS CACHE HIT! Returning instant answer for: '{request.question}'")
        return AskResponse(**cached_payload)

    # Self-Healing AI Pipeline: Give Gemini up to 3 attempts (The Merry-Go-Round)
    for attempt in range(3):
        # 1. Ask Gemini to convert the question (or error feedback) to SQL
        try:
            sql_query = generate_sql_from_text(current_prompt, SCHEMA_CONTEXT)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

        # Clean markdown formatting if Gemini wrapped it in ```sql ... ```
        sql_query = sql_query.replace("```sql", "").replace("```", "").strip()

        # 2. Security Validation: Ensure it's only a SELECT query
        if not sql_query.upper().startswith("SELECT"):
            last_error = "Only SELECT queries are allowed for security reasons."
            current_prompt = f"Human asked: {request.question}\nYou generated non-SELECT SQL: {sql_query}\nError: {last_error}\nPlease return only a SELECT SQL query."
            continue
        
        forbidden = False
        forbidden_keywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE"]
        for keyword in forbidden_keywords:
            if keyword in sql_query.upper():
                last_error = f"Forbidden keyword detected: {keyword}"
                current_prompt = f"Human asked: {request.question}\nYou generated SQL with keyword {keyword}: {sql_query}\nError: {last_error}\nFix your SQL."
                forbidden = True
                break
        if forbidden:
            continue

        # 3. Execute the SQL query safely (Scene 3: The Happy Path)
        try:
            result = db.execute(text(sql_query))
            rows = [dict(row) for row in result.mappings()]
                
            # 4. Generate Business Insights
            try:
                insight_data = generate_business_insight(request.question, rows)
                analysis = AnalysisModel(**insight_data) if insight_data else None
            except Exception:
                analysis = None
                
            response_payload = AskResponse(results=rows, analysis=analysis)
            # ⚡ Save into Redis Cache for 5 minutes!
            query_cache.set(request.question, response_payload.model_dump())
            return response_payload
            
        except Exception as db_err:
            # INTERCEPTED DATABASE ERROR! (Scene 4: The Safety Net)
            print(f"⚠️ Self-Healing Attempt {attempt + 1}/3 failed. Database Error: {db_err}")
            last_error = str(db_err)
            current_prompt = f"""
            Human asked: {request.question}
            You previously generated this buggy SQL: {sql_query}
            PostgreSQL threw this database driver error: {last_error}
            Please analyze the error and return only a corrected SELECT SQL query!
            """

    # If all 3 self-healing attempts failed:
    raise HTTPException(
        status_code=400, 
        detail=f"AI failed to generate executable SQL after 3 Self-Healing attempts.\nLast Database Error: {last_error}"
    )
