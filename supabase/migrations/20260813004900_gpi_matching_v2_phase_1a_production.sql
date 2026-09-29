BEGIN;

DO $$
DECLARE
  v_hash text;
  v_version_count integer;
  v_version_id integer;
BEGIN
  SELECT md5(pg_get_functiondef(p.oid))
  INTO v_hash
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'gpi_service_search_public_opportunities'
    AND pg_get_function_identity_arguments(p.oid) =
      'p_goal text, p_city_area_id uuid, p_cause_tag_ids uuid[], p_activity_tag_ids uuid[], p_schedule_types text[], p_limit integer';

  IF v_hash IS DISTINCT FROM '9f4491062cd2aca849fd47cb026cc706' THEN
    RAISE EXCEPTION
      'Legacy GPI search RPC baseline mismatch. Expected %, got %',
      '9f4491062cd2aca849fd47cb026cc706',
      coalesce(v_hash, '<missing>');
  END IF;

  SELECT count(*), min(id)
  INTO v_version_count, v_version_id
  FROM public.gpi_taxonomy_versions
  WHERE status = 'active'
    AND label = 'dallas_pilot_v1';

  IF v_version_count <> 1 OR v_version_id <> 1 THEN
    RAISE EXCEPTION
      'Expected exactly one active dallas_pilot_v1 taxonomy version with id=1; count=%, id=%',
      v_version_count, v_version_id;
  END IF;

  IF (
    SELECT count(*)
    FROM public.gpi_city_areas
    WHERE active
      AND slug IN ('dallas','arlington','frisco','irving','plano')
  ) <> 5 THEN
    RAISE EXCEPTION 'Expected all five current DFW pilot city areas to exist and be active';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.gpi_activity_tags
    WHERE slug <> 'sports_recreation'
      AND (
        lower(label) = 'sports & recreation'
        OR lower(slug) IN ('sports','sports_recreation')
        OR synonyms && ARRAY['sports','basketball','soccer','fitness','recreation','athletics']::text[]
      )
  ) THEN
    RAISE EXCEPTION 'Sports/Recreation taxonomy collision detected; review before migration';
  END IF;
END
$$;

CREATE TABLE public.gpi_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  label text NOT NULL UNIQUE
    CHECK (
      label = btrim(label)
      AND char_length(label) BETWEEN 1 AND 80
    ),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gpi_markets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.gpi_markets FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.gpi_markets TO service_role;

CREATE TRIGGER gpi_markets_updated_at
BEFORE UPDATE ON public.gpi_markets
FOR EACH ROW
EXECUTE FUNCTION public.gpi_set_updated_at();

INSERT INTO public.gpi_markets (slug, label, active)
VALUES ('dallas_fort_worth', 'Dallas–Fort Worth', true);

ALTER TABLE public.gpi_city_areas
  ADD COLUMN market_id uuid NULL;

ALTER TABLE public.gpi_city_areas
  ADD CONSTRAINT gpi_city_areas_market_id_fkey
  FOREIGN KEY (market_id)
  REFERENCES public.gpi_markets(id)
  ON DELETE RESTRICT;

DO $$
DECLARE
  v_market_id uuid;
  v_updated integer;
BEGIN
  SELECT id INTO STRICT v_market_id
  FROM public.gpi_markets
  WHERE slug = 'dallas_fort_worth'
    AND active;

  UPDATE public.gpi_city_areas
  SET market_id = v_market_id
  WHERE slug IN ('dallas','arlington','frisco','irving','plano');

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated <> 5 THEN
    RAISE EXCEPTION
      'Expected to assign exactly 5 current pilot city areas to DFW; updated %',
      v_updated;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.gpi_city_areas
    WHERE slug IN ('dallas','arlington','frisco','irving','plano')
      AND market_id IS DISTINCT FROM v_market_id
  ) THEN
    RAISE EXCEPTION 'DFW market assignment validation failed';
  END IF;
END
$$;

