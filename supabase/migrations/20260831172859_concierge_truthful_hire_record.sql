-- Freeze-era hire ledger truth.
--
-- This migration intentionally transforms the live, checksum-pinned function
-- definition instead of reconstructing the full SECURITY DEFINER function.
-- It aborts on any drift and changes only the approved fee variables,
-- calculation block, and hire-confirmation fee/status values.

do $migration$
declare
  v_definition text;
  v_after text;
  v_expected_md5 constant text := 'af6acff827b142a57faa297a7eeb22ab';
  v_declarations constant text :=
    '  v_vendor_tier text;' || chr(10) ||
    '  v_fee numeric;' || chr(10);
  v_calculation constant text :=
    '  v_vendor_tier := v_vendor.tier;' || chr(10) ||
    '  v_fee := public.kb_compute_platform_fee(v_bid.amount, v_vendor_tier);' || chr(10) ||
    chr(10);
  v_old_insert constant text :=
    '    v_bid.amount,v_bid.amount,v_fee,''pending_payment'',now()';
  v_new_insert constant text :=
    '    v_bid.amount,v_bid.amount,null,''recorded'',now()';
begin
  select pg_get_functiondef('public.confirm_hire(uuid,uuid)'::regprocedure)
  into v_definition;

  if md5(v_definition) <> v_expected_md5 then
    raise exception 'confirm_hire drift guard failed: expected %, found %',
      v_expected_md5, md5(v_definition);
  end if;

  if position(v_declarations in v_definition) = 0
     or position(v_calculation in v_definition) = 0
     or position(v_old_insert in v_definition) = 0 then
    raise exception 'confirm_hire approved replacement fragments were not found';
  end if;

  v_definition := replace(v_definition, v_declarations, '');
  v_definition := replace(v_definition, v_calculation, '');
  v_definition := replace(v_definition, v_old_insert, v_new_insert);

  execute v_definition;

  select pg_get_functiondef('public.confirm_hire(uuid,uuid)'::regprocedure)
  into v_after;

  if position('v_vendor_tier' in v_after) > 0
     or position('v_fee' in v_after) > 0
     or position('pending_payment' in v_after) > 0
     or position(v_new_insert in v_after) = 0 then
    raise exception 'confirm_hire postcondition failed';
  end if;
end;
$migration$;
