-- 0012_rates: rates and ratings with their sources (task A10).
--
-- Additive only: two new tables and a seed generated from the data files
-- (scripts/content/generate-seed.mjs): 6 shore excursion prices (source note
-- "Cruiseship Proposal 2024", no date), 8 vehicle daily rates (no source) and
-- 16 tour ratings (no source), every one a draft. The database refuses a
-- published row without its source, so nothing here can appear on the site
-- until a source and date are recorded. Nothing reads these tables yet, and
-- they never feed `priceCents` or the dormant booking engine.

create table if not exists rates (
  id text primary key,
  subject_collection text not null,
  subject_id text not null references collection_items (id) on delete cascade,
  label text not null,
  currency text not null,
  amount_minor bigint not null,
  unit text not null,
  source_note text not null default '',
  source_date date,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  created_by text,
  updated_at timestamptz not null default now(),
  updated_by text,
  published_at timestamptz,
  archived_at timestamptz,
  constraint rates_currency_check check (currency in ('USD', 'SLE')),
  constraint rates_amount_check check (amount_minor >= 0 and amount_minor <= 99999999999),
  constraint rates_unit_check check (unit in ('per-person', 'per-day', 'per-group', 'per-transfer', 'per-night')),
  constraint rates_status_check check (status in ('draft', 'published', 'archived')),
  constraint rates_published_needs_source check (status <> 'published' or (length(trim(source_note)) > 0 and source_date is not null))
);

create index if not exists rates_subject_idx on rates (subject_id, status);

create table if not exists ratings (
  id text primary key,
  tour_id text not null references collection_items (id) on delete cascade,
  value_tenths integer not null,
  review_count integer not null,
  source_url text not null default '',
  source_date date,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  created_by text,
  updated_at timestamptz not null default now(),
  updated_by text,
  published_at timestamptz,
  archived_at timestamptz,
  constraint ratings_value_check check (value_tenths between 0 and 50),
  constraint ratings_count_check check (review_count >= 0),
  constraint ratings_status_check check (status in ('draft', 'published', 'archived')),
  constraint ratings_published_needs_source check (status <> 'published' or (source_url like 'https://%' and source_date is not null))
);

create index if not exists ratings_tour_idx on ratings (tour_id, status);

-- BEGIN GENERATED RATES SEED (scripts/content/generate-seed.mjs; do not edit by hand)
insert into rates (id, subject_collection, subject_id, label, currency, amount_minor, unit, source_note, status) values
  ('fd591455-119d-5ed3-b5da-92f96d02487d', 'cruise-excursions', '0ce19759-e47b-5c96-b03f-c801e3e5ef94', 'Per person', 'USD', 6000, 'per-person', 'Cruiseship Proposal 2024', 'draft'),
  ('ede30726-5186-5198-b2f0-68cb130feaee', 'cruise-excursions', '25869bea-2f8f-53b0-b4fc-50de3109223e', 'Per person', 'USD', 7500, 'per-person', 'Cruiseship Proposal 2024', 'draft'),
  ('bbeb7322-ef2b-579b-ad12-f9c535e2c577', 'cruise-excursions', 'a36586e1-efad-5eb4-ad1e-eddb18c5a020', 'Per person', 'USD', 6500, 'per-person', 'Cruiseship Proposal 2024', 'draft'),
  ('09c22a52-4d6b-54ac-9de8-00969660ab00', 'cruise-excursions', 'e6b93e9e-1fc9-5ee2-a609-e808175890b3', 'Per person', 'USD', 9000, 'per-person', 'Cruiseship Proposal 2024', 'draft'),
  ('ea91a865-f8d3-5fe6-95c6-3aaf3dd88415', 'cruise-excursions', '1cc9fd02-0418-5923-b561-08dea64f52e9', 'Per person', 'USD', 8500, 'per-person', 'Cruiseship Proposal 2024', 'draft'),
  ('08071b68-2d30-551d-97eb-43efe21d3df3', 'cruise-excursions', '04395129-53b9-5181-a9dc-9f5f0aabba5a', 'Per person', 'USD', 6500, 'per-person', 'Cruiseship Proposal 2024', 'draft'),
  ('30f56ab2-c373-5a74-a123-63660371b120', 'vehicles', '4ae19d19-e8d7-5a06-9bcd-2a08499b63ed', 'Daily rate', 'USD', 3500, 'per-day', '', 'draft'),
  ('64efd6e3-b809-5ff1-a70f-3d7b4926f27f', 'vehicles', '1bbc48c6-524d-59bb-9f76-e422dd2957bf', 'Daily rate', 'USD', 5500, 'per-day', '', 'draft'),
  ('ca9dd08e-0ec7-5ad9-bbac-a9194575b3cf', 'vehicles', 'a4ec645b-eaf2-5d45-af2e-934d109f9a43', 'Daily rate', 'USD', 8000, 'per-day', '', 'draft'),
  ('25f374f9-88f3-5ebf-b417-f6a7671d707c', 'vehicles', '2d168007-8625-506b-84c3-a6c48c2b6cf4', 'Daily rate', 'USD', 12000, 'per-day', '', 'draft'),
  ('51b72474-18e6-5a6d-a59b-4bc5fc11370c', 'vehicles', 'bbd4e653-9b89-5030-a9a8-70042fbe1d0b', 'Daily rate', 'USD', 10000, 'per-day', '', 'draft'),
  ('1624bf39-97b9-5483-b767-7b5d3e81ecda', 'vehicles', 'e64dda92-ac9c-5be7-a417-1fa5f1316e40', 'Daily rate', 'USD', 15000, 'per-day', '', 'draft'),
  ('1dc95dbb-25d1-5851-9236-08ed117ea958', 'vehicles', 'a936619a-58a6-59e9-a3d3-f0ef6cc88063', 'Daily rate', 'USD', 18000, 'per-day', '', 'draft'),
  ('6d44fd07-4be7-5d3f-9a85-25d4bc08cb77', 'vehicles', '50329def-57fc-5f83-aa54-8463bd5e878d', 'Daily rate', 'USD', 35000, 'per-day', '', 'draft')
