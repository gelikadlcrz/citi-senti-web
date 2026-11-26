# Testing and contribution guide

[Back to repository README](../README.md)

Use the development environment and synthetic test comments. Tests verify software behavior and model execution; they are not interchangeable with independent model evaluation.

## Automated backend checks

From `backend/` with the environment active:

```bash
python -m pip check
python -m unittest discover -s tests -v
python -m scripts.check_models --metadata-only
python -m scripts.check_models
```

| Check | Verifies | Does not establish |
| --- | --- | --- |
| `tests/test_model_service.py` | Orchestration, model reuse/release, controlled predictions and truncation | Trained model accuracy or hardware performance |
| `tests/test_analysis_api.py` | Request/response validation, status codes and controlled error cases | Real weight execution |
| `check_models --metadata-only` | Required paths, metadata and configured device | Tokenizer execution or weight integrity |
| `check_models` | Actual checkpoint loading and sample prediction | Independent end-to-end accuracy |

The assembled Phase 8 implementation contains 19 backend unit tests; the count may change as teammates add tests. Install the model dependencies when running the full suite. Investigate any failure rather than relying on an expected count alone.

## Live API contract smoke test

With `fastapi dev app/main.py` running in one terminal, use a second terminal in `backend/`:

```bash
python -m scripts.smoke_test_analysis
```

This script is included in the Phase 9 verification files. If it has not been merged into your branch, add it from that patch before running the command. It expects 13 checks including health, invalid inputs, multilingual comments, length boundaries, unique aspect codes, valid sentiment values, truncation metadata and the no-store header. It uses actual HTTP requests and synthetic comments, not real citizen data. A success does not establish prediction correctness. Options include `--base-url` and `--timeout`; use a development server.

## Performance benchmarking

The optional `backend/scripts/benchmark_analysis.py` from the model testing work sends repeated multilingual requests to the running API. If present in the branch, run:

```bash
python -m scripts.benchmark_analysis
```

Compare sequential and resident modes using the same checkpoint pairing, device, batch sizes and comments. Restart the server between configurations. Record first response, subsequent latency, request failures, prediction consistency and actual memory pressure. Prefer resident mode only when capacity and reliability are verified. Do not infer runtime memory requirements solely from the disk size of the models.

## Frontend checks

From `frontend/`:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm build
pnpm verify:explore
```

`pnpm build` runs TypeScript and Vite production build. `verify:explore` checks the Explore section, not the whole application. Run these commands on your actual development platform, then repeat after merging shared changes.

## Manual acceptance tests

Run both servers and visit `/analyze-feedback`. Record results for the commit under test, including device and model identifier. Test at desktop, tablet and mobile sizes (for example 1440, 768 and 390 pixels).

### Input and analysis

- [ ] Root redirects to Analyze Feedback; sidebar navigation works.
- [ ] All four multilingual samples populate the textarea without auto-submitting.
- [ ] Character count updates, including Unicode input; 1,000-character limit is enforced.
- [ ] Blank input cannot be submitted; Clear resets the form.
- [ ] Analyze sends one request, shows loading and prevents repeated submissions.
- [ ] A backend outage or model-unavailable error preserves the comment and permits retry.
- [ ] Navigating away during inference does not display stale results after returning.

### Results and integration

- [ ] Header switches to Analysis Results while the sidebar item remains active.
- [ ] Comment, aspect names and sentiments match the live response.
- [ ] Positive + neutral + negative counts equal the number of detected aspects.
- [ ] Empty predictions display zero counts and an appropriate explanation (use a controlled test fixture if necessary).
- [ ] Truncation notices match the API metadata; copied text includes applicable warnings.
- [ ] Copy Results works or provides a fallback; Clear resets state and focuses input.
- [ ] Submit Feedback navigates to the contribution route; when the contribution form is integrated, verify its prefill and explicit consent behavior.
- [ ] Reload removes temporary analysis; comments do not appear in URLs or browser persistent storage.
- [ ] Temporary analysis does not insert records into Supabase (see database guide).

### Accessibility and regression

- [ ] Controls can be reached and activated by keyboard; focus is visible.
- [ ] Sentiment labels communicate meaning without color alone; loading/errors are understandable.
- [ ] Long comments and tables do not overflow at mobile widths; sidebar and Explore remain functional.
- [ ] Review routes and existing teammate features after merging shared files.

## Before opening a pull request

1. Confirm the tests relevant to your changes pass. Record failures and untested cases rather than claiming results you did not observe.
2. Review `git status --short` and `git diff --check`. Check staged files for `.env`, `.venv`, `model_artifacts`, `seed_data`, `node_modules`, and private data.
3. Keep API response changes synchronized between backend and frontend. Update relevant documentation and tests in the same change.
4. Coordinate shared-file modifications (`App.tsx`, `Layout.tsx`, `main.py`, `.env.example`, SVG icon sheet) with teammates. Fetch and integrate current `main` according to the team's branch policy, resolve conflicts, and rerun tests.
5. Push your feature branch and open a PR describing changes, verification results, database impact, compatibility notes and remaining limitations.

Suggested verification record (fill in actual outcomes):

```text
Commit:
Python / Transformers / PyTorch:
Node / pnpm:
Checkpoint identifier and device / load mode:
Backend unit tests:
Actual model check:
Live HTTP smoke test:
Frontend lint / build / Explore check:
Manual browser and privacy checks:
Known limitations / failures:
```

## Release readiness

A working local feature is not a production release. Confirm research-final checkpoint selection, tokenizer revision, corpus preprocessing parity and independent end-to-end model evaluation. Confirm contribution integration and whether a separate Download Results action remains in scope. Verify deployment routing, memory/latency capacity, authentication for protected routes, authorization, request limits, logging and privacy, and dev/prod isolation. The supplied development metrics are not public accuracy claims. Update the README and feature status after these checks are completed.
