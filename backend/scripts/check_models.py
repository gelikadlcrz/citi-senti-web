"""Load both full checkpoints, then predict a sample; run from backend with -m."""
import argparse
import json

from app.ml.service import AnalysisService


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--text', default='Maganda ang traffic policy pero kulang ang enforcement.')
    parser.add_argument('--metadata-only', action='store_true', help='Validate configuration and local metadata without loading model weights')
    args = parser.parse_args()
    engine = AnalysisService()
    engine._prepare()
    print(f'Device: {engine.device}; mode: {engine.mode}', flush=True)
    if args.metadata_only:
        print('Model metadata and paths validated. Weights and inference not tested.')
        return
    # Check both stages even if the test comment produces no detected aspects.
    if engine.mode == 'sequential':
        for loader, path in [(engine._runtime.load_acd, engine.acd_dir), (engine._runtime.load_acsa, engine.acsa_dir)]:
            handle = loader(path, engine.device)
            engine._runtime.release_handle(handle)
            del handle
    else:
        engine._ensure_resident()
    print(json.dumps(engine.predict(args.text), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
