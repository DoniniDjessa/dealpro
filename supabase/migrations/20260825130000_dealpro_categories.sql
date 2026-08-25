-- Remap legacy DealPro categories into Immobilier / Résidences / Terrains / Auto / Opportunités.

update public.dealpro_offers
set category = case
  when category = 'automobile' then 'auto'
  when category in ('agriculture', 'btp', 'industrie', 'commerce', 'b2b') then 'opportunite'
  else category
end
where category in ('automobile', 'agriculture', 'btp', 'industrie', 'commerce', 'b2b');

update public.dealpro_demands
set category = case
  when category = 'automobile' then 'auto'
  when category in ('agriculture', 'btp', 'industrie', 'commerce', 'b2b') then 'opportunite'
  else category
end
where category in ('automobile', 'agriculture', 'btp', 'industrie', 'commerce', 'b2b');
