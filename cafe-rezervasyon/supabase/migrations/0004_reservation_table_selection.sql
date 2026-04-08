alter table public.reservations
add column if not exists table_id int,
add column if not exists area_type text check (area_type in ('smoking', 'non-smoking'));
