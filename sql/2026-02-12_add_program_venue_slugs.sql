-- Adds human-readable slugs for public routing.
-- Rules:
-- - lowercase
-- - spaces/any non [a-z0-9] -> hyphens
-- - only letters/numbers/hyphens
-- - trimmed hyphens
--
-- This script also backfills existing rows and resolves duplicates by appending
-- "-2", "-3", ... (still matches allowed characters).

begin;

alter table programs add column if not exists slug text;
alter table venues add column if not exists slug text;

-- Backfill programs.slug
with base as (
  select
    id,
    nullif(
      regexp_replace(
        regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'),
        '(^-|-$)',
        '',
        'g'
      ),
      ''
    ) as base_slug
  from programs
),
ranked as (
  select
    id,
    coalesce(base_slug, cast(id as text)) as base_slug,
    row_number() over (
      partition by coalesce(base_slug, cast(id as text))
      order by cast(id as text)
    ) as rn
  from base
)
update programs p
set slug = case
  when r.rn = 1 then r.base_slug
  else r.base_slug || '-' || r.rn
end
from ranked r
where p.id = r.id
  and (p.slug is null or p.slug = '');

-- Backfill venues.slug
with base as (
  select
    id,
    nullif(
      regexp_replace(
        regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'),
        '(^-|-$)',
        '',
        'g'
      ),
      ''
    ) as base_slug
  from venues
),
ranked as (
  select
    id,
    coalesce(base_slug, cast(id as text)) as base_slug,
    row_number() over (
      partition by coalesce(base_slug, cast(id as text))
      order by cast(id as text)
    ) as rn
  from base
)
update venues v
set slug = case
  when r.rn = 1 then r.base_slug
  else r.base_slug || '-' || r.rn
end
from ranked r
where v.id = r.id
  and (v.slug is null or v.slug = '');

alter table programs alter column slug set not null;
alter table venues alter column slug set not null;

create unique index if not exists programs_slug_unique on programs (slug);
create unique index if not exists venues_slug_unique on venues (slug);

commit;


