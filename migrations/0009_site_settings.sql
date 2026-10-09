-- 0009_site_settings: site settings with draft, published versions and history (task A7).
--
-- Additive only: two new tables and a seed generated from the code's own
-- constants (scripts/content/generate-seed.mjs), so the published settings
-- start identical to what the site shows today. In this milestone only the
-- enquiry notification reads them (the published recipient list, falling back
-- to ENQUIRY_TEAM_EMAILS); the pages read them from task B5.

create table if not exists site_settings (
  id text primary key,
  draft jsonb not null,
  -- Raised on every save; a save or publish with an older rev is refused.
  rev integer not null default 1,
  published_version_id text,
  updated_at timestamptz not null default now(),
  updated_by text,
  constraint site_settings_single_row check (id = 'site')
);

create table if not exists site_settings_versions (
  id text primary key,
  settings_id text not null references site_settings (id),
  version integer not null,
  data jsonb not null,
  published_at timestamptz not null default now(),
  published_by text,
  restored_from text,
  constraint site_settings_versions_unique unique (settings_id, version)
);

-- BEGIN GENERATED SITE SETTINGS SEED (scripts/content/generate-seed.mjs; do not edit by hand)
insert into site_settings (id, draft, rev, published_version_id)
values ('site', '{"business":{"name":"Tourism Is Life","legalName":"Tourism Is Life Tours","tagline":"Discover the Heart of West Africa","description":"Sierra Leone destination management company for tours, cruise shore excursions, and travel services across Sierra Leone, Guinea, Liberia, and West Africa.","website":"https://tourismislife.com"},"contact":{"phones":[{"label":"Phone","number":"+232 76 568 335","whatsapp":true,"sms":true},{"label":"Mobile","number":"+232 79 616 668","whatsapp":true,"sms":true}],"email":"info@tourismislife.com","address":"State Avenue 232, Freetown, Sierra Leone","emergencyNote":"24/7 emergency phone services"},"social":[{"platform":"youtube","label":"YouTube","url":"https://youtube.com/@tourismislifetours7260?si=n9DPO2r-pFJwWtjn","handle":"@tourismislifetours7260","enabled":true},{"platform":"facebook","label":"Facebook","url":"https://www.facebook.com/share/1EUPY5JvRi/","handle":"","enabled":true},{"platform":"x","label":"X","url":"https://x.com/tourismislife","handle":"@tourismislife","enabled":true},{"platform":"instagram","label":"Instagram","url":"https://www.instagram.com/tourismislifetours","handle":"@tourismislifetours","enabled":true},{"platform":"tiktok","label":"TikTok","url":"","handle":"","enabled":false}],"seo":{"defaultDescription":"Tourism Is Life is a Sierra Leone destination management company for tours, cruise handling, and West Africa travel.","shareImage":"/images/misc/og-image.jpg"},"enquiryRecipients":["info@tourismislife.com","george@baobabadventure.co.uk"],"interface":{"skipLink":"Skip to content","notFoundKicker":"404","notFoundTitle":"This page is not on the map","notFoundBody":"Try Destinations, Tours, or the home page.","errorTitle":"Something went wrong","errorFallback":"An unexpected error occurred. Try reloading the page."},"documents":{"sustainabilityPolicyUrl":null}}'::jsonb, 1, 'ssv_seed')
on conflict (id) do nothing;
insert into site_settings_versions (id, settings_id, version, data, published_by)
values ('ssv_seed', 'site', 1, '{"business":{"name":"Tourism Is Life","legalName":"Tourism Is Life Tours","tagline":"Discover the Heart of West Africa","description":"Sierra Leone destination management company for tours, cruise shore excursions, and travel services across Sierra Leone, Guinea, Liberia, and West Africa.","website":"https://tourismislife.com"},"contact":{"phones":[{"label":"Phone","number":"+232 76 568 335","whatsapp":true,"sms":true},{"label":"Mobile","number":"+232 79 616 668","whatsapp":true,"sms":true}],"email":"info@tourismislife.com","address":"State Avenue 232, Freetown, Sierra Leone","emergencyNote":"24/7 emergency phone services"},"social":[{"platform":"youtube","label":"YouTube","url":"https://youtube.com/@tourismislifetours7260?si=n9DPO2r-pFJwWtjn","handle":"@tourismislifetours7260","enabled":true},{"platform":"facebook","label":"Facebook","url":"https://www.facebook.com/share/1EUPY5JvRi/","handle":"","enabled":true},{"platform":"x","label":"X","url":"https://x.com/tourismislife","handle":"@tourismislife","enabled":true},{"platform":"instagram","label":"Instagram","url":"https://www.instagram.com/tourismislifetours","handle":"@tourismislifetours","enabled":true},{"platform":"tiktok","label":"TikTok","url":"","handle":"","enabled":false}],"seo":{"defaultDescription":"Tourism Is Life is a Sierra Leone destination management company for tours, cruise handling, and West Africa travel.","shareImage":"/images/misc/og-image.jpg"},"enquiryRecipients":["info@tourismislife.com","george@baobabadventure.co.uk"],"interface":{"skipLink":"Skip to content","notFoundKicker":"404","notFoundTitle":"This page is not on the map","notFoundBody":"Try Destinations, Tours, or the home page.","errorTitle":"Something went wrong","errorFallback":"An unexpected error occurred. Try reloading the page."},"documents":{"sustainabilityPolicyUrl":null}}'::jsonb, null)
on conflict (id) do nothing;
-- END GENERATED SITE SETTINGS SEED
