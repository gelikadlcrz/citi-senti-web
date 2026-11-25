
import json
import statistics
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

API_URL = "http://127.0.0.1:8000/api/v1/analysis"

SAMPLES = [
    (
        "English",
        "The new traffic policy has reduced congestion, "
        "but its enforcement remains inconsistent."
    ),
    (
        "Tagalog",
        "Maganda ang programa ng lungsod pero "
        "masyadong mahal ang mga bayarin."
    ),
    (
        "Ilocano",
        "Nasayaat ti programa ti siudad ngem "
        "nabayag ti panaguray iti terminal."
    ),
    (
        "Code-switched",
        "Matagal ang pila sa terminal, pero mas maayos "
        "na ang traffic management ngayon. Sana mas "
        "mabilis din ang pagresponde sa reklamo."
    ),
    (
        "Neutral",
        "The city government announced a new "
        "traffic management policy."
    ),
    (
        "Unrelated",
        "I enjoy listening to music."
    ),
]

REPETITIONS = 2


def analyze(comment):
    request = Request(
        API_URL,
        data=json.dumps(
            {"comment": comment},
            ensure_ascii=False
        ).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    start = time.perf_counter()

    with urlopen(request, timeout=300) as response:
        result = json.loads(response.read().decode("utf-8"))

    elapsed = time.perf_counter() - start

    if result["mode"] != "live":
        raise ValueError("Expected live model inference")

    return result, elapsed


def main():
    durations = []
    failures = 0
    previous_results = {}

    for run in range(1, REPETITIONS + 1):
        print(f"\n{'=' * 50}")
        print(f"BENCHMARK RUN {run}")
        print("=" * 50)

        for language, comment in SAMPLES:
            print(f"\nLanguage / case: {language}")
            print(f"Comment: {comment}")

            try:
                result, elapsed = analyze(comment)
                durations.append(elapsed)

                predictions = result["predictions"]

                print(f"Response time: {elapsed:.3f} seconds")
                print(f"Detected aspects: {len(predictions)}")
                print(f"Model: {result['model_version']}")

                if not predictions:
                    print("No aspects detected.")

                for prediction in predictions:
                    print(
                        f"  {prediction['aspect_code']}: "
                        f"{prediction['sentiment']}"
                    )

                if language in previous_results:
                    if previous_results[language] != predictions:
                        print("WARNING: Predictions changed.")

                previous_results[language] = predictions

            except HTTPError as exc:
                failures += 1
                print(f"HTTP error: {exc.code}")
                print(exc.read().decode("utf-8"))

            except (URLError, TimeoutError, ValueError) as exc:
                failures += 1
                print(f"Request failed: {exc}")

    print(f"\n{'=' * 50}")
    print("BENCHMARK SUMMARY")
    print("=" * 50)

    print(f"Successful requests: {len(durations)}")
    print(f"Failed requests: {failures}")

    if durations:
        print(f"First successful response: {durations[0]:.3f}s")
        print(f"Fastest response: {min(durations):.3f}s")
        print(f"Slowest response: {max(durations):.3f}s")
        print(f"Average response: {statistics.mean(durations):.3f}s")
        print(f"Median response: {statistics.median(durations):.3f}s")

        if len(durations) > 1:
            print(
                "Average subsequent response: "
                f"{statistics.mean(durations[1:]):.3f}s"
            )


if __name__ == "__main__":
    main()
