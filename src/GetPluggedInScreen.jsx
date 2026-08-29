import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";

let GpiCardWord, firstNonEmpty, kbSafeSessionGet, kbSafeSessionRemove, kbSafeSessionSet, savePostAuthTarget, setAuthDefaultRole;

function applyGetPluggedInDependencies(values = {}) {
  ({ GpiCardWord, firstNonEmpty, kbSafeSessionGet, kbSafeSessionRemove, kbSafeSessionSet, savePostAuthTarget, setAuthDefaultRole } = values || {});
}

const GPI_PREVIEW_OPPORTUNITIES = [
  {
    id: "preview-belong",
    tone: "belong",
    word: "BELONG",
    kicker: "",
    title: "Community Dinner",
    organization_name: "",
    day_label: "Sun",
    time_label: "5:30 PM",
    distance_label: "Nearby",
    first_visit_label: "Come as you are and meet the team.",
    footer_note: "",
    goal: "connect",
  },
  {
    id: "preview-meet",
    tone: "meet",
    word: "MEET",
    kicker: "",
    title: "Men's Faith Breakfast",
    organization_name: "Redeemer Dallas",
    day_label: "Thu",
    time_label: "Before work",
    distance_label: "Dallas area",
    first_visit_label: "Low-pressure connection before the day starts.",
    footer_note: "Newcomers welcome",
    goal: "connect",
  },
  {
    id: "preview-serve",
    tone: "serve",
    word: "SERVE",
    kicker: "Start here",
    title: "Food Pantry Saturday",
    organization_name: "Dallas Hope Center",
    day_label: "Sat",
    time_label: "9:00 AM",
    distance_label: "2.8 mi",
    first_visit_label: "Meet the team and serve alongside others.",
    footer_note: "Come once · No experience needed · Serve with a team",
    goal: "serve",
  },
  {
    id: "preview-mentor",
    tone: "mentor",
    word: "MENTOR",
    kicker: "",
    title: "Youth Mentoring Night",
    organization_name: "Oak Cliff Outreach",
    day_label: "Tue",
    time_label: "Training included",
    distance_label: "Dallas area",
    first_visit_label: "Shadow a leader before taking the next step.",
    footer_note: "",
    goal: "serve",
  },
  {
    id: "preview-grow",
    tone: "grow",
    word: "GROW",
    kicker: "",
    title: "Midweek Bible Study",
    organization_name: "",
    day_label: "Wed",
    time_label: "7:00 PM",
    distance_label: "Nearby",
    first_visit_label: "Join a table and get a feel for the group.",
    footer_note: "",
    goal: "connect",
  },
];

const GPI_TONES = ["belong", "meet", "serve", "mentor", "grow"];

const GPI_TONE_BY_PRIMARY_CATEGORY = Object.freeze({
  serving_neighbors: "serve",
  community_groups: "belong",
  youth_family: "mentor",
  missions_outreach: "serve",
  worship_growth: "grow",
  business_professional: "meet",
  creative_arts: "grow",
  hands_on_skills: "serve",
});

const GPI_WORD_BY_TONE = Object.freeze({
  belong: "BELONG",
  meet: "MEET",
  serve: "SERVE",
  mentor: "MENTOR",
  grow: "GROW",
});

function gpiNormalizeCategoryKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function gpiPrimaryCategoryKey(row) {
  const direct = firstNonEmpty(
    row?.primary_category,
    row?.primary_category_slug,
    row?.primary_category_key,
    row?.category_slug,
    row?.category_key,
    row?.category,
    row?.category_label
  );
  const directKey = gpiNormalizeCategoryKey(direct);
  if (directKey) return directKey;
  const categories = Array.isArray(row?.categories) ? row.categories : [];
  const firstPrimary = categories.find((item) => item?.is_primary || item?.primary) || categories[0];
  return gpiNormalizeCategoryKey(firstNonEmpty(firstPrimary?.slug, firstPrimary?.key, firstPrimary?.label, firstPrimary?.name));
}

function gpiInferToneFromText(row) {
  const source = [
    row?.goal,
    row?.activity_label,
    row?.activity_slug,
    row?.title,
    row?.opportunity_title,
    row?.description,
  ].filter(Boolean).join(" ").toLowerCase();
  if (source.includes("mentor") || source.includes("youth") || source.includes("family") || source.includes("student")) return "mentor";
  if (source.includes("study") || source.includes("group") || source.includes("learn") || source.includes("worship") || source.includes("prayer") || source.includes("creative") || source.includes("arts")) return "grow";
  if (source.includes("breakfast") || source.includes("dinner") || source.includes("meet") || source.includes("business") || source.includes("professional")) return "meet";
  if (source.includes("serve") || source.includes("food") || source.includes("outreach") || source.includes("mission") || source.includes("skills") || source.includes("hands-on")) return "serve";
  if (source.includes("community") || source.includes("belong") || source.includes("connect")) return "belong";
  return "belong";
}

function gpiToneForOpportunity(row) {
  if (GPI_TONES.includes(row?.tone)) return row.tone;
  const categoryKey = gpiPrimaryCategoryKey(row);
  return GPI_TONE_BY_PRIMARY_CATEGORY[categoryKey] || gpiInferToneFromText(row);
}

function gpiWordForTone(tone) {
  return GPI_WORD_BY_TONE[tone] || "BELONG";
}

