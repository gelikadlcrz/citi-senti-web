"""Local full-fine-tuned Glot500-m ACD and ACSA inference.

Adapted from the CITI-Senti research runtime; no training or file writes.
"""
from __future__ import annotations

import gc
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import torch


from .labels import ASPECT_CODES, ASPECT_NAMES

CODES = tuple(ASPECT_CODES)
SENTIMENTS = ("Negative", "Neutral", "Positive")
WEIGHT_FILENAMES = (
    "model.safetensors", "pytorch_model.bin",
    "model.safetensors.index.json", "pytorch_model.bin.index.json",
)
TOKENIZER_FILENAMES = (
    "tokenizer.json", "tokenizer.model", "spiece.model",
    "sentencepiece.bpe.model", "vocab.json",
)


def require_dir(path: Path, name: str) -> Path:
    path = Path(path).expanduser().resolve()
    if not path.is_dir():
        raise FileNotFoundError(f"{name} directory not found: {path}")
    return path


def load_json(path: Path) -> dict:
    if not path.is_file():
        raise FileNotFoundError(f"Required metadata not found: {path}")
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def has_model_weights(path: Path) -> bool:
    return any((path / fname).is_file() for fname in WEIGHT_FILENAMES)


def select_device(name: str = "auto") -> torch.device:
    if name == "auto":
        if torch.cuda.is_available():
            return torch.device("cuda")
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return torch.device("mps")
        return torch.device("cpu")
    chosen = torch.device(name)
    if chosen.type == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("--device cuda requested but CUDA is unavailable")
    if chosen.type == "mps" and not (
        hasattr(torch.backends, "mps") and torch.backends.mps.is_available()
    ):
        raise RuntimeError("--device mps requested but MPS is unavailable")
    return chosen


def release_handle(handle: ACDHandle | ACSAHandle) -> None:
    """Release model weights before loading the next stage onto a small GPU."""
    device = handle.device
    handle.model = None
    gc.collect()
    if device.type == "cuda":
        torch.cuda.empty_cache()
    if device.type == "mps" and hasattr(torch.mps, "empty_cache"):
        torch.mps.empty_cache()


def read_acd_report(model_dir: Path) -> dict:
    for name in ("acd_results.json", ".acd_results.json"):
        candidate = model_dir / name
        if candidate.is_file():
            return load_json(candidate)
    raise FileNotFoundError(
        f"No ACD results/threshold metadata found in {model_dir}. "
        "Thresholds must be selected on Validation, never on Testing."
    )


def get_model_label_order(config: Any, expected: tuple[str, ...], *,
                          allow_generic: bool = False) -> tuple[str, ...]:
    mapping = config.id2label
    order = tuple(str(mapping.get(i, mapping.get(str(i), ""))) for i in range(len(expected)))
    if allow_generic and all(x.startswith("LABEL_") for x in order):
        print("WARNING: ACD checkpoint has generic label names; using shared.labels order.", file=sys.stderr, flush=True)
        order = expected
    if len(order) != len(expected) or set(order) != set(expected):
        raise ValueError(f"Model output order {order} differs from expected {expected}")
    return order


@dataclass
class ACDHandle:
    model: Any
    tokenizer: Any
    order: tuple[str, ...]
    thresholds: np.ndarray
    max_length: int
    device: torch.device
    kind: str


@dataclass
class ACSAHandle:
    model: Any
    tokenizer: Any
    max_length: int
    device: torch.device


def load_acd(model_dir: Path, device: torch.device) -> ACDHandle:
    """Load full fine-tuned ACD, with saved validation-selected thresholds."""
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    model_dir = require_dir(model_dir, "ACD model")
    report = read_acd_report(model_dir)
    if (model_dir / "adapter_config.json").exists():
        raise ValueError("Expected a full fine-tuned ACD checkpoint")
    if not (model_dir / "config.json").is_file() or not has_model_weights(model_dir):
        raise FileNotFoundError(f"ACD checkpoint requires config.json and model weights: {model_dir}")
    model, info = AutoModelForSequenceClassification.from_pretrained(
        str(model_dir), local_files_only=True, output_loading_info=True
    )
    if any(info.get(key) for key in ("missing_keys", "mismatched_keys", "error_msgs")):
        raise ValueError(f"Incomplete ACD checkpoint: {info}")
    order = get_model_label_order(model.config, CODES)
    kind = "full fine-tuning"

    saved_codes = report.get("label_names", {})
    if saved_codes and set(saved_codes) != set(CODES):
        raise ValueError("ACD results label_names does not match shared.labels")

    chosen = report.get("category_thresholds")
    if isinstance(chosen, dict) and all(code in chosen for code in order):
        thresholds = np.asarray([float(chosen[code]) for code in order])
    elif report.get("global_threshold") is not None:
        thresholds = np.full(len(order), float(report["global_threshold"]))
    else:
        raise ValueError("ACD results have no saved Validation-selected thresholds")
    if not np.isfinite(thresholds).all() or ((thresholds < 0) | (thresholds > 1)).any():
        raise ValueError("ACD thresholds must be finite and between 0 and 1")

    tokenizer = AutoTokenizer.from_pretrained(str(model_dir), use_fast=False, local_files_only=True)
    max_len = int(report["training_parameters"]["max_length"])
    if max_len <= 0:
        raise ValueError("Invalid saved ACD max_length")
    model = model.to(device).eval()
    print(f"ACD: {kind}; max_length={max_len}; thresholds from Validation", file=sys.stderr, flush=True)
    return ACDHandle(model, tokenizer, order, thresholds, max_len, device, kind)


