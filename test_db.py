import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.db.database import SessionLocal
from sqlalchemy import text

try:
    db = SessionLocal()
    result = db.execute(text("SELECT 1"))
    print("DB SUCCESS:", result.scalar())
except Exception as e:
    import traceback
    print("DB CRASH!")
    traceback.print_exc()
finally:
    db.close()
