"""Seed approved, de-identified research corpus comments into the DEV database.

Run from backend/ (or use any working directory):
  python scripts/seed_research_feedback.py /path/to/comments.csv
  python scripts/seed_research_feedback.py /path/to/comments.csv --apply

Reads only backend/.env, never a production .env file or inherited DATABASE_URL.
Requires psycopg[binary] and python-dotenv. Dry run is the default.
"""
import argparse
import csv
import hashlib
from pathlib import Path

import psycopg
from psycopg.conninfo import conninfo_to_dict
from dotenv import dotenv_values


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv_file', type=Path)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    config = dotenv_values(Path(__file__).resolve().parent.parent / '.env', interpolate=False)
    dev_ref = config.get('DEV_PROJECT_REF')
    prod_ref = config.get('PROD_PROJECT_REF')
    url = config.get('DATABASE_URL')
    if config.get('APP_ENV') != 'development' or not dev_ref or not prod_ref or not url or dev_ref == prod_ref:
        raise SystemExit('Refusing to run: configure separate DEV_PROJECT_REF and PROD_PROJECT_REF, DATABASE_URL and APP_ENV=development in backend/.env.')
    try:
        params = conninfo_to_dict(url)
    except psycopg.Error:
        raise SystemExit('Invalid DATABASE_URL; check backend/.env privately.') from None
    # Only allow a standard Supabase Session pooler connection for the explicit DEV ref.
    if (params.get('user') != f'postgres.{dev_ref}'
            or not params.get('host', '').endswith('.pooler.supabase.com')
            or params.get('port') != '5432'
            or params.get('dbname') != 'postgres'
            or params.get('sslmode') not in ('require', 'verify-ca', 'verify-full')
            or 'hostaddr' in params or 'service' in params):
        raise SystemExit('Refusing to run: DATABASE_URL must be the SSL-enabled DEV Session pooler URL.')

    rows = {}
    with args.csv_file.open(encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != ['model_text']:
            raise SystemExit('Expected a single CSV column named model_text.')
        for n, row in enumerate(reader, start=2):
            comment = row.get('model_text')
            if None in row or comment is None or not comment.strip() or len(comment) > 1000 or '\x00' in comment:
                raise SystemExit(f'Invalid comment on CSV row {n}. Nothing inserted.')
            reference = 'DEMO-' + hashlib.sha256(comment.encode('utf-8')).hexdigest()[:40]
            if reference in rows and rows[reference] != comment:
                raise SystemExit('Reference collision. Nothing inserted.')
            rows[reference] = comment
    if not rows:
        raise SystemExit('CSV contains no comments.')

    print(f'Development project: {dev_ref}')
    print(f'Validated unique comments: {len(rows)}')
    if not args.apply:
        print('Dry run: no database connection or changes. Use --apply to import.')
        return
    if input('Type the DEVELOPMENT project reference to confirm: ').strip() != dev_ref:
        raise SystemExit('Cancelled.')
    inserted = 0
    try:
        with psycopg.connect(url, connect_timeout=10) as conn:
            with conn.cursor() as cur:
                for reference, comment in rows.items():
                    cur.execute('''
                        INSERT INTO public.feedback_submissions
                            (reference_code, original_comment, current_comment, source)
                        VALUES (%s, %s, %s, 'research_corpus')
                        ON CONFLICT (reference_code) DO NOTHING
                        RETURNING submission_id
                    ''', (reference, comment, comment))
                    if cur.fetchone() is not None:
                        inserted += 1
                    else:
                        cur.execute('''SELECT source::text, original_comment
                                       FROM public.feedback_submissions
                                       WHERE reference_code = %s''', (reference,))
                        if cur.fetchone() != ('research_corpus', comment):
                            raise RuntimeError('Existing reference does not match corpus comment.')
        # Connection context commits only if all records were processed successfully.
    except (psycopg.Error, RuntimeError) as exc:
        raise SystemExit(f'Import failed ({type(exc).__name__}); transaction rolled back. Check schema/connection privately.') from None
    print(f'Inserted: {inserted}')
    print(f'Already present: {len(rows) - inserted}')


if __name__ == '__main__':
    main()