def load_acsa(model_dir: Path, device: torch.device) -> ACSAHandle:
    """Load the user's full-fine-tuned, V1 comment-first ACSA checkpoint."""
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    model_dir = require_dir(model_dir, "ACSA model")
    if not (model_dir / "config.json").is_file() or not has_model_weights(model_dir):
        raise FileNotFoundError(f"ACSA full checkpoint requires config.json and model weights: {model_dir}")
    report = load_json(model_dir / "acsa_results.json")
    expected_format = "tokenizer(text=model_text, text_pair='Aspect: CODE — NAME')"
    if report.get("input_format") not in (None, expected_format):
        raise ValueError(
            f"Unsupported ACSA input format: {report['input_format']}. "
            "This runtime implements the original V1 comment-first paired input."
        )
    if report.get("label_order") not in (None, list(SENTIMENTS)):
        raise ValueError("ACSA report sentiment order differs from Negative, Neutral, Positive")
    if report.get("aspect_codes") not in (None, list(CODES)):
        raise ValueError("ACSA report aspect codes differ from shared.labels")
    model = AutoModelForSequenceClassification.from_pretrained(
        str(model_dir), local_files_only=True, output_loading_info=True
    )
    model, info = model
    if any(info.get(key) for key in ("missing_keys", "mismatched_keys", "error_msgs")):
        raise ValueError(f"Incomplete ACSA checkpoint: {info}")
    order = get_model_label_order(model.config, SENTIMENTS)
    if order != SENTIMENTS:
        raise ValueError(f"ACSA output order must be {SENTIMENTS}, got {order}")
    tokenizer = AutoTokenizer.from_pretrained(str(model_dir), use_fast=False, local_files_only=True)
    max_len = int(report["training_parameters"]["max_length"])
    if max_len <= 0:
        raise ValueError("Invalid saved ACSA max_length")
    model = model.to(device).eval()
    print(f"ACSA: full fine-tuning, V1 paired input; max_length={max_len}", file=sys.stderr, flush=True)
    return ACSAHandle(model, tokenizer, max_len, device)


def input_would_truncate(handle: ACDHandle | ACSAHandle, text: str, *, aspect_code: str | None = None) -> bool:
    """Measure the untruncated sequence, including special tokens and paired prompt."""
    kwargs = {"text_pair": aspect_prompt(aspect_code)} if aspect_code is not None else {}
    encoded = handle.tokenizer(text, add_special_tokens=True, truncation=False,
                               padding=False, verbose=False, **kwargs)
    return len(encoded["input_ids"]) > handle.max_length


@torch.inference_mode()
def infer_acd(handle: ACDHandle, texts: list[str], batch_size: int = 2) -> np.ndarray:
    if not texts:
        return np.zeros((0, len(handle.order)), dtype=np.float32)
    outputs = []
    for start in range(0, len(texts), batch_size):
        features = handle.tokenizer(
            texts[start:start + batch_size], max_length=handle.max_length,
            truncation=True, padding=True, return_tensors="pt"
        )
        features = {name: value.to(handle.device) for name, value in features.items()}
        if handle.device.type == "cuda":
            dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
            with torch.autocast("cuda", dtype=dtype):
                logits = handle.model(**features).logits
        else:
            logits = handle.model(**features).logits
        outputs.append(torch.sigmoid(logits.float()).cpu().numpy())
    return np.concatenate(outputs, axis=0)


def aspect_prompt(code: str) -> str:
    if code not in CODES:
        raise ValueError(f"Unexpected aspect category {code!r}")
    return f"Aspect: {code} — {ASPECT_NAMES[code]}"


@torch.inference_mode()
def infer_acsa(handle: ACSAHandle, pairs: list[tuple[str, str]],
               batch_size: int = 2) -> np.ndarray:
    if not pairs:
        return np.zeros((0, len(SENTIMENTS)), dtype=np.float32)
    outputs = []
    for start in range(0, len(pairs), batch_size):
        batch = pairs[start:start + batch_size]
        texts = [t for t, _ in batch]
        prompts = [aspect_prompt(code) for _, code in batch]
        features = handle.tokenizer(
            texts, text_pair=prompts, truncation="only_first",
            max_length=handle.max_length, padding=True, return_tensors="pt"
        )
        features = {name: value.to(handle.device) for name, value in features.items()}
        if handle.device.type == "cuda":
            dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
            with torch.autocast("cuda", dtype=dtype):
                logits = handle.model(**features).logits
        else:
            logits = handle.model(**features).logits
        outputs.append(torch.softmax(logits.float(), dim=-1).cpu().numpy())
    return np.concatenate(outputs, axis=0)
