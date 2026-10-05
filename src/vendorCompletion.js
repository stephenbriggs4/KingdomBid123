// Single source of truth for vendor profile completion.
// Profile and My Work both call this so the same vendor data always shows the same percentage.
// Only fields the vendor can complete belong here. Admin-controlled status (for example
// Faith Verified) must never be added, or vendors are penalized for review outcomes they don't control.
export function calcVendorCompletion(vendorRow) {
  if (!vendorRow) return { pct: 0, missing: [], score: 0 };
  const checks = [
    { key:"name",              label:"Business name",         weight:10, pass:!!(vendorRow.name && vendorRow.name.length > 2) },
    { key:"bio",               label:"Bio (100+ chars)",       weight:15, pass:!!(vendorRow.bio && vendorRow.bio.length >= 100) },
    { key:"faith_statement",   label:"Faith statement",        weight:15, pass:!!(vendorRow.faith_statement && vendorRow.faith_statement.length > 20) },
    { key:"city",              label:"Location",               weight:10, pass:!!(vendorRow.city && vendorRow.city.length > 1) },
    { key:"tags",              label:"Skills / specialties",   weight:10, pass:!!(vendorRow.tags && vendorRow.tags.length > 0) },
    { key:"portfolio",         label:"Portfolio item",         weight:20, pass:!!(vendorRow._hasPortfolio) },
    { key:"tagline",           label:"Tagline",                weight:10, pass:!!(vendorRow.tagline && vendorRow.tagline.length > 5) },
    { key:"church_sizes_served",label:"Church sizes served",   weight: 5, pass:Array.isArray(vendorRow.church_sizes_served) ? vendorRow.church_sizes_served.length > 0 : !!vendorRow.church_sizes_served },
    { key:"service_state",     label:"Service state",          weight: 5, pass:!!(vendorRow.service_state) },
  ];
  const score = checks.reduce((acc, c) => acc + (c.pass ? c.weight : 0), 0);
  const missingChecks = checks.filter(c => !c.pass);
  const missing = missingChecks.map(c => c.label);
  // Every check above is vendor-controlled, so each missing item is something the vendor can complete.
  // `next` is the first missing item in checklist order; it is null when the profile is complete.
  return {
    pct: score,
    missing,
    checks,
    remaining: missingChecks.length,
    next: missingChecks[0] ? { key: missingChecks[0].key, label: missingChecks[0].label } : null,
  };
}
