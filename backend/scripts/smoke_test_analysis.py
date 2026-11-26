"""Live HTTP contract smoke test using synthetic comments only (no database writes)."""
import argparse
import json
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

CODES = {f'A{i:02}' for i in range(1, 12)}
SENTIMENTS = {'positive', 'neutral', 'negative'}


def request(base, path, payload=None, timeout=300):
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode('utf-8')
    req = Request(base + path, data=body, headers={'Accept': 'application/json', 'Content-Type': 'application/json'}, method='GET' if body is None else 'POST')
    try:
        with urlopen(req, timeout=timeout) as response:
            return response.status, response.headers, json.loads(response.read())
    except HTTPError as exc:
        return exc.code, exc.headers, None


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def validate_result(data, headers, comment):
    require(isinstance(data, dict), 'Expected a JSON object')
    require(data.get('comment') == comment.strip(), 'Returned comment differs')
    require(data.get('mode') == 'live', 'Expected live mode')
    require(isinstance(data.get('model_version'), str) and bool(data['model_version'].strip()), 'Missing model version')
    require('no-store' in headers.get('Cache-Control', '').lower(), 'Missing Cache-Control: no-store')
    predictions = data.get('predictions')
    require(isinstance(predictions, list), 'Missing predictions array')
    seen = set()
    for p in predictions:
        require(isinstance(p, dict), 'Invalid prediction object')
        code, sentiment = p.get('aspect_code'), p.get('sentiment')
        require(isinstance(code, str) and code in CODES and code not in seen, 'Invalid or duplicate aspect code')
        require(isinstance(sentiment, str) and sentiment in SENTIMENTS, 'Invalid sentiment')
        seen.add(code)
    truncation = data.get('truncation')
    require(isinstance(truncation, dict) and type(truncation.get('acd')) is bool, 'Invalid ACD truncation flag')
    affected = truncation.get('acsa_aspects')
    require(isinstance(affected, list) and all(isinstance(c, str) and c in seen for c in affected), 'Invalid ACSA truncation codes')
    require(len(affected) == len(set(affected)), 'Duplicate ACSA truncation codes')
    return predictions, truncation


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:8000')
    parser.add_argument('--timeout', type=float, default=300)
    args = parser.parse_args()
    base = args.base_url.rstrip('/')
    try:
        status, _, data = request(base, '/api/v1/health', timeout=args.timeout)
        require(status == 200 and isinstance(data, dict) and data.get('status') == 'ok', 'Health endpoint failed')
    except Exception as exc:
        print(f'FAIL health: {exc}', file=sys.stderr)
        return 1
    print('PASS health', flush=True)
    cases = [
        ('empty', {'comment': ''}, 422),
        ('whitespace', {'comment': '   '}, 422),
        ('missing', {}, 422),
        ('non-string', {'comment': 42}, 422),
        ('over limit', {'comment': 'a' * 1001}, 422),
        ('English', {'comment': 'The new traffic policy reduces congestion, but enforcement remains inconsistent.'}, 200),
        ('Tagalog', {'comment': 'Maganda ang programa ng lungsod pero mahal ang mga bayarin.'}, 200),
        ('Ilocano', {'comment': 'Nasayaat ti programa ti siudad ngem nabayag ti panaguray iti terminal.'}, 200),
        ('Code-switched', {'comment': 'Matagal ang pila sa terminal, pero mas maayos na ang traffic management ngayon.'}, 200),
        ('unrelated', {'comment': 'I enjoy listening to music.'}, 200),
        ('exactly 1000 characters', {'comment': 'a' * 1000}, 200),
        ('long token sequence', {'comment': ' '.join(['bus'] * 200)}, 200),
    ]
    failed = 0
    for name, payload, expected in cases:
        start = time.perf_counter()
        try:
            status, headers, data = request(base, '/api/v1/analysis', payload, args.timeout)
            require(status == expected, f'Expected HTTP {expected}, got {status}')
            if expected == 200:
                predictions, truncation = validate_result(data, headers, payload['comment'])
                if name == 'long token sequence':
                    require(truncation['acd'], 'Expected ACD truncation for the long synthetic input')
                print(f'PASS {name}: {len(predictions)} aspects; truncation={truncation}; {time.perf_counter()-start:.2f}s', flush=True)
            else:
                print(f'PASS {name}: HTTP {status}', flush=True)
        except (AssertionError, URLError, OSError, ValueError, TypeError) as exc:
            failed += 1
            print(f'FAIL {name}: {exc}', flush=True)
    print(f'\n{len(cases)+1-failed}/{len(cases)+1} checks passed (including health).')
    print('Contract checks only: not an accuracy evaluation or browser test.')
    return int(failed > 0)


if __name__ == '__main__':
    raise SystemExit(main())