INSERT INTO public.gpi_activity_tags (
  slug,
  label,
  synonyms,
  active,
  introduced_in_version_id
)
VALUES (
  'sports_recreation',
  'Sports & Recreation',
  ARRAY['sports','basketball','soccer','fitness','recreation','athletics']::text[],
  true,
  1
)
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  v_ok boolean;
BEGIN
  SELECT
    active
    AND introduced_in_version_id = 1
    AND retired_in_version_id IS NULL
    AND label = 'Sports & Recreation'
    AND synonyms @> ARRAY['sports','basketball','soccer','fitness','recreation','athletics']::text[]
  INTO v_ok
  FROM public.gpi_activity_tags
  WHERE slug = 'sports_recreation';

  IF coalesce(v_ok, false) IS NOT TRUE THEN
    RAISE EXCEPTION
      'sports_recreation exists but does not match the locked Phase 1 contract';
  END IF;
END
$$;

CREATE TABLE public.gpi_discovery_interest_mappings (
  interest_key text NOT NULL
    CHECK (interest_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  signal_type text NOT NULL
    CHECK (signal_type IN ('activity','cause','audience','goal')),
  signal_key text NOT NULL
    CHECK (signal_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (interest_key, signal_type, signal_key)
);

ALTER TABLE public.gpi_discovery_interest_mappings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.gpi_discovery_interest_mappings FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.gpi_discovery_interest_mappings TO service_role;

INSERT INTO public.gpi_discovery_interest_mappings
  (interest_key, signal_type, signal_key)
VALUES
  ('young_adults', 'audience', 'young_adults'),
  ('bible_study',  'activity', 'bible_study'),
  ('volunteer',    'goal',     'serve'),
  ('worship',      'activity', 'worship'),
  ('sports',       'activity', 'sports_recreation'),
  ('mentoring',    'activity', 'mentoring'),
  ('outreach',     'activity', 'outreach'),
  ('prayer',       'activity', 'prayer'),
  ('creative',     'activity', 'creative_arts'),
  ('professional', 'activity', 'professional_networking'),
  ('professional', 'cause',    'professional_fellowship'),
  ('men',          'audience', 'men'),
  ('women',        'audience', 'women'),
  ('families',     'audience', 'families'),
  ('students',     'audience', 'teenagers'),
  ('students',     'cause',    'youth_development'),
  ('missions',     'activity', 'missions_support'),
  ('missions',     'cause',    'local_missions'),
  ('missions',     'cause',    'global_missions');

DO $$
DECLARE
  v_rows integer;
  v_interests integer;
BEGIN
  SELECT count(*), count(DISTINCT interest_key)
  INTO v_rows, v_interests
  FROM public.gpi_discovery_interest_mappings;

  IF v_rows <> 19 OR v_interests <> 15 THEN
    RAISE EXCEPTION
      'Discovery mapping seed mismatch: expected 19 rows / 15 interests; got % / %',
      v_rows, v_interests;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.gpi_discovery_interest_mappings m
    WHERE m.signal_type = 'activity'
      AND NOT EXISTS (
        SELECT 1
        FROM public.gpi_activity_tags t
        WHERE t.slug = m.signal_key
          AND t.active
          AND t.retired_in_version_id IS NULL
      )
  ) THEN
    RAISE EXCEPTION 'At least one activity mapping does not resolve to an active canonical tag';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.gpi_discovery_interest_mappings m
    WHERE m.signal_type = 'cause'
      AND NOT EXISTS (
        SELECT 1
        FROM public.gpi_cause_tags t
        WHERE t.slug = m.signal_key
          AND t.active
          AND t.retired_in_version_id IS NULL
      )
  ) THEN
    RAISE EXCEPTION 'At least one cause mapping does not resolve to an active canonical tag';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.gpi_discovery_interest_mappings m
    WHERE m.signal_type = 'audience'
      AND NOT EXISTS (
        SELECT 1
        FROM public.gpi_audience_tags t
        WHERE t.slug = m.signal_key
          AND t.active
          AND t.retired_in_version_id IS NULL
      )
  ) THEN
    RAISE EXCEPTION 'At least one audience mapping does not resolve to an active canonical tag';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.gpi_discovery_interest_mappings m
    WHERE m.signal_type = 'goal'
      AND m.signal_key NOT IN ('serve','connect')
  ) THEN
    RAISE EXCEPTION 'Goal mapping must resolve only to serve/connect';
  END IF;
END
$$;

CREATE INDEX gpi_opportunity_activity_tags_activity_lookup_idx
  ON public.gpi_opportunity_activity_tags (activity_tag_id, opportunity_id);

