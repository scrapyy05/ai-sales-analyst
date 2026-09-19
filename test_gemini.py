import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.services.gemini_service import generate_sql_from_text

try:
    sql = generate_sql_from_text("what is the total revenue?", "table: sales")
    print(f"SUCCESS: {sql}")
except Exception as e:
    import traceback
    print("CRASH!")
    traceback.print_exc()
