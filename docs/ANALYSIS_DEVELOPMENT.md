# Citizen feedback analysis

[Back to repository README](../README.md)

## Scope

This guide covers the temporary Analyze Feedback and Analysis Results workflow. It does not describe a deployed moderation, contribution or reporting implementation. Training and model evaluation are maintained separately in the research repository.

## Model pipeline

The web runtime adapts the research team's `absa_runtime.py` and reuses its ACD/ACSA prediction logic. The web service requires full-fine-tuned checkpoints and local tokenizers. It does not support the original research runtime's LoRA fallback, train models, or recalibrate thresholds.

| Parameter | ACD | ACSA |
| --- | --- | --- |
| Task | Multi-label aspect-category detection | Aspect-conditioned sentiment classification |
| Development checkpoint | `optimized_expanded_v2` | `trial_03_mixed_1p5_decay_0p05` |
| Architecture | XLM-RoBERTa sequence classification | XLM-RoBERTa sequence classification |
| Output | Eleven aspect probabilities | Three sentiment probabilities per detected aspect |
| Decision | Sigmoid; saved threshold per category (all 0.625 for this ACD) | Softmax; argmax |
| Saved max length | 128 tokens | 128 tokens, including aspect prompt |
| Saved weight dtype | Float32 | Float32 |
| Saved Transformers version | 5.23.0 | 4.57.6 |

The service validates taxonomy, label order, reverse mappings, classification type, required threshold entries and training parameters. Thresholds and maximum lengths are read from local checkpoint metadata rather than hardcoded in inference. The service strips outer whitespace only; preserve other text as the original inference script does. Confirm preprocessing parity with the research corpus's `model_text` before release.

The ACSA model receives the comment first and the aspect prompt second:

```text
Aspect: CODE — NAME
```

For example, `Aspect: A10 — Traffic and Transportation Impact`. The paired tokenizer uses `truncation="only_first"` so the aspect prompt is retained. ACD tokenization uses truncation and padding at its saved sequence limit. If ACD detects no aspects, ACSA inference is skipped and the response contains an empty list.

### Aspect taxonomy

| Code | Category |
| --- | --- |
| A01 | Policy Benefits and Impact |
| A02 | Implementation and Enforcement |
| A03 | Cost, Fees and Penalties |
| A04 | Accessibility and Convenience |
| A05 | Fairness and Inclusivity |
| A06 | Rules and Policy Provisions |
| A07 | Government Administration and Responsiveness |
| A08 | Public Safety and Security |
| A09 | Environmental Impact |
| A10 | Traffic and Transportation Impact |
| A11 | Other |

ACSA model output order is `Negative`, `Neutral`, `Positive` (indices 0, 1, 2). The public API maps these to lowercase values matching the database enum. A11 is a trained category, not an automatic fallback for unrelated comments. Keep `backend/app/ml/labels.py`, `frontend/src/data/aspects.ts`, checkpoint metadata and database reference data aligned.

### Model loading modes

- **Sequential:** Load ACD for a request, infer, release its weights, then load and release ACSA if needed. Lower peak model memory but repeated loading overhead.
- **Resident:** Load both models on the first analysis and reuse them in that process. Faster repeated requests if sufficient memory is available.

The process-local service lock serializes inference. Inference runs synchronously in the endpoint's worker thread; concurrent requests can queue. Canceling a browser request does not guarantee cancellation of running model inference. Use the benchmark script and target machine's memory monitoring to choose a mode. See [local development](LOCAL_DEVELOPMENT.md) for settings.

## HTTP API

### `GET /api/v1/health`

Returns HTTP 200 with `{"status":"ok","service":"citi-senti-api"}`. This is a server liveness endpoint, not a model or database readiness test.

### `POST /api/v1/analysis`

Content-Type: `application/json`. No citizen account is required for temporary analysis.

Request:

```json
{
  "comment": "Maganda ang traffic management ngayon."
}
```

The comment must be a string of 1–1,000 Unicode code points before trimming, and cannot consist solely of whitespace. The service does not automatically identify the input language or restrict the text to specific languages. The supported language scope is English, Tagalog, Ilocano and code-switching.

Example successful response (illustrative predictions, not measured outputs):

```json
{
  "comment": "Maganda ang traffic management ngayon.",
  "predictions": [
    {"aspect_code": "A10", "sentiment": "positive"}
  ],
  "model_version": "glot500m-acd-optimized-expanded-v2-acsa-stage2-trial03",
  "mode": "live",
  "truncation": {"acd": false, "acsa_aspects": []}
}
```