CREATE INDEX gpi_opportunity_cause_tags_cause_lookup_idx
  ON public.gpi_opportunity_cause_tags (cause_tag_id, opportunity_id);

CREATE INDEX gpi_opportunity_participant_audiences_audience_lookup_idx
  ON public.gpi_opportunity_participant_audiences (audience_tag_id, opportunity_id);

CREATE OR REPLACE FUNCTION public.gpi_service_search_public_opportunities_v2(
  p_discovery_interest_keys text[] DEFAULT '{}'::text[],
  p_city_area_id uuid DEFAULT NULL::uuid,
  p_market_slug text DEFAULT 'dallas_fort_worth'::text,
  p_schedule_types text[] DEFAULT NULL::text[],
  p_limit integer DEFAULT 24
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_limit integer;
  v_market_id uuid;
  v_market_slug text;
  v_market_label text;
  v_selected_city_id uuid;
  v_selected_city_slug text;
  v_selected_city_label text;
  v_interest_keys text[] := ARRAY[]::text[];
  v_schedule_types text[] := ARRAY[]::text[];
  v_requested_count integer := 0;
  v_candidates jsonb := '[]'::jsonb;
  v_results jsonb := '[]'::jsonb;
  v_best jsonb;
  v_result_item jsonb;
  v_selected_ids uuid[] := ARRAY[]::uuid[];
  v_selected_hosts uuid[] := ARRAY[]::uuid[];
  v_selected_categories text[] := ARRAY[]::text[];
  v_exact_count integer := 0;
  v_target_count integer := 0;
  v_tiers text[] := ARRAY[]::text[];
  v_tier text;
  v_best_id uuid;
  v_best_host uuid;
  v_best_category text;
  v_used_nearby boolean := false;
  v_used_starter boolean := false;
  v_fallback_tier text;
BEGIN
  v_limit := greatest(1, least(coalesce(p_limit, 24), 50));

  SELECT m.id, m.slug, m.label
  INTO v_market_id, v_market_slug, v_market_label
  FROM public.gpi_markets m
  WHERE m.slug = lower(btrim(coalesce(p_market_slug, 'dallas_fort_worth')))
    AND m.active;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown or inactive GPI market: %', p_market_slug
      USING ERRCODE = '22023';
  END IF;

  SELECT coalesce(array_agg(x.k ORDER BY x.k), ARRAY[]::text[])
  INTO v_interest_keys
  FROM (
    SELECT DISTINCT lower(btrim(u.key)) AS k
    FROM unnest(coalesce(p_discovery_interest_keys, ARRAY[]::text[])) AS u(key)
    WHERE btrim(u.key) <> ''
  ) x;

  v_requested_count := cardinality(v_interest_keys);

  IF EXISTS (
    SELECT 1
    FROM unnest(v_interest_keys) AS k(interest_key)
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.gpi_discovery_interest_mappings m
      WHERE m.interest_key = k.interest_key
    )
  ) THEN
    RAISE EXCEPTION 'One or more Discovery interest keys are unknown'
      USING ERRCODE = '22023';
  END IF;

  SELECT coalesce(array_agg(x.k ORDER BY x.k), ARRAY[]::text[])
  INTO v_schedule_types
  FROM (
    SELECT DISTINCT lower(btrim(u.schedule_type)) AS k
    FROM unnest(coalesce(p_schedule_types, ARRAY[]::text[])) AS u(schedule_type)
    WHERE btrim(u.schedule_type) <> ''
  ) x;

  IF EXISTS (
    SELECT 1
    FROM unnest(v_schedule_types) AS s(schedule_type)
    WHERE s.schedule_type NOT IN ('one_time','recurring','flexible')
  ) THEN
    RAISE EXCEPTION 'Unsupported schedule type supplied to GPI v2 search'
      USING ERRCODE = '22023';
  END IF;

  IF p_city_area_id IS NOT NULL THEN
    SELECT c.id, c.slug, c.label
    INTO v_selected_city_id, v_selected_city_slug, v_selected_city_label
    FROM public.gpi_city_areas c
    WHERE c.id = p_city_area_id
      AND c.active
      AND c.market_id = v_market_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION
        'Selected city area is unknown, inactive, or outside selected market'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  WITH
  selected_keys AS (
    SELECT unnest(v_interest_keys) AS interest_key
  ),
  selected_mappings AS (
    SELECT m.interest_key, m.signal_type, m.signal_key
    FROM public.gpi_discovery_interest_mappings m
    JOIN selected_keys s ON s.interest_key = m.interest_key
  ),
  activity_hits AS (
    SELECT x.opportunity_id, m.interest_key, true AS is_precise
    FROM selected_mappings m
    JOIN public.gpi_activity_tags t
      ON m.signal_type = 'activity'
     AND t.slug = m.signal_key
     AND t.active
     AND t.retired_in_version_id IS NULL
    JOIN public.gpi_opportunity_activity_tags x
      ON x.activity_tag_id = t.id
  ),
  cause_hits AS (
    SELECT x.opportunity_id, m.interest_key, true AS is_precise
    FROM selected_mappings m
    JOIN public.gpi_cause_tags t
      ON m.signal_type = 'cause'
     AND t.slug = m.signal_key
     AND t.active
     AND t.retired_in_version_id IS NULL
    JOIN public.gpi_opportunity_cause_tags x
      ON x.cause_tag_id = t.id
  ),
  audience_hits AS (
    SELECT x.opportunity_id, m.interest_key, true AS is_precise
    FROM selected_mappings m
    JOIN public.gpi_audience_tags t
      ON m.signal_type = 'audience'
     AND t.slug = m.signal_key
     AND t.active
     AND t.retired_in_version_id IS NULL
    JOIN public.gpi_opportunity_participant_audiences x
      ON x.audience_tag_id = t.id
  ),
  goal_hits AS (
    SELECT v.id AS opportunity_id, m.interest_key, false AS is_precise
    FROM selected_mappings m
    JOIN public.gpi_public_opportunities_internal v
      ON m.signal_type = 'goal'
     AND v.goal = m.signal_key
  ),
  all_hits AS (
    SELECT * FROM activity_hits
    UNION ALL SELECT * FROM cause_hits
    UNION ALL SELECT * FROM audience_hits
    UNION ALL SELECT * FROM goal_hits
  ),
  matched_interest_rows AS (
    SELECT h.opportunity_id, h.interest_key, bool_or(h.is_precise) AS is_precise
    FROM all_hits h
    GROUP BY h.opportunity_id, h.interest_key
  ),
  match_summary AS (
    SELECT
      r.opportunity_id,
      count(*)::integer AS matched_interest_count,
      array_agg(r.interest_key ORDER BY r.interest_key) AS matched_interest_keys,
      count(*) FILTER (WHERE r.is_precise)::integer AS precise_interest_count
    FROM matched_interest_rows r
    GROUP BY r.opportunity_id
  ),
  raw AS (
    SELECT
      v.id,
      v.organization_id,
      v.primary_category,
      v.schedule_type,
      v.commitment_type,
      v.requires_background_check,
      v.requires_orientation,
      v.requires_application,
      v.requires_membership,
      v.min_age,
      v.max_age,
      v.next_starts_at,
      v.city_area_id,
      v.location_mode,
      to_jsonb(v) AS opportunity_json,
      coalesce(ms.matched_interest_count, 0) AS matched_interest_count,
      coalesce(ms.matched_interest_keys, ARRAY[]::text[]) AS matched_interest_keys,
      coalesce(ms.precise_interest_count, 0) AS precise_interest_count,
      (c.market_id = v_market_id OR v.location_mode = 'virtual') AS in_market,
      CASE
        WHEN p_city_area_id IS NOT NULL THEN v.city_area_id = p_city_area_id
        ELSE (c.market_id = v_market_id OR v.location_mode = 'virtual')
      END AS exact_geo,
      (
        NOT v.requires_membership
        AND NOT v.requires_application
        AND NOT v.requires_background_check
        AND NOT v.requires_orientation
        AND (v.commitment_type = 'drop_in' OR v.schedule_type = 'flexible')
      ) AS starter_eligible
    FROM public.gpi_public_opportunities_internal v
    LEFT JOIN public.gpi_city_areas c
      ON c.id = v.city_area_id
     AND c.active
    LEFT JOIN match_summary ms
      ON ms.opportunity_id = v.id
  ),
  scored AS (
    SELECT
      r.*,
      CASE
        WHEN r.matched_interest_count <= 0 THEN 0
        WHEN r.matched_interest_count = 1 THEN 60
        WHEN r.matched_interest_count = 2 THEN 82
        WHEN r.matched_interest_count = 3 THEN 94
        ELSE 100
      END AS interest_score,
      CASE WHEN r.exact_geo THEN 30 ELSE 0 END AS geography_score,
      CASE
        WHEN cardinality(v_schedule_types) > 0 AND r.schedule_type = ANY(v_schedule_types)
        THEN 25 ELSE 0
      END AS schedule_score,
      (
        CASE WHEN r.next_starts_at IS NOT NULL OR r.schedule_type = 'flexible' THEN 5 ELSE 0 END
        + CASE WHEN r.commitment_type = 'drop_in' THEN 4 ELSE 0 END
        + CASE
            WHEN NOT r.requires_membership
             AND NOT r.requires_application
             AND NOT r.requires_background_check
            THEN 3 ELSE 0
          END
        + CASE WHEN NOT r.requires_orientation THEN 2 ELSE 0 END
        + CASE WHEN r.min_age IS NULL AND r.max_age IS NULL THEN 1 ELSE 0 END
      ) AS low_friction_score
    FROM raw r
    WHERE r.in_market
  ),
  classified AS (
    SELECT
      s.*,
      (s.interest_score + s.geography_score + s.schedule_score + s.low_friction_score)::integer AS base_score,
      CASE
        WHEN v_requested_count = 0 AND s.starter_eligible THEN 'starter'
        WHEN v_requested_count > 0 AND s.matched_interest_count > 0 AND s.exact_geo THEN 'exact'
        WHEN v_requested_count > 0 AND s.matched_interest_count > 0 AND NOT s.exact_geo THEN 'nearby'
        WHEN v_requested_count > 0 AND s.starter_eligible THEN 'starter'
        ELSE NULL
      END AS result_tier
    FROM scored s
  )
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'opportunity_id', c.id,
        'host_id', c.organization_id,
        'primary_category', c.primary_category,
        'opportunity', c.opportunity_json,
        'matched_interest_count', c.matched_interest_count,
        'matched_interest_keys', to_jsonb(c.matched_interest_keys),
        'precise_interest_count', c.precise_interest_count,
        'base_score', c.base_score,
        'result_tier', c.result_tier
      )
    ),
    '[]'::jsonb
  )
  INTO v_candidates
  FROM classified c
  WHERE c.result_tier IS NOT NULL;

  SELECT count(*)
  INTO v_exact_count
  FROM jsonb_array_elements(v_candidates) AS j(e)
  WHERE e->>'result_tier' = 'exact';

  IF v_requested_count = 0 THEN
    v_tiers := ARRAY['starter']::text[];
    v_target_count := v_limit;
  ELSIF v_exact_count >= 5 THEN
    v_tiers := ARRAY['exact']::text[];
    v_target_count := v_limit;
  ELSIF p_city_area_id IS NULL THEN
    v_tiers := ARRAY['exact','starter']::text[];
    v_target_count := least(v_limit, 5);
  ELSE
    v_tiers := ARRAY['exact','nearby','starter']::text[];
    v_target_count := least(v_limit, 5);
  END IF;

  FOREACH v_tier IN ARRAY v_tiers
  LOOP
    WHILE jsonb_array_length(v_results) < v_target_count
    LOOP
      v_best := NULL;

      SELECT e
      INTO v_best
      FROM jsonb_array_elements(v_candidates) AS j(e)
      WHERE e->>'result_tier' = v_tier
        AND NOT ((e->>'opportunity_id')::uuid = ANY(v_selected_ids))
      ORDER BY
        (
          coalesce((e->>'base_score')::integer, 0)
          - CASE WHEN (e->>'host_id')::uuid = ANY(v_selected_hosts) THEN 5 ELSE 0 END
          - CASE
              WHEN e->>'primary_category' IS NOT NULL
               AND (e->>'primary_category') = ANY(v_selected_categories)
              THEN 4 ELSE 0
            END
        ) DESC,
        coalesce((e->>'precise_interest_count')::integer, 0) DESC,
        (e->>'opportunity_id')::uuid ASC
      LIMIT 1;

      EXIT WHEN v_best IS NULL;

      v_best_id := (v_best->>'opportunity_id')::uuid;
      v_best_host := (v_best->>'host_id')::uuid;
      v_best_category := v_best->>'primary_category';

      v_result_item := jsonb_build_object(
        'opportunity', v_best->'opportunity',
        'matched_interest_count', (v_best->>'matched_interest_count')::integer,
        'matched_interest_keys', v_best->'matched_interest_keys',
        'base_score', (v_best->>'base_score')::integer,
        'result_tier', v_best->>'result_tier'
      );

      v_results := v_results || jsonb_build_array(v_result_item);
      v_selected_ids := array_append(v_selected_ids, v_best_id);
      v_selected_hosts := array_append(v_selected_hosts, v_best_host);

      IF v_best_category IS NOT NULL THEN
        v_selected_categories := array_append(v_selected_categories, v_best_category);
      END IF;

      IF v_tier = 'nearby' THEN
        v_used_nearby := true;
      ELSIF v_tier = 'starter' THEN
        v_used_starter := true;
      END IF;
    END LOOP;
  END LOOP;

  IF jsonb_array_length(v_results) = 0 THEN
    v_fallback_tier := 'empty';
  ELSIF v_used_starter THEN
    v_fallback_tier := 'starter';
  ELSIF v_used_nearby THEN
    v_fallback_tier := 'nearby';
  ELSE
    v_fallback_tier := 'exact';
  END IF;

  RETURN jsonb_build_object(
    'requested_interest_count', v_requested_count,
    'result_count', jsonb_array_length(v_results),
    'fallback_tier', v_fallback_tier,
    'market', jsonb_build_object('id', v_market_id, 'slug', v_market_slug, 'label', v_market_label),
    'selected_city_area',
      CASE
        WHEN v_selected_city_id IS NULL THEN NULL
        ELSE jsonb_build_object('id', v_selected_city_id, 'slug', v_selected_city_slug, 'label', v_selected_city_label)
      END,
    'results', v_results
  );
