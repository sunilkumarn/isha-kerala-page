-- Backfill all existing venues.slug from the associated city name.
-- Rule matches app `slugify()`:
-- - lowercase
-- - any non [a-z0-9] -> hyphen
-- - trim leading/trailing hyphens
--
-- Assumption: cities.name are unique (so resulting slugs are unique).
-- If any venue has a NULL city_id (or missing city row), its slug will be left unchanged.

begin;

-- Ensure column exists (safe if already present)
alter table venues add column if not exists slug text;

-- Update ALL venues that have an associated city
update venues v
set slug =
  nullif(
    regexp_replace(
      regexp_replace(lower(c.name), '[^a-z0-9]+', '-', 'g'),
      '(^-|-$)',
      '',
      'g'
    ),
    ''
  )
from cities c
where c.id = v.city_id;

commit;

