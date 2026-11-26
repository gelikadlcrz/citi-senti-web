# Local development

[Back to repository README](../README.md)

This guide sets up the web application independently of the model-training repository. Use development resources, not production credentials, for local testing.

## 1. Prerequisites

- Git, Python with `venv` and pip, Node.js, and pnpm.
- A Python version supported by the repository's ML dependency set on your operating system and architecture. Reuse a verified environment where possible; do not infer compatibility solely from successful installation.
- Access to the selected trained checkpoints, including their metadata and tokenizers, for live analysis.
- A development Supabase project and database connection string only if working on database-backed features. The Supabase CLI is needed for schema migrations.

Check your tools with `python --version`, `node --version`, and `pnpm --version`. Use the team's verified versions and the committed dependency files. The supplied frontend has a pnpm lockfile; the Python requirements use a mixture of pins and ranges, not a complete lockfile.

## 2. Install backend dependencies

From the repository root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
```

On Windows PowerShell, activate with `.venv\Scripts\Activate.ps1`. Use an existing compatible environment instead of recreating it when one is already set up.

Choose one installation path:

```bash
# API and database development without model inference
python -m pip install -r requirements.txt

# Or: API plus Glot500-m inference
python -m pip install -r requirements-model.txt
```

The ML requirements include the base requirements and add PyTorch, Transformers, Accelerate, SentencePiece, Safetensors, protobuf, and NumPy. The analysis feature's initial Transformers pin is `4.57.6`; ACD was saved using `5.23.0` and ACSA using `4.57.6`. A successful checkpoint-load and prediction test is required before declaring the chosen environment compatible. Do not edit a checkpoint configuration to work around loading errors.

```bash
python -m pip check
```

## 3. Configure the environment

Create `backend/.env` if it does not exist. Use `backend/.env.example` as the model configuration reference. Merge settings into an existing file rather than replacing teammate-specific configuration. The checked-in example is model-only in the inspected implementation.

For model inference:

```dotenv
GLOT_ACD_MODEL_DIR=model_artifacts/acd/optimized_expanded_v2
GLOT_ACSA_MODEL_DIR=model_artifacts/acsa/stage2_from_research/trial_03_mixed_1p5_decay_0p05
GLOT_DEVICE=auto
GLOT_LOAD_MODE=sequential
GLOT_ACD_BATCH_SIZE=2
GLOT_ACSA_BATCH_SIZE=2
GLOT_MODEL_VERSION=glot500m-acd-optimized-expanded-v2-acsa-stage2-trial03
```

| Variable | Meaning |
| --- | --- |
| `GLOT_ACD_MODEL_DIR` | ACD checkpoint directory |
| `GLOT_ACSA_MODEL_DIR` | ACSA checkpoint directory |
| `GLOT_DEVICE` | `auto`, `cpu`, `cuda`, or `mps`; auto prefers CUDA, then MPS, then CPU |
| `GLOT_LOAD_MODE` | `sequential` or `resident` |
| `GLOT_ACD_BATCH_SIZE` | Positive integer; ACD inference batch size |
| `GLOT_ACSA_BATCH_SIZE` | Positive integer; ACSA comment-aspect pair batch size |
| `GLOT_MODEL_VERSION` | Nonempty identifier for the actual checkpoint combination |

Paths may be absolute or relative to `backend/`, regardless of the working directory. Process environment variables take precedence over `.env` for the model service. Restart the backend after changing configuration or checkpoints.

For database-backed development, also set the following using your own development project values:

```dotenv
APP_ENV=development
DATABASE_URL=postgresql://postgres.DEV_REF:PASSWORD@POOLER_HOST:5432/postgres?sslmode=require
DEV_PROJECT_REF=DEV_REF
PROD_PROJECT_REF=PROD_REF
```

The database URL is illustrative; copy your real development Session pooler URI from Supabase, including the correct host and encoded password. Never paste the production URI into a development environment. See [database guide](DATABASE.md).

## 4. Prepare checkpoints

Keep model artifacts outside Git. Obtain the two full-fine-tuned checkpoints from the research team. The default development pairing is:

```text
backend/model_artifacts/
├── acd/optimized_expanded_v2/
│   ├── config.json
│   ├── model.safetensors
│   ├── acd_results.json
│   ├── sentencepiece.bpe.model
│   ├── tokenizer_config.json
│   └── special_tokens_map.json
└── acsa/stage2_from_research/trial_03_mixed_1p5_decay_0p05/
    ├── config.json
    ├── model.safetensors
    ├── acsa_results.json
    ├── sentencepiece.bpe.model
    ├── tokenizer_config.json
    └── special_tokens_map.json