END
$function$;

REVOKE ALL ON FUNCTION public.gpi_service_search_public_opportunities_v2(
  text[], uuid, text, text[], integer
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.gpi_service_search_public_opportunities_v2(
  text[], uuid, text, text[], integer
) TO service_role;

DO $$
DECLARE
  v_hash text;
  v_policy_count integer;
BEGIN
  SELECT md5(pg_get_functiondef(p.oid))
  INTO v_hash
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'gpi_service_search_public_opportunities'
    AND pg_get_function_identity_arguments(p.oid) =
      'p_goal text, p_city_area_id uuid, p_cause_tag_ids uuid[], p_activity_tag_ids uuid[], p_schedule_types text[], p_limit integer';

  IF v_hash IS DISTINCT FROM '9f4491062cd2aca849fd47cb026cc706' THEN
    RAISE EXCEPTION
      'Legacy GPI search RPC changed during Phase 1A; aborting. Expected %, got %',
      '9f4491062cd2aca849fd47cb026cc706',
      coalesce(v_hash, '<missing>');
  END IF;

  SELECT count(*)
  INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('gpi_markets','gpi_discovery_interest_mappings');

  IF v_policy_count <> 0 THEN
    RAISE EXCEPTION
      'New backend-owned GPI tables unexpectedly have browser RLS policies';
  END IF;

  IF has_table_privilege('anon', 'public.gpi_markets', 'SELECT')
     OR has_table_privilege('authenticated', 'public.gpi_markets', 'SELECT')
     OR has_table_privilege('anon', 'public.gpi_discovery_interest_mappings', 'SELECT')
     OR has_table_privilege('authenticated', 'public.gpi_discovery_interest_mappings', 'SELECT')
  THEN
    RAISE EXCEPTION 'Browser role unexpectedly has direct SELECT access to new backend-owned tables';
  END IF;

  IF has_function_privilege(
       'anon',
       'public.gpi_service_search_public_opportunities_v2(text[],uuid,text,text[],integer)',
       'EXECUTE'
     )
     OR has_function_privilege(
       'authenticated',
       'public.gpi_service_search_public_opportunities_v2(text[],uuid,text,text[],integer)',
       'EXECUTE'
     )
  THEN
    RAISE EXCEPTION 'Browser role unexpectedly has direct EXECUTE on GPI v2 service RPC';
  END IF;
END
$$;

COMMIT;
