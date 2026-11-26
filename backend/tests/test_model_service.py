import os
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

import numpy as np

from app.ml.service import AnalysisService, ModelUnavailable, BACKEND


class ServiceTests(unittest.TestCase):
    def make_engine(self, mode):
        engine = AnalysisService()
        engine._validated = True
        engine.mode = mode
        engine.acd_batch_size = 2
        engine.acsa_batch_size = 2
        engine.version = 'test'
        engine.device = 'cpu'
        engine.acd_dir = 'acd'
        engine.acsa_dir = 'acsa'
        runtime = Mock()
        engine._runtime = runtime
        runtime.load_acd.return_value = SimpleNamespace(order=('A01','A04','A10'), thresholds=np.array([.5,.7,.3]))
        runtime.input_would_truncate.return_value = False
        runtime.infer_acd.return_value = np.array([[.49,.7,.4]])
        runtime.infer_acsa.return_value = np.array([[.8,.1,.1],[.1,.2,.7]])
        return engine, runtime

    def test_phase2_environment_names_and_batch_sizes(self):
        engine = AnalysisService()
        with patch.dict(os.environ, {
            'GLOT_ACD_MODEL_DIR': 'custom/acd',
            'GLOT_ACSA_MODEL_DIR': 'custom/acsa',
            'GLOT_ACD_BATCH_SIZE': '3',
            'GLOT_ACSA_BATCH_SIZE': '4',
        }, clear=True), patch('app.ml.service.load_dotenv'):
            engine._configure()
        self.assertEqual(engine.acd_dir, BACKEND / 'custom/acd')
        self.assertEqual(engine.acsa_dir, BACKEND / 'custom/acsa')
        self.assertEqual((engine.acd_batch_size, engine.acsa_batch_size), (3, 4))
        self.assertEqual(engine.mode, 'sequential')

    def test_blank_or_oversized_input(self):
        engine, runtime = self.make_engine('sequential')
        for text in ('', '  ', 'x' * 1001):
            with self.assertRaises(ValueError):
                engine.predict(text)
        runtime.load_acd.assert_not_called()

    def test_resident_loads_once_and_pairs_in_order(self):
        engine, runtime = self.make_engine('resident')
        result = engine.predict('  Mixed comment!  ')
        self.assertEqual(result['predictions'], [{'aspect_code':'A04','sentiment':'negative'}, {'aspect_code':'A10','sentiment':'positive'}])
        runtime.infer_acsa.assert_called_once_with(engine.acsa, [('Mixed comment!','A04'),('Mixed comment!','A10')], batch_size=2)
        engine.predict('second')
        runtime.load_acd.assert_called_once()
        runtime.load_acsa.assert_called_once()

    def test_sequential_releases_models(self):
        engine, runtime = self.make_engine('sequential')
        engine.predict('test')
        self.assertEqual(runtime.release_handle.call_count, 2)
        self.assertIsNone(engine.acd)
        self.assertIsNone(engine.acsa)

    def test_no_aspect_skips_acsa(self):
        engine, runtime = self.make_engine('sequential')
        runtime.infer_acd.return_value = np.zeros((1,3))
        self.assertEqual(engine.predict('test')['predictions'], [])
        runtime.load_acsa.assert_not_called()
        runtime.infer_acsa.assert_not_called()

    def test_tokenizer_length_includes_pair_and_special_tokens(self):
        from app.ml.absa_runtime import input_would_truncate
        tokenizer = Mock()
        handle = SimpleNamespace(tokenizer=tokenizer, max_length=128)
        tokenizer.return_value = {'input_ids': list(range(128))}
        self.assertFalse(input_would_truncate(handle, 'comment'))
        tokenizer.assert_called_once_with('comment', add_special_tokens=True,
                                          truncation=False, padding=False, verbose=False)
        tokenizer.reset_mock()
        tokenizer.return_value = {'input_ids': list(range(129))}
        self.assertTrue(input_would_truncate(handle, 'comment', aspect_code='A10'))
        tokenizer.assert_called_once_with('comment', add_special_tokens=True,
            truncation=False, padding=False, verbose=False,
            text_pair='Aspect: A10 — Traffic and Transportation Impact')

    def test_truncation_flags_follow_actual_stages(self):
        engine, runtime = self.make_engine('sequential')
        runtime.input_would_truncate.side_effect = [True, False, True]
        result = engine.predict('long comment')
        self.assertEqual(result['truncation'], {'acd': True, 'acsa_aspects': ['A10']})
        self.assertEqual(runtime.input_would_truncate.call_count, 3)
        self.assertEqual(len(result['predictions']), 2)

    def test_no_aspect_truncation(self):
        engine, runtime = self.make_engine('sequential')
        runtime.infer_acd.return_value = np.zeros((1,3))
        runtime.input_would_truncate.return_value = True
        self.assertEqual(engine.predict('long comment')['truncation'], {'acd': True, 'acsa_aspects': []})
        runtime.load_acsa.assert_not_called()

    def test_loading_failure(self):
        engine, runtime = self.make_engine('resident')
        runtime.load_acsa.side_effect = FileNotFoundError('missing')
        with self.assertLogs('app.ml.service', level='ERROR'), self.assertRaises(ModelUnavailable):
            engine.predict('test')
        self.assertIsNone(engine.acd)
        self.assertIsNone(engine.acsa)
        runtime.release_handle.assert_called_once()


if __name__ == '__main__':
    unittest.main()
