
import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env"))

database_url = os.environ["DATABASE_URL"]

with psycopg.connect(database_url, connect_timeout=10) as conn:
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN (
                  'admin_users',
                  'policy_topics',
                  'aspect_categories',
                  'feedback_submissions',
                  'analysis_results',
                  'feedback_reviews'
              )
        """)

        table_count = cursor.fetchone()[0]

        print("Connected to Supabase PostgreSQL!")
        print(f"CITI-Senti tables found: {table_count}")
