from google import genai
from app.core.config import settings
import json
import time

# Initialize the new Gemini API client securely
client = genai.Client(api_key=settings.GEMINI_API_KEY)

def _call_gemini_with_retry(prompt: str, max_retries: int = 3) -> str:
    """Helper function to automatically retry if we hit a 503 traffic spike."""
    for attempt in range(max_retries):
        try:
            # We must use 2.5-flash because your key has a 0 limit on 2.0
            response = client.models.generate_content(
                model='gemini-flash-latest',
                contents=prompt
            )
            return response.text
        except Exception as e:
            if "503" not in str(e) and attempt == max_retries - 1:
                raise e
            # Wait 5 seconds and try again
            time.sleep(5)
    raise Exception("Failed to generate content after multiple retries due to server overload.")

def generate_sql_from_text(prompt: str, schema_context: str) -> str:
    """
    Takes a natural language prompt and the database schema, 
    and asks Gemini to return ONLY a valid SQL SELECT query.
    """
    
    system_instruction = f"""
    You are an expert SQL Data Analyst. 
    Your goal is to translate a user's natural language question into a valid PostgreSQL query.
    
    Here is the database schema:
    {schema_context}
    
    CRITICAL RULES:
    1. ONLY return the raw SQL query. Do not wrap it in markdown code blocks like ```sql ... ```
    2. Do not include any explanations or conversational text.
    3. You are ONLY allowed to write SELECT queries. Do NOT write INSERT, UPDATE, DELETE, DROP, or ALTER.
    """
    
    full_prompt = f"{system_instruction}\n\nUser Question: {prompt}\nSQL Query:"
    
    # Call our retry helper instead of calling it directly
    response_text = _call_gemini_with_retry(full_prompt)
    
    # Strip any accidental markdown blocks or whitespace the AI might have included
    clean_sql = response_text.strip().replace("```sql", "").replace("```", "").strip()
    return clean_sql

def generate_business_insight(question: str, sql_results: list) -> dict | None:
    """
    Takes the user's original question and the resulting data from the SQL query,
    and asks Gemini to generate a concise business insight.
    """
    prompt = f"""
    You are an experienced Sales Analyst.

    User Question:
    {question}

    Query Results:
    {sql_results}

    Analyze the results and provide:
    1. Summary
    2. Key Insight
    3. Recommendation

    Rules:
    * Focus on business value.
    * Do not mention SQL.
    * Do not mention databases.
    * Keep response concise.
    * Maximum 120 words.
    * Use professional language.
    * Return ONLY a valid JSON object with EXACTLY these three keys: "summary", "insight", "recommendation". Do not wrap in markdown.
    """
    try:
        response_text = _call_gemini_with_retry(prompt)
        
        # Clean up the output to ensure it is valid JSON
        clean_json = response_text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except Exception:
        # If generation or parsing fails, return None to gracefully fallback
        return None
