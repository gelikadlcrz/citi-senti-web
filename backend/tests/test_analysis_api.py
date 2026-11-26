"""API contract tests; no checkpoint loading, database or network required."""
import unittest
from unittest.mock import Mock

from fastapi.testclient import TestClient

from app.main import app
from app.ml.service import ModelUnavailable
from app.routers.analysis import get_analysis_service


class AnalysisApiTests(unittest.TestCase):
    def setUp(self):
        self.engine = Mock()
        app.dependency_overrides[get_analysis_service] = lambda: self.engine
        self.addCleanup(app.dependency_overrides.pop, get_analysis_service, None)
        self.client = TestClient(app)
        self.addCleanup(self.client.close)

    def response(self, predictions):
        return {"comment": "Sample", "predictions": predictions,
                "model_version": "test-model", "mode": "live",
                "truncation": {"acd": False, "acsa_aspects": []}}

    def test_health(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "service": "citi-senti-api"})

    def test_valid_analysis(self):
        expected = self.response([{"aspect_code": "A10", "sentiment": "positive"},
                                  {"aspect_code": "A07", "sentiment": "negative"}])
        self.engine.predict.return_value = expected
        response = self.client.post("/api/v1/analysis", json={"comment": "  Sample  "})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected)
        self.assertEqual(response.headers["cache-control"], "no-store")
        self.engine.predict.assert_called_once_with("Sample")

    def test_truncation_metadata(self):
        self.engine.predict.return_value = {**self.response([{"aspect_code": "A10", "sentiment": "positive"}]),
            "truncation": {"acd": True, "acsa_aspects": ["A10"]}}
        response = self.client.post("/api/v1/analysis", json={"comment": "Sample"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["truncation"], {"acd": True, "acsa_aspects": ["A10"]})

    def test_invalid_truncation_metadata(self):
        for value in ({"acd": "false", "acsa_aspects": []},
                      {"acd": False, "acsa_aspects": ["A02"]},
                      {"acd": False, "acsa_aspects": ["A10", "A10"]}, None):
            with self.subTest(value=value):
                self.engine.predict.return_value = {**self.response([{"aspect_code": "A10", "sentiment": "positive"}]), "truncation": value}
                self.assertEqual(self.client.post("/api/v1/analysis", json={"comment": "Sample"}).status_code, 500)

    def test_invalid_comments(self):
        for body in ({}, {"comment": ""}, {"comment": " \n "},
                     {"comment": "x" * 1001}, {"comment": None}, {"comment": 123}):
            with self.subTest(body=body):
                response = self.client.post("/api/v1/analysis", json=body)
                self.assertEqual(response.status_code, 422)
        self.engine.predict.assert_not_called()

    def test_maximum_length(self):
        text = "x" * 1000
        self.engine.predict.return_value = {**self.response([]), "comment": text}
        response = self.client.post("/api/v1/analysis", json={"comment": text})
        self.assertEqual(response.status_code, 200)
        self.engine.predict.assert_called_once_with(text)

    def test_empty_predictions(self):
        self.engine.predict.return_value = self.response([])
        response = self.client.post("/api/v1/analysis", json={"comment": "Sample"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["predictions"], [])

    def test_unavailable_model(self):
        self.engine.predict.side_effect = ModelUnavailable("private details")
        response = self.client.post("/api/v1/analysis", json={"comment": "Sample"})
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"detail": "Analysis model is unavailable."})

    def test_inference_failure(self):
        self.engine.predict.side_effect = RuntimeError("private details")
        response = self.client.post("/api/v1/analysis", json={"comment": "Sample"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"detail": "Analysis failed."})

    def test_invalid_predictions(self):
        for predictions in ([{"aspect_code": "A12", "sentiment": "positive"}],
                            [{"aspect_code": "A01", "sentiment": "unknown"}],
                            [{"aspect_code": "A01", "sentiment": "positive"},
                             {"aspect_code": "A01", "sentiment": "negative"}]):
            with self.subTest(predictions=predictions):
                self.engine.predict.return_value = self.response(predictions)
                response = self.client.post("/api/v1/analysis", json={"comment": "Sample"})
                self.assertEqual(response.status_code, 500)
                self.assertEqual(response.json(), {"detail": "Analysis failed."})


if __name__ == "__main__":
    unittest.main()
