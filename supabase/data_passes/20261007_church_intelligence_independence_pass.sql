-- Church Intelligence independence pass -- 2026-10-07
-- Reference record of what was run directly against production
-- (knkwaphosqronbhrvlsu) via the Supabase SQL tool. This is a one-time data
-- pass, not a schema migration -- nothing here needs to be "applied" again.
--
-- Purpose: close the evidence-independence gate flagged in
-- DALLAS_GOLD_SET_MEASUREMENT_REPORT_2026-09-30.md. All 40 gold-set church
-- records traced to a single source family (manual_web_research). This adds
-- a second, independent source per church where one could actually be
-- found -- the church's own official website, or an official denomination
-- directory / government record where no church website existed. Nothing
-- was fabricated: 18 of 40 churches had no independent source available in
-- search and were left single-source, flagged in the roadmap doc instead.

-- 1. Register the two new source types.
insert into church_intel.source_registry (source_key, display_name, independence_family_key, authority_class, access_method, terms_checked_at, default_allowed_purposes, automation_status, retention_rule, policy_version, policy_effective_at, notes)
values
('church_official_website_v1', 'Church-Published Official Website', 'church_official_website', 'first_party', 'public_web', now(), ARRAY['research','verification','internal_analytics'], 'manual_only', 'Retain source citation only (URL). No bulk content retained.', 1, now(), 'Independent-source pass (2026-10-07): the church''s own official website, confirmed directly against name/address, as the second independent source required before Dallas gold-set claims can be trusted at scale. Distinct independence_family_key from manual_web_research.'),
('official_directory_or_record_v1', 'Official Denomination Directory or Government Record', 'official_directory_or_record', 'official', 'public_web', now(), ARRAY['research','verification','internal_analytics'], 'manual_only', 'Retain source citation only (URL). No bulk content retained.', 1, now(), 'Independent-source pass (2026-10-07): an official denomination/conference directory (e.g. a regional UMC/diocese directory) or a government/historic record (e.g. City of Dallas Historic Preservation), used where no dedicated church website was found. Distinct independence_family_key from manual_web_research.');

-- 2. For each confirmed church, insert a source_record + a second
-- `canonical_name` evidence_claim (status 'observed', not auto-promoted --
-- promotion is left for a deliberate admin review step). Ran as four
-- batches of 7/3/5/7 inserts alongside the web research; see the roadmap
-- doc (CHURCH_INTELLIGENCE_BUILD_ROADMAP_2026-10-07.md, section 7, Pass 2)
-- for the full list of which church used which source and URL, and the
-- 18 that could not be independently confirmed.

-- 3. Populated the previously-empty church_organizations.canonical_website
-- column for the 16 churches where an official website (not just a
-- directory/government record) was found.

-- Result, verified by query: 22 of 40 organizations now have evidence
-- claims from >= 2 distinct independence_family_key values.