function gpiTokenize(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function gpiRowSearchText(row) {
  const category = gpiPrimaryCategoryKey(row);
  const tagText = [
    ...(Array.isArray(row?.activity_tags) ? row.activity_tags : []),
    ...(Array.isArray(row?.cause_tags) ? row.cause_tags : []),
    ...(Array.isArray(row?.audience_tags) ? row.audience_tags : []),
    ...(Array.isArray(row?.tags) ? row.tags : []),
  ].map((item) => firstNonEmpty(item?.slug, item?.key, item?.label, item?.name, item)).join(" ");
  return [
    row?.title,
    row?.opportunity_title,
    row?.name,
    row?.organization_name,
    row?.host_name,
    row?.activity_label,
    row?.activity_slug,
    row?.primary_category,
    row?.category_label,
    category,
    row?.description,
    row?.first_visit_label,
    row?.commitment_label,
    row?.experience_label,
    row?.goal,
    row?.schedule_type,
    row?.city_area_label,
    row?.city_area_name,
    row?.city,
    tagText,
  ].filter(Boolean).join(" ").toLowerCase();
}

function gpiDiscoveryScore(row, signals = {}) {
  let score = 0;
  const text = gpiRowSearchText(row);
  const queryTokens = gpiTokenize(signals.query);
  const rowGoal = String(row?.goal || "").toLowerCase();
  const rowSchedule = String(row?.schedule_type || row?.schedule || "").toLowerCase();
  const rowCityId = String(row?.city_area_id || row?.cityAreaId || row?.city_id || "");
  const rowTone = gpiToneForOpportunity(row);

  if (signals.goal && rowGoal === String(signals.goal).toLowerCase()) score += 45;
  if (signals.schedule && rowSchedule === String(signals.schedule).toLowerCase()) score += 34;
  if (signals.cityAreaId && rowCityId && rowCityId === String(signals.cityAreaId)) score += 28;

  queryTokens.forEach((token) => {
    if (!text.includes(token)) return;
    score += text.includes(` ${token} `) ? 14 : 9;
    if (String(row?.title || row?.opportunity_title || "").toLowerCase().includes(token)) score += 8;
    if (String(row?.activity_label || row?.activity_slug || "").toLowerCase().includes(token)) score += 6;
  });

  if (!signals.goal && rowGoal === "connect") score += 5;
  if (!signals.schedule && ["one_time", "recurring", "flexible"].includes(rowSchedule)) score += 3;
  if (rowTone === "belong" && !signals.query && !signals.goal) score += 2;

  return score;
}

function gpiStableRowId(row, index) {
  return String(row?.id || row?.opportunity_id || row?.title || row?.opportunity_title || `row-${index}`);
}

function gpiDiversityPenalty(row, selectedRows) {
  const tone = gpiToneForOpportunity(row);
  const host = String(row?.organization_id || row?.organization_name || row?.host_name || "").toLowerCase();
  const category = gpiPrimaryCategoryKey(row);
  let penalty = 0;
  if (selectedRows.some((item) => gpiToneForOpportunity(item) === tone)) penalty += 6;
  if (host && selectedRows.some((item) => String(item?.organization_id || item?.organization_name || item?.host_name || "").toLowerCase() === host)) penalty += 5;
  if (category && selectedRows.some((item) => gpiPrimaryCategoryKey(item) === category)) penalty += 4;
  return penalty;
}

function gpiRankDiscoveryRows(rows, signals = {}) {
  const source = Array.isArray(rows) ? rows : [];
  if (source.length <= 1) return source;
  const scored = source.map((row, index) => ({
    row,
    index,
    score: gpiDiscoveryScore(row, signals),
    id: gpiStableRowId(row, index),
  }));
  scored.sort((left, right) => right.score - left.score || left.index - right.index);

  const remaining = scored.slice();
  const selected = [];
  while (remaining.length) {
    let bestIndex = 0;
    let bestValue = -Infinity;
    remaining.forEach((candidate, index) => {
      const value = candidate.score - gpiDiversityPenalty(candidate.row, selected.map((item) => item.row));
      if (value > bestValue || (value === bestValue && candidate.index < remaining[bestIndex].index)) {
        bestValue = value;
        bestIndex = index;
      }
    });
    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  return selected.map((item, rankIndex) => ({
    ...item.row,
    gpi_match_score: item.score,
    gpi_rank_position: rankIndex + 1,
  }));
}

const GPI_DISCOVERY_TERMS = [
  { id: "serve", label: "Serve others", tier: "large", tone: "serve", goal: "serve" },
  { id: "community", label: "Find community", tier: "large", tone: "belong", goal: "connect" },
  { id: "meet_people", label: "Meet people", tier: "large", tone: "connect", goal: "connect" },
  { id: "bible_study", label: "Bible Study", tier: "medium", tone: "grow" },
  { id: "young_adults", label: "Young Adults", tier: "medium", tone: "connect" },
  { id: "worship", label: "Worship", tier: "medium", tone: "grow" },
  { id: "outreach", label: "Outreach", tier: "medium", tone: "serve", goal: "serve" },
  { id: "prayer", label: "Prayer", tier: "medium", tone: "belong" },
  { id: "volunteer", label: "Volunteer", tier: "medium", tone: "serve", goal: "serve" },
  { id: "mentoring", label: "Mentoring", tier: "medium", tone: "grow" },
  { id: "men", label: "Men", tier: "small", tone: "belong" },
  { id: "women", label: "Women", tier: "small", tone: "belong" },
  { id: "missions", label: "Missions", tier: "small", tone: "serve" },
  { id: "sports", label: "Sports", tier: "small", tone: "connect" },
  { id: "creative", label: "Creative", tier: "small", tone: "create" },
  { id: "students", label: "Students", tier: "small", tone: "grow" },
  { id: "professional", label: "Professional Community", tier: "small", tone: "connect" },
  { id: "leadership", label: "Leadership", tier: "small", tone: "grow" },
  { id: "support", label: "Recovery/support", tier: "small", tone: "belong" },
  { id: "families", label: "Families", tier: "small", tone: "belong" },
  { id: "music", label: "Music", tier: "small", tone: "create" },
];

const GPI_DISCOVERY_GRID_ORDER = [
  "young_adults",
  "bible_study",
  "volunteer",
  "worship",
  "sports",
  "mentoring",
  "outreach",
  "prayer",
  "creative",
  "professional",
  "men",
  "women",
  "families",
  "students",
  "missions",
];

const GPI_DISCOVERY_US_CITY_SUGGESTIONS = Object.freeze([
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC", "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Washington, DC", "Boston, MA", "El Paso, TX", "Nashville, TN", "Detroit, MI", "Oklahoma City, OK", "Portland, OR", "Las Vegas, NV", "Memphis, TN", "Louisville, KY", "Baltimore, MD", "Milwaukee, WI", "Albuquerque, NM", "Tucson, AZ", "Fresno, CA", "Sacramento, CA", "Mesa, AZ", "Kansas City, MO", "Atlanta, GA", "Omaha, NE", "Colorado Springs, CO", "Raleigh, NC", "Miami, FL", "Virginia Beach, VA", "Oakland, CA", "Minneapolis, MN", "Tulsa, OK", "Arlington, TX", "Tampa, FL", "New Orleans, LA", "Wichita, KS", "Cleveland, OH", "Bakersfield, CA", "Aurora, CO", "Anaheim, CA", "Honolulu, HI", "Santa Ana, CA", "Riverside, CA", "Corpus Christi, TX", "Lexington, KY", "Henderson, NV", "Stockton, CA", "Saint Paul, MN", "Cincinnati, OH", "St. Louis, MO", "Pittsburgh, PA", "Greensboro, NC", "Lincoln, NE", "Anchorage, AK", "Plano, TX", "Orlando, FL", "Irvine, CA", "Newark, NJ", "Durham, NC", "Chula Vista, CA", "Toledo, OH", "Fort Wayne, IN", "St. Petersburg, FL", "Laredo, TX", "Jersey City, NJ", "Chandler, AZ", "Madison, WI", "Lubbock, TX", "Scottsdale, AZ", "Reno, NV", "Buffalo, NY", "Gilbert, AZ", "Glendale, AZ", "North Las Vegas, NV", "Winston-Salem, NC", "Chesapeake, VA", "Norfolk, VA", "Fremont, CA", "Garland, TX", "Irving, TX", "Hialeah, FL", "Richmond, VA", "Boise, ID", "Spokane, WA", "Baton Rouge, LA", "Tacoma, WA", "San Bernardino, CA", "Modesto, CA", "Fontana, CA", "Des Moines, IA", "Moreno Valley, CA", "Santa Clarita, CA", "Fayetteville, NC", "Birmingham, AL", "Oxnard, CA", "Rochester, NY", "Port St. Lucie, FL", "Grand Rapids, MI", "Huntsville, AL", "Salt Lake City, UT", "Frisco, TX", "Yonkers, NY", "Amarillo, TX", "Glendale, CA", "Huntington Beach, CA", "McKinney, TX", "Montgomery, AL", "Augusta, GA", "Aurora, IL", "Akron, OH", "Little Rock, AR", "Tempe, AZ", "Columbus, GA", "Overland Park, KS", "Grand Prairie, TX", "Tallahassee, FL", "Cape Coral, FL", "Mobile, AL", "Knoxville, TN", "Shreveport, LA", "Worcester, MA", "Ontario, CA", "Vancouver, WA", "Sioux Falls, SD", "Chattanooga, TN", "Providence, RI", "Brownsville, TX", "Fort Lauderdale, FL", "Newport News, VA", "Santa Rosa, CA", "Peoria, AZ", "Salem, OR", "Eugene, OR", "Pembroke Pines, FL", "Cary, NC", "Springfield, MO", "Fort Collins, CO", "Jackson, MS", "Alexandria, VA", "Hayward, CA", "Lancaster, CA", "Lakewood, CO", "Clarksville, TN", "Palmdale, CA", "Salinas, CA", "Hollywood, FL", "Macon, GA", "Kansas City, KS", "Sunnyvale, CA", "Pomona, CA", "Killeen, TX", "Escondido, CA", "Pasadena, TX", "Naperville, IL", "Bellevue, WA", "Joliet, IL", "Murfreesboro, TN", "Midland, TX", "Rockford, IL", "Paterson, NJ", "Savannah, GA", "Bridgeport, CT", "Torrance, CA", "McAllen, TX", "Syracuse, NY", "Surprise, AZ", "Denton, TX", "Roseville, CA", "Thornton, CO", "Miramar, FL", "Pasadena, CA", "Mesquite, TX", "Olathe, KS", "Dayton, OH", "Carrollton, TX", "Waco, TX", "Orange, CA", "Fullerton, CA", "Charleston, SC", "West Valley City, UT", "Visalia, CA", "Hampton, VA", "Gainesville, FL", "Warren, MI", "Coral Springs, FL", "Cedar Rapids, IA", "Round Rock, TX", "Sterling Heights, MI", "Kent, WA", "Columbia, SC", "Santa Clara, CA", "New Haven, CT", "Stamford, CT", "Concord, CA", "Elizabeth, NJ", "Athens, GA", "Thousand Oaks, CA", "Lafayette, LA", "Simi Valley, CA", "Topeka, KS", "Norman, OK", "Fargo, ND", "Wilmington, NC", "Abilene, TX", "Odessa, TX", "Columbia, MO", "Pearland, TX", "Victorville, CA", "Hartford, CT", "Vallejo, CA", "Allentown, PA", "Berkeley, CA", "Richardson, TX", "Arvada, CO", "Ann Arbor, MI", "Rochester, MN", "Cambridge, MA", "Sugar Land, TX", "Lansing, MI", "Evansville, IN", "College Station, TX", "Fairfield, CA", "Clearwater, FL", "Beaumont, TX", "Independence, MO", "Provo, UT", "West Jordan, UT", "Murrieta, CA", "Palm Bay, FL", "El Monte, CA", "Carlsbad, CA", "North Charleston, SC", "Temecula, CA", "Clovis, CA", "Meridian, ID", "Westminster, CO", "Costa Mesa, CA", "High Point, NC", "Manchester, NH", "Pueblo, CO", "Lakeland, FL", "Pompano Beach, FL", "West Palm Beach, FL", "Antioch, CA", "Everett, WA", "Downey, CA", "Lowell, MA", "Centennial, CO", "Elgin, IL", "Richmond, CA", "Peoria, IL", "Broken Arrow, OK", "Miami Gardens, FL", "Billings, MT", "Jurupa Valley, CA", "Sandy Springs, GA", "Gresham, OR", "Lewisville, TX", "Hillsboro, OR", "Ventura, CA", "Greeley, CO", "Inglewood, CA", "Waterbury, CT", "League City, TX", "Santa Maria, CA", "Tyler, TX", "Davie, FL", "San Mateo, CA", "Boulder, CO", "Allen, TX", "West Covina, CA", "Wichita Falls, TX", "Green Bay, WI", "Burbank, CA", "Rialto, CA", "Woodbridge, NJ", "South Bend, IN", "Daly City, CA", "Las Cruces, NM", "Renton, WA", "Sparks, NV", "Davenport, IA", "Tuscaloosa, AL", "San Angelo, TX", "Vacaville, CA", "Spokane Valley, WA", "Roanoke, VA", "Kenosha, WI", "Albany, NY", "Erie, PA", "Bend, OR", "Conroe, TX", "Dearborn, MI", "Sandy, UT", "Holland, MI", "Sioux City, IA", "Redding, CA", "Brockton, MA", "Longmont, CO", "Bellingham, WA", "Bismarck, ND", "Iowa City, IA", "Rapid City, SD", "Charlottesville, VA", "Duluth, MN", "Flagstaff, AZ", "Mankato, MN", "Traverse City, MI", "Asheville, NC", "Greenville, SC", "Hilton Head Island, SC", "Myrtle Beach, SC", "Pensacola, FL", "Naples, FL", "Sarasota, FL", "Key West, FL", "Savannah, GA", "Athens, GA", "Macon, GA", "Augusta, GA", "Columbus, GA", "Franklin, TN", "Brentwood, TN", "Carmel, IN", "Fishers, IN", "Naperville, IL", "Evanston, IL", "Oak Park, IL", "Boulder, CO", "Aspen, CO", "Vail, CO", "Santa Fe, NM", "Taos, NM", "Sedona, AZ", "Scottsdale, AZ", "Malibu, CA", "Santa Barbara, CA", "Monterey, CA", "Napa, CA", "Sonoma, CA", "Palo Alto, CA", "Mountain View, CA", "Redmond, WA", "Bellevue, WA", "Kirkland, WA", "Vancouver, WA"
]);

function gpiCityOptionLabel(city) {
  const raw = String(city?.label || city?.name || city?.city || city?.display_name || "").trim();
  if (!raw) return "";
  const rawState = String(city?.state_code || city?.state_abbr || city?.state || city?.region_code || "").trim();
  const state = rawState.length <= 3 ? rawState.toUpperCase() : rawState;
  // A live mapped row may expose only `Dallas` as its label. Keep the canonical
  // id separate, but make the human-facing suggestion unambiguous as City, ST.
  if (state && !raw.includes(",")) return `${raw}, ${state}`;
  return raw;
}

function gpiCityOptionId(city) {
  return String(city?.id || city?.city_area_id || city?.cityAreaId || "").trim();
}

function gpiNormalizeCityLabel(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function gpiBuildNationalCitySuggestions(cityAreas = []) {
  const seen = new Set();
  const suggestions = [];
  (Array.isArray(cityAreas) ? cityAreas : []).forEach((city) => {
    const label = gpiCityOptionLabel(city);
    if (!label) return;
    const key = gpiNormalizeCityLabel(label);
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push({ label, id:gpiCityOptionId(city), source:"live" });
  });
  GPI_DISCOVERY_US_CITY_SUGGESTIONS.forEach((label) => {
    const key = gpiNormalizeCityLabel(label);
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push({ label, id:"", source:"national" });
  });
  return suggestions;
}

const GPI_DISCOVERY_SIGNAL_TO_INTEREST = Object.freeze({
  bible_study: "bible_study",
  worship: "worship",
  mentoring: "mentoring",
  outreach: "outreach",
  prayer: "prayer",
  creative_arts: "creative",
  professional_networking: "professional",
  missions_support: "missions",
  sports_recreation: "sports",
});

function gpiDiscoveryInterestKey(term) {
  const direct = String(term?.id || "").trim().toLowerCase();
  if (GPI_DISCOVERY_GRID_ORDER.includes(direct)) return direct;
  const signal = String(term?.slug || term?.key || "").trim().toLowerCase();
  return GPI_DISCOVERY_SIGNAL_TO_INTEREST[signal] || "";
}

function gpiDiscoveryInterestLabel(interestKey) {
  const key = String(interestKey || "").trim().toLowerCase();
  const term = GPI_DISCOVERY_TERMS.find((item) => item.id === key);
  if (term?.label) return term.label;
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function gpiResultMatchNote(row) {
  const keys = Array.isArray(row?.gpi_matched_interest_keys)
    ? Array.from(new Set(row.gpi_matched_interest_keys.map((key) => String(key || "").trim().toLowerCase()).filter(Boolean)))
    : [];
  const labels = keys.map(gpiDiscoveryInterestLabel).filter(Boolean);
  const tier = String(row?.gpi_result_tier || "").trim().toLowerCase();

  if (labels.length) {
    const visible = labels.slice(0, 2);
    const extra = labels.length > 2 ? ` +${labels.length - 2}` : "";
    const prefix = tier === "nearby" ? "Nearby · " : "";
    return `${prefix}Matches ${visible.join(" + ")}${extra}`;
  }
  if (tier === "starter") return "Good first step";
  return "";
}

function gpiRowsFromV2Search(data) {
  const results = Array.isArray(data?.results) ? data.results : [];
  return results.map((result) => ({
    ...(result?.opportunity || {}),
    gpi_matched_interest_count: Number(result?.matched_interest_count || 0),
    gpi_matched_interest_keys: Array.isArray(result?.matched_interest_keys) ? result.matched_interest_keys : [],
    gpi_base_score: Number(result?.base_score || 0),
    gpi_result_tier: String(result?.result_tier || ""),
  }));
}

const GPI_DISCOVERY_IMAGE_BASE = "/gpi-discovery/";

const GPI_DISCOVERY_CARD_IMAGES = {
  young_adults: { file: "tim-mossholder-hOF1bWoet_Q-unsplash.jpg", focal: "50% 57%" },
  bible_study: { file: "dylan-gillis-KdeqA3aTnBY-unsplash.jpg", focal: "50% 50%" },
  volunteer: { file: "vitaly-gariev-jgRfl2R4mUs-unsplash.jpg", focal: "60% 50%" },
  worship: { file: "hannah-busing-FF049vNP1eg-unsplash.jpg", focal: "50% 35%" },
  sports: { file: "tj-dragotta-Gl0jBJJTDWs-unsplash.jpg", focal: "50% 50%" },
  mentoring: { file: "linkedin-sales-solutions-W3Jl3jREpDY-unsplash.jpg", focal: "65% 50%" },
  outreach: { file: "camylla-battani-ABVE1cyT7hk-unsplash.jpg", focal: "50% 50%" },
  prayer: { file: "rosie-sun-rTwhmFSoXC8-unsplash.jpg", focal: "45% 50%" },
  creative: { file: "romain-gal-uGnWkhC3ePI-unsplash.jpg", focal: "40% 55%" },
  professional: { file: "m-accelerator-yTsy3PYFPtc-unsplash.jpg", focal: "38% 55%" },
  men: { file: "anubhav-shekhar-dFy29v46Nr8-unsplash.jpg", focal: "50% 50%" },
  women: { file: "priscilla-du-preez-mKJUoZPy70I-unsplash.jpg", focal: "50% 50%" },
  families: { file: "barnaby-woodrow-YmU5nP3UTgo-unsplash.jpg", focal: "45% 65%" },
  students: { file: "meredith-spencer-sr4xtO90tUM-unsplash.jpg", focal: "30% 55%" },
  missions: { file: "edmundo-cole-hRijPf3zVtI-unsplash.jpg", focal: "60% 50%" },
};

const GPI_DISCOVERY_EMBEDDED_IMAGES = {
  young_adults: "/gpi/young-adults.jpg",
  bible_study: "/gpi/bible-study.jpg",
  volunteer: "/gpi/volunteer.jpg",
  worship: "/gpi/worship.jpg",
  sports: "/gpi/sports.jpg",
  mentoring: "/gpi/mentoring.jpg",
  outreach: "/gpi/outreach.jpg",
  prayer: "/gpi/prayer.jpg",
  creative: "/gpi/creative.jpg",
  professional: "/gpi/professional.jpg",
  men: "/gpi/men.jpg",
  women: "/gpi/women.jpg",
  families: "/gpi/families.jpg",
  students: "/gpi/students.jpg",
  missions: "/gpi/missions.jpg",
};

function gpiDiscoveryGoalForTerms(terms = []) {
  const goals = terms.map((term) => term.goal).filter(Boolean);
  if (goals.includes("serve")) return "serve";
  if (goals.includes("connect")) return "connect";
  return "";
}

function GpiDiscoveryCard({ term, selected, imageMeta, onToggle }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <button
      type="button"
      className={`gpi-discovery-card${selected ? " selected" : ""}${imageFailed ? " image-failed" : ""}`}
      aria-pressed={selected}
      onClick={onToggle}
    >
      {!imageFailed && (
        <img
          className="gpi-discovery-card-image"
          src={GPI_DISCOVERY_EMBEDDED_IMAGES[term.id] || `${GPI_DISCOVERY_IMAGE_BASE}${imageMeta.file}`}
          alt=""
          style={{ objectPosition: imageMeta.focal }}
          onError={() => setImageFailed(true)}
        />
      )}
      <span className="gpi-discovery-card-label">{term.label}</span>
      <span className={`gpi-discovery-card-check${selected ? " selected" : ""}`} aria-hidden="true">{selected ? "✓" : ""}</span>
    </button>
  );
}

function GpiDiscoveryStage({
  cityAreas,
  cityAreaId,
  setCityAreaId,
  cityQuery,
  setCityQuery,
  activityTags,
  selectedInterests,
  query,
  setQuery,
  loading,
  onToggleInterest,
  onRemoveInterest,
  onFindNextStep,
  onViewAll,
  onNotSure,
  onPostOpportunity,
  onMyRequests,
}) {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [citySuggestionsOpen, setCitySuggestionsOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimeoutRef = useRef(null);

  const handleFindNextStep = useCallback(() => {
    if (transitioning) return;
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    setTransitioning(true);
    transitionTimeoutRef.current = setTimeout(() => {
      transitionTimeoutRef.current = null;
      onFindNextStep();
    }, 320);
  }, [onFindNextStep, transitioning]);

  useEffect(() => () => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  const selectedInterestKeys = new Set(selectedInterests.map(gpiDiscoveryInterestKey).filter(Boolean));
  const gpiVisibleTerms = GPI_DISCOVERY_GRID_ORDER.map((id) => GPI_DISCOVERY_TERMS.find((term) => term.id === id)).filter(Boolean);
  const normalizedSearchQuery = query.trim().toLowerCase();
  const filteredSearchResults = useMemo(() => {
    if (!normalizedSearchQuery) return [];
    return activityTags.filter((tag) => {
      if (!gpiDiscoveryInterestKey(tag)) return false;
      const searchText = [tag.label, tag.slug, tag.name].filter(Boolean).join(" ").toLowerCase();
      return searchText.includes(normalizedSearchQuery);
    });
  }, [activityTags, normalizedSearchQuery]);
  const selectedSearchOnlyTerms = selectedInterests.filter((term) => !GPI_DISCOVERY_GRID_ORDER.includes(gpiDiscoveryInterestKey(term)));
  const citySuggestions = useMemo(() => gpiBuildNationalCitySuggestions(cityAreas), [cityAreas]);
  const citySearchLabel = cityQuery || "Search any U.S. city";
  const filteredCitySuggestions = useMemo(() => {
    const needle = gpiNormalizeCityLabel(cityQuery);
    if (!needle) return [];
    const startsWith = [];
    const contains = [];
    citySuggestions.forEach((city) => {
      const label = gpiNormalizeCityLabel(city?.label);
      if (!label) return;
      if (label.startsWith(needle)) startsWith.push(city);
      else if (label.includes(needle)) contains.push(city);
    });
    return [...startsWith, ...contains].slice(0, 6);
  }, [cityQuery, citySuggestions]);
  const handleDiscoveryCityInput = useCallback((value) => {
    // Typing is free text only. Never infer a canonical city from a partial string.
    const next = String(value || "");
    setCityQuery(next);
    setCityAreaId("");
    setCitySuggestionsOpen(Boolean(next.trim()));
  }, [setCityAreaId, setCityQuery]);
  const selectDiscoveryCity = useCallback((city) => {
    const label = String(city?.label || "").trim();
    if (!label) return;
    setCityQuery(label);
    // Only live mapped city-area suggestions carry an id. National text suggestions remain unmapped.
    setCityAreaId(String(city?.id || "").trim());
    setCitySuggestionsOpen(false);
  }, [setCityAreaId, setCityQuery]);

  const handleInterestSelection = useCallback((term) => {
    const interestKey = gpiDiscoveryInterestKey(term);
    if (!interestKey) return;
    const isSelected = selectedInterests.some((item) => gpiDiscoveryInterestKey(item) === interestKey);
    if (isSelected) {
      onRemoveInterest(interestKey);
      return;
    }
    onToggleInterest(term);
  }, [onRemoveInterest, onToggleInterest, selectedInterests]);

  const selectionCount = selectedInterests.length;
  const footerLabel = transitioning
    ? "Finding your places…"
    : selectionCount === 0
      ? "Show me popular places →"
      : "Find my next step →";

  return (
    <div className="gpi-discovery">
      <section className={`gpi-discovery-board${transitioning ? " transitioning" : ""}`} aria-labelledby="gpi-discovery-title">
        <div className="gpi-discovery-toprail">
          <div className="gpi-discovery-eyebrow">Get Plugged In</div>

          <div className="gpi-discovery-toprail-actions">
            <button type="button" className="gpi-discovery-seeker-entry" onClick={onMyRequests}>
              <strong>My requests</strong><em aria-hidden="true">→</em>
            </button>
            <div className="gpi-discovery-host-entry-wrap">
              <small className="gpi-discovery-host-caption">For churches &amp; ministries</small>
              <button type="button" className="gpi-discovery-host-entry" onClick={onPostOpportunity}>
                <span className="gpi-discovery-host-plus" aria-hidden="true">＋</span>
                <strong>Post an opportunity</strong>
                <em aria-hidden="true">→</em>
              </button>
            </div>
            {selectionCount > 0 ? (
              <div className="gpi-discovery-selection-count" aria-live="polite" aria-atomic="true">
                {selectionCount} selected
              </div>
            ) : null}
          </div>
        </div>

        <div className="gpi-discovery-header">
          <div className="gpi-discovery-header-copy">
            <h1 id="gpi-discovery-title">Discover what moves you.</h1>
            <p>Choose the interests that inspire you and FaithBid will personalize real ways to connect, serve, and grow.</p>
          </div>

          <label className="gpi-discovery-city-search">
            <div className="gpi-city-search-field">
              <GpiFilterIcon type="location" />
              <input
                value={cityQuery}
                onChange={(event) => handleDiscoveryCityInput(event.target.value)}
                onFocus={() => { if (String(cityQuery || "").trim()) setCitySuggestionsOpen(true); }}
                onBlur={() => setTimeout(() => setCitySuggestionsOpen(false), 120)}
                placeholder="Search by city or area"
                aria-label="Search by city or area"
                aria-autocomplete="list"
                aria-expanded={citySuggestionsOpen && filteredCitySuggestions.length > 0}
                aria-controls="gpi-city-suggestions"
              />
            </div>
            {citySuggestionsOpen && filteredCitySuggestions.length > 0 ? (
              <div id="gpi-city-suggestions" className="gpi-city-autocomplete-list" role="listbox" aria-label="City suggestions">
                {filteredCitySuggestions.map((city) => (
                  <button
                    key={`${city.source}:${city.label}`}
                    type="button"
                    role="option"
                    aria-selected={gpiNormalizeCityLabel(cityQuery) === gpiNormalizeCityLabel(city.label)}
                    onClick={(event) => { event.preventDefault(); selectDiscoveryCity(city); }}
                  >
                    {city.label}
                  </button>
                ))}
              </div>
            ) : null}
          </label>
        </div>

        <div className="gpi-discovery-grid-viewport">
          <div className="gpi-discovery-grid" role="group" aria-label="Choose interests">
            {gpiVisibleTerms.map((term) => (
              <GpiDiscoveryCard
                key={term.id}
                term={term}
                selected={selectedInterestKeys.has(term.id)}
                imageMeta={GPI_DISCOVERY_CARD_IMAGES[term.id]}
                onToggle={() => handleInterestSelection(term)}
              />
            ))}
          </div>
        </div>

        <div className="gpi-discovery-footer">
          <div className="gpi-discovery-footer-context" aria-hidden="true">
            <strong>Pick what speaks to you</strong>
            <span>You can change your selections anytime.</span>
          </div>

          <div className="gpi-discovery-footer-tools">
            <button
              type="button"
              className="gpi-discovery-search-trigger"
              aria-expanded={searchExpanded}
              aria-controls="gpi-discovery-search-panel"
              onClick={() => setSearchExpanded((expanded) => !expanded)}
            >
              Looking for something else?
            </button>
            <button type="button" className="gpi-discovery-notsure" onClick={onNotSure} disabled={loading}>
              Not sure where to start?
            </button>
          </div>

        {searchExpanded && (
          <div className="gpi-discovery-search-panel" id="gpi-discovery-search-panel">
            <label className="gpi-discovery-search-field">
              <GpiFilterIcon type="search" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search interests"
                aria-label="Search interests"
                aria-controls="gpi-discovery-search-results"
                aria-describedby="gpi-discovery-search-count"
              />
            </label>

            <div
              id="gpi-discovery-search-count"
              className="gpi-discovery-search-count"
              aria-live="polite"
              aria-atomic="true"
            >
              {normalizedSearchQuery
                ? `${filteredSearchResults.length} ${filteredSearchResults.length === 1 ? "result" : "results"} available.`
                : "Type to search interests."}
            </div>

            <div
              id="gpi-discovery-search-results"
              className="gpi-discovery-search-results"
              role="list"
              aria-label="Interest search results"
              aria-describedby="gpi-discovery-search-count"
            >
              {normalizedSearchQuery && filteredSearchResults.map((tag) => (
                <div key={tag.id || tag.slug || tag.label} role="listitem" className="gpi-discovery-search-result-item">
                  <button
                    type="button"
                    className={`gpi-discovery-search-result${selectedInterestKeys.has(gpiDiscoveryInterestKey(tag)) ? " selected" : ""}`}
                    aria-pressed={selectedInterestKeys.has(gpiDiscoveryInterestKey(tag))}
                    onClick={() => handleInterestSelection(tag)}
                  >
                    {tag.label || tag.slug}
                  </button>
                </div>
              ))}
            </div>

            {normalizedSearchQuery && filteredSearchResults.length === 0 && (
              <div className="gpi-discovery-search-empty">
                <div>No interests found for '{query}'</div>
                <button type="button" onClick={() => setQuery("")}>Try another search</button>
              </div>
            )}

            {selectedSearchOnlyTerms.length > 0 && (
              <div className="gpi-discovery-search-selected" aria-label="Selected searched interests">
                {selectedSearchOnlyTerms.map((term) => (
                  <button
                    key={term.id}
                    type="button"
                    className="gpi-discovery-search-selected-chip"
                    onClick={() => handleInterestSelection(term)}
                    aria-label={`Remove ${term.label}`}
                  >
                    {term.label}<span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

          <div className="gpi-discovery-primary-actions">
            <button
              type="button"
              className="gpi-discovery-viewall"
              onClick={onViewAll}
              disabled={transitioning || loading}
            >
              View all opportunities
            </button>
            <button
              type="button"
              className="gpi-discovery-cta"
              onClick={handleFindNextStep}
              disabled={transitioning}
            >
              <span aria-live="polite" aria-atomic="true">{footerLabel}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function gpiExplicitBoolean(row, keys = []) {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(row || {}, key)) continue;
    const value = row?.[key];
    if (value === true || value === false) return value;
    if (String(value).toLowerCase() === "true") return true;
    if (String(value).toLowerCase() === "false") return false;
  }
  return null;
}

function gpiDerivableText(row) {
  return gpiRowSearchText(row);
}

function gpiDeriveOpportunityReadiness(row) {
  const text = gpiDerivableText(row);
  const category = gpiPrimaryCategoryKey(row);
  const labels = [];
  const sources = [];

  const firstTime = gpiExplicitBoolean(row, ["first_time_friendly", "newcomer_friendly", "beginner_friendly"]);
  if (firstTime === true || /first[-\s]?time|newcomer|come as you are|low[-\s]?pressure|shadow|orientation|training included/.test(text)) {
    labels.push("First-time friendly");
    sources.push(firstTime === true ? "explicit:first_time_friendly" : "derived:first_time_text");
  }

  const experienceRequired = gpiExplicitBoolean(row, ["experience_required", "requires_experience"]);
  if (experienceRequired === false || /no (?:prior )?experience(?: needed|required)?/.test(text)) {
    labels.push("No experience needed");
    sources.push(experienceRequired === false ? "explicit:experience_required_false" : "derived:experience_text");
  } else if (experienceRequired === true || /experience required|prior experience required/.test(text)) {
    labels.push("Requirements apply");
    sources.push(experienceRequired === true ? "explicit:experience_required_true" : "derived:requirement_text");
  }

  const familyFriendly = gpiExplicitBoolean(row, ["family_friendly", "families_welcome"]);
  if (familyFriendly === true || category === "youth_family" || /families|parents|children|kids|childcare|youth|teenagers/.test(text)) {
    labels.push("Family signal");
    sources.push(familyFriendly === true ? "explicit:family_friendly" : "derived:family_text");
  }

  const deduped = Array.from(new Set(labels)).slice(0, 3);
  return {
    labels: deduped,
    sources,
    fallbackNote: deduped.length ? "" : "Host will confirm fit details.",
  };
}

const gpiDiscoveryEnabled = (() => {
  try {
    const envValue = typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_GPI_DISCOVERY_ENABLED
      : undefined;
    const localValue = typeof window !== "undefined"
      ? window.localStorage?.getItem("gpiDiscoveryEnabled")
      : undefined;
    return String(envValue || localValue || "true").toLowerCase() !== "false";
  } catch {
    return false;
  }
})();

const GPI_CARD_POSES = [
  { xCqw: 0,    xPx: 0, yCqw: 0,     scale: 1,     rotateY: 0,  opacity: 1 },
  { xCqw: 20.1, xPx: 0, yCqw: -0.72, scale: 0.935, rotateY: 17, opacity: 1 },
  { xCqw: 35.0, xPx: 0, yCqw: -0.12, scale: 0.86,  rotateY: 17, opacity: 1 },
  { xCqw: 47.0, xPx: 0, yCqw: 0,     scale: 0.72,  rotateY: 17, opacity: 0 },
];

function gpiPoseForPosition(position) {
  const sign = position < 0 ? -1 : position > 0 ? 1 : 0;
  const abs = Math.min(Math.abs(position), GPI_CARD_POSES.length - 1);
  const lo = Math.floor(abs);
  const hi = Math.min(GPI_CARD_POSES.length - 1, Math.ceil(abs));
  const t = abs - lo;
  const a = GPI_CARD_POSES[lo];
  const b = GPI_CARD_POSES[hi];
  const mix = (key) => a[key] + (b[key] - a[key]) * t;
  return {
    xCqw: mix("xCqw") * sign,
    xPx: mix("xPx") * sign,
    yCqw: mix("yCqw"),
    scale: mix("scale"),
    rotateY: mix("rotateY") * -sign,
    opacity: mix("opacity"),
    zIndex: Math.round(50 - abs * 10),
  };
}

function gpiViewportOffset(value) {
  if (!value) return "0px";
  const magnitude = Math.abs(value);
  const referencePx = Number((magnitude * 15.86).toFixed(3));
  return value > 0
    ? `clamp(0px, ${magnitude}vw, ${referencePx}px)`
    : `clamp(-${referencePx}px, -${magnitude}vw, 0px)`;
}

function gpiRelativeSlot(index, selected, total) {
  if (!total) return 0;
  let diff = index - selected;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

function gpiTitleWord(item, index) {
  if (item?.word) return item.word;
  const source = `${item?.goal || ""} ${item?.activity_label || ""} ${item?.title || ""}`.toLowerCase();
  if (source.includes("mentor")) return "MENTOR";
  if (source.includes("study") || source.includes("group") || source.includes("learn")) return "GROW";
  if (source.includes("breakfast") || source.includes("dinner") || source.includes("meet")) return "MEET";
  if (source.includes("serve") || source.includes("food") || source.includes("outreach")) return "SERVE";
  return ["BELONG", "MEET", "SERVE", "MENTOR", "GROW"][index % 5];
}

function gpiRecurringScheduleLabel(row) {
  if (String(row?.schedule_type || "").trim().toLowerCase() !== "recurring") return "";
  const explicit = firstNonEmpty(row?.recurrence_note, row?.schedule_label, "");
  if (explicit) return explicit;
  const dayNames = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
  const days = (Array.isArray(row?.recurring_days) ? row.recurring_days : [])
    .map((day) => dayNames[Number(day)])
    .filter(Boolean);
  const startValue = String(row?.time_window_start || "").trim();
  let timeLabel = "";
  if (startValue) {
    const [hourText, minuteText = "00"] = startValue.split(":");
    const hour = Number(hourText);
    if (Number.isFinite(hour)) {
      const minute = String(minuteText).padStart(2, "0").slice(0, 2);
      timeLabel = (hour % 12 || 12) + ":" + minute + " " + (hour >= 12 ? "PM" : "AM");
    }
  }
  return [days.join(" + "), timeLabel].filter(Boolean).join(" at ") || "Recurring";
}

function gpiUsableOrganizationDescription(value) {
  const description = String(value || "").trim();
  if (!description) return "";
  if (/\b(?:synthetic|qa(?:[-\s]?test)?|test fixture|seed fixture)\b/i.test(description)) return "";
  return description;
}

function gpiPublicOrganizationName(value) {
  return String(value || "FaithBid host").replace(/^GPI Test Host \d+\s*-\s*/i, "").trim() || "FaithBid host";
}

function gpiOrganizationIsFixture(organization) {
  return /\b(?:synthetic|qa(?:[-\s]?test)?|test fixture|seed fixture)\b/i.test(String(organization?.description || organization?.organization_description || ""));
}

function gpiSupportedOpportunityFacts(row) {
  if (!row) return [];
  const facts = [];
  if (String(row.commitment_type || "").toLowerCase() === "drop_in") facts.push("Drop in");
  if (row.requires_application === false) facts.push("No application required");
  if (row.requires_orientation === false) facts.push("No formal orientation required");
  if (row.requires_membership === false) facts.push("Membership not required");
  return facts.slice(0, 3);
}

function gpiDisplayOpportunity(row, index) {
  const title = firstNonEmpty(row?.title, row?.opportunity_title, row?.name, "Local opportunity");
  const organization = gpiPublicOrganizationName(firstNonEmpty(row?.organization_name, row?.host_name, row?.org_name, row?.church_name, "FaithBid host"));
  const locationMode = String(row?.location_mode || "").trim().toLowerCase();
  const city = firstNonEmpty(
    row?.city_label,
    row?.city_area_label,
    row?.city_area_name,
    row?.city,
    locationMode === "virtual" ? "Online" : "Dallas"
  );
  const scheduleType = String(row?.schedule_type || row?.schedule || "").replace(/_/g, " ");
  const dateValue = row?.next_starts_at || row?.next_occurrence_starts_at || row?.starts_at || row?.start_time || row?.next_start_at || null;
  let dayLabel = firstNonEmpty(row?.day_label, row?.weekday_label, "");
  let timeLabel = firstNonEmpty(row?.time_label, row?.start_time_label, "");
  if (dateValue) {
    try {
      const d = new Date(dateValue);
      if (!Number.isNaN(d.getTime())) {
        dayLabel = dayLabel || d.toLocaleDateString("en-US", { weekday: "short" });
        timeLabel = timeLabel || d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      }
    } catch {}
  }
  timeLabel = timeLabel || scheduleType || "Flexible";
  const distance = row?.distance_miles != null
    ? `${Number(row.distance_miles).toFixed(Number(row.distance_miles) % 1 ? 1 : 0)} mi`
    : firstNonEmpty(row?.distance_label, city);
  const tone = gpiToneForOpportunity(row);
  const readiness = gpiDeriveOpportunityReadiness(row);
  const matchNote = gpiResultMatchNote(row);
  const recurrenceLabel = gpiRecurringScheduleLabel(row);
  return {
    ...row,
    id: row?.id || row?.opportunity_id || `gpi-row-${index}`,
    tone,
    word: gpiWordForTone(tone) || gpiTitleWord(row, index),
    kicker: firstNonEmpty(row?.kicker, row?.activity_label, row?.goal === "serve" ? "Serve" : "Connect"),
    title,
    organization_name: organization,
    city_label: city,
    day_label: dayLabel || "Soon",
    time_label: timeLabel || "Flexible",
    distance_label: distance,
    is_recurring: String(row?.schedule_type || "").trim().toLowerCase() === "recurring",
    recurrence_label: recurrenceLabel,
    first_visit_label: firstNonEmpty(row?.first_visit_label, row?.first_visit, row?.description, "Meet the team and see whether this is a fit."),
    footer_note: firstNonEmpty(
      matchNote,
      row?.commitment_label,
      row?.experience_label,
      row?.commitment_type ? String(row.commitment_type).replace(/_/g, " ") : "",
      row?.schedule_type ? String(row.schedule_type).replace(/_/g, " ") : "Details available"
    ),
    readiness_labels: readiness.labels,
    readiness_sources: readiness.sources,
    readiness_fallback_note: readiness.fallbackNote,
    isPreview: false,
  };
}

function gpiEmptyInterestPrerequisites() {
  return { loading: false, loaded: false, opportunityId: null, error: "", occurrences: [], requirements: [] };
}

function gpiHasAgeRestriction(item) {
  return item?.min_age != null || item?.max_age != null;
}

function gpiAgeAffirmationLabel(item) {
  const min = item?.min_age;
  const max = item?.max_age;
  if (min != null && max != null) return `I confirm that I am between ${min} and ${max} years old.`;
  if (min != null) return `I confirm that I am at least ${min} years old.`;
  if (max != null) return `I confirm that I am ${max} years old or younger.`;
  return "";
}

function gpiFormatOccurrence(occurrence) {
  const startsAt = occurrence?.starts_at;
  if (!startsAt) return "Available date";
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return "Available date";
  const startLabel = start.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  if (!occurrence?.ends_at) return startLabel;
  const end = new Date(occurrence.ends_at);
  if (Number.isNaN(end.getTime())) return startLabel;
  return `${startLabel} - ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

function gpiInterestSubmissionState({
  item,
  prerequisites,
  selectedOccurrenceId,
  affirmedRequirementIds,
  ageRangeAffirmed,
}) {
  const scheduleType = String(item?.schedule_type || "").toLowerCase();
  const occurrenceRequired = scheduleType === "one_time" || scheduleType === "recurring";
  const occurrences = Array.isArray(prerequisites?.occurrences) ? prerequisites.occurrences : [];
  const requirements = Array.isArray(prerequisites?.requirements) ? prerequisites.requirements : [];
  const affirmed = new Set((affirmedRequirementIds || []).map(String));
  const allRequirementsAffirmed = requirements.every((requirement) => affirmed.has(String(requirement.requirement_id)));
  const ageRestrictionExists = gpiHasAgeRestriction(item);
  const prerequisitesCurrent = !!prerequisites?.loaded
    && String(prerequisites?.opportunityId || "") === String(item?.id || "");
  const occurrenceUnavailable = occurrenceRequired && prerequisitesCurrent && !prerequisites?.error && !occurrences.length;
  const occurrenceMissing = occurrenceRequired && !selectedOccurrenceId;
  const ready = !!item
    && prerequisitesCurrent
    && !prerequisites?.loading
    && !prerequisites?.error
    && !occurrenceUnavailable
    && !occurrenceMissing
    && allRequirementsAffirmed
    && (!ageRestrictionExists || ageRangeAffirmed);
  return {
    ready,
    occurrenceRequired,
    occurrenceUnavailable,
    occurrenceMissing,
    allRequirementsAffirmed,
    ageRestrictionExists,
  };
}

function gpiBuildInterestSubmissionPayload({
  item,
  selectedOccurrenceId,
  requirements,
  affirmedRequirementIds,
  ageRangeAffirmed,
}) {
  const affirmed = new Set((affirmedRequirementIds || []).map(String));
  const requiredIds = (requirements || [])
    .map((requirement) => requirement?.requirement_id)
    .filter((id) => id != null && affirmed.has(String(id)));
  return {
    opportunity_id: item.id,
    occurrence_id: selectedOccurrenceId || null,
    consent_accepted: true,
    participant_requirement_ids: requiredIds,
    age_range_affirmed: gpiHasAgeRestriction(item) ? !!ageRangeAffirmed : false,
    process_opt_outs: [],
  };
}

function GpiFilterIcon({ type }) {
  if (type === "location") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>;
  if (type === "calendar") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>;
  // 858 — replaces the raw "⌕" text glyph, which rendered at a different
  // weight/baseline than the other three stroked icons (audit item B5).
  if (type === "search") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.7-4.7"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="8" r="4"/><path d="M3.5 21v-2.5A6.5 6.5 0 0 1 10 12h0a6.5 6.5 0 0 1 6.5 6.5V21M18 6.5a3 3 0 0 1 0 5.8M19 15a5 5 0 0 1 2 4"/></svg>;
}

const GPI_HOST_INTENT_SESSION_KEY = "kb_gpi_host_intent_v1";

function gpiHostTitleCase(value = "") {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function gpiHostFormatWhen(value) {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined }).format(date);
}

function gpiHostDateTimeLabel(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function gpiHostToIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function gpiHostRequestStatusLabel(value = "") {
  const status = String(value || "").toLowerCase();
  return ({
    submitted: "New interest",
    notified: "Needs response",
    next_step_provided: "Next step sent",
    declined: "Declined",
    unavailable: "No longer available",
    notification_failed: "Delivery issue",
    org_no_response: "Response window closed",
    request_invalidated: "Opportunity changed",
    seeker_confirmed: "Connected",
    seeker_did_not_connect: "Did not connect",
    seeker_no_confirmation: "No seeker confirmation",
  })[status] || gpiHostTitleCase(status || "request");
}

function gpiHostRequestStatusNote(value = "") {
  const status = String(value || "").toLowerCase();
  return ({
    submitted: "The seeker verified their contact. Opening this request starts the host response window.",
    notified: "Review the confirmed fit details and choose the right next step.",
    next_step_provided: "FaithBid released the seeker's email after you provided a next step. The seeker still confirms the outcome separately.",
    declined: "This request was closed without releasing seeker contact information.",
    unavailable: "The opportunity was marked unavailable for this request. Seeker contact was not released.",
    notification_failed: "FaithBid could not deliver the organization notification. The request is closed for operational review.",
    org_no_response: "The organization response window expired before a response was recorded.",
    request_invalidated: "The opportunity stopped being eligible before the request could continue.",
    seeker_confirmed: "The seeker confirmed that the connection happened.",
    seeker_did_not_connect: "The seeker reported that the connection did not happen.",
    seeker_no_confirmation: "The seeker outcome window closed without a confirmation.",
  })[status] || "FaithBid keeps this lifecycle record for host follow-through.";
}

function GpiHostPortal({ open, onClose, currentUser, cityAreas = [], showToast, onPreviewOrganization }) {
  const [hostScreen, setHostScreen] = useState("home");
  const [context, setContext] = useState({ memberships: [], access_requests: [] });
  const [contextLoading, setContextLoading] = useState(false);
  const [hostError, setHostError] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [workspace, setWorkspace] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceFilter, setWorkspaceFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [requestQueue, setRequestQueue] = useState("active");
  const [requestWorkspace, setRequestWorkspace] = useState({ summary: {}, requests: [] });
  const [requestLoading, setRequestLoading] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [requestDetail, setRequestDetail] = useState(null);
  const [requestResponse, setRequestResponse] = useState("next_step_provided");
  const [requestInstructions, setRequestInstructions] = useState("");

  const [orgSearch, setOrgSearch] = useState("");
  const [orgSearchResults, setOrgSearchResults] = useState([]);
  const [orgSearching, setOrgSearching] = useState(false);
  const [claimOrg, setClaimOrg] = useState(null);
  const [claimRole, setClaimRole] = useState("admin");
  const [claimEmail, setClaimEmail] = useState(currentUser?.email || "");
  const [claimMessage, setClaimMessage] = useState("");

  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDescription, setNewOrgDescription] = useState("");
  const [newOrgEmail, setNewOrgEmail] = useState(currentUser?.email || "");

  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftGoal, setDraftGoal] = useState("connect");
  const [draftFormat, setDraftFormat] = useState("event");
  const [draftResponsibility, setDraftResponsibility] = useState("participant");
  const [draftCommitment, setDraftCommitment] = useState("drop_in");
  const [draftSchedule, setDraftSchedule] = useState("one_time");
  const [draftDuration, setDraftDuration] = useState("60");
  const [draftRecurringDays, setDraftRecurringDays] = useState([]);
  const [draftStartTime, setDraftStartTime] = useState("18:00");
  const [draftEndTime, setDraftEndTime] = useState("19:00");
  const [draftLocationMode, setDraftLocationMode] = useState("in_person");
  const [draftCityAreaId, setDraftCityAreaId] = useState("");


  const [hostTaxonomy, setHostTaxonomy] = useState({ activity: [], cause: [], audience: [] });
  const [editorOpportunityId, setEditorOpportunityId] = useState("");
  const [editorData, setEditorData] = useState(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorTab, setEditorTab] = useState("details");
  const [editorForm, setEditorForm] = useState(null);
  const [editorActivityIds, setEditorActivityIds] = useState([]);
  const [editorCauseIds, setEditorCauseIds] = useState([]);
  const [editorParticipantRequirements, setEditorParticipantRequirements] = useState([]);
  const [editorPopulationIds, setEditorPopulationIds] = useState([]);
  const [editorReadiness, setEditorReadiness] = useState(null);
  const [editorReviewFeedback, setEditorReviewFeedback] = useState(null);
  const [occurrenceStart, setOccurrenceStart] = useState("");
  const [occurrenceEnd, setOccurrenceEnd] = useState("");
  const [occurrenceDeadline, setOccurrenceDeadline] = useState("");
  const [closeReason, setCloseReason] = useState("");

  const memberships = Array.isArray(context?.memberships) ? context.memberships : [];
  const activeMemberships = memberships.filter((membership) => membership?.active === true);
  const inactiveMemberships = memberships.filter((membership) => membership?.active !== true);
  const accessRequests = Array.isArray(context?.access_requests) ? context.access_requests : [];
  const pendingRequests = accessRequests.filter((request) => String(request?.status || "").toLowerCase() === "pending");
  const selectedMembership = memberships.find((membership) => String(membership?.organization_id) === String(selectedOrgId)) || null;
  const hostActivityTags = Array.isArray(hostTaxonomy?.activity) ? hostTaxonomy.activity : [];
  const hostCauseTags = Array.isArray(hostTaxonomy?.cause) ? hostTaxonomy.cause : [];
  const hostAudienceTags = Array.isArray(hostTaxonomy?.audience) ? hostTaxonomy.audience : [];

  const loadContext = useCallback(async () => {
    if (!currentUser?.id) return;
    setContextLoading(true);
    setHostError("");
    try {
      const result = await supabase.rpc("gpi_host_get_context");
      if (result?.error) throw result.error;
      const data = result?.data || { memberships: [], access_requests: [] };
      const nextMemberships = Array.isArray(data?.memberships) ? data.memberships : [];
      setContext(data);
      setSelectedOrgId((current) => {
        const currentIsActive = nextMemberships.some((membership) => membership?.active === true && String(membership?.organization_id) === String(current));
        if (currentIsActive) return current;
        return String(nextMemberships.find((membership) => membership?.active === true)?.organization_id || "");
      });
    } catch (error) {
      setHostError(error?.message || "Your organization access could not load.");
    } finally {
      setContextLoading(false);
    }
  }, [currentUser?.id]);

  const loadWorkspace = useCallback(async (organizationId) => {
    if (!organizationId || !currentUser?.id) {
      setWorkspace(null);
      return;
    }
    setWorkspaceLoading(true);
    setHostError("");
    try {
      const result = await supabase.rpc("gpi_host_get_workspace", { p_organization_id: organizationId });
      if (result?.error) throw result.error;
      setWorkspace(result?.data || null);
    } catch (error) {
      setWorkspace(null);
      setHostError(error?.message || "This organization workspace could not load.");
    } finally {
      setWorkspaceLoading(false);
    }
  }, [currentUser?.id]);

  const loadConnectionRequests = useCallback(async (organizationId, queue = "active") => {
    if (!organizationId || !currentUser?.id) {
      setRequestWorkspace({ summary: {}, requests: [] });
      return;
    }
    setRequestLoading(true);
    setHostError("");
    try {
      const result = await supabase.rpc("gpi_host_list_connection_requests", {
        p_organization_id: organizationId,
        p_queue: queue,
        p_limit: 80,
      });
      if (result?.error) throw result.error;
      setRequestWorkspace(result?.data || { summary: {}, requests: [] });
    } catch (error) {
      setRequestWorkspace({ summary: {}, requests: [] });
      setHostError(error?.message || "Interest requests could not load.");
    } finally {
      setRequestLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!open || !currentUser?.id) return;
    loadContext();
  }, [open, currentUser?.id, loadContext]);

  useEffect(() => {
    if (!open || !currentUser?.id) return;
    let canceled = false;
    (async () => {
      try {
        const result = await supabase.rpc("gpi_host_get_editor_taxonomy");
        if (result?.error) throw result.error;
        if (!canceled) setHostTaxonomy(result?.data || { activity: [], cause: [], audience: [] });
      } catch (error) {
        if (!canceled) setHostError(error?.message || "Opportunity taxonomy could not load.");
      }
    })();
    return () => { canceled = true; };
  }, [open, currentUser?.id]);

  useEffect(() => {
    if (open) return;
    setHostScreen("home");
    setHostError("");
    setClaimOrg(null);
    setWorkspaceFilter("all");
    setEditorOpportunityId("");
    setEditorData(null);
    setEditorForm(null);
    setEditorReadiness(null);
    setEditorReviewFeedback(null);
    setEditorTab("details");
    setCloseReason("");
    setRequestQueue("active");
    setRequestWorkspace({ summary: {}, requests: [] });
    setSelectedRequestId("");
    setRequestDetail(null);
    setRequestResponse("next_step_provided");
    setRequestInstructions("");
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add("gpi-host-portal-open");
    const onKey = (event) => { if (event.key === "Escape" && !busy) onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("gpi-host-portal-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onClose]);

  useEffect(() => {
    if (!open || contextLoading) return;
    if (activeMemberships.length && hostScreen === "home") setHostScreen("workspace");
  }, [open, contextLoading, activeMemberships.length, hostScreen]);

  useEffect(() => {
    if (!open || !["workspace", "requests", "request"].includes(hostScreen) || !selectedOrgId) return;
    loadWorkspace(selectedOrgId);
  }, [open, hostScreen, selectedOrgId, loadWorkspace]);

  useEffect(() => {
    if (!open || !selectedOrgId || !["workspace", "requests"].includes(hostScreen)) return;
    loadConnectionRequests(selectedOrgId, hostScreen === "workspace" ? "active" : requestQueue);
  }, [open, hostScreen, selectedOrgId, requestQueue, loadConnectionRequests]);

  useEffect(() => {
    if (!open) return;
    setClaimEmail((current) => current || currentUser?.email || "");
    setNewOrgEmail((current) => current || currentUser?.email || "");
  }, [open, currentUser?.email]);

  const backToHostHome = () => setHostScreen(activeMemberships.length ? "workspace" : "home");

  const searchOrganizations = async (event) => {
    event?.preventDefault?.();
    const needle = orgSearch.trim();
    if (needle.length < 2) {
      setHostError("Enter at least two characters to search organizations.");
      return;
    }
    setOrgSearching(true);
    setHostError("");
    setClaimOrg(null);
    try {
      const result = await supabase.rpc("gpi_host_search_claimable_organizations", { p_search: needle, p_limit: 12 });
      if (result?.error) throw result.error;
      setOrgSearchResults(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      setOrgSearchResults([]);
      setHostError(error?.message || "Organization search could not load.");
    } finally {
      setOrgSearching(false);
    }
  };

  const requestOrganizationAccess = async (event) => {
    event.preventDefault();
    if (!claimOrg?.organization_id) return;
    if (!claimEmail.trim()) {
      setHostError("Enter the organization contact email you want FaithBid to review.");
      return;
    }
    setBusy(true);
    setHostError("");
    try {
      const result = await supabase.rpc("gpi_host_request_organization_access", {
        p_organization_id: claimOrg.organization_id,
        p_requested_role: claimRole,
        p_request_message: claimMessage.trim() || null,
        p_organization_contact_email: claimEmail.trim(),
      });
      if (result?.error) throw result.error;
      showToast?.("Organization access request sent for FaithBid review.", "success");
      setClaimMessage("");
      setClaimOrg(null);
      setOrgSearchResults([]);
      setOrgSearch("");
      await loadContext();
      setHostScreen("home");
    } catch (error) {
      setHostError(error?.message || "Access request could not be sent.");
    } finally {
      setBusy(false);
    }
  };

  const withdrawAccessRequest = async (requestId) => {
    if (!requestId) return;
    setBusy(true);
    setHostError("");
    try {
      const result = await supabase.rpc("gpi_host_withdraw_organization_access_request", { p_request_id: requestId });
      if (result?.error) throw result.error;
      showToast?.("Organization access request withdrawn.", "success");
      await loadContext();
    } catch (error) {
      setHostError(error?.message || "The request could not be withdrawn.");
    } finally {
      setBusy(false);
    }
  };

  const createOrganization = async (event) => {
    event.preventDefault();
    if (newOrgName.trim().length < 2 || !newOrgEmail.trim()) {
      setHostError("Organization name and contact email are required.");
      return;
    }
    setBusy(true);
    setHostError("");
    try {
      const result = await supabase.rpc("gpi_host_create_organization", {
        p_name: newOrgName.trim(),
        p_description: newOrgDescription.trim() || null,
        p_contact_email: newOrgEmail.trim(),
      });
      if (result?.error) throw result.error;
      const organizationId = String(result?.data || "");
      showToast?.("Organization workspace created. Nothing is public yet.", "success");
      setNewOrgName("");
      setNewOrgDescription("");
      await loadContext();
      if (organizationId) setSelectedOrgId(organizationId);
      setHostScreen("workspace");
    } catch (error) {
      setHostError(error?.message || "Organization workspace could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const toggleRecurringDay = (day) => {
    setDraftRecurringDays((current) => current.includes(day)
      ? current.filter((value) => value !== day)
      : [...current, day].sort((a, b) => a - b));
  };

  const resetDraftForm = () => {
    setDraftTitle("");
    setDraftDescription("");
    setDraftGoal("connect");
    setDraftFormat("event");
    setDraftResponsibility("participant");
    setDraftCommitment("drop_in");
    setDraftSchedule("one_time");
    setDraftDuration("60");
    setDraftRecurringDays([]);
    setDraftStartTime("18:00");
    setDraftEndTime("19:00");
    setDraftLocationMode("in_person");
    setDraftCityAreaId("");
  };

  const createOpportunityDraft = async (event) => {
    event.preventDefault();
    const title = draftTitle.trim();
    const description = draftDescription.trim();
    if (!selectedOrgId) return;
    if (title.length < 3) {
      setHostError("Opportunity title must contain at least 3 characters.");
      return;
    }
    if (description.length < 20) {
      setHostError("Add at least 20 characters describing the opportunity.");
      return;
    }
    if (draftSchedule === "recurring" && !draftRecurringDays.length) {
      setHostError("Choose at least one recurring day.");
      return;
    }
    if (draftSchedule === "recurring" && (!draftStartTime || !draftEndTime || draftStartTime >= draftEndTime)) {
      setHostError("Choose a valid recurring time window.");
      return;
    }
    if (draftSchedule === "flexible" && (!Number(draftDuration) || Number(draftDuration) < 1)) {
      setHostError("Flexible opportunities need an estimated duration.");
      return;
    }
    if (["in_person", "hybrid"].includes(draftLocationMode) && !draftCityAreaId) {
      setHostError("Choose the city or area for an in-person or hybrid opportunity.");
      return;
    }

    const payload = {
      title,
      description,
      goal: draftGoal,
      opportunity_format: draftFormat,
      responsibility_level: draftResponsibility,
      commitment_type: draftCommitment,
      requires_background_check: false,
      requires_orientation: false,
      requires_application: false,
      requires_membership: false,
      schedule_type: draftSchedule,
      location_mode: draftLocationMode,
      location_visibility: "address_on_acceptance",
    };
    const duration = Number(draftDuration);
    if (Number.isFinite(duration) && duration > 0) payload.estimated_duration_minutes = duration;
    if (draftSchedule === "recurring") {
      payload.recurring_days = draftRecurringDays;
      payload.time_window_start = draftStartTime;
      payload.time_window_end = draftEndTime;
    }
    if (["in_person", "hybrid"].includes(draftLocationMode)) payload.city_area_id = draftCityAreaId;

    setBusy(true);
    setHostError("");
    try {
      const result = await supabase.rpc("gpi_host_save_opportunity", {
        p_opportunity_id: null,
        p_organization_id: selectedOrgId,
        p_payload: payload,
      });
      if (result?.error) throw result.error;
      const opportunityId = String(result?.data || "");
      showToast?.("Opportunity draft created. It is not public until FaithBid review and publication.", "success");
      resetDraftForm();
      await Promise.all([loadContext(), loadWorkspace(selectedOrgId)]);
      setWorkspaceFilter("draft");
      if (opportunityId) openOpportunityEditor(opportunityId);
      else setHostScreen("workspace");
    } catch (error) {
      setHostError(error?.message || "Opportunity draft could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const hydrateEditor = (data, readiness) => {
    const opportunity = data?.opportunity || {};
    const privateDetails = data?.private_details || {};
    setEditorData(data || null);
    setEditorReadiness(readiness || null);
    setEditorForm({
      title: opportunity.title || "",
      description: opportunity.description || "",
      goal: opportunity.goal || "connect",
      opportunity_format: opportunity.opportunity_format || "event",
      responsibility_level: opportunity.responsibility_level || "participant",
      commitment_type: opportunity.commitment_type || "drop_in",
      estimated_duration_minutes: opportunity.estimated_duration_minutes ?? "",
      min_age: opportunity.min_age ?? "",
      max_age: opportunity.max_age ?? "",
      requires_background_check: opportunity.requires_background_check === true,
      requires_orientation: opportunity.requires_orientation === true,
      requires_application: opportunity.requires_application === true,
      requires_membership: opportunity.requires_membership === true,
      transportation_note: opportunity.transportation_note || "",
      schedule_type: opportunity.schedule_type || "one_time",
      recurring_days: Array.isArray(opportunity.recurring_days) ? opportunity.recurring_days.map(Number) : [],
      time_window_start: opportunity.time_window_start ? String(opportunity.time_window_start).slice(0,5) : "18:00",
      time_window_end: opportunity.time_window_end ? String(opportunity.time_window_end).slice(0,5) : "19:00",
      recurrence_note: opportunity.recurrence_note || "",
      location_mode: opportunity.location_mode || "in_person",
      city_area_id: opportunity.city_area_id || "",
      postal_code: opportunity.postal_code || "",
      location_visibility: opportunity.location_visibility || "address_on_acceptance",
      public_address_text: opportunity.public_address_text || "",
      public_meeting_point_text: opportunity.public_meeting_point_text || "",
      private_address_text: privateDetails?.private_address_text || "",
      virtual_join_url: privateDetails?.virtual_join_url || "",
    });
    setEditorActivityIds((data?.activity_tags || []).map((tag) => String(tag.id)));
    setEditorCauseIds((data?.cause_tags || []).map((tag) => String(tag.id)));
    setEditorParticipantRequirements((data?.participant_requirements || []).map((item) => ({
      audience_tag_id: String(item.audience_tag_id || item.id || ""),
      treatment: item.treatment === "confirmation_required" ? "confirmation_required" : "descriptive",
      confirmation_prompt: item.confirmation_prompt || "",
    })).filter((item) => item.audience_tag_id));
    setEditorPopulationIds((data?.population_served || []).map((tag) => String(tag.id)));
  };

  const loadOpportunityEditor = useCallback(async (opportunityId) => {
    if (!opportunityId || !currentUser?.id) return;
    setEditorLoading(true);
    setHostError("");
    try {
      const [detailResult, readinessResult, feedbackResult] = await Promise.all([
        supabase.rpc("gpi_host_get_opportunity_editor", { p_opportunity_id: opportunityId }),
        supabase.rpc("gpi_host_get_review_readiness", { p_opportunity_id: opportunityId }),
        supabase.rpc("gpi_host_get_latest_review_feedback", { p_opportunity_id: opportunityId }),
      ]);
      if (detailResult?.error) throw detailResult.error;
      if (readinessResult?.error) throw readinessResult.error;
      if (feedbackResult?.error) throw feedbackResult.error;
      hydrateEditor(detailResult?.data || null, readinessResult?.data || null);
      setEditorReviewFeedback(feedbackResult?.data || null);
    } catch (error) {
      setEditorData(null);
      setEditorForm(null);
      setEditorReadiness(null);
      setEditorReviewFeedback(null);
      setHostError(error?.message || "Opportunity editor could not load.");
    } finally {
      setEditorLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!open || hostScreen !== "editor" || !editorOpportunityId) return;
    loadOpportunityEditor(editorOpportunityId);
  }, [open, hostScreen, editorOpportunityId, loadOpportunityEditor]);

  const openOpportunityEditor = (opportunityId) => {
    setHostError("");
    setEditorTab("details");
    setCloseReason("");
    setEditorOpportunityId(String(opportunityId || ""));
    setHostScreen("editor");
  };

  const setEditorField = (key, value) => setEditorForm((current) => ({ ...(current || {}), [key]: value }));

  const setEditorGoal = (value) => {
    setEditorField("goal", value);
    if (value === "connect") {
      const allowedIds = new Set(hostCauseTags.filter((tag) => tag?.care_flagged !== true).map((tag) => String(tag.id)));
      setEditorCauseIds((current) => current.filter((id) => allowedIds.has(String(id))));
      setEditorPopulationIds([]);
    }
  };

  const toggleEditorId = (setter, id) => setter((current) => current.includes(String(id)) ? current.filter((value) => value !== String(id)) : [...current, String(id)]);

  const toggleEditorParticipant = (tag) => {
    const tagId = String(tag?.id || "");
    if (!tagId) return;
    setEditorParticipantRequirements((current) => current.some((item) => item.audience_tag_id === tagId)
      ? current.filter((item) => item.audience_tag_id !== tagId)
      : [...current, { audience_tag_id: tagId, treatment: "descriptive", confirmation_prompt: "" }]);
  };

  const updateEditorParticipant = (tagId, patch) => setEditorParticipantRequirements((current) => current.map((item) => item.audience_tag_id === String(tagId) ? { ...item, ...patch } : item));

  const buildEditorPayload = () => {
    const form = editorForm || {};
    const payload = {
      title: String(form.title || "").trim(),
      description: String(form.description || "").trim(),
      goal: form.goal,
      opportunity_format: form.opportunity_format,
      responsibility_level: form.responsibility_level,
      commitment_type: form.commitment_type,
      requires_background_check: !!form.requires_background_check,
      requires_orientation: !!form.requires_orientation,
      requires_application: !!form.requires_application,
      requires_membership: !!form.requires_membership,
      schedule_type: form.schedule_type,
      location_mode: form.location_mode,
      location_visibility: form.location_visibility,
    };
    if (String(form.estimated_duration_minutes || "").trim()) payload.estimated_duration_minutes = Number(form.estimated_duration_minutes);
    if (String(form.min_age || "").trim()) payload.min_age = Number(form.min_age);
    if (String(form.max_age || "").trim()) payload.max_age = Number(form.max_age);
    if (String(form.transportation_note || "").trim()) payload.transportation_note = String(form.transportation_note).trim();
    if (form.schedule_type === "recurring") {
      payload.recurring_days = Array.isArray(form.recurring_days) ? form.recurring_days : [];
      payload.time_window_start = form.time_window_start;
      payload.time_window_end = form.time_window_end;
    } else if (form.schedule_type === "flexible" && form.time_window_start && form.time_window_end) {
      payload.time_window_start = form.time_window_start;
      payload.time_window_end = form.time_window_end;
    }
    if (String(form.recurrence_note || "").trim()) payload.recurrence_note = String(form.recurrence_note).trim();
    if (["in_person", "hybrid"].includes(form.location_mode)) {
      payload.city_area_id = form.city_area_id;
      if (String(form.postal_code || "").trim()) payload.postal_code = String(form.postal_code).trim();
    }
    if (form.location_visibility === "public_address") payload.public_address_text = String(form.public_address_text || "").trim();
    if (form.location_visibility === "public_meeting_point") payload.public_meeting_point_text = String(form.public_meeting_point_text || "").trim();
    return payload;
  };

  const validateEditor = () => {
    const form = editorForm || {};
    if (String(form.title || "").trim().length < 3) return "Opportunity title must contain at least 3 characters.";
    if (String(form.description || "").trim().length < 20) return "Opportunity description must contain at least 20 characters.";
    if (form.schedule_type === "recurring" && (!Array.isArray(form.recurring_days) || !form.recurring_days.length)) return "Choose at least one recurring day.";
    if (form.schedule_type === "recurring" && (!form.time_window_start || !form.time_window_end || form.time_window_start >= form.time_window_end)) return "Choose a valid recurring time window.";
    if (form.schedule_type === "flexible" && (!Number(form.estimated_duration_minutes) || Number(form.estimated_duration_minutes) < 1)) return "Flexible opportunities need an estimated duration.";
    if (["in_person", "hybrid"].includes(form.location_mode) && !form.city_area_id) return "Choose a mapped city or area.";
    if (form.location_visibility === "public_address" && !String(form.public_address_text || "").trim()) return "Enter the public address or choose another location privacy option.";
    if (form.location_visibility === "public_meeting_point" && !String(form.public_meeting_point_text || "").trim()) return "Enter the public meeting point or choose another location privacy option.";
    const minAge = String(form.min_age || "").trim() ? Number(form.min_age) : null;
    const maxAge = String(form.max_age || "").trim() ? Number(form.max_age) : null;
    if (minAge !== null && maxAge !== null && minAge > maxAge) return "Minimum age cannot be greater than maximum age.";
    const badPrompt = editorParticipantRequirements.find((item) => item.treatment === "confirmation_required" && String(item.confirmation_prompt || "").trim().length < 5);
    if (badPrompt) return "Confirmation-required audiences need a prompt of at least 5 characters.";
    return "";
  };

  const saveFullOpportunity = async () => {
    if (!editorOpportunityId || !selectedOrgId || !editorForm) return;
    const validation = validateEditor();
    if (validation) { setHostError(validation); return; }
    setBusy(true);
    setHostError("");
    try {
      const result = await supabase.rpc("gpi_host_save_full_opportunity", {
        p_opportunity_id: editorOpportunityId,
        p_organization_id: selectedOrgId,
        p_payload: buildEditorPayload(),
        p_private_address_text: editorForm.location_visibility === "address_on_acceptance" ? (String(editorForm.private_address_text || "").trim() || null) : null,
        p_virtual_join_url: ["virtual", "hybrid"].includes(editorForm.location_mode) ? (String(editorForm.virtual_join_url || "").trim() || null) : null,
        p_cause_tag_ids: editorCauseIds,
        p_activity_tag_ids: editorActivityIds,
        p_participant_requirements: editorParticipantRequirements.map((item) => ({
          audience_tag_id: item.audience_tag_id,
          treatment: item.treatment,
          confirmation_prompt: item.treatment === "confirmation_required" ? String(item.confirmation_prompt || "").trim() : null,
        })),
        p_population_served_ids: editorForm.goal === "serve" ? editorPopulationIds : [],
      });
      if (result?.error) throw result.error;
      showToast?.("Opportunity saved. Public visibility still requires FaithBid review and publication.", "success");
      await Promise.all([loadOpportunityEditor(editorOpportunityId), loadWorkspace(selectedOrgId), loadContext()]);
    } catch (error) {
      setHostError(error?.message || "Opportunity changes could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const addOccurrence = async (event) => {
    event.preventDefault();
    if (!editorOpportunityId) return;
    const startsAt = gpiHostToIso(occurrenceStart);
    const endsAt = gpiHostToIso(occurrenceEnd);
    const deadline = gpiHostToIso(occurrenceDeadline);
    if (!startsAt) { setHostError("Choose a valid occurrence start time."); return; }
    if (endsAt && new Date(endsAt) <= new Date(startsAt)) { setHostError("Occurrence end must be after the start."); return; }
    if (deadline && new Date(deadline) > new Date(startsAt)) { setHostError("Registration deadline cannot be after the occurrence starts."); return; }
    setBusy(true); setHostError("");
    try {
      const result = await supabase.rpc("gpi_host_add_occurrence", {
        p_opportunity_id: editorOpportunityId,
        p_starts_at: startsAt,
        p_ends_at: endsAt,
        p_registration_deadline: deadline,
      });
      if (result?.error) throw result.error;
      setOccurrenceStart(""); setOccurrenceEnd(""); setOccurrenceDeadline("");
      showToast?.("Occurrence added.", "success");
      await Promise.all([loadOpportunityEditor(editorOpportunityId), loadWorkspace(selectedOrgId)]);
    } catch (error) { setHostError(error?.message || "Occurrence could not be added."); }
    finally { setBusy(false); }
  };

  const updateOccurrence = async (occurrence, status, reconfirm = false) => {
    if (!occurrence?.id) return;
    setBusy(true); setHostError("");
    try {
      const result = await supabase.rpc("gpi_host_update_occurrence", {
        p_occurrence_id: occurrence.id,
        p_starts_at: occurrence.starts_at,
        p_ends_at: occurrence.ends_at || null,
        p_status: status || occurrence.status,
        p_registration_deadline: occurrence.registration_deadline || null,
        p_reconfirm: reconfirm,
      });
      if (result?.error) throw result.error;
      showToast?.(reconfirm ? "Occurrence reconfirmed." : "The gathering was updated. FaithBid will show the change to affected participants.", "success");
      await Promise.all([loadOpportunityEditor(editorOpportunityId), loadWorkspace(selectedOrgId)]);
    } catch (error) { setHostError(error?.message || "Occurrence could not be updated."); }
    finally { setBusy(false); }
  };

  const submitForReview = async () => {
    if (!editorOpportunityId) return;
    setBusy(true); setHostError("");
    try {
      const readinessResult = await supabase.rpc("gpi_host_get_review_readiness", { p_opportunity_id: editorOpportunityId });
      if (readinessResult?.error) throw readinessResult.error;
      const readiness = readinessResult?.data || {};
      setEditorReadiness(readiness);
      if (!readiness.can_submit) {
        const missing = Array.isArray(readiness.missing) ? readiness.missing.join(" · ") : "Complete the review checklist first.";
        throw new Error(missing || "Complete the review checklist first.");
      }
      const result = await supabase.rpc("gpi_host_submit_for_review", { p_opportunity_id: editorOpportunityId });
      if (result?.error) throw result.error;
      showToast?.("Opportunity submitted for FaithBid review. It is not public yet.", "success");
      await Promise.all([loadOpportunityEditor(editorOpportunityId), loadWorkspace(selectedOrgId), loadContext()]);
      setEditorTab("review");
    } catch (error) { setHostError(error?.message || "Opportunity could not be submitted for review."); }
    finally { setBusy(false); }
  };

  const withdrawFromReview = async () => {
    if (!editorOpportunityId) return;
    setBusy(true); setHostError("");
    try {
      const result = await supabase.rpc("gpi_host_withdraw_from_review", { p_opportunity_id: editorOpportunityId });
      if (result?.error) throw result.error;
      showToast?.("Opportunity returned to private draft.", "success");
      await Promise.all([loadOpportunityEditor(editorOpportunityId), loadWorkspace(selectedOrgId), loadContext()]);
    } catch (error) { setHostError(error?.message || "Opportunity could not be withdrawn from review."); }
    finally { setBusy(false); }
  };

  const confirmOpportunityCurrent = async () => {
    if (!editorOpportunityId) return;
    setBusy(true); setHostError("");
    try {
      const result = await supabase.rpc("gpi_host_confirm_opportunity", { p_opportunity_id: editorOpportunityId });
      if (result?.error) throw result.error;
      showToast?.("Opportunity confirmed as current.", "success");
      await Promise.all([loadOpportunityEditor(editorOpportunityId), loadWorkspace(selectedOrgId)]);
    } catch (error) { setHostError(error?.message || "Opportunity freshness could not be confirmed."); }
    finally { setBusy(false); }
  };

  const closeOpportunity = async () => {
    if (!editorOpportunityId) return;
    const reason = closeReason.trim();
    if (!reason) { setHostError("Add a short closure reason before closing the opportunity."); return; }
    setBusy(true); setHostError("");
    try {
      const result = await supabase.rpc("gpi_host_close_opportunity", { p_opportunity_id: editorOpportunityId, p_reason: reason });
      if (result?.error) throw result.error;
      showToast?.("Opportunity closed.", "success");
      setCloseReason("");
      await Promise.all([loadOpportunityEditor(editorOpportunityId), loadWorkspace(selectedOrgId), loadContext()]);
    } catch (error) { setHostError(error?.message || "Opportunity could not be closed."); }
    finally { setBusy(false); }
  };

  const loadConnectionRequestDetail = useCallback(async (requestId, markSeen = false) => {
    if (!requestId || !currentUser?.id) return;
    setRequestLoading(true);
    setHostError("");
    try {
      if (markSeen) {
        const seenResult = await supabase.rpc("gpi_host_mark_connection_request_seen", { p_request_id: requestId });
        if (seenResult?.error) throw seenResult.error;
      }
      const result = await supabase.rpc("gpi_host_get_connection_request", { p_request_id: requestId });
      if (result?.error) throw result.error;
      const data = result?.data || null;
      setRequestDetail(data);
      setRequestResponse("next_step_provided");
      setRequestInstructions(data?.next_step?.instructions || "");
    } catch (error) {
      setRequestDetail(null);
      setHostError(error?.message || "Interest request could not load.");
    } finally {
      setRequestLoading(false);
    }
  }, [currentUser?.id]);

  const openConnectionRequest = async (requestId) => {
    if (!requestId) return;
    setSelectedRequestId(String(requestId));
    setHostScreen("request");
    await loadConnectionRequestDetail(requestId, true);
    if (selectedOrgId) loadConnectionRequests(selectedOrgId, requestQueue);
  };

  const submitConnectionResponse = async () => {
    if (!selectedRequestId) return;
    const instructions = requestResponse === "next_step_provided" ? requestInstructions.trim() : null;
    if (requestResponse === "next_step_provided" && instructions.length < 10) {
      setHostError("Add at least 10 characters explaining the seeker's next step.");
      return;
    }
    setBusy(true);
    setHostError("");
    try {
      const result = await supabase.rpc("gpi_host_respond_to_connection_request", {
        p_request_id: selectedRequestId,
        p_response: requestResponse,
        p_next_step_instructions: instructions,
      });
      if (result?.error) throw result.error;
      showToast?.(requestResponse === "next_step_provided" ? "Next step sent. Seeker contact is now available in this request." : requestResponse === "declined" ? "Interest request declined without releasing seeker contact." : "Interest request marked unavailable.", "success");
      await Promise.all([
        loadConnectionRequestDetail(selectedRequestId, false),
        selectedOrgId ? loadConnectionRequests(selectedOrgId, requestQueue) : Promise.resolve(),
      ]);
    } catch (error) {
      setHostError(error?.message || "Interest request response could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const workspaceOpportunities = Array.isArray(workspace?.opportunities) ? workspace.opportunities : [];
  const filteredWorkspaceOpportunities = workspaceFilter === "all"
    ? workspaceOpportunities
    : workspaceOpportunities.filter((item) => String(item?.status || "") === workspaceFilter);
  const opportunityCounts = workspaceOpportunities.reduce((counts, item) => {
    const status = String(item?.status || "draft");
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
  const workspaceOrganization = workspace?.organization || selectedMembership || {};
  const organizationLocked = ["suspended", "closed"].includes(String(workspaceOrganization?.status || workspaceOrganization?.organization_status || "").toLowerCase());
  const organizationPublicHomeAvailable = !!selectedOrgId && selectedMembership?.active !== false && (workspaceOrganization?.verified === true || String(workspaceOrganization?.status || workspaceOrganization?.organization_status || "").toLowerCase() === "verified");
  const requestSummary = requestWorkspace?.summary || {};
  const connectionRequests = Array.isArray(requestWorkspace?.requests) ? requestWorkspace.requests : [];
  const requestRecord = requestDetail?.request || null;
  const requestConfirmations = Array.isArray(requestDetail?.confirmations) ? requestDetail.confirmations : [];
  const requestProcessRequirements = requestDetail?.process_requirements || {};
  const requestCanRespond = String(requestRecord?.status || "").toLowerCase() === "notified" && (!requestRecord?.response_due_at || new Date(requestRecord.response_due_at) > new Date());
  const editorOpportunity = editorData?.opportunity || null;
  const editorOccurrences = Array.isArray(editorData?.occurrences) ? editorData.occurrences : [];
  const editorStatus = String(editorOpportunity?.status || "draft").toLowerCase();
  const editorMembershipRole = String(workspaceOrganization?.membership_role || selectedMembership?.membership_role || "").toLowerCase();
  const editorLocked = organizationLocked || editorStatus === "closed";
  const editorCity = cityAreas.find((city) => String(city?.id || city?.city_area_id) === String(editorForm?.city_area_id || ""));
  const selectedActivityLabels = hostActivityTags.filter((tag) => editorActivityIds.includes(String(tag.id))).map((tag) => tag.label);
  const reviewMissing = Array.isArray(editorReadiness?.missing) ? editorReadiness.missing : [];

  if (!open) return null;

  return (
    <div className="gpi-host-portal" role="dialog" aria-modal="true" aria-label="Church and ministry opportunity workspace">
      <button type="button" className="gpi-host-portal-backdrop" aria-label="Close church and ministry workspace" onClick={() => { if (!busy) onClose?.(); }} />
      <section className="gpi-host-shell">
        <header className="gpi-host-shell-header">
          <div>
            <span className="gpi-host-eyebrow">For churches &amp; ministries</span>
            <h2>{["workspace", "draft", "editor", "requests", "request"].includes(hostScreen)
              ? hostScreen === "editor"
                ? (editorOpportunity?.title || "Opportunity editor")
                : hostScreen === "request"
                  ? (requestRecord?.opportunity_title || "Interest request")
                  : hostScreen === "requests"
                    ? "Interest requests"
                    : "My opportunities"
              : "Bring people together."}</h2>
            <p>{["workspace", "draft", "editor", "requests", "request"].includes(hostScreen)
              ? hostScreen === "requests" || hostScreen === "request"
                ? "Respond to verified seeker interest without exposing contact information before you provide a real next step."
                : "Create and manage real opportunities while FaithBid keeps verification and public publication separate."
              : "Create a host workspace, claim an existing organization, and invite people into a real next step."}</p>
          </div>
          <button type="button" className="gpi-host-close" onClick={() => { if (!busy) onClose?.(); }} aria-label="Close">×</button>
        </header>

        {hostError && <div className="gpi-host-error" role="alert"><strong>Needs attention</strong><span>{hostError}</span><button type="button" onClick={() => setHostError("")}>Dismiss</button></div>}

        {contextLoading ? (
          <div className="gpi-host-loading"><span/><strong>Opening your organization workspace…</strong></div>
        ) : hostScreen === "home" ? (
          <div className="gpi-host-onboarding">
            <div className="gpi-host-trust-note">
              <span>FaithBid trust boundary</span>
              <strong>Organization access is reviewed separately from your Marketplace role.</strong>
              <p>A church or vendor account can represent a ministry here only through its verified GPI organization relationship.</p>
            </div>

            {inactiveMemberships.length > 0 && <div className="gpi-host-inactive-list">
              <div className="gpi-host-section-label">Inactive organization access</div>
              {inactiveMemberships.map((membership) => <div className="gpi-host-inactive-card" key={membership.organization_id}><div><strong>{membership.organization_name}</strong><span>Your prior {gpiHostTitleCase(membership.membership_role)} access is inactive.</span></div><em>FaithBid review required</em></div>)}
            </div>}

            {pendingRequests.length > 0 && <div className="gpi-host-pending-list">
              <div className="gpi-host-section-label">Requests awaiting FaithBid review</div>
              {pendingRequests.map((request) => <div className="gpi-host-pending-card" key={request.request_id}>
                <div><strong>{request.organization_name}</strong><span>{gpiHostTitleCase(request.requested_role)} access · requested {gpiHostFormatWhen(request.created_at)}</span></div>
                <button type="button" disabled={busy} onClick={() => withdrawAccessRequest(request.request_id)}>Withdraw</button>
              </div>)}
            </div>}

            <div className="gpi-host-choice-grid">
              <button type="button" className="gpi-host-choice" onClick={() => { setHostError(""); setHostScreen("claim"); }}>
                <span className="gpi-host-choice-icon">⌕</span>
                <strong>Find my organization</strong>
                <p>Search an existing verified church or ministry and request host access.</p>
                <em>Request access →</em>
              </button>
              <button type="button" className="gpi-host-choice" onClick={() => { setHostError(""); setHostScreen("create"); }}>
                <span className="gpi-host-choice-icon">＋</span>
                <strong>Set up a new organization</strong>
                <p>Create a private draft workspace. Verification and public publication stay with FaithBid.</p>
                <em>Create workspace →</em>
              </button>
            </div>
          </div>
        ) : hostScreen === "claim" ? (
          <div className="gpi-host-form-screen">
            <button type="button" className="gpi-host-back" onClick={backToHostHome}>← Back</button>
            <div className="gpi-host-form-intro gpi-host-form-intro-split"><div><span>Existing organization</span><h3>Find your church or ministry.</h3><p>Search only verified organizations already participating in Get Plugged In.</p></div><button type="button" onClick={() => { setHostError(""); setHostScreen("create"); }}>Set up a new organization</button></div>
            <form className="gpi-host-search-form" onSubmit={searchOrganizations}>
              <label><span>Organization name</span><div><input value={orgSearch} onChange={(event) => setOrgSearch(event.target.value)} placeholder="Search by church or ministry name"/><button type="submit" disabled={orgSearching}>{orgSearching ? "Searching…" : "Search"}</button></div></label>
            </form>
            <div className="gpi-host-search-results">
              {orgSearchResults.map((organization) => {
                const alreadyConnected = organization.membership_active === true;
                const alreadyPending = !!organization.pending_request_id;
                return <button type="button" key={organization.organization_id} className={`gpi-host-search-result${String(claimOrg?.organization_id) === String(organization.organization_id) ? " selected" : ""}`} disabled={alreadyConnected || alreadyPending} onClick={() => { setClaimOrg(organization); setClaimMessage(""); setHostError(""); }}>
                  <span><strong>{organization.name}</strong><small>{organization.description || "Verified FaithBid organization"}</small></span>
                  <em>{alreadyConnected ? "Already connected" : alreadyPending ? "Request pending" : "Request access →"}</em>
                </button>;
              })}
              {!orgSearching && orgSearch.trim().length >= 2 && orgSearchResults.length === 0 && <div className="gpi-host-search-empty">No verified organizations matched that search. You can set up a new organization instead.</div>}
            </div>
            {claimOrg && <form className="gpi-host-claim-form" onSubmit={requestOrganizationAccess}>
              <div className="gpi-host-selected-org"><span>Requesting access to</span><strong>{claimOrg.name}</strong></div>
              <div className="gpi-host-field-grid">
                <label><span>Role in this workspace</span><select value={claimRole} onChange={(event) => setClaimRole(event.target.value)}><option value="admin">Organization Admin</option><option value="editor">Organization Editor</option></select></label>
                <label><span>Organization contact email</span><input type="email" required value={claimEmail} onChange={(event) => setClaimEmail(event.target.value)} placeholder="contact@church.org"/></label>
              </div>
              <label><span>Anything FaithBid should know?</span><textarea value={claimMessage} maxLength={1000} onChange={(event) => setClaimMessage(event.target.value)} placeholder="Your role, relationship to the organization, or context that helps us verify access."/></label>
              <div className="gpi-host-form-actions"><button type="button" onClick={() => setClaimOrg(null)}>Cancel</button><button type="submit" disabled={busy}>{busy ? "Sending…" : "Send for FaithBid review"}</button></div>
            </form>}
          </div>
        ) : hostScreen === "create" ? (
          <div className="gpi-host-form-screen">
            <button type="button" className="gpi-host-back" onClick={backToHostHome}>← Back</button>
            <div className="gpi-host-form-intro"><span>New organization</span><h3>Set up a private host workspace.</h3><p>You can begin drafts immediately. Your organization and contact route remain unverified until FaithBid reviews them.</p></div>
            <form className="gpi-host-create-form" onSubmit={createOrganization}>
              <label><span>Church or ministry name</span><input required minLength={2} maxLength={160} value={newOrgName} onChange={(event) => setNewOrgName(event.target.value)} placeholder="Organization name"/></label>
              <label><span>Short description <em>optional</em></span><textarea maxLength={3000} value={newOrgDescription} onChange={(event) => setNewOrgDescription(event.target.value)} placeholder="What does your church or ministry do?"/></label>
              <label><span>Primary organization contact email</span><input type="email" required value={newOrgEmail} onChange={(event) => setNewOrgEmail(event.target.value)} placeholder="contact@church.org"/></label>
              <div className="gpi-host-create-note"><strong>Private by default.</strong><span>Creating this workspace does not verify your organization and does not publish an opportunity.</span></div>
              <div className="gpi-host-form-actions"><button type="button" onClick={backToHostHome}>Cancel</button><button type="submit" disabled={busy}>{busy ? "Creating…" : "Create organization workspace"}</button></div>
            </form>
          </div>
        ) : hostScreen === "editor" ? (
          <div className="gpi-host-form-screen gpi-host-editor-screen">
            <button type="button" className="gpi-host-back" onClick={() => { setHostError(""); setHostScreen("workspace"); }}>← My opportunities</button>
            {editorLoading || !editorForm ? <div className="gpi-host-loading"><span/><strong>Loading opportunity editor…</strong></div> : <>
              <div className="gpi-host-editor-topline">
                <div><span className={`gpi-host-status status-${editorStatus}`}>{gpiHostTitleCase(editorStatus)}</span><em>Revision {editorOpportunity?.content_revision || 1}</em>{editorReadiness?.organization_verified === false && <em>Organization verification pending</em>}</div>
                <div><button type="button" disabled={busy} onClick={() => loadOpportunityEditor(editorOpportunityId)}>Refresh</button><button type="button" className="primary" disabled={busy || editorLocked} onClick={saveFullOpportunity}>{busy ? "Saving…" : "Save changes"}</button></div>
              </div>

              {editorStatus === "open" && <div className="gpi-host-editor-live-note"><strong>This opportunity is live.</strong><span>A material save automatically returns it to FaithBid review before it can be public again.</span></div>}
              {editorStatus === "requires_review" && <div className="gpi-host-editor-review-note"><strong>Awaiting FaithBid review.</strong><span>You may keep editing, but FaithBid reviews the latest content revision. You can also withdraw it back to a private draft.</span></div>}
              {editorReviewFeedback?.reason && <div className="gpi-host-editor-feedback-note"><div><strong>FaithBid requested changes.</strong><span>{editorReviewFeedback.requested_at ? `Sent ${gpiHostFormatWhen(editorReviewFeedback.requested_at)}` : "Review feedback"}</span></div><p>{editorReviewFeedback.reason}</p><button type="button" onClick={()=>setEditorTab("review")}>Review &amp; resubmit →</button></div>}
              {editorLocked && <div className="gpi-host-locked-note"><strong>Read-only opportunity.</strong><span>Closed or locked records cannot be edited from the host workspace.</span></div>}

              <div className="gpi-host-editor-tabs" role="tablist" aria-label="Opportunity editor sections">
                {[["details","Opportunity"],["matching","Who it is for"],["logistics","When & where"],["review","Preview & submit"]].map(([id,label]) => <button type="button" key={id} role="tab" aria-selected={editorTab===id} className={editorTab===id ? "active" : ""} onClick={() => setEditorTab(id)}>{label}</button>)}
              </div>

              {editorTab === "details" && <div className="gpi-host-editor-panel">
                <div className="gpi-host-editor-section-heading"><span>Opportunity</span><h3>What are you inviting people into?</h3><p>Keep the invitation clear enough that someone can understand the first step without insider language.</p></div>
                <div className="gpi-host-editor-grid">
                  <label className="wide"><span>Opportunity title</span><input disabled={editorLocked} minLength={3} maxLength={160} value={editorForm.title} onChange={(e)=>setEditorField("title",e.target.value)}/></label>
                  <label className="wide"><span>Description</span><textarea disabled={editorLocked} minLength={20} maxLength={5000} value={editorForm.description} onChange={(e)=>setEditorField("description",e.target.value)}/></label>
                  <label><span>Main goal</span><select disabled={editorLocked} value={editorForm.goal} onChange={(e)=>setEditorGoal(e.target.value)}><option value="connect">Connect</option><option value="serve">Serve</option></select></label>
                  <label><span>Format</span><select disabled={editorLocked} value={editorForm.opportunity_format} onChange={(e)=>setEditorField("opportunity_format",e.target.value)}><option value="event">Event</option><option value="group">Group</option><option value="class">Class</option><option value="service_role">Service role</option></select></label>
                  <label><span>Participation</span><select disabled={editorLocked} value={editorForm.responsibility_level} onChange={(e)=>setEditorField("responsibility_level",e.target.value)}><option value="participant">Join in</option><option value="volunteer">Volunteer</option><option value="leader">Lead</option></select></label>
                  <label><span>Commitment</span><select disabled={editorLocked} value={editorForm.commitment_type} onChange={(e)=>setEditorField("commitment_type",e.target.value)}><option value="drop_in">Drop in</option><option value="ongoing">Ongoing</option><option value="seasonal">Seasonal</option></select></label>
                  <label><span>Estimated minutes</span><input disabled={editorLocked} type="number" min="1" max="10080" value={editorForm.estimated_duration_minutes} onChange={(e)=>setEditorField("estimated_duration_minutes",e.target.value)}/></label>
                  <div className="gpi-host-age-grid"><label><span>Minimum age</span><input disabled={editorLocked} type="number" min="0" max="120" value={editorForm.min_age} onChange={(e)=>setEditorField("min_age",e.target.value)}/></label><label><span>Maximum age</span><input disabled={editorLocked} type="number" min="0" max="120" value={editorForm.max_age} onChange={(e)=>setEditorField("max_age",e.target.value)}/></label></div>
                  <label className="wide"><span>Transportation note</span><input disabled={editorLocked} maxLength={500} value={editorForm.transportation_note} onChange={(e)=>setEditorField("transportation_note",e.target.value)} placeholder="Optional arrival, parking, or transportation guidance"/></label>
                </div>
                <div className="gpi-host-requirement-grid">
                  {[["requires_background_check","Background check required"],["requires_orientation","Orientation required"],["requires_application","Application required"],["requires_membership","Membership required"]].map(([key,label]) => <label key={key}><input disabled={editorLocked} type="checkbox" checked={!!editorForm[key]} onChange={(e)=>setEditorField(key,e.target.checked)}/><span>{label}</span></label>)}
                </div>
              </div>}

              {editorTab === "matching" && <div className="gpi-host-editor-panel">
                <div className="gpi-host-editor-section-heading"><span>Discovery matching</span><h3>Help the right people find this.</h3><p>FaithBid uses these signals to connect seeker interests with real opportunities. At least one activity is required before review.</p></div>
                <div className="gpi-host-taxonomy-section"><div><strong>Activities</strong><span>Choose what someone will actually do.</span></div><div className="gpi-host-taxonomy-chips">{hostActivityTags.map((tag) => <button type="button" disabled={editorLocked} className={editorActivityIds.includes(String(tag.id)) ? "selected" : ""} key={tag.id} onClick={()=>toggleEditorId(setEditorActivityIds,tag.id)}>{tag.label}</button>)}</div></div>
                <div className="gpi-host-taxonomy-section"><div><strong>Cause / community focus</strong><span>{editorForm.goal === "connect" ? "Care-sensitive causes are held out of Connect listings by the trust contract." : "Optional context about the cause or community served."}</span></div><div className="gpi-host-taxonomy-chips">{hostCauseTags.map((tag) => { const blocked = editorForm.goal === "connect" && tag.care_flagged === true; return <button type="button" disabled={editorLocked || blocked} title={blocked ? "Use Serve for care-sensitive causes." : undefined} className={editorCauseIds.includes(String(tag.id)) ? "selected" : ""} key={tag.id} onClick={()=>toggleEditorId(setEditorCauseIds,tag.id)}>{tag.label}{blocked ? " · Serve only" : ""}</button>; })}</div></div>
                <div className="gpi-host-taxonomy-section"><div><strong>Who can participate?</strong><span>Select descriptive audiences, or require a simple confirmation when needed.</span></div><div className="gpi-host-audience-list">{hostAudienceTags.map((tag) => { const item=editorParticipantRequirements.find((entry)=>entry.audience_tag_id===String(tag.id)); return <div className={`gpi-host-audience-row${item ? " selected" : ""}`} key={tag.id}><label><input disabled={editorLocked} type="checkbox" checked={!!item} onChange={()=>toggleEditorParticipant(tag)}/><span>{tag.label}</span></label>{item && <><select disabled={editorLocked} value={item.treatment} onChange={(e)=>updateEditorParticipant(tag.id,{treatment:e.target.value,confirmation_prompt:e.target.value==="confirmation_required"?item.confirmation_prompt:""})}><option value="descriptive">Descriptive</option><option value="confirmation_required">Ask for confirmation</option></select>{item.treatment === "confirmation_required" && <input disabled={editorLocked} maxLength={240} value={item.confirmation_prompt} onChange={(e)=>updateEditorParticipant(tag.id,{confirmation_prompt:e.target.value})} placeholder="What should the participant confirm?"/>}</>}</div>; })}</div></div>
                {editorForm.goal === "serve" && <div className="gpi-host-taxonomy-section"><div><strong>People served</strong><span>Optional: who primarily benefits from this service opportunity?</span></div><div className="gpi-host-taxonomy-chips">{hostAudienceTags.map((tag) => <button type="button" disabled={editorLocked} className={editorPopulationIds.includes(String(tag.id)) ? "selected" : ""} key={tag.id} onClick={()=>toggleEditorId(setEditorPopulationIds,tag.id)}>{tag.label}</button>)}</div></div>}
              </div>}

              {editorTab === "logistics" && <div className="gpi-host-editor-panel">
                <div className="gpi-host-editor-section-heading"><span>When &amp; where</span><h3>Make the next step concrete.</h3><p>Private addresses and virtual links stay behind the protected host contract.</p></div>
                <div className="gpi-host-editor-grid">
                  <label><span>Schedule</span><select disabled={editorLocked} value={editorForm.schedule_type} onChange={(e)=>setEditorField("schedule_type",e.target.value)}><option value="one_time">One-time</option><option value="recurring">Recurring</option><option value="flexible">Flexible</option></select></label>
                  <label><span>Estimated minutes</span><input disabled={editorLocked} type="number" min="1" max="10080" value={editorForm.estimated_duration_minutes} onChange={(e)=>setEditorField("estimated_duration_minutes",e.target.value)}/></label>
                  {editorForm.schedule_type === "recurring" && <div className="gpi-host-recurring wide"><span>Recurring pattern</span><div>{[[1,"Mon"],[2,"Tue"],[3,"Wed"],[4,"Thu"],[5,"Fri"],[6,"Sat"],[0,"Sun"]].map(([day,label]) => <button disabled={editorLocked} type="button" key={day} className={(editorForm.recurring_days||[]).includes(day)?"selected":""} onClick={()=>setEditorField("recurring_days",(editorForm.recurring_days||[]).includes(day)?editorForm.recurring_days.filter((v)=>v!==day):[...editorForm.recurring_days,day].sort((a,b)=>a-b))}>{label}</button>)}</div><div className="gpi-host-time-grid"><label><span>Starts</span><input disabled={editorLocked} type="time" value={editorForm.time_window_start} onChange={(e)=>setEditorField("time_window_start",e.target.value)}/></label><label><span>Ends</span><input disabled={editorLocked} type="time" value={editorForm.time_window_end} onChange={(e)=>setEditorField("time_window_end",e.target.value)}/></label></div></div>}
                  <label className="wide"><span>Schedule note</span><input disabled={editorLocked} maxLength={500} value={editorForm.recurrence_note} onChange={(e)=>setEditorField("recurrence_note",e.target.value)} placeholder="Optional schedule guidance"/></label>
                  <label><span>Location</span><select disabled={editorLocked} value={editorForm.location_mode} onChange={(e)=>setEditorField("location_mode",e.target.value)}><option value="in_person">In person</option><option value="virtual">Virtual</option><option value="hybrid">Hybrid</option></select></label>
                  {["in_person","hybrid"].includes(editorForm.location_mode) && <label><span>City / area</span><select disabled={editorLocked} value={editorForm.city_area_id} onChange={(e)=>setEditorField("city_area_id",e.target.value)}><option value="">Choose a mapped area</option>{cityAreas.map((city)=><option key={city.id||city.city_area_id||city.label} value={city.id||city.city_area_id}>{gpiCityOptionLabel(city)}</option>)}</select></label>}
                  {["in_person","hybrid"].includes(editorForm.location_mode) && <label><span>Postal code</span><input disabled={editorLocked} maxLength={16} value={editorForm.postal_code} onChange={(e)=>setEditorField("postal_code",e.target.value)} placeholder="Optional"/></label>}
                  <label><span>Address privacy</span><select disabled={editorLocked} value={editorForm.location_visibility} onChange={(e)=>setEditorField("location_visibility",e.target.value)}><option value="address_on_acceptance">Share exact details after acceptance</option><option value="public_meeting_point">Show a public meeting point</option><option value="public_address">Show the address publicly</option></select></label>
                  {editorForm.location_visibility === "public_address" && <label className="wide"><span>Public address</span><input disabled={editorLocked} value={editorForm.public_address_text} onChange={(e)=>setEditorField("public_address_text",e.target.value)} placeholder="Address shown to seekers"/></label>}
                  {editorForm.location_visibility === "public_meeting_point" && <label className="wide"><span>Public meeting point</span><input disabled={editorLocked} value={editorForm.public_meeting_point_text} onChange={(e)=>setEditorField("public_meeting_point_text",e.target.value)} placeholder="Public place or meeting instructions"/></label>}
                  {editorForm.location_visibility === "address_on_acceptance" && <label className="wide"><span>Protected private location detail</span><textarea disabled={editorLocked} minLength={3} maxLength={500} value={editorForm.private_address_text} onChange={(e)=>setEditorField("private_address_text",e.target.value)} placeholder={editorForm.location_mode === "virtual" ? "Explain that this is virtual-only or add any protected access note." : "Exact address or protected meeting detail shared only after acceptance."}/></label>}
                  {["virtual","hybrid"].includes(editorForm.location_mode) && <label className="wide"><span>Protected virtual join URL</span><input disabled={editorLocked} type="url" value={editorForm.virtual_join_url} onChange={(e)=>setEditorField("virtual_join_url",e.target.value)} placeholder="https://…"/></label>}
                </div>

                {editorForm.schedule_type !== "flexible" && <div className="gpi-host-occurrence-box">
                  <div className="gpi-host-occurrence-heading"><div><strong>Actual dates</strong><span>{editorForm.schedule_type === "one_time" ? "One-time opportunities require exactly one future scheduled occurrence." : "Recurring opportunities need at least one future scheduled occurrence."}</span></div><em>{editorOccurrences.length} total</em></div>
                  {editorOccurrences.length > 0 && <div className="gpi-host-occurrence-list">{editorOccurrences.map((occurrence)=><div key={occurrence.id}><div><strong>{gpiHostDateTimeLabel(occurrence.starts_at)}</strong><span>{occurrence.ends_at ? `Ends ${gpiHostDateTimeLabel(occurrence.ends_at)}` : "End time not set"} · {gpiHostTitleCase(occurrence.status)}</span></div><div><button type="button" disabled={busy||editorLocked} onClick={()=>updateOccurrence(occurrence,occurrence.status,true)}>Reconfirm</button>{occurrence.status !== "scheduled" && <button type="button" disabled={busy||editorLocked} onClick={()=>updateOccurrence(occurrence,"scheduled")}>Scheduled</button>}{occurrence.status !== "full" && <button type="button" disabled={busy||editorLocked} onClick={()=>updateOccurrence(occurrence,"full")}>Full</button>}{occurrence.status !== "canceled" && <button type="button" disabled={busy||editorLocked} onClick={()=>updateOccurrence(occurrence,"canceled")}>Cancel</button>}</div></div>)}</div>}
                  <form className="gpi-host-occurrence-form" onSubmit={addOccurrence}><label><span>Starts</span><input disabled={editorLocked || (editorForm.schedule_type === "one_time" && editorOccurrences.length>=1)} type="datetime-local" value={occurrenceStart} onChange={(e)=>setOccurrenceStart(e.target.value)} required/></label><label><span>Ends</span><input disabled={editorLocked || (editorForm.schedule_type === "one_time" && editorOccurrences.length>=1)} type="datetime-local" value={occurrenceEnd} onChange={(e)=>setOccurrenceEnd(e.target.value)}/></label><label><span>Registration deadline</span><input disabled={editorLocked || (editorForm.schedule_type === "one_time" && editorOccurrences.length>=1)} type="datetime-local" value={occurrenceDeadline} onChange={(e)=>setOccurrenceDeadline(e.target.value)}/></label><button type="submit" disabled={busy || editorLocked || (editorForm.schedule_type === "one_time" && editorOccurrences.length>=1)}>Add date</button></form>
                </div>}
              </div>}

              {editorTab === "review" && <div className="gpi-host-editor-panel gpi-host-review-panel">
                <div className="gpi-host-editor-section-heading"><span>Preview &amp; submit</span><h3>See the invitation before FaithBid reviews it.</h3><p>Submission sends the current revision to FaithBid. It does not publish the opportunity.</p></div>
                <div className="gpi-host-review-grid">
                  <div className="gpi-host-preview-wrap"><div className={`gpi-host-preview-card tone-${editorForm.goal === "serve" ? "serve" : "connect"}`}><div className="gpi-host-preview-kicker">{gpiHostTitleCase(editorForm.goal)} · {gpiHostTitleCase(editorForm.opportunity_format)}</div><h4>{editorForm.title || "Untitled opportunity"}</h4><p className="org">{workspaceOrganization?.name || selectedMembership?.organization_name || "Your organization"}</p><div className="gpi-host-preview-meta"><span>{gpiHostTitleCase(editorForm.schedule_type)}</span><span>{editorForm.location_mode === "virtual" ? "Virtual" : gpiCityOptionLabel(editorCity) || gpiHostTitleCase(editorForm.location_mode)}</span></div><p className="desc">{editorForm.description || "Add a clear description so seekers know what to expect."}</p><div className="gpi-host-preview-tags">{selectedActivityLabels.slice(0,4).map((label)=><span key={label}>{label}</span>)}{!selectedActivityLabels.length && <span>Add an activity</span>}</div><button type="button" disabled>I'm interested</button></div><small>Preview uses draft content only; protected address and join-link values are intentionally excluded.</small></div>
                  <div className="gpi-host-readiness-card"><span>FaithBid review readiness</span><strong>{editorStatus === "requires_review" ? "Submitted" : editorReadiness?.can_submit ? "Ready to submit" : "Still needs a few things"}</strong><div className="gpi-host-readiness-checks">{[["Activity",editorReadiness?.activity_ok],["Active taxonomy",editorReadiness?.taxonomy_ok],["Protected location",editorReadiness?.private_address_ok],["Virtual access",editorReadiness?.virtual_join_ok],["Actual date",editorReadiness?.occurrence_ok]].map(([label,ok])=><div key={label} className={ok ? "pass" : "pending"}><i>{ok ? "✓" : "·"}</i><span>{label}</span></div>)}</div>{reviewMissing.length>0 && <ul>{reviewMissing.map((item)=><li key={item}>{item}</li>)}</ul>}{editorReadiness?.organization_verified === false && <p><strong>Organization verification is still pending.</strong> FaithBid can review the opportunity, but publication still requires a verified organization.</p>}
                    <div className="gpi-host-review-actions">{editorStatus === "requires_review" ? <button type="button" disabled={busy||editorLocked} onClick={withdrawFromReview}>Withdraw to private draft</button> : editorStatus === "open" ? <button type="button" disabled={busy||editorLocked} onClick={confirmOpportunityCurrent}>Confirm this is still current</button> : <button type="button" className="primary" disabled={busy || editorLocked || !editorReadiness?.can_submit} onClick={submitForReview}>{busy ? "Working…" : "Submit for FaithBid review"}</button>}<button type="button" disabled={busy} onClick={()=>loadOpportunityEditor(editorOpportunityId)}>Recheck readiness</button></div>
                  </div>
                </div>
                {editorMembershipRole === "admin" && editorStatus !== "closed" && <div className="gpi-host-close-box"><div><strong>Close this opportunity</strong><span>Closing removes it from the active host lifecycle. FaithBid keeps the historical record.</span></div><input disabled={busy} maxLength={1000} value={closeReason} onChange={(e)=>setCloseReason(e.target.value)} placeholder="Reason for closing"/><button type="button" disabled={busy||!closeReason.trim()} onClick={closeOpportunity}>Close opportunity</button></div>}
              </div>}

              <div className="gpi-host-editor-bottom"><button type="button" onClick={()=>setHostScreen("workspace")}>Back to My opportunities</button><button type="button" className="primary" disabled={busy || editorLocked} onClick={saveFullOpportunity}>{busy ? "Saving…" : "Save changes"}</button></div>
            </>}
          </div>
        ) : hostScreen === "request" ? (
          <div className="gpi-host-form-screen gpi-host-request-detail-screen">
            <button type="button" className="gpi-host-back" onClick={() => { setHostError(""); setHostScreen("requests"); }}>← Interest requests</button>
            {requestLoading || !requestRecord ? <div className="gpi-host-loading"><span/><strong>Opening interest request…</strong></div> : <>
              <div className="gpi-host-request-detail-hero">
                <div><span className={`gpi-host-request-status status-${String(requestRecord.status || "request")}`}>{gpiHostRequestStatusLabel(requestRecord.status)}</span><h3>{requestRecord.opportunity_title}</h3><p>{gpiHostRequestStatusNote(requestRecord.status)}</p></div>
                <div className="gpi-host-request-timing"><span>{requestRecord.occurrence_starts_at ? "Selected date" : "Schedule"}</span><strong>{requestRecord.occurrence_starts_at ? gpiHostDateTimeLabel(requestRecord.occurrence_starts_at) : gpiHostTitleCase(requestRecord.schedule_type)}</strong>{requestRecord.response_due_at && String(requestRecord.status) === "notified" && <em>Respond by {gpiHostDateTimeLabel(requestRecord.response_due_at)}</em>}</div>
              </div>

              <div className="gpi-host-request-detail-grid">
                <section className="gpi-host-request-evidence">
                  <div className="gpi-host-editor-section-heading"><span>Verified fit signals</span><h3>What the seeker confirmed.</h3><p>FaithBid shows the host only the confirmations needed to make a fit decision. The email stays protected until a positive next step is provided.</p></div>
                  {requestConfirmations.length ? <div className="gpi-host-request-confirmation-list">{requestConfirmations.map((confirmation, index) => <div key={`${confirmation.confirmation_type}-${index}`}><i>✓</i><div><strong>{confirmation.confirmation_type === "age_range" ? "Age requirement confirmed" : "Participation requirement confirmed"}</strong><span>{confirmation.prompt || "Confirmed by the seeker."}</span></div></div>)}</div> : <div className="gpi-host-request-no-confirmations"><strong>No additional confirmation questions.</strong><span>The seeker still completed FaithBid's contact-verification step before this request reached your workspace.</span></div>}
                  {Object.values(requestProcessRequirements).some(Boolean) && <div className="gpi-host-request-process"><span>Host process requirements</span><div>{requestProcessRequirements.background_check && <em>Background check</em>}{requestProcessRequirements.orientation && <em>Orientation</em>}{requestProcessRequirements.application && <em>Application</em>}{requestProcessRequirements.membership && <em>Membership</em>}</div></div>}
                </section>

                <aside className="gpi-host-request-response-card">
                  <span>Seeker contact</span>
                  {requestRecord.seeker_contact_available && requestRecord.seeker_email ? <><strong className="released">Released after next step</strong><a href={`mailto:${requestRecord.seeker_email}`}>{requestRecord.seeker_email}</a></> : <><strong>Protected by FaithBid</strong><p>The seeker's email is not exposed before you choose a positive next step.</p></>}

                  {requestCanRespond ? <div className="gpi-host-request-response-form">
                    <div className="gpi-host-request-response-options">
                      <button type="button" className={requestResponse === "next_step_provided" ? "active" : ""} onClick={() => setRequestResponse("next_step_provided")}>Give next step</button>
                      <button type="button" className={requestResponse === "declined" ? "active" : ""} onClick={() => setRequestResponse("declined")}>Not a fit</button>
                      <button type="button" className={requestResponse === "unavailable" ? "active" : ""} onClick={() => setRequestResponse("unavailable")}>No longer available</button>
                    </div>
                    {requestResponse === "next_step_provided" && <label><span>What should they do next?</span><textarea disabled={busy} minLength={10} maxLength={4000} value={requestInstructions} onChange={(event) => setRequestInstructions(event.target.value)} placeholder="For example: Reply to our welcome coordinator, arrive 10 minutes early, and meet us at the front entrance."/><small>This instruction is stored with the request. After you send it, FaithBid releases the seeker's email so your organization can follow through directly.</small></label>}
                    {requestResponse !== "next_step_provided" && <div className="gpi-host-request-negative-note">Seeker contact will remain protected and the request will close.</div>}
                    <button type="button" className="primary" disabled={busy || (requestResponse === "next_step_provided" && requestInstructions.trim().length < 10)} onClick={submitConnectionResponse}>{busy ? "Saving response…" : requestResponse === "next_step_provided" ? "Send next step" : requestResponse === "declined" ? "Decline request" : "Mark unavailable"}</button>
                  </div> : requestRecord.status === "next_step_provided" ? <div className="gpi-host-request-after-response"><span>Next step provided</span><p>{requestDetail?.next_step?.instructions || "Next-step instructions recorded."}</p><em>Awaiting seeker outcome until {gpiHostDateTimeLabel(requestRecord.outcome_due_at)}</em></div> : <div className="gpi-host-request-after-response"><span>Request closed</span><p>{gpiHostRequestStatusNote(requestRecord.status)}</p>{requestRecord.closed_at && <em>Closed {gpiHostDateTimeLabel(requestRecord.closed_at)}</em>}</div>}
                </aside>
              </div>
            </>}
          </div>
        ) : hostScreen === "requests" ? (
          <div className="gpi-host-workspace gpi-host-requests-workspace">
            <div className="gpi-host-workspace-top">
              <div className="gpi-host-org-context">
                {activeMemberships.length > 1 ? <label><span>Organization</span><select value={selectedOrgId} onChange={(event) => { setSelectedOrgId(event.target.value); setWorkspace(null); setRequestWorkspace({ summary: {}, requests: [] }); }}>
                  {activeMemberships.map((membership) => <option key={membership.organization_id} value={membership.organization_id}>{membership.organization_name}</option>)}
                </select></label> : <div><span>Organization</span><strong>{workspaceOrganization?.name || selectedMembership?.organization_name || "Your organization"}</strong></div>}
                <div className="gpi-host-org-badges"><span className={`gpi-host-status status-${String(workspaceOrganization?.status || selectedMembership?.organization_status || "draft")}`}>{gpiHostTitleCase(workspaceOrganization?.status || selectedMembership?.organization_status || "draft")}</span><span>{gpiHostTitleCase(workspaceOrganization?.membership_role || selectedMembership?.membership_role || "member")}</span></div>
              </div>
              <div className="gpi-host-workspace-actions"><button type="button" onClick={() => setHostScreen("workspace")}>My opportunities</button><button type="button" onClick={() => loadConnectionRequests(selectedOrgId, requestQueue)}>Refresh requests</button></div>
            </div>

            <div className="gpi-host-request-summary">
              <button type="button" className={requestQueue === "new" ? "active" : ""} onClick={() => setRequestQueue("new")}><span>Needs response</span><strong>{requestSummary.new_count || 0}</strong></button>
              <button type="button" className={requestQueue === "awaiting_seeker" ? "active" : ""} onClick={() => setRequestQueue("awaiting_seeker")}><span>Awaiting seeker</span><strong>{requestSummary.awaiting_seeker_count || 0}</strong></button>
              <button type="button" className={requestQueue === "active" ? "active" : ""} onClick={() => setRequestQueue("active")}><span>Active</span><strong>{requestSummary.active_count || 0}</strong></button>
              <button type="button" className={requestQueue === "closed" ? "active" : ""} onClick={() => setRequestQueue("closed")}><span>Closed</span><strong>{requestSummary.closed_count || 0}</strong></button>
            </div>
            <div className="gpi-host-list-toolbar"><div><span>Interest workflow</span><strong>{requestLoading ? "Loading…" : `${connectionRequests.length} shown`}</strong></div><button type="button" className={requestQueue === "all" ? "active" : ""} onClick={() => setRequestQueue("all")}>All requests</button></div>

            {requestLoading ? <div className="gpi-host-loading"><span/><strong>Loading interest requests…</strong></div> : connectionRequests.length ? <div className="gpi-host-request-list">
              {connectionRequests.map((request) => <button type="button" key={request.request_id} className="gpi-host-request-row" onClick={() => openConnectionRequest(request.request_id)}>
                <div className={`gpi-host-request-dot status-${request.status}`}/><div><span><strong>{request.opportunity_title}</strong><em>{gpiHostRequestStatusLabel(request.status)}</em></span><small>{request.occurrence_starts_at ? gpiHostDateTimeLabel(request.occurrence_starts_at) : gpiHostTitleCase(request.schedule_type)} · {gpiHostTitleCase(request.goal)}</small><p>{gpiHostRequestStatusNote(request.status)}</p></div><span className="gpi-host-row-date">{request.submitted_at ? `Received ${gpiHostFormatWhen(request.submitted_at)}` : gpiHostFormatWhen(request.created_at)} →</span>
              </button>)}
            </div> : <div className="gpi-host-empty-opportunities"><div>✓</div><strong>No requests in this view.</strong><p>Verified seeker interest will appear here without exposing contact information before your organization provides a real next step.</p><button type="button" onClick={() => setRequestQueue("all")}>View request history</button></div>}
          </div>
        ) : hostScreen === "draft" ? (
          <div className="gpi-host-form-screen gpi-host-draft-screen">
            <button type="button" className="gpi-host-back" onClick={() => { setHostError(""); setHostScreen("workspace"); }}>← My opportunities</button>
            <div className="gpi-host-form-intro"><span>Start a draft</span><h3>What are you inviting people into?</h3><p>This creates a private draft only. Matching tags, exact logistics, preview, and review submission come in the full editor.</p></div>
            <form className="gpi-host-draft-form" onSubmit={createOpportunityDraft}>
              <label className="gpi-host-wide"><span>Opportunity title</span><input required minLength={3} maxLength={160} value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="Young adults community dinner"/></label>
              <label className="gpi-host-wide"><span>Describe the opportunity</span><textarea required minLength={20} maxLength={5000} value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} placeholder="Describe what someone can expect, who will welcome them, and what the first step looks like."/></label>
              <label><span>Main goal</span><select value={draftGoal} onChange={(event) => setDraftGoal(event.target.value)}><option value="connect">Connect</option><option value="serve">Serve</option></select></label>
              <label><span>Format</span><select value={draftFormat} onChange={(event) => setDraftFormat(event.target.value)}><option value="event">Event</option><option value="group">Group</option><option value="class">Class</option><option value="service_role">Service role</option></select></label>
              <label><span>Participation</span><select value={draftResponsibility} onChange={(event) => setDraftResponsibility(event.target.value)}><option value="participant">Join in</option><option value="volunteer">Volunteer</option><option value="leader">Lead</option></select></label>
              <label><span>Commitment</span><select value={draftCommitment} onChange={(event) => setDraftCommitment(event.target.value)}><option value="drop_in">Drop in</option><option value="ongoing">Ongoing</option><option value="seasonal">Seasonal</option></select></label>
              <label><span>Schedule</span><select value={draftSchedule} onChange={(event) => setDraftSchedule(event.target.value)}><option value="one_time">One-time</option><option value="recurring">Recurring</option><option value="flexible">Flexible</option></select></label>
              <label><span>Estimated minutes</span><input type="number" min="1" max="10080" value={draftDuration} onChange={(event) => setDraftDuration(event.target.value)} required={draftSchedule === "flexible"}/></label>
              {draftSchedule === "recurring" && <div className="gpi-host-recurring gpi-host-wide"><span>Recurring days</span><div>{[[1,"Mon"],[2,"Tue"],[3,"Wed"],[4,"Thu"],[5,"Fri"],[6,"Sat"],[0,"Sun"]].map(([day,label]) => <button type="button" key={day} className={draftRecurringDays.includes(day) ? "selected" : ""} onClick={() => toggleRecurringDay(day)}>{label}</button>)}</div><div className="gpi-host-time-grid"><label><span>Starts</span><input type="time" value={draftStartTime} onChange={(event) => setDraftStartTime(event.target.value)}/></label><label><span>Ends</span><input type="time" value={draftEndTime} onChange={(event) => setDraftEndTime(event.target.value)}/></label></div></div>}
              <label><span>Location</span><select value={draftLocationMode} onChange={(event) => setDraftLocationMode(event.target.value)}><option value="in_person">In person</option><option value="virtual">Virtual</option><option value="hybrid">Hybrid</option></select></label>
              {["in_person", "hybrid"].includes(draftLocationMode) && <label><span>City / area</span><select required value={draftCityAreaId} onChange={(event) => setDraftCityAreaId(event.target.value)}><option value="">Choose a mapped area</option>{cityAreas.map((city) => <option key={city.id || city.city_area_id || city.label} value={city.id || city.city_area_id}>{gpiCityOptionLabel(city)}</option>)}</select></label>}
              <div className="gpi-host-draft-note gpi-host-wide"><strong>Exact address stays private.</strong><span>The starter draft uses “share after acceptance.” You can choose a public meeting point or public address in the full editor.</span></div>
              <div className="gpi-host-form-actions gpi-host-wide"><button type="button" onClick={() => setHostScreen("workspace")}>Cancel</button><button type="submit" disabled={busy}>{busy ? "Creating draft…" : "Create private draft"}</button></div>
            </form>
          </div>
        ) : (
          <div className="gpi-host-workspace">
            <div className="gpi-host-workspace-top">
              <div className="gpi-host-org-context">
                {activeMemberships.length > 1 ? <label><span>Organization</span><select value={selectedOrgId} onChange={(event) => { setSelectedOrgId(event.target.value); setWorkspace(null); }}>
                  {activeMemberships.map((membership) => <option key={membership.organization_id} value={membership.organization_id}>{membership.organization_name}</option>)}
                </select></label> : <div><span>Organization</span><strong>{workspaceOrganization?.name || selectedMembership?.organization_name || "Your organization"}</strong></div>}
                <div className="gpi-host-org-badges"><span className={`gpi-host-status status-${String(workspaceOrganization?.status || selectedMembership?.organization_status || "draft")}`}>{gpiHostTitleCase(workspaceOrganization?.status || selectedMembership?.organization_status || "draft")}</span><span>{gpiHostTitleCase(workspaceOrganization?.membership_role || selectedMembership?.membership_role || "member")}</span></div>
              </div>
              <div className="gpi-host-workspace-actions">
                <button type="button" className="gpi-host-public-preview" disabled={!organizationPublicHomeAvailable} title={organizationPublicHomeAvailable ? "Open the same public organization home participants see." : "FaithBid verification is required before an organization home is public."} onClick={() => onPreviewOrganization?.(selectedOrgId)}>Preview public organization home</button>
                <button type="button" className="gpi-host-interest-entry" onClick={() => { setRequestQueue("active"); setHostScreen("requests"); }}>Interest requests{Number(requestSummary.new_count || 0) > 0 && <span>{requestSummary.new_count}</span>}</button>
                <button type="button" onClick={() => setHostScreen("claim")}>Add / claim organization</button>
                <button type="button" className="primary" disabled={organizationLocked || workspaceLoading} onClick={() => { resetDraftForm(); setHostError(""); setHostScreen("draft"); }}>Post an opportunity</button>
              </div>
            </div>

            {organizationLocked && <div className="gpi-host-locked-note"><strong>This organization is {String(workspaceOrganization?.status || selectedMembership?.organization_status).toLowerCase()}.</strong><span>Opportunity creation is unavailable until FaithBid restores host write access.</span></div>}
            {String(workspaceOrganization?.status || selectedMembership?.organization_status || "").toLowerCase() === "draft" && <div className="gpi-host-unverified-note"><strong>Private organization workspace.</strong><span>You can prepare drafts now. FaithBid verification is still required before public publication.</span></div>}
            {pendingRequests.length > 0 && <div className="gpi-host-workspace-pending"><strong>{pendingRequests.length} organization access {pendingRequests.length === 1 ? "request is" : "requests are"} pending.</strong><button type="button" onClick={() => setHostScreen("home")}>Review requests</button></div>}
            <button type="button" className="gpi-host-interest-snapshot" onClick={() => { setRequestQueue("active"); setHostScreen("requests"); }}><div><span>Seeker interest</span><strong>{Number(requestSummary.new_count || 0) > 0 ? `${requestSummary.new_count} ${Number(requestSummary.new_count) === 1 ? "request needs" : "requests need"} your response` : Number(requestSummary.awaiting_seeker_count || 0) > 0 ? `${requestSummary.awaiting_seeker_count} awaiting seeker confirmation` : "No active interest requests"}</strong></div><em>Open interest workspace →</em></button>

            <div className="gpi-host-workspace-summary">
              {[
                ["Drafts", opportunityCounts.draft || 0, "draft"],
                ["Needs FaithBid review", opportunityCounts.requires_review || 0, "requires_review"],
                ["Live", opportunityCounts.open || 0, "open"],
                ["Closed", opportunityCounts.closed || 0, "closed"],
              ].map(([label, count, status]) => <button type="button" className={workspaceFilter === status ? "active" : ""} key={status} onClick={() => setWorkspaceFilter(status)}><span>{label}</span><strong>{workspaceLoading ? "–" : count}</strong></button>)}
            </div>

            <GpiStage2HostModule organizationId={selectedOrgId} opportunities={workspaceOpportunities} />

            <div className="gpi-host-list-toolbar"><div><span>Opportunity workspace</span><strong>{workspaceLoading ? "Loading…" : `${filteredWorkspaceOpportunities.length} shown`}</strong></div><button type="button" className={workspaceFilter === "all" ? "active" : ""} onClick={() => setWorkspaceFilter("all")}>All opportunities</button></div>

            {workspaceLoading ? <div className="gpi-host-loading"><span/><strong>Loading opportunities…</strong></div> : filteredWorkspaceOpportunities.length ? <div className="gpi-host-opportunity-list">
              {filteredWorkspaceOpportunities.map((item) => <button type="button" key={item.id} className="gpi-host-opportunity-row" onClick={() => openOpportunityEditor(item.id)}>
                <div className="gpi-host-opportunity-mark">{String(item.goal || "connect") === "serve" ? "S" : "C"}</div>
                <div><span><strong>{item.title}</strong><em className={`gpi-host-status status-${item.status}`}>{gpiHostTitleCase(item.status)}</em></span><small>{gpiHostTitleCase(item.goal)} · {gpiHostTitleCase(item.schedule_type)} · revision {item.content_revision || 1}</small><p>{item.status === "requires_review" ? "FaithBid review is required before this can be public." : item.status === "open" ? `Live · last confirmed ${gpiHostFormatWhen(item.last_confirmed_at)}` : item.status === "closed" ? "Closed opportunity history" : "Private draft — not visible to seekers."}</p></div>
                <span className="gpi-host-row-date">Updated {gpiHostFormatWhen(item.updated_at)} →</span>
              </button>)}
            </div> : <div className="gpi-host-empty-opportunities"><div>＋</div><strong>{workspaceFilter === "all" ? "No opportunities yet." : `No ${gpiHostTitleCase(workspaceFilter)} opportunities.`}</strong><p>Start with a private draft. Nothing reaches seekers until FaithBid review and publication.</p><button type="button" disabled={organizationLocked} onClick={() => { resetDraftForm(); setHostScreen("draft"); }}>Post your first opportunity</button></div>}
          </div>
        )}
      </section>
    </div>
  );
}

const GPI_SEEKER_INTENT_SESSION_KEY = "kb_gpi_seeker_intent_v1";

const GPI_INTEREST_INTENT_SESSION_KEY = "kb_gpi_interest_intent_v1";

const GPI_STAGE2_PARTICIPATION_POLICY_VERSION = "stage2-recurring-updates-v1";

const GPI_STAGE2_PARTICIPATION_BACKEND_ENABLED = (() => {
  try {
    return String(import.meta.env?.VITE_GPI_STAGE2_PARTICIPATION_ENABLED || "false").toLowerCase() === "true";
  } catch {
    return false;
  }
})();

const GPI_STAGE3_OCCURRENCE_INTENT_ENABLED = (() => {
  try {
    return String(import.meta.env?.VITE_GPI_STAGE3_OCCURRENCE_INTENT_ENABLED || "false").toLowerCase() === "true";
  } catch {
    return false;
  }
})();

const GPI_STAGE4_CHANGE_NOTICES_ENABLED = (() => {
  try {
    return String(import.meta.env?.VITE_GPI_STAGE4_CHANGE_NOTICES_ENABLED || "false").toLowerCase() === "true";
  } catch {
    return false;
  }
})();

function gpiStage2PreviewEnabled() {
  try {
    return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("gpiStage2Preview") === "1";
  } catch {
    return false;
  }
}

function gpiStage2OperationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "00000000-0000-4000-8000-" + String(Date.now()).padStart(12, "0").slice(-12);
}

async function gpiStage2ParticipantAction(action, payload) {
  if (!GPI_STAGE2_PARTICIPATION_BACKEND_ENABLED) throw new Error("Recurring updates are not enabled for this environment.");
  const result = await supabase.functions.invoke("gpi-participation-auth", { body: { action, payload } });
  if (result?.error) throw result.error;
  return result?.data?.data ?? result?.data ?? null;
}

async function gpiStage3OccurrenceIntentAction(action, payload) {
  if (!GPI_STAGE3_OCCURRENCE_INTENT_ENABLED) throw new Error("Gathering plans are not enabled for this environment.");
  const result = await supabase.functions.invoke("gpi-occurrence-intent-auth", { body: { action, payload } });
  if (result?.error) {
    let message = result.error?.message || "Gathering-plan service could not complete that request.";
    try {
      const response = result.error?.context;
      const detail = response?.clone ? await response.clone().json() : null;
      message = detail?.error || detail?.code || message;
    } catch {}
    throw new Error(message);
  }
  return result?.data?.data ?? result?.data ?? null;
}

async function gpiStage4OccurrenceNoticeAction(payload = {}) {
  if (!GPI_STAGE4_CHANGE_NOTICES_ENABLED) throw new Error("Gathering-change notices are not enabled for this environment.");
  const result = await supabase.functions.invoke("gpi-occurrence-notice-auth", { body: payload });
  if (result?.error) {
    let message = result.error?.message || "Gathering-change notices could not load.";
    try {
      const response = result.error?.context;
      const detail = response?.clone ? await response.clone().json() : null;
      message = detail?.error || detail?.code || message;
    } catch {}
    throw new Error(message);
  }
  return result?.data?.data ?? result?.data ?? [];
}

function gpiStage4NoticeCopy(notice) {
  const type = String(notice?.event_type || "");
  if (type === "occurrence_canceled") return { title: "Gathering canceled", body: `The gathering scheduled for ${gpiHostDateTimeLabel(notice.old_starts_at)} was canceled.` };
  if (type === "occurrence_marked_full") return { title: "Gathering is full", body: `The gathering scheduled for ${gpiHostDateTimeLabel(notice.new_starts_at || notice.old_starts_at)} is now full.` };
  return { title: "Gathering time changed", body: `${gpiHostDateTimeLabel(notice.old_starts_at)} → ${gpiHostDateTimeLabel(notice.new_starts_at)}` };
}

function GpiStage4OccurrenceNotices({ request }) {
  const visible = GPI_STAGE4_CHANGE_NOTICES_ENABLED && String(request?.schedule_type || "").toLowerCase() === "recurring";
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!visible || !request?.opportunity_id) return;
    let canceled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const data = await gpiStage4OccurrenceNoticeAction({ relationship_id: null, limit: 50 });
        const rows = Array.isArray(data) ? data : Array.isArray(data?.notices) ? data.notices : [];
        if (!canceled) setNotices(rows.filter((row) => String(row?.opportunity_id) === String(request.opportunity_id)));
      } catch (loadError) {
        if (!canceled) setError(loadError?.message || "Gathering-change notices could not load.");
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => { canceled = true; };
  }, [reload, request?.opportunity_id, visible]);

  if (!visible || (!loading && !error && notices.length === 0)) return null;
  return <section className="gpi-stage4-notices" aria-label="Gathering changes" aria-live="polite">
    <div className="gpi-stage4-notices-head"><span>Important updates</span><h4>Gathering changes</h4></div>
    {loading ? <p>Checking for changes…</p> : error ? <div className="gpi-stage4-notices-error" role="alert"><span>{error}</span><button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></div> : <div className="gpi-stage4-notices-list">
      {notices.map((notice) => {
        const copy = gpiStage4NoticeCopy(notice);
        return <article key={notice.event_id} className={`type-${notice.event_type}`}>
          <div><strong>{copy.title}</strong><p>{copy.body}</p></div>
          <time dateTime={notice.created_at}>{gpiHostFormatWhen(notice.created_at)}</time>
          {notice.current_next_occurrence?.starts_at && <small>Current next gathering: {gpiHostDateTimeLabel(notice.current_next_occurrence.starts_at)}</small>}
        </article>;
      })}
    </div>}
  </section>;
}

function gpiStage2Relationship(value) {
  if (!value || typeof value !== "object") return null;
  return { ...value, id: value.id || value.relationship_id || "" };
}

function GpiStage2ParticipantModule({ request, showToast, preview = false }) {
  const visible = preview || GPI_STAGE2_PARTICIPATION_BACKEND_ENABLED;
  const eligible = String(request?.status || "").toLowerCase() === "seeker_confirmed"
    && String(request?.schedule_type || "").toLowerCase() === "recurring";
  const [relationship, setRelationship] = useState(preview ? { id: "preview-relationship", status: "active" } : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible || !eligible || preview || !GPI_STAGE2_PARTICIPATION_BACKEND_ENABLED) return;
    let canceled = false;
    (async () => {
      try {
        const data = await gpiStage2ParticipantAction("get_state", { relationship_id: null });
        const rows = Array.isArray(data) ? data : Array.isArray(data?.relationships) ? data.relationships : [];
        const match = rows.find((row) => String(row?.opportunity_id) === String(request?.opportunity_id));
        if (!canceled) setRelationship(gpiStage2Relationship(match));
      } catch (loadError) {
        if (!canceled) setError(loadError?.message || "Recurring-update controls could not load.");
      }
    })();
    return () => { canceled = true; };
  }, [eligible, preview, request?.opportunity_id, visible]);

  if (!visible || !eligible) return null;
  const status = String(relationship?.status || "none").toLowerCase();
  const act = async (action) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (preview) {
        const nextStatus = action === "pause" ? "paused" : action === "stop" ? "ended" : "active";
        setRelationship(action === "opt_in" ? { id: "preview-relationship", status: "active" } : { ...relationship, status: nextStatus });
      } else if (action === "opt_in") {
        const data = await gpiStage2ParticipantAction("opt_in", {
          opportunity_id: request.opportunity_id,
          source_connection_request_id: request.request_id || request.id,
          consent_policy_version: GPI_STAGE2_PARTICIPATION_POLICY_VERSION,
          consent_accepted: true,
          operation_id: gpiStage2OperationId(),
        });
        setRelationship(gpiStage2Relationship(data?.relationship || data));
      } else {
        const data = await gpiStage2ParticipantAction(action, {
          relationship_id: relationship.id,
          operation_id: gpiStage2OperationId(),
        });
        setRelationship(gpiStage2Relationship(data?.relationship || data));
      }
      showToast?.(action === "pause" ? "Recurring updates paused." : action === "stop" ? "Recurring updates stopped." : action === "resume" ? "Recurring updates resumed." : "Recurring updates are on.", "success");
    } catch (actionError) {
      setError(actionError?.message || "That recurring-update change could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const needsConsent = status === "none" || status === "ended";
  return <section className={`gpi-stage2-participant status-${status}`} aria-label="Recurring update preference">
    <div className="gpi-stage2-participant-head">
      <div><span>Optional · Private</span><h4>{needsConsent ? "Would you like help staying connected?" : "Recurring updates"}</h4></div>
      {!needsConsent && <em>{status === "paused" ? "Updates paused" : "Receiving updates"}</em>}
    </div>
    {needsConsent ? <>
      <strong>Get recurring updates</strong>
      <p>By selecting "Get recurring updates," you agree that FaithBid may email your verified FaithBid account about the next eligible gathering for this recurring opportunity. This is optional. It does not create church membership, record attendance, or create a public participant profile. The recurring-updates feature gives the organization only an anonymous count and does not share any additional identity or contact information. You can pause or stop these emails at any time in My Requests.</p>
      <div className="gpi-stage2-actions"><button type="button" disabled={busy} onClick={() => act("opt_in")}>{busy ? "Saving…" : status === "ended" ? "Get updates again" : "Get recurring updates"}</button><span>No thanks—your connection stays unchanged.</span></div>
    </> : <>
      <p>{status === "paused" ? "FaithBid will not email you about upcoming gatherings until you resume." : "FaithBid may email you about the next eligible gathering. The organization sees only an anonymous active count."}</p>
      <div className="gpi-stage2-actions">{status === "paused" ? <button type="button" disabled={busy} onClick={() => act("resume")}>Resume updates</button> : <button type="button" disabled={busy} onClick={() => act("pause")}>Pause updates</button>}<button type="button" className="secondary" disabled={busy} onClick={() => act("stop")}>Stop updates</button></div>
    </>}
    {error && <small role="alert">{error}</small>}
  </section>;
}

function gpiStage3IntentRow(value) {
  if (!value || typeof value !== "object") return null;
  return { ...value, id: value.id || value.intent_id || "" };
}

function GpiStage3OccurrenceIntentModule({ request, showToast, preview = false }) {
  const visible = preview || (GPI_STAGE2_PARTICIPATION_BACKEND_ENABLED && GPI_STAGE3_OCCURRENCE_INTENT_ENABLED);
  const eligibleRequest = String(request?.status || "").toLowerCase() === "seeker_confirmed"
    && String(request?.schedule_type || "").toLowerCase() === "recurring";
  const seededRelationship = request?.relationship_id || request?.participation_relationship_id
    ? {
        id: request.relationship_id || request.participation_relationship_id,
        status: request.participation_status || "active",
        opportunity_id: request.opportunity_id,
        next_occurrence: request.next_occurrence || (request.occurrence_id ? {
          id: request.occurrence_id,
          starts_at: request.occurrence_starts_at,
          ends_at: request.occurrence_ends_at,
        } : null),
      }
    : null;
  const [relationship, setRelationship] = useState(preview ? { id: "preview-relationship", status: "active", next_occurrence: { id: "preview-occurrence", starts_at: new Date(Date.now() + 7 * 86400000).toISOString() } } : seededRelationship);
  const [intent, setIntent] = useState(preview ? { id: "preview-intent", status: "planning", effective: true } : null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible || !eligibleRequest || preview || !GPI_STAGE3_OCCURRENCE_INTENT_ENABLED) return;
    let canceled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const participation = await gpiStage2ParticipantAction("get_state", { relationship_id: null });
        const relationshipRows = Array.isArray(participation) ? participation : Array.isArray(participation?.relationships) ? participation.relationships : [];
        const match = relationshipRows.find((row) => String(row?.opportunity_id) === String(request?.opportunity_id) && String(row?.status || "").toLowerCase() === "active");
        const nextRelationship = gpiStage2Relationship(match);
        const occurrenceId = nextRelationship?.next_occurrence?.id || request?.next_occurrence?.id || request?.occurrence_id || "";
        if (!nextRelationship?.id || !occurrenceId) {
          if (!canceled) {
            setRelationship(nextRelationship || null);
            setIntent(null);
          }
          return;
        }
        if (!canceled) setRelationship(nextRelationship);
        const intentData = await gpiStage3OccurrenceIntentAction("get_state", { relationship_id: nextRelationship.id });
        const intentRows = Array.isArray(intentData) ? intentData : Array.isArray(intentData?.intents) ? intentData.intents : [];
        const matchIntent = intentRows.find((row) => String(row?.occurrence_id) === String(occurrenceId));
        if (!canceled) {
          setRelationship(nextRelationship);
          setIntent(gpiStage3IntentRow(matchIntent));
        }
      } catch (loadError) {
        if (!canceled) setError(loadError?.message || "Gathering-plan controls could not load.");
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => { canceled = true; };
  }, [eligibleRequest, preview, request?.occurrence_id, request?.opportunity_id, request?.next_occurrence?.id, visible]);

  if (!visible || !eligibleRequest) return null;

  const relationshipId = relationship?.id || "";
  const occurrence = relationship?.next_occurrence || request?.next_occurrence || null;
  const occurrenceId = occurrence?.id || request?.occurrence_id || "";
  if (!preview && (!relationshipId || !occurrenceId)) return null;

  const planning = String(intent?.status || "").toLowerCase() === "planning" && intent?.effective !== false;
  const act = async (action) => {
    if (busy || loading || !relationshipId || !occurrenceId) return;
    setBusy(true);
    setError("");
    try {
      if (preview) {
        setIntent(action === "plan" ? { id: "preview-intent", status: "planning", effective: true } : { ...intent, status: "removed", effective: false });
      } else {
        const data = await gpiStage3OccurrenceIntentAction(action, {
          relationship_id: relationshipId,
          occurrence_id: occurrenceId,
          operation_id: gpiStage2OperationId(),
        });
        setIntent(gpiStage3IntentRow(data?.intent || data));
      }
      showToast?.(action === "plan" ? "Plan saved privately." : "Plan removed.", "success");
    } catch (actionError) {
      setError(actionError?.message || "That gathering-plan change could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const occurrenceLabel = occurrence?.starts_at
    ? gpiFormatOccurrence(occurrence)
    : request?.occurrence_starts_at
      ? gpiHostDateTimeLabel(request.occurrence_starts_at)
      : "the next eligible gathering";

  return <section className={`gpi-stage3-intent${planning ? " is-planning" : ""}`} aria-label="Private gathering plan">
    <div className="gpi-stage3-intent-head">
      <div><span>Optional · Private</span><h4>{planning ? "Planning to go" : "Planning for the next gathering?"}</h4></div>
      {planning && <em>Only you can see this</em>}
    </div>
    <p>{planning ? `FaithBid saved that you are planning to go to ${occurrenceLabel}. This is not an RSVP, attendance record, or message to the organization.` : `Privately mark that you are planning to go to ${occurrenceLabel}. The organization does not receive your name, a roster, or a count from this.`}</p>
    <div className="gpi-stage3-actions">
      {planning ? <button type="button" className="secondary" disabled={busy || loading} onClick={() => act("remove")}>{busy ? "Saving…" : "Plans changed"}</button> : <button type="button" disabled={busy || loading} onClick={() => act("plan")}>{busy || loading ? "Loading…" : "I'm planning to go"}</button>}
    </div>
    {error && <small role="alert">{error}</small>}
  </section>;
}

function GpiStage2HostModule({ organizationId, opportunities = [], preview = false }) {
  const visible = preview || GPI_STAGE2_PARTICIPATION_BACKEND_ENABLED;
  const recurring = opportunities.filter((item) => String(item?.schedule_type || "").toLowerCase() === "recurring");
  const [counts, setCounts] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible || preview || !GPI_STAGE2_PARTICIPATION_BACKEND_ENABLED || !organizationId || !recurring.length) return;
    let canceled = false;
    Promise.all(recurring.map(async (item) => {
      const result = await supabase.rpc("gpi_host_get_participation_summary", { p_organization_id: organizationId, p_opportunity_id: item.id });
      if (result?.error) throw result.error;
      return [item.id, Number(result?.data?.active_consent_count || 0)];
    })).then((entries) => { if (!canceled) setCounts(Object.fromEntries(entries)); }).catch((loadError) => { if (!canceled) setError(loadError?.message || "Private counts could not load."); });
    return () => { canceled = true; };
  }, [organizationId, preview, visible, opportunities]);

  if (!visible || !recurring.length) return null;
  return <section className="gpi-stage2-host" aria-label="Recurring update consent counts">
    <div><span>Recurring updates</span><strong>Anonymous consent count</strong><p>This is not attendance, membership, an RSVP list, or a participant directory.</p></div>
    <div className="gpi-stage2-host-list">{recurring.map((item, index) => <div key={item.id || index}><span>{item.title || "Recurring opportunity"}</span><strong>{preview ? (index === 0 ? 3 : 0) : Number(counts[item.id] || 0)}</strong><em>currently opted in</em></div>)}</div>
    {error && <small role="alert">{error}</small>}
  </section>;
}

function GpiStage2PreviewDeck() {
  if (!gpiStage2PreviewEnabled()) return null;
  const request = { id: "preview-request", request_id: "preview-request", opportunity_id: "preview-opportunity", status: "seeker_confirmed", schedule_type: "recurring" };
  const opportunities = [{ id: "preview-opportunity", title: "Thursday Scripture Gathering", schedule_type: "recurring" }];
  return <aside className="gpi-stage2-preview" aria-label="Stage 2 interface preview"><header><span>Stage 2 preview · backend off</span><strong>Two role-aware surfaces</strong></header><GpiStage2ParticipantModule request={request} preview /><GpiStage2HostModule organizationId="preview-organization" opportunities={opportunities} preview /></aside>;
}

function gpiSeekerStatusLabel(value = "") {
  const status = String(value || "").toLowerCase();
  return ({
    pending_verification: "Verify your email",
    submitted: "Sent to host",
    notified: "Host received it",
    next_step_provided: "Next step ready",
    declined: "Not a fit",
    unavailable: "No longer available",
    notification_failed: "Delivery issue",
    org_no_response: "Host did not respond",
    request_invalidated: "Opportunity changed",
    seeker_confirmed: "Connected",
    seeker_did_not_connect: "Did not connect",
    seeker_no_confirmation: "Confirmation window closed",
    verification_expired: "Verification expired",
  })[status] || gpiHostTitleCase(status || "request");
}

function gpiSeekerStatusNote(value = "") {
  const status = String(value || "").toLowerCase();
  return ({
    pending_verification: "This older request still needs email verification before the host can receive it.",
    submitted: "FaithBid verified your signed-in account and sent this request to the organization.",
    notified: "The organization has received your request and can respond inside FaithBid.",
    next_step_provided: "The organization shared your next step. Review the details and tell FaithBid whether you connected.",
    declined: "The organization decided this opportunity is not the right fit for this request.",
    unavailable: "The organization marked this opportunity unavailable for this request.",
    notification_failed: "FaithBid could not complete the organization delivery path for this request.",
    org_no_response: "The organization did not respond within the response window.",
    request_invalidated: "The opportunity changed or stopped being eligible before your request completed.",
    seeker_confirmed: "You confirmed that this connection happened.",
    seeker_did_not_connect: "You told FaithBid that the connection did not happen.",
    seeker_no_confirmation: "The confirmation window ended without a response from you.",
    verification_expired: "The email verification window expired before this request reached the host.",
  })[status] || "FaithBid is tracking this request for you.";
}

function GpiSeekerPortal({ open, onClose, currentUser, showToast }) {
  const [queue, setQueue] = useState("active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listData, setListData] = useState({ summary: {}, requests: [] });
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const rpc = useCallback(async (name, args = {}) => {
    const { data, error: rpcError } = await supabase.rpc(name, args);
    if (rpcError) throw rpcError;
    return data;
  }, []);

  const loadRequests = useCallback(async (nextQueue = queue) => {
    if (!open || !currentUser?.id) return;
    setLoading(true);
    setError("");
    try {
      const data = await rpc("gpi_seeker_list_my_requests", { p_queue: nextQueue, p_limit: 100 });
      setListData({ summary: data?.summary || {}, requests: Array.isArray(data?.requests) ? data.requests : [] });
    } catch (requestError) {
      setError(requestError?.message || "Could not load your Get Plugged In requests.");
      setListData({ summary: {}, requests: [] });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, open, queue, rpc]);

  const openRequest = useCallback(async (requestId) => {
    if (!requestId) return;
    setSelectedRequestId(requestId);
    setDetailLoading(true);
    setError("");
    try {
      const data = await rpc("gpi_seeker_get_request", { p_request_id: requestId });
      setDetail(data || null);
    } catch (requestError) {
      setError(requestError?.message || "Could not open this request.");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [rpc]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("gpi-seeker-portal-open");
    loadRequests(queue);
    return () => document.body.classList.remove("gpi-seeker-portal-open");
  }, [open, queue, loadRequests]);

  useEffect(() => {
    if (open) return;
    setSelectedRequestId(null);
    setDetail(null);
    setError("");
  }, [open]);

  const reportOutcome = useCallback(async (outcome) => {
    if (!selectedRequestId || busy) return;
    setBusy(true);
    setError("");
    try {
      await rpc("gpi_seeker_report_outcome", { p_request_id: selectedRequestId, p_outcome: outcome });
      showToast?.(outcome === "seeker_confirmed" ? "Connection confirmed." : "Thanks — FaithBid recorded that you did not connect.", "success");
      await Promise.all([loadRequests(queue), openRequest(selectedRequestId)]);
    } catch (requestError) {
      const message = requestError?.message || "Could not record your outcome yet.";
      setError(message);
      showToast?.(message, "error");
    } finally {
      setBusy(false);
    }
  }, [busy, loadRequests, openRequest, queue, rpc, selectedRequestId, showToast]);

  if (!open) return null;

  const summary = listData.summary || {};
  const requests = Array.isArray(listData.requests) ? listData.requests : [];
  const request = detail?.request || null;
  const nextStep = detail?.next_step || null;
  const released = detail?.released_details || null;
  const safeJoinUrl = /^https?:\/\//i.test(String(released?.virtual_join_url || "").trim()) ? String(released.virtual_join_url).trim() : "";
  const queueButtons = [
    ["Active", "active", summary.active_count || 0],
    ["Awaiting host", "awaiting_host", summary.awaiting_host_count || 0],
    ["Next step", "next_step", summary.next_step_count || 0],
    ["Closed", "closed", summary.closed_count || 0],
    ["All", "all", null],
  ];

  return (
    <div className="gpi-seeker-portal" role="dialog" aria-modal="true" aria-label="My Get Plugged In requests">
      <button type="button" className="gpi-seeker-backdrop" aria-label="Close My requests" onClick={() => { if (!busy) onClose?.(); }} />
      <section className="gpi-seeker-shell">
        <header className="gpi-seeker-header">
          <div>
            <span>Get Plugged In · Your activity</span>
            <h2>{selectedRequestId ? "Your connection" : "My requests"}</h2>
            <p>{selectedRequestId ? "Everything the organization has released for this request stays here." : "Track the opportunities you raised your hand for and close the loop when a connection happens."}</p>
          </div>
          <button type="button" className="gpi-seeker-close" onClick={() => { if (!busy) onClose?.(); }} aria-label="Close">×</button>
        </header>

        {error && <div className="gpi-seeker-error"><strong>Could not complete that.</strong><span>{error}</span><button type="button" onClick={() => selectedRequestId ? openRequest(selectedRequestId) : loadRequests(queue)}>Retry</button></div>}

        {selectedRequestId ? (
          <div className="gpi-seeker-detail">
            <button type="button" className="gpi-seeker-back" onClick={() => { setSelectedRequestId(null); setDetail(null); }}>← Back to requests</button>
            {detailLoading || !request ? <div className="gpi-seeker-loading"><span/><strong>Opening your request…</strong></div> : <>
              <div className="gpi-seeker-detail-hero">
                <div>
                  <span className={`gpi-seeker-status status-${request.status}`}>{gpiSeekerStatusLabel(request.status)}</span>
                  <h3>{request.opportunity_title}</h3>
                  <p>{request.organization_name}</p>
                </div>
                <div className="gpi-seeker-timing">
                  <span>{request.occurrence_starts_at ? "When" : "Schedule"}</span>
                  <strong>{request.occurrence_starts_at ? gpiHostDateTimeLabel(request.occurrence_starts_at) : gpiHostTitleCase(request.schedule_type)}</strong>
                  <em>Requested {gpiHostFormatWhen(request.created_at)}</em>
                </div>
              </div>

              <div className="gpi-seeker-status-card">
                <span>Where it stands</span>
                <strong>{gpiSeekerStatusLabel(request.status)}</strong>
                <p>{gpiSeekerStatusNote(request.status)}</p>
              </div>

              {(detail?.confirmations || []).length > 0 && <div className="gpi-seeker-confirmations">
                <span>What you confirmed</span>
                <div>{detail.confirmations.map((item, index) => <p key={`${item.confirmation_type}-${index}`}><i>✓</i><span>{item.prompt}</span></p>)}</div>
              </div>}

              {nextStep && <div className="gpi-seeker-next-step">
                <span>Your next step</span>
                <h4>{nextStep.instructions}</h4>
                {(released?.private_address_text || safeJoinUrl) && <div className="gpi-seeker-released-details">
                  {released?.private_address_text && <div><span>Private meeting details</span><strong>{released.private_address_text}</strong></div>}
                  {safeJoinUrl && <div><span>Private join link</span><a href={safeJoinUrl} target="_blank" rel="noreferrer">Open secure join link ↗</a></div>}
                </div>}
                <small>These details are available because the organization provided a next step for your request.</small>
              </div>}

              {request.status === "next_step_provided" && <div className="gpi-seeker-outcome">
                <span>Did you connect?</span>
                <strong>Help FaithBid close the loop.</strong>
                <p>This only records whether the connection happened. It does not review or rate the organization.</p>
                <div>
                  <button type="button" disabled={busy} onClick={() => reportOutcome("seeker_confirmed")}>{busy ? "Saving…" : "Yes, I connected"}</button>
                  <button type="button" disabled={busy} className="secondary" onClick={() => reportOutcome("seeker_did_not_connect")}>I didn't connect</button>
                </div>
              </div>}

              <GpiStage2ParticipantModule request={request} showToast={showToast} />
              <GpiStage3OccurrenceIntentModule request={request} showToast={showToast} />
              <GpiStage4OccurrenceNotices request={request} />

              {request.closed_at && <div className="gpi-seeker-closed-note"><span>Closed {gpiHostFormatWhen(request.closed_at)}</span><strong>{gpiSeekerStatusLabel(request.status)}</strong></div>}
            </>}
          </div>
        ) : (
          <div className="gpi-seeker-workspace">
            <div className="gpi-seeker-summary">
              {queueButtons.map(([label, key, count]) => <button type="button" key={key} className={queue === key ? "active" : ""} onClick={() => setQueue(key)}><span>{label}</span><strong>{count == null ? "View" : loading ? "–" : count}</strong></button>)}
            </div>
            {Number(summary.next_step_count || 0) > 0 && <div className="gpi-seeker-attention"><span>Next step ready</span><strong>{summary.next_step_count} {Number(summary.next_step_count) === 1 ? "organization has" : "organizations have"} responded.</strong><em>Open the request to see released details and confirm the outcome.</em></div>}
            {loading ? <div className="gpi-seeker-loading"><span/><strong>Loading your requests…</strong></div> : requests.length ? <div className="gpi-seeker-list">
              {requests.map((item) => <button type="button" className="gpi-seeker-row" key={item.request_id} onClick={() => openRequest(item.request_id)}>
                <span className={`gpi-seeker-dot status-${item.status}`} />
                <div><span><strong>{item.opportunity_title}</strong><em>{gpiSeekerStatusLabel(item.status)}</em></span><small>{item.organization_name} · {item.occurrence_starts_at ? gpiHostDateTimeLabel(item.occurrence_starts_at) : gpiHostTitleCase(item.schedule_type)}</small><p>{gpiSeekerStatusNote(item.status)}</p></div>
                <span className="gpi-seeker-row-date">{gpiHostFormatWhen(item.updated_at || item.created_at)} →</span>
              </button>)}
            </div> : <div className="gpi-seeker-empty"><div>↗</div><strong>No requests here yet.</strong><p>When you send interest while signed in, FaithBid will keep the request and its next steps in this workspace.</p><button type="button" onClick={() => onClose?.()}>Explore opportunities</button></div>}
          </div>
        )}
      </section>
    </div>
  );
}

const GPI_ORGANIZATION_ROUTE_PATTERN = /^#\/?get-plugged-in\/organization\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})(?:[/?#]|$)/i;

function gpiOrganizationIdFromLocation() {
  if (typeof window === "undefined") return "";
  return decodeURIComponent(String(window.location.hash || "").match(GPI_ORGANIZATION_ROUTE_PATTERN)?.[1] || "");
}

function gpiOrganizationRoute(organizationId) {
  return `#/get-plugged-in/organization/${encodeURIComponent(String(organizationId || "").trim())}`;
}

function GetPluggedInPage({ nav, showToast, currentUser, authReady, discoveryEnabled = false }) {
  const [taxonomy, setTaxonomy] = useState([]);
  const [cityAreas, setCityAreas] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(2);
  const [dragProgress, setDragProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  const [query, setQuery] = useState("");
  const [goal, setGoal] = useState("");
  const [schedule, setSchedule] = useState("");
  const [cityAreaId, setCityAreaId] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [gpiPhase, setGpiPhase] = useState(discoveryEnabled ? "discovery" : "results");
  const [gpiBrowseMode, setGpiBrowseMode] = useState("fan");
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [searchMeta, setSearchMeta] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [detailOccurrences, setDetailOccurrences] = useState([]);
  const [detailOccurrencesLoading, setDetailOccurrencesLoading] = useState(false);
  const [detailOccurrencesError, setDetailOccurrencesError] = useState("");
  const [detailOccurrencesReload, setDetailOccurrencesReload] = useState(0);
  const [interestItem, setInterestItem] = useState(null);
  const [interestEmail, setInterestEmail] = useState(currentUser?.email || "");
  const [submitting, setSubmitting] = useState(false);
  const [interestPrerequisites, setInterestPrerequisites] = useState(gpiEmptyInterestPrerequisites);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState("");
  const [affirmedRequirementIds, setAffirmedRequirementIds] = useState([]);
  const [ageRangeAffirmed, setAgeRangeAffirmed] = useState(false);
  const [interestSubmitError, setInterestSubmitError] = useState("");
  const [interestSentItem, setInterestSentItem] = useState(null);
  const [interestPrereqReload, setInterestPrereqReload] = useState(0);
  const [hostPortalOpen, setHostPortalOpen] = useState(false);
  const [seekerPortalOpen, setSeekerPortalOpen] = useState(false);
  const [hostMemberships, setHostMemberships] = useState([]);
  const [organizationHome, setOrganizationHome] = useState(null);
  const [organizationHomeLoading, setOrganizationHomeLoading] = useState(false);
  const [organizationHomeError, setOrganizationHomeError] = useState("");
  const [organizationHomeTargetId, setOrganizationHomeTargetId] = useState("");
  const [organizationPreviewAsParticipant, setOrganizationPreviewAsParticipant] = useState(false);
  const interestPrereqRequestRef = useRef(0);
  const dragRef = useRef({ active: false, startX: 0, lastX: 0, lastT: 0, velocity: 0, moved: false, pendingProgress: 0, raf: 0 });
  const settleTimerRef = useRef(null);
  const suppressCardClickRef = useRef(false);

  // 865: this screen is a full-viewport public composition. Some host builds
  // still ship the Vite starter/root constraints (flex body, max-width root,
  // centered text/padding), which makes a 100vw child overflow a narrower
  // ancestor and clips the fan. Scope the host reset to this route only.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    html.classList.add("gpi-public-host-active");
    body.classList.add("gpi-public-host-active");
    root?.classList.add("gpi-public-host-active");
    // 0192: remove the temporary 0191 diagnostic if this file is hot-swapped
    // into an already-running Vite session. This is cleanup only; no runtime
    // measurement or layout mutation remains in the product build.
    document.getElementById("gpi-diagnostic-panel")?.remove();
    try { delete window.__gpiDiagnostic; } catch {}
    return () => {
      html.classList.remove("gpi-public-host-active");
      body.classList.remove("gpi-public-host-active");
      root?.classList.remove("gpi-public-host-active");
    };
  }, []);

  // 0192: rendered-truth diagnostic removed after browser geometry was captured.

  const activityTags = useMemo(() => taxonomy.filter(t => t.axis === "activity"), [taxonomy]);
  const displayItems = useMemo(() => {
    const rows = items.map(gpiDisplayOpportunity);
    const previewRows = GPI_PREVIEW_OPPORTUNITIES.map((item) => ({ ...item, isPreview: true }));
    if (!rows.length) return discoveryEnabled && searchCompleted ? [] : previewRows;
    // 0067: Discovery matching/ranking is authoritative in the v2 backend.
    // The Discovery search textbox is an interest-picker aid, not a second
    // post-response phrase filter over opportunity cards.
    if (discoveryEnabled || !query.trim()) return rows;
    const needle = query.trim().toLowerCase();
    const filtered = rows.filter((item) => [
      item.title,
      item.organization_name,
      item.kicker,
      item.first_visit_label,
      item.footer_note,
      item.activity_label,
      item.primary_category,
      item.category_label,
      item.goal,
    ].filter(Boolean).join(" ").toLowerCase().includes(needle));
    return filtered.length || discoveryEnabled ? filtered : rows;
  }, [discoveryEnabled, items, query, searchCompleted]);
  const liveCount = items.length;
  const selectedCityArea = useMemo(() => cityAreas.find((city) =>
    String(city?.id || city?.city_area_id || "") === String(cityAreaId || "")
  ) || null, [cityAreaId, cityAreas]);
  const resultsAreaLabel = selectedCityArea?.label || selectedCityArea?.name || cityQuery || "America";
  const resultsContextLabel = selectedInterests.length
    ? `Based on ${selectedInterests.map((item) => item.label).join(", ")} · ${resultsAreaLabel}`
    : `Good first steps ${cityAreaId ? "in" : "across"} ${resultsAreaLabel}`;
  const showingDiscoveryEmpty = discoveryEnabled && searchCompleted && !loading && !error && !displayItems.length;
  const showingDiscoverySkeleton = discoveryEnabled && gpiPhase === "results" && loading;
  const gpiLocationStatus = String(searchMeta?.location_status || "");
  const gpiLocalMarketAvailable = searchMeta?.local_market_available !== false;
  const gpiRequestedLocation = String(searchMeta?.requested_location || cityQuery || "").trim();
  const showingVirtualOnlyLocation = discoveryEnabled && searchCompleted && !!gpiRequestedLocation && !gpiLocalMarketAvailable;
  const showingMappedLocalLocation = discoveryEnabled && searchCompleted && gpiLocationStatus === "exact_supported";
  const active = displayItems[selected] || displayItems[0] || null;
  const previewMode = !!active?.isPreview;
  const publicOrganization = organizationHome?.organization || null;
  const publicOrganizationOpportunities = useMemo(() => (Array.isArray(organizationHome?.opportunities) ? organizationHome.opportunities : []).map(gpiDisplayOpportunity), [organizationHome]);
  const publicOrganizationName = gpiPublicOrganizationName(publicOrganization?.name);
  const publicOrganizationDescription = gpiUsableOrganizationDescription(publicOrganization?.description);
  const publicOrganizationIsFixture = gpiOrganizationIsFixture(publicOrganization);
  const publicOrganizationCities = Array.from(new Set(publicOrganizationOpportunities.map((item) => item.city_label).filter(Boolean)));
  const managedOrganizationIds = useMemo(() => new Set((hostMemberships || []).filter((membership) => membership?.active !== false).map((membership) => String(membership?.organization_id || ""))), [hostMemberships]);
  const managesPublicOrganization = !!publicOrganization?.id && managedOrganizationIds.has(String(publicOrganization.id));
  const interestSubmissionState = gpiInterestSubmissionState({
    item: interestItem,
    prerequisites: interestPrerequisites,
    selectedOccurrenceId,
    affirmedRequirementIds,
    ageRangeAffirmed,
  });

  const detailIsRecurring = String(detailItem?.schedule_type || "").toLowerCase() === "recurring";
  const detailRecurringLabel = detailIsRecurring ? gpiRecurringScheduleLabel(detailItem) : "";
  // Stage 1 freeze rule: recurring alone is not enough. The richer gathering
  // treatment is reserved for a currently public opportunity with at least
  // two eligible dates returned by the service-only occurrence contract.
  const detailReceivesRecurringTreatment = detailIsRecurring
    && !detailOccurrencesLoading
    && !detailOccurrencesError
    && detailOccurrences.length >= 2;
  const detailOpportunityFacts = gpiSupportedOpportunityFacts(detailItem);
  const detailOrganizationDescription = gpiUsableOrganizationDescription(detailItem?.organization_description);
  const detailNextOccurrence = detailOccurrences[0] || null;
  const detailHasUpcomingSeries = detailOccurrences.length >= 2;
  const detailDescriptionText = firstNonEmpty(detailItem?.description_text, detailItem?.description, "");
  const detailFirstVisitText = firstNonEmpty(detailItem?.first_visit_label, detailItem?.first_visit, "");
  const detailHeroSummary = detailFirstVisitText && detailFirstVisitText.trim().toLowerCase() !== detailDescriptionText.trim().toLowerCase()
    ? detailFirstVisitText
    : "";
  const detailGoodToKnowText = firstNonEmpty(
    (detailItem?.readiness_labels || []).join(" · "),
    detailItem?.readiness_fallback_note,
    ""
  );
  const detailScheduleText = firstNonEmpty(
    detailItem?.schedule_label,
    detailItem?.recurrence_label,
    [detailItem?.day_label, detailItem?.time_label].filter(Boolean).join(" · "),
    ""
  );
  const detailWhenText = [detailItem?.day_label, detailItem?.time_label].filter(Boolean).join(" · ");
  const detailDistinctScheduleText = detailScheduleText.trim().toLowerCase() !== detailWhenText.trim().toLowerCase()
    ? detailScheduleText
    : "";
  const detailCommitmentText = firstNonEmpty(
    detailItem?.commitment_label,
    detailItem?.commitment_type ? gpiHostTitleCase(detailItem.commitment_type) : "",
    ""
  );
  const detailBasicFacts = [
    { label: "Host", value: detailItem?.organization_name },
    { label: "When", value: detailWhenText },
    { label: "Near", value: detailItem?.distance_label },
    { label: "Type", value: firstNonEmpty(detailItem?.category_label, detailItem?.kicker, "") },
    { label: "Schedule", value: detailDistinctScheduleText },
    { label: "Commitment", value: detailCommitmentText },
  ].filter((fact) => String(fact.value || "").trim());
  const openGpiHostPortal = useCallback(() => {
    if (!authReady) {
      showToast?.("Checking your FaithBid account…", "info");
      return;
    }
    if (!currentUser?.id) {
      kbSafeSessionSet(GPI_HOST_INTENT_SESSION_KEY, "post");
      savePostAuthTarget({ screen: "get-plugged-in", autoPost: false });
      setAuthDefaultRole("login");
      nav?.("auth");
      return;
    }
    setHostPortalOpen(true);
  }, [authReady, currentUser?.id, nav, showToast]);

  useEffect(() => {
    if (!authReady || !currentUser?.id) return;
    if (kbSafeSessionGet(GPI_HOST_INTENT_SESSION_KEY) !== "post") return;
    kbSafeSessionRemove(GPI_HOST_INTENT_SESSION_KEY);
    setHostPortalOpen(true);
  }, [authReady, currentUser?.id]);

  const openGpiSeekerPortal = useCallback(() => {
    if (!authReady) {
      showToast?.("Checking your FaithBid account…", "info");
      return;
    }
    if (!currentUser?.id) {
      kbSafeSessionSet(GPI_SEEKER_INTENT_SESSION_KEY, "requests");
      savePostAuthTarget({ screen: "get-plugged-in", autoPost: false });
      setAuthDefaultRole("login");
      nav?.("auth");
      return;
    }
    setSeekerPortalOpen(true);
  }, [authReady, currentUser?.id, nav, showToast]);

  useEffect(() => {
    if (!authReady || !currentUser?.id) return;
    if (kbSafeSessionGet(GPI_SEEKER_INTENT_SESSION_KEY) !== "requests") return;
    kbSafeSessionRemove(GPI_SEEKER_INTENT_SESSION_KEY);
    setSeekerPortalOpen(true);
  }, [authReady, currentUser?.id]);

  const invokeGpi = useCallback(async (action, payload = {}) => {
    const { data, error: fnError } = await supabase.functions.invoke("gpi-public", { body: { action, payload } });
    if (fnError) throw fnError;
    if (!data?.ok) throw new Error(data?.error || "Get Plugged In request failed.");
    return data.data;
  }, []);

  useEffect(() => {
    if (!authReady || !currentUser?.id) {
      setHostMemberships([]);
      return undefined;
    }
    let canceled = false;
    supabase.rpc("gpi_host_get_context")
      .then(({ data, error: contextError }) => {
        if (contextError) throw contextError;
        if (!canceled) setHostMemberships(Array.isArray(data?.memberships) ? data.memberships : []);
      })
      .catch(() => { if (!canceled) setHostMemberships([]); });
    return () => { canceled = true; };
  }, [authReady, currentUser?.id]);

  const clearOrganizationHome = useCallback(() => {
    setOrganizationHome(null);
    setOrganizationHomeError("");
    setOrganizationHomeLoading(false);
    setOrganizationHomeTargetId("");
    setOrganizationPreviewAsParticipant(false);
  }, []);

  const closeOrganizationHome = useCallback(() => {
    clearOrganizationHome();
    if (gpiOrganizationIdFromLocation()) {
      window.history.replaceState({}, "", "#/get-plugged-in");
    }
  }, [clearOrganizationHome]);

  const openOrganizationHome = useCallback(async (item, { updateRoute = true } = {}) => {
    const organizationId = String(item?.organization_id || item?.id || "").trim();
    if (!organizationId || item?.isPreview) {
      showToast?.("A public organization home will be available when this host is published.", "info");
      return;
    }
    if (updateRoute && gpiOrganizationIdFromLocation() !== organizationId) {
      window.history.pushState({ gpiOrganizationId: organizationId }, "", gpiOrganizationRoute(organizationId));
    }
    setOrganizationHomeTargetId(organizationId);
    setOrganizationHome(null);
    setOrganizationHomeError("");
    setOrganizationHomeLoading(true);
    setOrganizationPreviewAsParticipant(false);
    setDetailItem(null);
    try {
      const data = await invokeGpi("get_organization", { organization_id: organizationId });
      if (!data?.organization) throw new Error("This organization home is not currently public.");
      setOrganizationHome(data);
    } catch (loadError) {
      setOrganizationHomeError(loadError?.message || "Could not open this organization home.");
    } finally {
      setOrganizationHomeLoading(false);
    }
  }, [invokeGpi, showToast]);

  useEffect(() => {
    const syncOrganizationRoute = () => {
      const organizationId = gpiOrganizationIdFromLocation();
      if (!organizationId) {
        clearOrganizationHome();
        return;
      }
      if (organizationId === organizationHomeTargetId && (organizationHomeLoading || organizationHome || organizationHomeError)) return;
      openOrganizationHome({ organization_id: organizationId }, { updateRoute: false });
    };
    syncOrganizationRoute();
    window.addEventListener("popstate", syncOrganizationRoute);
    window.addEventListener("hashchange", syncOrganizationRoute);
    return () => {
      window.removeEventListener("popstate", syncOrganizationRoute);
      window.removeEventListener("hashchange", syncOrganizationRoute);
    };
  }, [clearOrganizationHome, openOrganizationHome, organizationHome, organizationHomeError, organizationHomeLoading, organizationHomeTargetId]);

  const copyOrganizationHomeLink = useCallback(async () => {
    const organizationId = String(publicOrganization?.id || organizationHomeTargetId || "").trim();
    if (!organizationId) return;
    const shareUrl = new URL(window.location.href);
    shareUrl.hash = gpiOrganizationRoute(organizationId).slice(1);
    try {
      await navigator.clipboard.writeText(shareUrl.toString());
      showToast?.("Organization home link copied.", "success");
    } catch {
      showToast?.("This organization home now has a shareable address in your browser.", "info");
    }
  }, [organizationHomeTargetId, publicOrganization?.id, showToast]);

  useEffect(() => {
    const recurring = String(detailItem?.schedule_type || "").toLowerCase() === "recurring";
    if (!detailItem?.id || detailItem.isPreview || !recurring) {
      setDetailOccurrences([]);
      setDetailOccurrencesLoading(false);
      setDetailOccurrencesError("");
      return undefined;
    }
    let canceled = false;
    setDetailOccurrencesLoading(true);
    setDetailOccurrencesError("");
    invokeGpi("list_occurrences", { opportunity_id: detailItem.id })
      .then((rows) => {
        if (canceled) return;
        const occurrences = (Array.isArray(rows) ? rows : []).slice().sort((left, right) =>
          new Date(left?.starts_at || 0) - new Date(right?.starts_at || 0)
        );
        setDetailOccurrences(occurrences);
      })
      .catch((loadError) => {
        if (canceled) return;
        setDetailOccurrences([]);
        setDetailOccurrencesError(loadError?.message || "Could not load the current gathering dates.");
      })
      .finally(() => { if (!canceled) setDetailOccurrencesLoading(false); });
    return () => { canceled = true; };
  }, [detailItem?.id, detailItem?.isPreview, detailItem?.schedule_type, detailOccurrencesReload, invokeGpi]);
  const invokeAuthenticatedGpiInterest = useCallback(async (payload = {}) => {
    const { data, error: fnError } = await supabase.functions.invoke("gpi-interest-auth", { body: { action: "submit_interest", payload } });
    if (fnError) throw fnError;
    if (!data?.ok) throw new Error(data?.error || "Could not send tracked interest.");
    return data.data;
  }, []);

  // 0204: signed-out interest is intentionally resumed through authentication while the
  // email/provider worker remains deferred. Preserve only the public opportunity id;
  // prerequisites are re-read fresh after authentication rather than trusting stale UI state.
  useEffect(() => {
    if (!authReady || !currentUser?.id) return undefined;
    const opportunityId = String(kbSafeSessionGet(GPI_INTEREST_INTENT_SESSION_KEY) || "").trim();
    if (!opportunityId) return undefined;
    kbSafeSessionRemove(GPI_INTEREST_INTENT_SESSION_KEY);
    let canceled = false;
    (async () => {
      try {
        const data = await invokeGpi("get_opportunity", { opportunity_id: opportunityId });
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) throw new Error("That opportunity is no longer available.");
        if (canceled) return;
        setDetailItem(null);
        setInterestItem(gpiDisplayOpportunity(row));
        setInterestSubmitError("");
        showToast?.("You're signed in. Review the current details and send your interest.", "success");
      } catch (resumeError) {
        if (canceled) return;
        showToast?.(resumeError?.message || "That opportunity could not be reopened.", "error");
      }
    })();
    return () => { canceled = true; };
  }, [authReady, currentUser?.id, invokeGpi, showToast]);

  const loadFilters = useCallback(async () => {
    try {
      const [tax, cities] = await Promise.all([
        invokeGpi("list_taxonomy"),
        invokeGpi("list_city_areas"),
      ]);
      setTaxonomy(Array.isArray(tax) ? tax : []);
      setCityAreas(Array.isArray(cities) ? cities : []);
    } catch (e) {
      setError(e?.message || "Could not load Get Plugged In filters.");
    }
  }, [invokeGpi]);

  const runSearch = useCallback(async (overrides = {}) => {
    const nextGoal = Object.prototype.hasOwnProperty.call(overrides, "goal") ? overrides.goal : goal;
    const nextCityAreaId = Object.prototype.hasOwnProperty.call(overrides, "cityAreaId") ? overrides.cityAreaId : cityAreaId;
    const nextCityQuery = Object.prototype.hasOwnProperty.call(overrides, "cityQuery") ? overrides.cityQuery : cityQuery;
    const nextSchedule = Object.prototype.hasOwnProperty.call(overrides, "schedule") ? overrides.schedule : schedule;
    const nextInterestKeys = Object.prototype.hasOwnProperty.call(overrides, "interestKeys")
      ? overrides.interestKeys
      : selectedInterests.map(gpiDiscoveryInterestKey).filter(Boolean);
    setLoading(true);
    setError("");
    try {
      let nextRows = [];
      if (discoveryEnabled) {
        const data = await invokeGpi("search_v2", {
          discovery_interest_keys: Array.from(new Set((nextInterestKeys || []).filter(Boolean))),
          city_area_id: nextCityAreaId || null,
          city_query: nextCityQuery || null,
          schedule_types: nextSchedule ? [nextSchedule] : [],
          limit: 24,
        });
        setSearchMeta({
          location_status: data?.location_status || null,
          local_market_available: data?.local_market_available !== false,
          requested_location: data?.requested_location || nextCityQuery || null,
          resolved_place: data?.resolved_place || null,
          fallback_tier: data?.fallback_tier || null,
        });
        nextRows = gpiRowsFromV2Search(data);
      } else {
        setSearchMeta(null);
        const data = await invokeGpi("search", {
          goal: nextGoal || null,
          city_area_id: nextCityAreaId || null,
          city_query: nextCityQuery || null,
          schedule_types: nextSchedule ? [nextSchedule] : [],
          limit: 24,
        });
        nextRows = Array.isArray(data) ? data : [];
      }
      setItems(nextRows);
      setSearchCompleted(true);
      setSelected((prev) => nextRows.length ? (discoveryEnabled ? 0 : Math.min(Math.max(prev, 0), nextRows.length - 1)) : 2);
    } catch (e) {
      setError(e?.message || "Could not load local opportunities.");
      setSearchMeta(null);
      setItems([]);
      setSearchCompleted(true);
    } finally {
      setLoading(false);
    }
  }, [cityAreaId, cityQuery, discoveryEnabled, goal, invokeGpi, schedule, selectedInterests]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadFilters();
      if (mounted && !discoveryEnabled) await runSearch();
      if (mounted && discoveryEnabled) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!displayItems.length) return;
    setSelected((prev) => Math.min(Math.max(prev, 0), displayItems.length - 1));
  }, [displayItems.length]);

  useEffect(() => {
    setInterestEmail(currentUser?.email || "");
  }, [currentUser?.email]);

  useEffect(() => {
    setInterestSubmitError("");
    setInterestSentItem(null);
  }, [interestItem?.id]);

  useEffect(() => {
    const requestId = interestPrereqRequestRef.current + 1;
    interestPrereqRequestRef.current = requestId;
    setSelectedOccurrenceId("");
    setAffirmedRequirementIds([]);
    setAgeRangeAffirmed(false);

    if (!interestItem || interestItem.isPreview) {
      setInterestPrerequisites(gpiEmptyInterestPrerequisites());
      return () => {
        if (interestPrereqRequestRef.current === requestId) interestPrereqRequestRef.current += 1;
      };
    }

    setInterestPrerequisites({ loading: true, loaded: false, opportunityId: interestItem.id, error: "", occurrences: [], requirements: [] });
    Promise.all([
      invokeGpi("list_occurrences", { opportunity_id: interestItem.id }),
      invokeGpi("get_participant_requirements", { opportunity_id: interestItem.id }),
    ]).then(([occurrenceRows, requirementRows]) => {
      if (requestId !== interestPrereqRequestRef.current) return;
      const occurrences = (Array.isArray(occurrenceRows) ? occurrenceRows : [])
        .slice()
        .sort((left, right) => new Date(left?.starts_at || 0) - new Date(right?.starts_at || 0));
      const requirements = Array.isArray(requirementRows) ? requirementRows : [];
      setInterestPrerequisites({ loading: false, loaded: true, opportunityId: interestItem.id, error: "", occurrences, requirements });
      if (String(interestItem.schedule_type || "").toLowerCase() === "one_time" && occurrences[0]?.id) {
        setSelectedOccurrenceId(occurrences[0].id);
      }
    }).catch((prerequisiteError) => {
      if (requestId !== interestPrereqRequestRef.current) return;
      setInterestPrerequisites({
        loading: false,
        loaded: false,
        opportunityId: interestItem.id,
        error: prerequisiteError?.message || "Could not load the current participation details.",
        occurrences: [],
        requirements: [],
      });
    });

    return () => {
      if (interestPrereqRequestRef.current === requestId) interestPrereqRequestRef.current += 1;
    };
  }, [interestItem?.id, interestItem?.schedule_type, interestPrereqReload, invokeGpi]);

  useEffect(() => () => {
    if (dragRef.current.raf) cancelAnimationFrame(dragRef.current.raf);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
  }, []);

  // 864: keep navigation responsive; this matches the short geometry
  // transition and removes the old half-second dead-input window.
  const GPI_SETTLE_MS = 170;

  const moveBy = useCallback((delta) => {
    if (settling || !displayItems.length) return;
    setSettling(true);
    setSelected((prev) => {
      const total = displayItems.length;
      // 858 — with fewer than 5 live rows the modular wrap in
      // gpiRelativeSlot can place the same card in two slots at once and
      // flicker (audit item F9). Below 5 items, clamp instead of wrapping.
      if (total < 5) return Math.min(Math.max(prev + delta, 0), total - 1);
      return ((prev + delta) % total + total) % total;
    });
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => setSettling(false), GPI_SETTLE_MS);
  }, [displayItems.length, settling]);

  const moveTo = useCallback((index) => {
    if (settling || !displayItems.length || index === selected) return;
    setSettling(true);
    setSelected(index);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => setSettling(false), GPI_SETTLE_MS);
  }, [displayItems.length, selected, settling]);

  const onPointerDown = (e) => {
    if (!displayItems.length || settling || e.button !== 0 || e.target.closest("button,input,select,a")) return;
    dragRef.current = { active: true, startX: e.clientX, lastX: e.clientX, lastT: performance.now(), velocity: 0, moved: false, pendingProgress: 0, raf: 0 };
    setDragging(true);
    setDragProgress(0);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const now = performance.now();
    const dx = e.clientX - drag.startX;
    const dt = Math.max(now - drag.lastT, 1);
    drag.velocity = (e.clientX - drag.lastX) / dt;
    drag.lastX = e.clientX;
    drag.lastT = now;
    drag.moved = drag.moved || Math.abs(dx) > 6;
    const carouselWidth = e.currentTarget.getBoundingClientRect().width || window.innerWidth;
    const snapDistance = Math.max(210, Math.min(335, carouselWidth * 0.22));
    drag.pendingProgress = Math.max(-0.96, Math.min(0.96, dx / snapDistance));
    if (!drag.raf) {
      drag.raf = requestAnimationFrame(() => {
        drag.raf = 0;
        setDragProgress(drag.pendingProgress);
      });
    }
  };

  const endDrag = () => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const dx = drag.lastX - drag.startX;
    const velocity = drag.velocity;
    const moved = drag.moved;
    drag.active = false;
    if (drag.raf) cancelAnimationFrame(drag.raf);
    drag.raf = 0;
    setDragging(false);
    setDragProgress(0);
    suppressCardClickRef.current = moved;
    setTimeout(() => { suppressCardClickRef.current = false; }, 0);
    if (dx < -52 || velocity < -0.34) moveBy(1);
    else if (dx > 52 || velocity > 0.34) moveBy(-1);
  };

  const closeInterestModal = useCallback(() => {
    interestPrereqRequestRef.current += 1;
    setInterestItem(null);
    setInterestPrerequisites(gpiEmptyInterestPrerequisites());
    setSelectedOccurrenceId("");
    setAffirmedRequirementIds([]);
    setAgeRangeAffirmed(false);
    setInterestSubmitError("");
    setInterestSentItem(null);
  }, []);

  const retryInterestPrerequisites = useCallback(() => {
    setInterestSubmitError("");
    setInterestPrereqReload((value) => value + 1);
  }, []);

  const continueInterestAfterAuth = useCallback(() => {
    const opportunityId = String(interestItem?.id || "").trim();
    if (!opportunityId) return;
    kbSafeSessionSet(GPI_INTEREST_INTENT_SESSION_KEY, opportunityId);
    savePostAuthTarget({ screen: "get-plugged-in", autoPost: false });
    setAuthDefaultRole("login");
    closeInterestModal();
    nav?.("auth");
  }, [closeInterestModal, interestItem?.id, nav]);

  const toggleDiscoveryInterest = useCallback((term) => {
    const interestKey = gpiDiscoveryInterestKey(term);
    if (!interestKey) return;
    setSelectedInterests((current) => current.some((item) => gpiDiscoveryInterestKey(item) === interestKey)
      ? current.filter((item) => gpiDiscoveryInterestKey(item) !== interestKey)
      : [...current, term]);
  }, []);

  const removeDiscoveryInterest = useCallback((interestKey) => {
    setSelectedInterests((current) => current.filter((item) => gpiDiscoveryInterestKey(item) !== interestKey));
  }, []);

  const runDiscoverySearch = useCallback(() => {
    const interestKeys = selectedInterests.map(gpiDiscoveryInterestKey).filter(Boolean);
    setGpiBrowseMode("fan");
    setGpiPhase("results");
    runSearch({ interestKeys });
  }, [runSearch, selectedInterests]);
  const viewAllDiscoveryOpportunities = useCallback(() => {
    setQuery("");
    setGoal("");
    setSchedule("");
    setSelectedInterests([]);
    setGpiBrowseMode("all");
    setGpiPhase("results");
    runSearch({ interestKeys: [], goal: "", schedule: "" });
  }, [runSearch]);
  const clearDiscoveryFilters = useCallback(() => {
    setQuery("");
    setGoal("");
    setSchedule("");
    setSelectedInterests([]);
    setGpiBrowseMode("fan");
    setGpiPhase("results");
    // 0068: zero-selection is the backend's locked starter-pool path. Keep
    // the user's selected city when present; an empty city means DFW-wide.
    runSearch({ interestKeys: [], goal: "", schedule: "", cityAreaId: "", cityQuery: "" });
  }, [runSearch]);

  const editDiscoveryInterests = useCallback(() => {
    setGpiBrowseMode("fan");
    setGpiPhase("discovery");
    setDetailItem(null);
    setInterestItem(null);
  }, []);
  const toggleInterestRequirement = useCallback((requirementId, checked) => {
    setAffirmedRequirementIds((current) => checked
      ? Array.from(new Set([...current, requirementId]))
      : current.filter((id) => String(id) !== String(requirementId)));
  }, []);

  const submitInterest = async (e) => {
    e.preventDefault();
    if (!interestItem || interestItem.isPreview) return;
    if (!currentUser?.id) {
      continueInterestAfterAuth();
      return;
    }
    if (!interestSubmissionState.ready) return;
    setSubmitting(true);
    setInterestSubmitError("");
    try {
      const interestPayload = gpiBuildInterestSubmissionPayload({
        item: interestItem,
        selectedOccurrenceId,
        requirements: interestPrerequisites.requirements,
        affirmedRequirementIds,
        ageRangeAffirmed,
      });
      const rawSubmission = await invokeAuthenticatedGpiInterest(interestPayload);
      const submission = Array.isArray(rawSubmission) ? rawSubmission[0] : rawSubmission;
      const requestStatus = String(submission?.request_status || submission?.status || "submitted").toLowerCase();
      const deduplicated = submission?.deduplicated === true;
      if (requestStatus === "request_invalidated") {
        throw new Error("This opportunity changed and is no longer available for a new request.");
      }
      setInterestSentItem({ ...interestItem, gpiRequestStatus: requestStatus, gpiDeduplicated: deduplicated });
      showToast?.(deduplicated ? "You already have an active request for this opportunity. Open My requests to continue." : "Interest sent. Track it anytime in My requests.", deduplicated ? "info" : "success");
    } catch (e2) {
      const message = e2?.message || "Could not send interest yet.";
      setInterestSubmitError(message);
      showToast?.(message, "error");
      setInterestPrereqReload((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gpi-public-page" data-gpi-build="0209-gpi-stage1-elevation-rule-acceptance-freeze-lock">
      {discoveryEnabled && gpiPhase === "discovery" && (
        <GpiDiscoveryStage
          cityAreas={cityAreas}
          cityAreaId={cityAreaId}
          setCityAreaId={setCityAreaId}
          cityQuery={cityQuery}
          setCityQuery={setCityQuery}
          activityTags={activityTags}
          selectedInterests={selectedInterests}
          query={query}
          setQuery={setQuery}
          loading={loading}
          onToggleInterest={toggleDiscoveryInterest}
          onRemoveInterest={removeDiscoveryInterest}
          onFindNextStep={runDiscoverySearch}
          onViewAll={viewAllDiscoveryOpportunities}
          onNotSure={clearDiscoveryFilters}
          onPostOpportunity={openGpiHostPortal}
          onMyRequests={openGpiSeekerPortal}
        />
      )}

      {!discoveryEnabled && (
        <section className="gpi-public-hero">
        <div className="gpi-public-hero-copy">
          <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 11px",borderRadius:999,background:"rgba(176,136,64,0.10)",border:"1px solid rgba(176,136,64,0.20)",fontSize:10,fontWeight:800,letterSpacing:"0.14em",textTransform:"uppercase",color:"#8A6729",marginBottom:12}}>Get Plugged In</div>
          <h1>Find a faithful next step.</h1>
          <p>Real ways to serve, meet people, and grow near you — organized by location, schedule, and first-step fit.</p>
        </div>
        <div className="gpi-public-controls" aria-label="Find Get Plugged In opportunities">
          <label className="gpi-select-control"><GpiFilterIcon type="location"/><select value={cityAreaId} onChange={(e)=>setCityAreaId(e.target.value)} aria-label="Location">
            <option value="">All mapped local cities</option>
            {cityAreas.map((city) => <option key={city.id || city.city_area_id || city.label} value={city.id || city.city_area_id}>{gpiCityOptionLabel(city)}</option>)}
          </select></label>
          <label className="gpi-select-control"><GpiFilterIcon type="calendar"/><select value={schedule} onChange={(e)=>setSchedule(e.target.value)} aria-label="Schedule">
            <option value="">This weekend</option>
            <option value="one_time">One-time</option>
            <option value="recurring">Recurring</option>
            <option value="flexible">Flexible</option>
          </select></label>
          <label className="gpi-select-control"><GpiFilterIcon type="people"/><select value={goal} onChange={(e)=>setGoal(e.target.value)} aria-label="Goal">
            <option value="">Easy first step</option>
            <option value="serve">Serve</option>
            <option value="connect">Meet people</option>
          </select></label>
          <div className="gpi-public-interest-field">
            <GpiFilterIcon type="search"/>
            <input list="gpi-interest-options" value={query} onChange={(e)=>setQuery(e.target.value)} onKeyDown={(e)=>{ if (e.key === "Enter") runSearch(); }} placeholder="Interests · Serve + meet people" aria-label="Search interests" />
            <datalist id="gpi-interest-options">
              {activityTags.slice(0, 18).map((tag) => <option key={tag.id || tag.slug || tag.label} value={tag.label || tag.slug} />)}
            </datalist>
          </div>
          <button type="button" onClick={runSearch} disabled={loading}>Show me <span aria-hidden="true">→</span></button>
          {discoveryEnabled && <button type="button" className="gpi-public-unsure" onClick={clearDiscoveryFilters} disabled={loading}>Not sure?</button>}
        </div>
      </section>
      )}

      {(!discoveryEnabled || gpiPhase === "results") && (
      <section className={`gpi-public-stage${discoveryEnabled ? " gpi-results-stage" : ""}${gpiBrowseMode === "all" ? " gpi-viewall-mode" : ""}`} aria-label="Get Plugged In opportunity carousel">
        <div className="gpi-public-stage-top">
          {discoveryEnabled ? (
            <div className="gpi-results-header">
              <div className="gpi-results-main">
                <div className="gpi-results-eyebrow">{selectedInterests.length ? "Your matches" : "Good first steps"}</div>
                <div className="gpi-public-count">{selectedInterests.length ? "Opportunities for you." : "Good first steps for you."}</div>
                <div className="gpi-public-help">{resultsContextLabel}</div>
              </div>
              <div className="gpi-results-controls">
                <div className="gpi-results-location-context" aria-label="GPI location coverage">
                  <span className="gpi-results-location-badge">
                    {showingVirtualOnlyLocation ? "Virtual options" : showingMappedLocalLocation ? "Local match" : "Location-aware"}
                  </span>
                  <span className="gpi-results-location-copy">
                    {showingVirtualOnlyLocation
                      ? `No live local market in ${gpiRequestedLocation} — showing virtual options.`
                      : showingMappedLocalLocation
                        ? `Local coverage available for ${gpiRequestedLocation || resultsAreaLabel}.`
                        : cityQuery
                          ? `Prioritizing ${cityQuery} while keeping virtual options available.`
                          : "Choose a city to prioritize nearby opportunities."}
                  </span>
                </div>
                <div className="gpi-refinement-row" aria-label="Refine Get Plugged In results">
                  <label className="gpi-refinement-chip">
                    <GpiFilterIcon type="location" />
                    <span>Location</span>
                    <select value={cityAreaId} onChange={(event) => { setCityAreaId(event.target.value); runSearch({ cityAreaId: event.target.value }); }} aria-label="Location">
                      <option value="">All mapped local cities</option>
                      {cityAreas.map((city) => <option key={city.id || city.city_area_id || city.label} value={city.id || city.city_area_id}>{gpiCityOptionLabel(city)}</option>)}
                    </select>
                  </label>
                  <label className="gpi-refinement-chip">
                    <GpiFilterIcon type="calendar" />
                    <span>Schedule</span>
                    <select value={schedule} onChange={(event) => { setSchedule(event.target.value); runSearch({ schedule: event.target.value }); }} aria-label="Schedule">
                      <option value="">Any time</option>
                      <option value="one_time">One-time</option>
                      <option value="recurring">Recurring</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </label>
                  <button type="button" className="gpi-refinement-chip gpi-refinement-static" disabled title="This filter depends on host data availability.">
                    <GpiFilterIcon type="people" />
                    <span>First-time friendly</span>
                  </button>
                  <button type="button" onClick={editDiscoveryInterests} className="gpi-results-edit">Edit interests</button>
                  <button type="button" onClick={openGpiSeekerPortal} className="gpi-results-my-requests">My requests</button>
                  <button type="button" onClick={() => setGpiBrowseMode((mode) => mode === "all" ? "fan" : "all")} className="gpi-public-viewall">{gpiBrowseMode === "all" ? "Show fan" : "View all " + (liveCount || 24)}<span aria-hidden="true">→</span></button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="gpi-public-count">{`${liveCount || 24} ways to get connected around ${resultsAreaLabel}`}</div>
                <div className="gpi-public-help">Drag or use arrows to explore</div>
              </div>
              <div className="gpi-public-stage-actions">
                <button type="button" onClick={openGpiSeekerPortal} className="gpi-results-my-requests">My requests</button>
                <button type="button" onClick={() => setGpiBrowseMode((mode) => mode === "all" ? "fan" : "all")} className="gpi-public-viewall">{gpiBrowseMode === "all" ? "Show fan" : "View all " + (liveCount || 24)}<span aria-hidden="true">→</span></button>
              </div>
            </>
          )}
        </div>
        {error && (
          <div className="gpi-public-error">
            <strong>Could not load this yet.</strong>
            <span>{error}</span>
            <button type="button" onClick={runSearch}>Try again</button>
          </div>
        )}

        {showingDiscoveryEmpty && (
          <div className="gpi-public-empty">
            <strong>{showingVirtualOnlyLocation ? `Local opportunities are not live in ${gpiRequestedLocation} yet.` : "No exact matches yet."}</strong>
            <span>{showingVirtualOnlyLocation ? "FaithBid will not substitute another city. Try broader interests for virtual options, or check back as local coverage expands." : "Try fewer filters, or use Not sure? to see the broad starter set."}</span>
            <button type="button" onClick={clearDiscoveryFilters}>Not sure?</button>
          </div>
        )}

        {/* 858 — arrows moved to be siblings of .gpi-public-carousel rather
            than children inside it. The carousel is position:absolute,
            which creates its own stacking context; the cards' inline
            zIndex (30–50) always outranked the arrows' z-index:9 while both
            lived inside that same context (audit item C4). As direct
            children of .gpi-public-stage, the arrows now sit in the stage's
            stacking context instead and are given a z-index above
            everything the stage contains. Click handlers are unchanged. */}
        {gpiBrowseMode === "all" ? (
          <div className="gpi-viewall-grid" aria-label="All Get Plugged In opportunities">
            {displayItems.map((item, idx) => (
              <article key={item.id || idx} className={"gpi-viewall-card tone-" + (item.tone || GPI_TONES[idx % GPI_TONES.length])}>
                <div className="gpi-viewall-tone" aria-hidden="true" />
                <div className="gpi-viewall-body">
                  <div className="gpi-viewall-taxonomy">
                    <span className="gpi-viewall-taxonomy-dot" aria-hidden="true" />
                    <span>{item.kicker || "Opportunity"}</span>
                    {String(item.word || gpiTitleWord(item, idx) || "").trim().toLowerCase() !== String(item.kicker || "Opportunity").trim().toLowerCase() && (
                      <>
                        <i aria-hidden="true">•</i>
                        <strong>{item.word || gpiTitleWord(item, idx)}</strong>
                      </>
                    )}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.organization_name}</p>
                  <div className="gpi-viewall-meta">{item.is_recurring ? item.recurrence_label : `${item.day_label} · ${item.time_label}`} · {item.distance_label}</div>
                  {discoveryEnabled && <div className="gpi-viewall-readiness">{(item.readiness_labels || []).slice(0,2).join(" · ") || item.readiness_fallback_note || "Host will confirm fit details."}</div>}
                </div>
                <div className="gpi-viewall-actions">
                  <button type="button" className="gpi-viewall-detail-action" onClick={() => setDetailItem(item)}>View details <span aria-hidden="true">→</span></button>
                  <button type="button" className="gpi-viewall-fan-link" onClick={() => { setSelected(idx); setGpiBrowseMode("fan"); }}>View in fan</button>
                  <button type="button" className="gpi-viewall-interest-action" disabled={item.isPreview} onClick={() => item.isPreview ? showToast?.("This opportunity is a preview. Published opportunities will accept interest.", "info") : setInterestItem(item)}>I'm interested</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <>
        <button type="button" className="gpi-public-arrow left" onClick={(e)=>{e.stopPropagation();moveBy(-1);}} aria-label="Previous opportunity">←</button>
        <div
          className={`gpi-public-carousel${dragging ? " dragging" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          role="region"
          aria-roledescription="carousel"
          tabIndex={0}
          onKeyDown={(e)=>{ if (e.key === "ArrowRight") moveBy(1); if (e.key === "ArrowLeft") moveBy(-1); }}
        >
          <div className="gpi-public-card-field">
            {showingDiscoverySkeleton && Array.from({ length: 5 }).map((_, idx) => {
              const slot = gpiRelativeSlot(idx, 2, 5);
              const pose = gpiPoseForPosition(slot);
              return (
                <article
                  key={`gpi-skeleton-${idx}`}
                  className={`gpi-public-card gpi-card-skeleton${idx === 2 ? " active" : ""}`}
                  style={{
                    transform: `translate3d(calc(-50% + ${gpiViewportOffset(pose.xCqw)} + ${pose.xPx}px), ${gpiViewportOffset(pose.yCqw)}, 0) scale(${pose.scale}) perspective(clamp(620px, 56.75vw, 900px)) rotateY(${pose.rotateY}deg)`,
                    zIndex: pose.zIndex,
                    opacity: pose.opacity,
                    pointerEvents: "none",
                  }}
                  aria-hidden="true"
                >
                  <div className="gpi-skeleton-line short" />
                  <div className="gpi-skeleton-word" />
                  <div className="gpi-skeleton-line title" />
                  <div className="gpi-skeleton-line host" />
                  <div className="gpi-card-rule" />
                  <div className="gpi-skeleton-line meta" />
                  <div className="gpi-skeleton-line note" />
                </article>
              );
            })}
            {!showingDiscoverySkeleton && displayItems.map((item, idx) => {
              const slot = gpiRelativeSlot(idx, selected, displayItems.length);
              const abs = Math.abs(slot);
              const isActive = idx === selected;
              const direction = dragProgress < 0 ? 1 : dragProgress > 0 ? -1 : 0;
              const isIncoming = direction !== 0 && slot === direction;
              const dragInfluence = isActive || isIncoming ? 1 : 0.14;
              const pose = gpiPoseForPosition(slot + dragProgress * dragInfluence);
              return (
                <article
                  key={item.id || idx}
                  className={`gpi-public-card tone-${item.tone || GPI_TONES[idx % GPI_TONES.length]}${isActive ? " active" : ""}`}
                  style={{
                    // 863: measured perspective fan. The side cards rotate
                    // away toward the center so their inner vertical edge is
                    // shorter than the outside edge, matching both opposing
                    // top/bottom slopes in the approved render.
                    transform: `translate3d(calc(-50% + ${gpiViewportOffset(pose.xCqw)} + ${pose.xPx}px), ${gpiViewportOffset(pose.yCqw)}, 0) scale(${pose.scale}) perspective(clamp(620px, 56.75vw, 900px)) rotateY(${pose.rotateY}deg)`,
                    zIndex: pose.zIndex,
                    opacity: pose.opacity,
                    pointerEvents: abs > 2.6 ? "none" : "auto",
                  }}
                  aria-hidden={abs > 2 ? "true" : "false"}
                  onClick={() => { if (!suppressCardClickRef.current && !isActive) moveTo(idx); }}
                >
                  <div className="gpi-card-kicker">{item.kicker}</div>
                  <div className="gpi-card-word"><GpiCardWord word={gpiTitleWord(item, idx)} /></div>
                  <div className="gpi-card-title">{item.title}</div>
                  <div className="gpi-card-host">{item.organization_name}</div>
                  <div className="gpi-card-rule" />
                  <div className="gpi-card-meta">{item.is_recurring ? item.recurrence_label : `${item.day_label} · ${item.time_label}`}</div>
                  {/* 858 — was gated on item.isPreview, which meant live
                      (published) opportunities never rendered this row at
                      all and silently lost a line of vertical rhythm
                      (audit item E8). Now renders for the active card
                      regardless of source, falling back to a generic
                      distance-only line when spots data isn't present. */}
                  <div className="gpi-card-submeta">
                    {item.distance_label}{item.isPreview ? " · 4 spots open" : (item.spots_label ? ` · ${item.spots_label}` : "")}
                  </div>
                  <div className="gpi-card-note">{item.footer_note}</div>
                  <button type="button" className="gpi-card-detail" aria-hidden={!isActive} tabIndex={isActive ? 0 : -1} onClick={(e)=>{e.stopPropagation();if(isActive)setDetailItem(item);}}>View details <span aria-hidden="true">→</span></button>
                </article>
              );
            })}
          </div>
        </div>
        <button type="button" className="gpi-public-arrow right" onClick={(e)=>{e.stopPropagation();moveBy(1);}} aria-label="Next opportunity">→</button>
          </>
        )}
      </section>
      )}

      {(!discoveryEnabled || gpiPhase === "results") && (
      <section className={`gpi-public-bottom${gpiBrowseMode === "all" ? " gpi-viewall-bottom" : ""}`} aria-live="polite">
        <div className="gpi-public-bottom-host">
          <span>Hosted by</span>
          <strong>{active?.organization_name || "FaithBid hosts"}</strong>
        </div>
        <div className="gpi-public-bottom-visit">
          <span>Your first visit</span>
          <strong>{active?.first_visit_label || "Meet the team and see if it fits."}</strong>
          {discoveryEnabled && active && (
            <div className="gpi-public-readiness">
              {(active.readiness_labels || []).length
                ? active.readiness_labels.map((label) => <em key={label}>{label}</em>)
                : <em>{active.readiness_fallback_note || "Host will confirm fit details."}</em>}
            </div>
          )}
        </div>
        <div className="gpi-public-bottom-action">
          <button type="button" disabled={!active} onClick={()=> previewMode ? showToast?.("This opportunity is a preview. Published opportunities will accept interest.", "info") : setInterestItem(active)}>I'm interested <span aria-hidden="true">→</span></button>
          <small>Sending interest doesn't commit you to attend.</small>
        </div>
      </section>
      )}

      {detailItem && (
        <div className="gpi-public-modal gpi-mobile-sheet-polish" role="dialog" aria-modal="true" aria-label={(detailItem.title || "Opportunity") + " details"}>
          <div className={`gpi-public-modal-card gpi-detail-card${detailReceivesRecurringTreatment ? " gpi-recurring-detail" : ""}`}>
            <button type="button" className="gpi-public-modal-close" onClick={()=>setDetailItem(null)} aria-label="Close">&times;</button>
            {detailReceivesRecurringTreatment ? <>
              <div className="gpi-recurring-hero">
                <div>
                  <div className="gpi-public-modal-eyebrow">{gpiHostTitleCase(detailItem.primary_category || detailItem.goal || "Connect")} · {detailRecurringLabel}</div>
                  <h2>{detailItem.title}</h2>
                  {detailHeroSummary ? <p>{detailHeroSummary}</p> : null}
                </div>
                <div className="gpi-recurring-next">
                  <span>Next gathering</span>
                  <strong>{detailNextOccurrence ? gpiFormatOccurrence(detailNextOccurrence) : `${detailItem.day_label} · ${detailItem.time_label}`}</strong>
                  <em>{detailRecurringLabel}</em>
                </div>
              </div>
              {detailOpportunityFacts.length > 0 && <div className="gpi-recurring-facts">{detailOpportunityFacts.map((fact) => <span key={fact}>✓ {fact}</span>)}</div>}
              <section className="gpi-recurring-section gpi-recurring-dates" aria-live="polite">
                <div className="gpi-recurring-section-head"><span>{detailHasUpcomingSeries ? "Upcoming gatherings" : "Next gathering"}</span><strong>{detailHasUpcomingSeries ? "Choose the date that works for you." : "The current eligible date."}</strong></div>
                {detailOccurrencesLoading ? <div className="gpi-recurring-loading">Loading current gathering dates…</div> : detailOccurrencesError ? <div className="gpi-recurring-error"><span>{detailOccurrencesError}</span><button type="button" onClick={() => setDetailOccurrencesReload((value) => value + 1)}>Retry</button></div> : detailOccurrences.length ? <div className="gpi-recurring-date-list">{detailOccurrences.slice(0, detailHasUpcomingSeries ? 4 : 1).map((occurrence, index) => <div key={occurrence.id || occurrence.starts_at}><span>{index === 0 ? "Next" : "Then"}</span><strong>{gpiFormatOccurrence(occurrence)}</strong></div>)}</div> : <div className="gpi-recurring-loading">The host is refreshing the next eligible date.</div>}
              </section>
              <div className="gpi-recurring-body-grid">
                <section className="gpi-recurring-section"><div className="gpi-recurring-section-head"><span>About this gathering</span><strong>An ongoing opportunity hosted through FaithBid.</strong></div>{detailDescriptionText ? <p>{detailDescriptionText}</p> : null}<div className="gpi-recurring-mini-grid">{detailRecurringLabel ? <div><span>Schedule</span><strong>{detailRecurringLabel}</strong></div> : null}{detailItem.distance_label ? <div><span>Near</span><strong>{detailItem.distance_label}</strong></div> : null}{detailCommitmentText ? <div><span>Commitment</span><strong>{detailCommitmentText}</strong></div> : null}</div></section>
                <section className="gpi-recurring-section gpi-recurring-host"><div className="gpi-recurring-section-head"><span>Hosted by</span><strong>{detailItem.organization_name}</strong></div><div className="gpi-recurring-host-badge">FaithBid host</div><p>{detailOrganizationDescription || `This gathering is connected to ${detailItem.organization_name} in ${detailItem.city_label || "the local area"}.`}</p><button type="button" className="gpi-organization-home-link" onClick={() => openOrganizationHome(detailItem)}>View organization <span aria-hidden="true">→</span></button></section>
              </div>
              <div className="gpi-detail-actions"><button type="button" disabled={detailItem.isPreview} onClick={()=>{setInterestItem(detailItem);setDetailItem(null);}}>I'm interested</button><button type="button" onClick={()=>setDetailItem(null)}>Keep exploring</button></div>
            </> : <>
              <div className="gpi-public-modal-eyebrow">{detailItem.kicker}</div>
              <h2>{detailItem.title}</h2>
              {detailDescriptionText ? <div className="gpi-detail-section"><span>What this is</span><p>{detailDescriptionText}</p></div> : null}
              {(detailHeroSummary || detailGoodToKnowText) ? <div className="gpi-detail-highlight-row">{detailHeroSummary ? <div><span>First visit</span><strong>{detailHeroSummary}</strong></div> : null}{detailGoodToKnowText ? <div><span>Good to know</span><strong>{detailGoodToKnowText}</strong></div> : null}</div> : null}
              {detailBasicFacts.length ? <div className="gpi-public-modal-grid">{detailBasicFacts.map((fact) => <div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}</div> : null}
              <div className="gpi-detail-actions"><button type="button" disabled={detailItem.isPreview} onClick={()=>{setInterestItem(detailItem);setDetailItem(null);}}>I'm interested</button><button type="button" className="gpi-organization-home-link" onClick={() => openOrganizationHome(detailItem)}>View organization</button><button type="button" onClick={()=>setDetailItem(null)}>Keep exploring</button></div>
            </>}
            {detailItem.isPreview && <small>This is a preview opportunity. Published opportunities will accept interest.</small>}
          </div>
        </div>
      )}
      {(organizationHomeLoading || organizationHomeError || publicOrganization) && (
        <div className="gpi-public-modal gpi-mobile-sheet-polish" role="dialog" aria-modal="true" aria-label="Organization home">
          <div className="gpi-public-modal-card gpi-organization-home-card">
            <button type="button" className="gpi-public-modal-close" onClick={closeOrganizationHome} aria-label="Close">&times;</button>
            {organizationHomeLoading ? <div className="gpi-organization-home-loading"><span/><strong>Opening organization home…</strong></div> : organizationHomeError ? <div className="gpi-organization-home-error"><span>Organization home unavailable</span><strong>{organizationHomeError}</strong><div><button type="button" onClick={() => openOrganizationHome({ organization_id: organizationHomeTargetId })}>Retry</button><button type="button" onClick={closeOrganizationHome}>Close</button></div></div> : <>
              {managesPublicOrganization && !organizationPreviewAsParticipant && <div className="gpi-organization-owner-controls"><div><span>Organization workspace</span><strong>You manage this FaithBid organization.</strong></div><div><button type="button" onClick={() => { closeOrganizationHome(); setHostPortalOpen(true); }}>Manage opportunities</button><button type="button" onClick={() => { closeOrganizationHome(); setHostPortalOpen(true); }}>Post opportunity</button><button type="button" className="secondary" onClick={() => setOrganizationPreviewAsParticipant(true)}>Preview as participant</button></div></div>}
              {managesPublicOrganization && organizationPreviewAsParticipant && <button type="button" className="gpi-organization-exit-preview" onClick={() => setOrganizationPreviewAsParticipant(false)}>Exit participant preview</button>}
              <div className="gpi-organization-home-hero">
                <div><div className="gpi-public-modal-eyebrow">{publicOrganizationIsFixture ? "Test-data preview" : "Verified FaithBid host"}</div><h2>{publicOrganizationName}</h2><p>{publicOrganizationDescription || (publicOrganizationName + " has " + publicOrganizationOpportunities.length + " public " + (publicOrganizationOpportunities.length === 1 ? "opportunity" : "opportunities") + " available through FaithBid.")}</p></div>
                <div className="gpi-organization-home-proof"><span>FaithBid host</span><strong>{publicOrganization?.verified ? "Verified" : "Public"}</strong><em>{publicOrganizationCities.join(" · ") || "Local and virtual opportunities"}</em><button type="button" className="gpi-organization-share-link" onClick={copyOrganizationHomeLink}>Copy organization link</button></div>
              </div>
              {publicOrganizationIsFixture && <div className="gpi-organization-fixture-note">This product preview uses verified QA data. FaithBid is not representing this synthetic host as a real-world organization.</div>}
              <div className="gpi-organization-home-summary"><div><span>Public opportunities</span><strong>{publicOrganizationOpportunities.length}</strong></div><div><span>Service area</span><strong>{publicOrganizationCities.join(", ") || "Available in each opportunity"}</strong></div><div><span>What you see</span><strong>The same public truth participants see</strong></div></div>
              <section className="gpi-organization-home-opportunities"><div><span>Opportunities from this host</span><strong>Choose one to see its current public details.</strong></div>{publicOrganizationOpportunities.length ? <div className="gpi-organization-opportunity-grid">{publicOrganizationOpportunities.map((item) => <button type="button" key={item.id} onClick={() => { closeOrganizationHome(); setDetailItem(item); }}><span>{item.is_recurring ? item.recurrence_label : (item.day_label + " · " + item.time_label)}</span><strong>{item.title}</strong><em>{item.kicker} · {item.city_label}</em><i>View details →</i></button>)}</div> : <div className="gpi-organization-home-empty">This host has no currently eligible public opportunities.</div>}</section>
            </>}
          </div>
        </div>
      )}
      {interestItem && (
        <div className="gpi-public-modal gpi-mobile-sheet-polish" role="dialog" aria-modal="true" aria-label="Send interest">
          <form className="gpi-public-modal-card" onSubmit={submitInterest}>
            <button type="button" className="gpi-public-modal-close" onClick={closeInterestModal} aria-label="Close">&times;</button>
            {interestSentItem ? (
              <div className="gpi-interest-success" role="status" aria-live="polite">
                <div className="gpi-public-modal-eyebrow">{interestSentItem.gpiDeduplicated ? "Request already active" : "Interest sent"}</div>
                <h2>{interestSentItem.gpiDeduplicated ? "You're already connected to this request." : "Interest sent."}</h2>
                <p>{interestSentItem.gpiDeduplicated ? "FaithBid found your existing active request instead of creating a duplicate. Open My requests to continue from its current status." : "Your verified FaithBid account is linked to this request. The organization can handle it in FaithBid, and you can track every next step here."}</p>
                <div className="gpi-interest-success-card">
                  <span>Sent for</span>
                  <strong>{interestSentItem.title}</strong>
                  <em>{interestSentItem.organization_name}</em>
                </div>
                {currentUser?.id && <button type="button" className="gpi-interest-track" onClick={() => { closeInterestModal(); setSeekerPortalOpen(true); }}>Track in My requests <span aria-hidden="true">→</span></button>}
                <button type="button" className={currentUser?.id ? "gpi-interest-keep-exploring" : ""} onClick={closeInterestModal}>Keep exploring <span aria-hidden="true">→</span></button>
              </div>
            ) : (
              <>
                <div className="gpi-public-modal-eyebrow">Send interest</div>
                <h2>{interestItem.title}</h2>
                <p>{currentUser?.id ? "FaithBid will use your verified account email and keep this request in My requests. This does not commit you to attend." : "Sign in to send and track this request securely in FaithBid. The public email-delivery path remains deferred, so FaithBid will not pretend a signed-out request has reached the host."}</p>

                <div className="gpi-public-interest-status" aria-live="polite">
                  {interestPrerequisites.loading && <span>Loading current dates and participation details...</span>}
                  {interestPrerequisites.error && <div className="gpi-public-interest-error"><span>{interestPrerequisites.error}</span><button type="button" onClick={retryInterestPrerequisites}>Retry</button></div>}
                  {interestSubmitError && !interestPrerequisites.loading && <span className="gpi-public-interest-error-text">{interestSubmitError} The current requirements have been refreshed.</span>}
                  {interestSubmissionState.occurrenceUnavailable && <span className="gpi-public-interest-error-text">This opportunity no longer has an available date.</span>}
                </div>

                {!interestPrerequisites.loading && !interestPrerequisites.error && String(interestItem.schedule_type || "").toLowerCase() === "one_time" && selectedOccurrenceId && (
                  <div className="gpi-public-interest-occurrence"><span>When</span><strong>{gpiFormatOccurrence(interestPrerequisites.occurrences.find((item) => item.id === selectedOccurrenceId))}</strong></div>
                )}

                {!interestPrerequisites.loading && !interestPrerequisites.error && String(interestItem.schedule_type || "").toLowerCase() === "recurring" && interestPrerequisites.occurrences.length > 0 && (
                  <label className="gpi-public-interest-select">
                    Choose a date
                    <select required value={selectedOccurrenceId} onChange={(event) => setSelectedOccurrenceId(event.target.value)}>
                      <option value="">Select an upcoming date</option>
                      {interestPrerequisites.occurrences.map((occurrence) => <option key={occurrence.id} value={occurrence.id}>{gpiFormatOccurrence(occurrence)}</option>)}
                    </select>
                  </label>
                )}

                {interestPrerequisites.requirements.length > 0 && (
                  <fieldset className="gpi-public-interest-confirmations">
                    <legend>Please confirm</legend>
                    {interestPrerequisites.requirements.map((requirement) => (
                      <label key={requirement.requirement_id}>
                        <input
                          type="checkbox"
                          checked={affirmedRequirementIds.some((id) => String(id) === String(requirement.requirement_id))}
                          onChange={(event) => toggleInterestRequirement(requirement.requirement_id, event.target.checked)}
                        />
                        <span>{requirement.confirmation_prompt}</span>
                      </label>
                    ))}
                  </fieldset>
                )}

                {gpiHasAgeRestriction(interestItem) && (
                  <fieldset className="gpi-public-interest-confirmations">
                    <legend>Age requirement</legend>
                    <label>
                      <input type="checkbox" checked={ageRangeAffirmed} onChange={(event) => setAgeRangeAffirmed(event.target.checked)} />
                      <span>{gpiAgeAffirmationLabel(interestItem)}</span>
                    </label>
                  </fieldset>
                )}
                {currentUser?.id ? <label className="gpi-public-email">
                  FaithBid email
                  <input type="email" required readOnly value={interestEmail} placeholder="you@example.com" />
                  <small>Your verified FaithBid account email is used so this request can be tracked securely in My requests.</small>
                </label> : <div className="gpi-public-email gpi-interest-signin-note">
                  <span>FaithBid account required</span>
                  <strong>Sign in once, then FaithBid will reopen this opportunity with fresh dates and requirements.</strong>
                  <small>No request is sent until your signed-in account is verified.</small>
                </div>}
                <button type="submit" disabled={submitting || (!!currentUser?.id && !interestSubmissionState.ready)}>{submitting ? "Sending..." : currentUser?.id ? "Send interest" : "Sign in to send interest"}</button>
              </>
            )}
          </form>
        </div>
      )}

      <GpiStage2PreviewDeck />

      <GpiHostPortal
        open={hostPortalOpen}
        onClose={() => setHostPortalOpen(false)}
        currentUser={currentUser}
        cityAreas={cityAreas}
        showToast={showToast}
        onPreviewOrganization={(organizationId) => {
          setHostPortalOpen(false);
          openOrganizationHome({ organization_id: organizationId });
        }}
      />
      <GpiSeekerPortal
        open={seekerPortalOpen}
        onClose={() => setSeekerPortalOpen(false)}
        currentUser={currentUser}
        showToast={showToast}
      />
    </div>
  );
}

function GetPluggedInDiscoveryPage(props) {
  // Stage 1 intentionally delegates to the current production page. Later
  // discovery stages should be built in this enabled branch so setting
  // gpiDiscoveryEnabled=false keeps the live/off path unchanged.
  return <GetPluggedInPage {...props} discoveryEnabled />;
}

function GetPluggedInRoute(props) {
  return gpiDiscoveryEnabled
    ? <GetPluggedInDiscoveryPage {...props} />
    : <GetPluggedInPage {...props} />;
}

export default function GetPluggedInScreenRoute({ dependencies, ...props }) {
  applyGetPluggedInDependencies(dependencies);
  return <GetPluggedInRoute {...props} />;
}