```

Use the original tokenizer files from each checkpoint when possible. Additional tokenizer files may be present. The current ACD report identifies `cis-lmu/glot500-base` as its base model. If the original ACD tokenizer is unavailable, the following recovery matches the original inference runtime's base-tokenizer fallback (run from `backend/` with ML dependencies installed):

```bash
python - <<'PY'
from pathlib import Path
from transformers import AutoTokenizer

path = Path('model_artifacts/acd/optimized_expanded_v2').resolve()
assert (path / 'model.safetensors').is_file(), 'Check ACD checkpoint path'
tokenizer = AutoTokenizer.from_pretrained('cis-lmu/glot500-base', use_fast=False)
print(tokenizer.save_pretrained(str(path)))
PY
```

This fetches tokenizer assets rather than model weights. Record the resolved tokenizer revision for reproducibility and confirm it matches the training-time tokenizer; the supplied training report does not identify an exact revision. Do not overwrite trained weights, model configuration, or reports. Keep the ACSA tokenizer supplied with its checkpoint.

The selected development weights occupy about 1.58 GB each on disk; runtime memory exceeds the raw weight sizes. Begin with sequential loading on constrained hardware. Resident mode holds both models in memory and should be benchmarked before adoption.

The Stage 2 ACSA candidate is the validation winner, but the comparison report warns against replacing a previously frozen research selection without confirmation. See [analysis guide](ANALYSIS_DEVELOPMENT.md).

## 5. Verify and run

From `backend/` with the virtual environment active:

```bash
python -m scripts.check_models --metadata-only
python -m scripts.check_models
fastapi dev app/main.py
```

The first check validates paths, model metadata and device selection, not actual weight loading or tokenizer execution. The second loads both checkpoints and predicts a sample. Use `--text "Your comment"` to test another input. The backend can start without weights because model initialization is deferred until analysis; the health route is not a model readiness probe.

In a separate terminal, from the repository root:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:5173/analyze-feedback`. The API is available at `http://127.0.0.1:8000/docs`. Keep both servers running; the development proxy uses port 8000. A production host needs equivalent `/api` routing and SPA history fallback; Vite's dev proxy is not a production deployment configuration.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| `ModuleNotFoundError` | Check `which python` (or `Get-Command python` on PowerShell), activate the web backend environment and install the appropriate requirements. |
| `Missing local tokenizer` | Verify tokenizer vocabulary and config files are in the exact checkpoint directory. Load the tokenizer with `local_files_only=True` to check it. |
| Checkpoint/label mismatch | Verify the correct model directories and metadata pairing. Investigate compatibility; do not change trained labels or thresholds. |
| MPS or CUDA failure | Check device availability; try `GLOT_DEVICE=cpu` and restart. |
| Memory pressure / OOM | Use sequential mode, reduce batch sizes to 1, close unnecessary processes and avoid multiple model workers. |
| HTTP 503 on analysis | Check server logs privately for configuration or model-load errors; run the model verification script. |
| Health works but analysis fails | Health only confirms the server is running. Verify both trained models. |
| Frontend cannot reach API | Confirm FastAPI is on port 8000 and Vite proxy is active. |
| Frontend says invalid result | Check that frontend and backend use the same response contract, including `truncation`. |

For automated and manual validation, follow [Testing](TESTING.md).
