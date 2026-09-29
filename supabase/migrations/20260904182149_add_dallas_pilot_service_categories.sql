-- Make the playbook's cleaning and landscaping categories first-class values
-- in the canonical Concierge category validator.

create or replace function concierge_ops.service_categories_are_valid(values_to_check text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(values_to_check, '{}'::text[]) <@ array[
    'cleaning_and_janitorial',
    'landscaping_and_grounds',
    'construction_and_trades',
    'facilities_and_maintenance',
    'av_production_and_worship_technology',
    'it_cybersecurity_and_managed_services',
    'web_software_and_digital',
    'marketing_branding_and_communications',
    'finance_accounting_and_payroll',
    'legal_risk_and_insurance',
    'hr_staffing_and_leadership_search',
    'consulting_strategy_and_operations',
    'events_hospitality_and_travel',
    'products_supplies_and_equipment',
    'other_needs_classification'
  ]::text[];
$$;
