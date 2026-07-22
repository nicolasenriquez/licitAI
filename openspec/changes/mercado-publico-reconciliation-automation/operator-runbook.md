# Mercado Público Reconciliation Automation Runbook

## Post-deploy backfill

Register the scheduler through the normal command bootstrap, then run one
explicit reconciliation refresh. Startup must not enqueue this backfill.

```bash
yarn command:prod mercado-publico:run \
  --job-name reconciliation-refresh
```

The command is safe to repeat: canonical and gold rows use natural-key
upserts, reconciliation pairs/events use their existing deduplication keys, and
gold rows are never deleted by this refresh.

## Verification queries

Run these read-only queries against the deployment's `mp` schema after the
backfill:

```sql
SELECT process_type, COUNT(*)
FROM mp.gold_detected_process
GROUP BY process_type
ORDER BY process_type;

SELECT job_name, status, started_at, finished_at, error_summary
FROM mp.stg_job_run
WHERE job_name = 'reconciliation-refresh'
ORDER BY started_at DESC;

SELECT COUNT(*)
FROM mp.reconciliation_public_market_entities;
```

The gold result must include every valid canonical key from `mp.licitacion`,
`mp.orden_compra`, and `mp.compra_agil`; unavailable fields must remain null.
The latest reconciliation run must be `success`, or `failed` with an
actionable `error_summary`. A failed run must not erase prior gold rows.

The scheduler is daily at a fixed 24-hour interval with stable ID
`mercado-publico-reconciliation-refresh`. It schedules reconciliation only;
API and CSV ingestion remain manually triggered.
