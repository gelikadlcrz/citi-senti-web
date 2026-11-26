# CITI-Senti

**Citizen Feedback Intelligence via Glot500-m for Trilingual Aspect-Based Sentiment Analysis in Baguio City**

CITI-Senti is an academic research web application for analyzing citizen feedback about local government policies, ordinances, resolutions, programs, services, and public issues in Baguio City. It supports English, Tagalog, Ilocano, and code-switched comments.

Unlike document-level sentiment analysis, CITI-Senti detects multiple policy-related aspects in a comment and predicts a separate sentiment for each detected aspect. The live analysis feature uses fine-tuned Glot500-m checkpoints; training, baseline experiments (Logistic Regression and Linear SVM), and research evaluation are maintained separately in the NLP repository.

## Project objectives

- Develop a trilingual aspect-based sentiment analysis approach for citizen feedback.
- Evaluate fine-tuned Glot500-m against traditional machine learning baselines.
- Provide a web interface for temporary analysis and voluntary feedback contribution.
- Support systematic examination of public concerns through aggregated feedback insights.

## Application scope

| Area | Purpose |
| --- | --- |
| Analyze Feedback | Enter a comment, run live aspect and sentiment inference, view and copy results. |
| Contribute Feedback | Voluntarily submit feedback with consent; manage contributions through the contribution workflow. |
| Public Insights | Present aggregated statistics from eligible feedback, with appropriate privacy safeguards. |
| Explore CITI-Senti | Explain the aspect taxonomy, analysis workflow, limitations, and research background. |
| Administration | Authenticate administrators and support feedback review, moderation, and reporting. |

**Development status:** The analysis and results workflow is implemented in the analysis feature branch. Explore pages are present. Contribution, insights, administration, and deployment are separate workstreams; this overview describes project scope, not a guarantee that every feature is implemented or deployed. See [architecture and integration boundaries](docs/ARCHITECTURE.md) for the inspected implementation.

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, TanStack Query |
| Backend | Python, FastAPI, Pydantic |
| Model inference | Glot500-m, PyTorch, Hugging Face Transformers, SentencePiece, Safetensors |
| Database | Supabase-hosted PostgreSQL, psycopg, SQL migrations |
| Development | pnpm, Oxlint, TypeScript compiler, Python unittest |

## Getting started

For the full instructions, including prerequisites, model artifacts, environment variables, and database setup, see the [local development guide](docs/LOCAL_DEVELOPMENT.md).

### Backend

From the repository root, assuming Python and the trained artifacts are already available:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-model.txt
```

For regular backend development without live inference, use `requirements.txt` instead. Configure `backend/.env` as described in the setup guide. For live analysis, verify the checkpoints before starting the server:

```bash
python -m scripts.check_models --metadata-only
python -m scripts.check_models
fastapi dev app/main.py
```

If an existing compatible virtual environment is already configured, reuse it rather than recreating it.

### Frontend

In a separate terminal, from the repository root:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

| Service | Local address |
| --- | --- |
| Citizen portal | http://localhost:5173/analyze-feedback |
| Backend API | http://127.0.0.1:8000 |
| API documentation (Swagger) | http://127.0.0.1:8000/docs |
| Health endpoint | http://127.0.0.1:8000/api/v1/health |

The Vite development proxy forwards `/api` requests to FastAPI. Temporary analysis does not require a database connection; persistent feedback and other database-backed features do.

## Documentation

| Guide | Contents |
| --- | --- |
| [Local development](docs/LOCAL_DEVELOPMENT.md) | Installation, model artifacts, environment configuration, running the application, troubleshooting |
| [System architecture](docs/ARCHITECTURE.md) | Repository organization, routes, component responsibilities, data flow and integration boundaries |
| [Analysis developer guide](docs/ANALYSIS_DEVELOPMENT.md) | Model behavior, API contract, truncation, frontend state and contribution handoff |
| [Database](docs/DATABASE.md) | Schema, migrations, dev/prod separation and research corpus seeding |
| [Testing and contribution](docs/TESTING.md) | Automated and manual checks, release criteria and Git workflow |
| [Frontend](frontend/README.md) | Frontend-specific commands, routes and conventions |

## Research and privacy

The model's predictions are automated estimates, not verified factual findings. Multiple detected aspects can have different sentiments. A comment may produce no detected aspects, and a long comment may be partially analyzed due to model token limits. Public statistics should not be interpreted as representative of the entire population of Baguio City.

Temporary analysis does not persist feedback or predictions in PostgreSQL. Contribution is a separate consent-based workflow. Do not commit credentials, trained weights, private corpus files, or environment directories.

## Disclaimer

CITI-Senti is an academic research project and is not affiliated with or an official platform of the City Government of Baguio. It is intended to support research and interpretation of citizen feedback, not to make official government decisions.
