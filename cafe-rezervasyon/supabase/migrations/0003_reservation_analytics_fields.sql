alter table public.reservations
add column if not exists selected_drink text,
add column if not exists district text,
add column if not exists occupancy_snapshot int check (occupancy_snapshot >= 0 and occupancy_snapshot <= 100);