| Field | Contract |
| --- | --- |
| `comment` | Submitted comment with outer whitespace removed |
| `predictions` | Array of zero or more unique detected aspects |
| `predictions[].aspect_code` | A01–A11 |
| `predictions[].sentiment` | `negative`, `neutral`, or `positive` |
| `model_version` | Nonempty configured checkpoint identifier |
| `mode` | `live` |
| `truncation.acd` | Boolean indicating whether the ACD input exceeded its token limit |
| `truncation.acsa_aspects` | Unique detected aspect codes whose paired inputs exceeded ACSA's token limit |

The response deliberately does not expose model probabilities or computed sentiment counts. The UI derives counts from `predictions` and uses its taxonomy to resolve names. Empty predictions are valid, not an HTTP error and not an overall neutral classification.

| Status | Meaning |
| --- | --- |
| 200 | Successful analysis, including empty predictions |
| 422 | Missing, invalid, blank or oversized input |
| 503 | Model configuration/loading failure; `Analysis model is unavailable.` |
| 500 | Inference or output validation failure; `Analysis failed.` |

Successful responses and explicit 500/503 errors set `Cache-Control: no-store`. The frontend also requests `cache: 'no-store'`. Default framework validation responses should be audited separately.

Test with the running backend:

```bash
curl -i http://127.0.0.1:8000/api/v1/analysis \
  -H 'Content-Type: application/json' \
  -d '{"comment":"Maganda ang traffic management ngayon."}'
```

Interactive OpenAPI documentation: `http://127.0.0.1:8000/docs`.

## Truncation and interpretation

A 1,000-character comment is not guaranteed to fit within 128 tokens. ACSA has additional overhead from its paired aspect prompt. The runtime measures the complete untruncated token sequence (including special tokens) for ACD and each ACSA input. It reports affected stages without changing the trained inference settings.

The UI conditionally displays a partial-analysis warning and includes it in copied results. Shorter comments can improve coverage. There is no pre-analysis token check or automatic chunking in this implementation. Increasing the sequence length, changing thresholds, or aggregating chunk predictions would require separate research evaluation.

Sentiment summary cards count detected aspects assigned to each sentiment, not citizens, submissions, or an overall sentiment. The same comment may produce both positive and negative aspects. Predictions are probabilistic and may be wrong.

## Frontend state and interactions

The input and result views share `/analyze-feedback`. The analysis page maintains temporary state; it prevents repeated submission while a request is pending, preserves input on errors, and aborts the browser request on unmount. Results show the original analyzed comment, counts, sorted aspects, and Copy Results, Clear and Submit Feedback actions. Clear resets the analysis and restores focus. The inspected design has no separate downloadable file action; confirm whether this is a remaining acceptance criterion.

## Integration with contribution

The citizen layout provides `useAnalysisFlow()` for the temporary draft. In the contribution page:

```tsx
import { useAnalysisFlow } from '../components/AnalysisFlowContext'

// Inside the contribution component under the citizen Layout:
const { contributionDraft, setContributionDraft } = useAnalysisFlow()
```

Prefill the form from a non-null draft and call `setContributionDraft(null)` after consuming it. Preserve user edits when the context changes. The context is not persistent storage; reloads or navigating away from the contribution flow can discard the draft. The contribution form must implement review, consent, storage and any access-code behavior independently.

Backend developers can reuse the process-local service:

```python
from app.ml.service import service

result = service.predict(comment)
```

This is a blocking call; do not run it directly on an async event loop. Handle `ModelUnavailable` and other inference failures through the contribution workflow. Use the returned `predictions` and actual `model_version`; do not trust predictions supplied by a browser. The service itself does not persist anything. Consult [Database](DATABASE.md) for revision and per-aspect storage requirements.

## Research provenance and release limitations

The supplied ACD report records validation macro-F1 0.8263 and the Stage 2 ACSA report records conditional validation macro-F1 0.7788 on gold-present aspect pairs. These are separate development metrics, not independent test results or end-to-end pipeline performance. The ACD and ACSA reports share the same dataset fingerprint. Stage 2 Trial 03 is the validation winner, but its comparison report explicitly cautions against overriding a previously frozen selection; verify research-final deployment checkpoints with the team. Confirm exact tokenizer provenance and dependency compatibility, then evaluate the complete pipeline independently before making performance claims.

Temporary analysis does not write to PostgreSQL, browser local/session storage or URLs. The sidebar stores its own collapse preference separately. Avoid logging raw feedback and review hosting logs, monitoring, error responses, cache configuration and access controls before public use. See [Testing](TESTING.md) for release checks.
