-- Rename custom asset keys in stored JSON and external holdings

UPDATE "ExternalHolding"
SET "assetKey" = 'customAsset:' || substring("assetKey" from 8)
WHERE "assetKey" LIKE 'custom:%';

UPDATE "FreedomPlan"
SET "portfolioAllocation" = (
  SELECT COALESCE(jsonb_object_agg(new_key, value), '{}'::jsonb)
  FROM (
    SELECT
      CASE
        WHEN key LIKE 'custom:%' THEN 'customAsset:' || substring(key from 8)
        ELSE key
      END AS new_key,
      value
    FROM jsonb_each("portfolioAllocation"::jsonb)
  ) AS entries
)::json
WHERE "portfolioAllocation"::text LIKE '%"custom:%';

UPDATE "FreedomPlan"
SET "assetCapitals" = (
  SELECT COALESCE(jsonb_object_agg(new_key, value), '{}'::jsonb)
  FROM (
    SELECT
      CASE
        WHEN key LIKE 'custom:%' THEN 'customAsset:' || substring(key from 8)
        ELSE key
      END AS new_key,
      value
    FROM jsonb_each("assetCapitals"::jsonb)
  ) AS entries
)::json
WHERE "assetCapitals"::text LIKE '%"custom:%';

UPDATE "PlanProgress"
SET "assetDetails" = (
  SELECT COALESCE(jsonb_object_agg(new_key, value), '{}'::jsonb)
  FROM (
    SELECT
      CASE
        WHEN key LIKE 'custom:%' THEN 'customAsset:' || substring(key from 8)
        ELSE key
      END AS new_key,
      value
    FROM jsonb_each("assetDetails"::jsonb)
  ) AS entries
)::json
WHERE "assetDetails" IS NOT NULL
  AND "assetDetails"::text LIKE '%"custom:%';
