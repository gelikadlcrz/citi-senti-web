"""Web adapter for the frozen research ACD -> ACSA pipeline."""
from __future__ import annotations

import logging
import math
import os
from pathlib import Path
from threading import Lock
from typing import Any

from dotenv import load_dotenv

from .labels import ASPECT_CODES, ASPECT_NAMES, SENTIMENT_LABELS

BACKEND = Path(__file__).resolve().parents[2]
logger = logging.getLogger(__name__)


class ModelUnavailable(RuntimeError):
    pass


class AnalysisService:
    def __init__(self):
        self.lock = Lock()
        self.acd = self.acsa = None
        self._runtime = None
        self._validated = False

    def _configure(self):
        load_dotenv(BACKEND / '.env', override=False)
        def path_from_env(key, default):
            path = Path(os.getenv(key, default)).expanduser()
            return (BACKEND / path).resolve() if not path.is_absolute() else path.resolve()
        self.acd_dir = path_from_env('GLOT_ACD_MODEL_DIR', 'model_artifacts/acd/optimized_expanded_v2')
        self.acsa_dir = path_from_env('GLOT_ACSA_MODEL_DIR', 'model_artifacts/acsa/stage2_from_research/trial_03_mixed_1p5_decay_0p05')
        self.device_name = os.getenv('GLOT_DEVICE', 'auto')
        self.mode = os.getenv('GLOT_LOAD_MODE', 'sequential')
        self.version = os.getenv('GLOT_MODEL_VERSION', 'glot500m-acd-optimized-expanded-v2-acsa-stage2-trial03')
        self.acd_batch_size = int(os.getenv('GLOT_ACD_BATCH_SIZE', '2'))
        self.acsa_batch_size = int(os.getenv('GLOT_ACSA_BATCH_SIZE', '2'))
        if min(self.acd_batch_size, self.acsa_batch_size) < 1:
            raise ValueError('Glot500-m batch sizes must be positive integers')
        if self.mode not in ('resident', 'sequential'):
            raise ValueError('GLOT_LOAD_MODE must be resident or sequential')
        if self.device_name not in ('auto', 'cpu', 'mps', 'cuda'):
            raise ValueError('GLOT_DEVICE must be auto, cpu, mps or cuda')
        if not self.version.strip():
            raise ValueError('GLOT_MODEL_VERSION must not be empty')

    def _prepare(self):
        if self._validated:
            return
        self._configure()
        from . import absa_runtime as runtime
        self._runtime = runtime
        for path in (self.acd_dir, self.acsa_dir):
            runtime.require_dir(path, 'Model')
            if (path / 'adapter_config.json').exists():
                raise ValueError('This web integration expects full fine-tuned checkpoints')
            if not (path / 'config.json').is_file() or not runtime.has_model_weights(path):
                raise FileNotFoundError(f'Missing config or weights: {path}')
            if not any((path / f).is_file() for f in runtime.TOKENIZER_FILENAMES):
                raise FileNotFoundError(f'Missing local tokenizer: {path}')
        acd_report = runtime.read_acd_report(self.acd_dir)
        acsa_report = runtime.load_json(self.acsa_dir / 'acsa_results.json')
        if acd_report.get('label_names') != ASPECT_NAMES:
            raise ValueError('ACD taxonomy differs from training labels')
        thresholds = acd_report.get('category_thresholds')
        if not isinstance(thresholds, dict) or set(thresholds) != set(ASPECT_CODES):
            raise ValueError('Expected all 11 saved ACD category thresholds')
        if not all(math.isfinite(float(v)) and 0 <= float(v) <= 1 for v in thresholds.values()):
            raise ValueError('Invalid ACD thresholds')
        if acsa_report.get('input_format') != "tokenizer(text=model_text, text_pair='Aspect: CODE — NAME')":
            raise ValueError('ACSA input format differs from research runtime')
        if acsa_report.get('label_order') != list(SENTIMENT_LABELS) or acsa_report.get('aspect_codes') != list(ASPECT_CODES):
            raise ValueError('ACSA output labels or aspect order differ')
        if acsa_report.get('aspect_names') != ASPECT_NAMES:
            raise ValueError('ACSA taxonomy differs from training labels')
        for report in (acd_report, acsa_report):
            if int(report['training_parameters']['max_length']) <= 0:
                raise ValueError('Invalid saved max_length')
        for directory, labels, problem_type in (
            (self.acd_dir, ASPECT_CODES, 'multi_label_classification'),
            (self.acsa_dir, SENTIMENT_LABELS, 'single_label_classification'),
        ):
            config = runtime.load_json(directory / 'config.json')
            if config.get('id2label') != {str(i): label for i, label in enumerate(labels)}:
                raise ValueError(f'Unexpected model label order: {directory}')
            if config.get('label2id') != {label: i for i, label in enumerate(labels)}:
                raise ValueError(f'Unexpected reverse label mapping: {directory}')
            if config.get('problem_type') != problem_type or config.get('model_type') != 'xlm-roberta':
                raise ValueError(f'Unexpected model architecture or classification type: {directory}')
        self.device = runtime.select_device(self.device_name)
        self._validated = True

    def _ensure_resident(self):
        if self.acd is not None and self.acsa is not None:
            return
        runtime = self._runtime
        try:
            self.acd = runtime.load_acd(self.acd_dir, self.device)
            self.acsa = runtime.load_acsa(self.acsa_dir, self.device)
        except Exception:
            for handle in (self.acd, self.acsa):
                if handle is not None:
                    runtime.release_handle(handle)
            self.acd = self.acsa = None
            raise

    def predict(self, comment: str) -> dict[str, Any]:
        # Match the research runtime: preserve case, punctuation and languages;
        # strip outer whitespace only. Serialize inference within this process.
        if not isinstance(comment, str) or not comment.strip() or len(comment) > 1000:
            raise ValueError("Comment must contain 1–1,000 characters and cannot be blank")
        text = comment.strip()
        with self.lock:
            try:
                self._prepare()
                if self.mode == 'resident':
                    self._ensure_resident()
                else:
                    self.acd = self._runtime.load_acd(self.acd_dir, self.device)
            except Exception as exc:
                logger.exception('Glot500-m configuration or load failed')
                raise ModelUnavailable('Analysis model is unavailable.') from exc
            runtime = self._runtime
            import numpy as np
            try:
                order = self.acd.order
                scores = runtime.infer_acd(self.acd, [text], batch_size=self.acd_batch_size)
                if scores.shape != (1, len(order)) or not np.isfinite(scores).all():
                    raise ValueError('Invalid ACD prediction array')
                probabilities = scores[0]
                codes = [code for i, code in enumerate(order) if probabilities[i] >= self.acd.thresholds[i]]
            finally:
                if self.mode == 'sequential':
                    runtime.release_handle(self.acd)
                    self.acd = None
            predictions = []
            if codes:
                if self.mode == 'sequential':
                    try:
                        self.acsa = runtime.load_acsa(self.acsa_dir, self.device)
                    except Exception as exc:
                        logger.exception('Glot500-m ACSA load failed')
                        raise ModelUnavailable('Analysis model is unavailable.') from exc
                try:
                    distributions = runtime.infer_acsa(self.acsa, [(text, code) for code in codes], batch_size=self.acsa_batch_size)
                    if distributions.shape != (len(codes), len(SENTIMENT_LABELS)) or not np.isfinite(distributions).all():
                        raise ValueError('Invalid ACSA prediction array')
                    for code, distribution in zip(codes, distributions, strict=True):
                        predictions.append({'aspect_code': code, 'sentiment': SENTIMENT_LABELS[int(distribution.argmax())].lower()})
                finally:
                    if self.mode == 'sequential':
                        runtime.release_handle(self.acsa)
                        self.acsa = None
            return {'comment': text, 'predictions': predictions, 'model_version': self.version, 'mode': 'live'}


service = AnalysisService()
