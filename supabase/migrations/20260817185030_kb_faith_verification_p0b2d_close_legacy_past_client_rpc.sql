revoke execute on function public.kb_submit_vendor_reference_response(text, boolean, integer, text, text, text, text) from public, anon, authenticated;
grant execute on function public.kb_submit_vendor_reference_response(text, boolean, integer, text, text, text, text) to service_role;
comment on function public.kb_submit_vendor_reference_response(text, boolean, integer, text, text, text, text) is
  'LEGACY exception-based past-client reference response RPC. Client execution revoked in P0-B2D after the 0160 frontend cutover to kb_submit_vendor_reference_response_v2. Service-role access retained for controlled operations only.';
