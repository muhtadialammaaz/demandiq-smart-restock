"""
Unit and Integration Tests for DemandIQ Core Pipeline
"""

import unittest
import os
import sqlite3
from demandiq.db import init_db, get_connection
from demandiq.services.synth import generate_sample_dataset
from demandiq.services.pipeline import run_pipeline
from demandiq.services.forecast import compute_wape, compute_bias, holt_winters_additive, croston_sba
from demandiq.services.advisor import generate_advisory

class TestDemandIQPipeline(unittest.TestCase):

    def setUp(self):
        self.test_db = "test_demandiq.sqlite3"
        init_db(self.test_db)
        self.conn = get_connection(self.test_db)

    def tearDown(self):
        self.conn.close()
        if os.path.exists(self.test_db):
            os.remove(self.test_db)

    def test_forecast_math(self):
        actual = [10, 12, 14, 10, 15]
        forecast = [11, 11, 13, 10, 16]
        wape = compute_wape(actual, forecast)
        bias = compute_bias(actual, forecast)
        self.assertGreater(wape, 0.0)
        self.assertLess(wape, 0.5)

        hw = holt_winters_additive(list(range(1, 30)), horizon=7)
        self.assertEqual(len(hw), 7)

        croston = croston_sba([0, 0, 5, 0, 0, 0, 4, 0, 6], horizon=5)
        self.assertEqual(len(croston), 5)
        self.assertGreater(croston[0], 0)

    def test_end_to_end_pipeline(self):
        # 1. Generate sample dataset
        dataset_id = generate_sample_dataset(self.conn, name="Test Store", num_skus=5)
        self.assertIsNotNone(dataset_id)

        # 2. Run pipeline
        summary = run_pipeline(self.conn, dataset_id)
        self.assertEqual(summary["products_analyzed"], 5)
        self.assertGreaterEqual(summary["total_money_at_risk"], 0)

        # 3. Verify recommendations saved in SQLite
        cur = self.conn.cursor()
        cur.execute("SELECT * FROM recommendations WHERE dataset_id = ?", (dataset_id,))
        recs = cur.fetchall()
        self.assertEqual(len(recs), 5)
        for r in recs:
            self.assertIn(r["status"], ["critical", "soon", "ok", "overstock", "dead"])
            self.assertTrue(len(r["message_bn"]) > 0)
            self.assertTrue(len(r["message_en"]) > 0)

if __name__ == "__main__":
    unittest.main()