on conflict (id) do nothing;
insert into ratings (id, tour_id, value_tenths, review_count, status) values
  ('cba1c878-4da0-5c06-ae83-027ed91a2df2', 'c7155fb7-52a0-5bcb-9ca5-92a938d05708', 41, 25, 'draft'),
  ('5db73b5d-e937-5e4a-8a8f-a24af5d9c91c', '9e5d1df2-d99e-5be7-b07e-6dbeeb8f1a1b', 41, 25, 'draft'),
  ('6360f090-bda3-5bc9-90a7-8699cfc2f9b9', 'b7fe41f1-5055-5ff9-a839-d3f1d7994605', 50, 17, 'draft'),
  ('3b887ee7-4f76-5725-9e0d-074794a2d475', 'b92b4e31-6245-5b74-a83e-74d10f85ee71', 45, 22, 'draft'),
  ('5e46df1b-f190-5cdf-981a-eb1bd442b09a', '95e6753c-ba43-5f12-8a26-a2da6398e0bb', 41, 21, 'draft'),
  ('68b81fb0-9561-51a6-9474-80c8410c831a', 'fc81a8f4-b797-5e4c-96b6-fb7ee8a196a4', 41, 25, 'draft'),
  ('6e109b2b-646b-58a7-acdf-9f61334bce24', '735c4f0a-5820-5ad7-96bd-b7313ffc938c', 41, 10, 'draft'),
  ('bd703f84-28b1-56bd-b1ba-73e8c8682237', 'b5a6ff47-4bed-5705-ad14-3da9d2442acf', 50, 17, 'draft'),
  ('6fed8b6b-6adc-5e1c-afc3-fee15933d5bb', '3a43b431-a889-56b6-af85-c32d79afb59b', 45, 22, 'draft'),
  ('759b48e6-b798-5fb8-9237-fbf1917936cd', '8b08d2d5-69c9-5069-a0c1-ddf22879ceb8', 41, 21, 'draft'),
  ('18d2f672-9386-5065-961d-cf6c77526dfa', 'e9328849-208d-5d2f-a7f5-264164769093', 41, 25, 'draft'),
  ('721a01cd-0495-545c-9505-7bcda5ed2469', 'f04011cb-14fa-5938-a636-1c0b18b4eda4', 50, 17, 'draft'),
  ('9a788393-262e-5003-81f7-bc80bfadffaf', '36c223fd-340c-501c-b161-585b303f6ec2', 45, 22, 'draft'),
  ('ad2a7120-59f5-51fd-81b5-f27c03c488ab', 'e25e365c-70f0-5250-bdc4-63480fa1ad13', 41, 25, 'draft'),
  ('fdad820c-0edd-5500-9109-73078312546b', '00f383ff-3370-5f52-a89d-a40e520b8cfe', 50, 17, 'draft'),
  ('8b1c759f-5f56-55fc-8325-edae72d8c044', '98d29974-b189-5c79-b812-db9bf92eb7d1', 45, 22, 'draft')
on conflict (id) do nothing;
-- END GENERATED RATES SEED
