-- Mark Rise Wellness Chiropractic as a practice-first listing.
-- Run this AFTER supabase/migrations/20261113000000_practice_first_listings.sql
-- is applied on production (project gddapefwrmucimpdhjrz).
--
-- Safe to run more than once. It updates one doctors row by id and adds a
-- slug redirect. It does not enable RLS and does not touch other offices.
--
-- Public URL after this runs:
--   https://www.neurochiro.co/directory/rise-wellness-chiropractic
--   https://www.neurochiro.co/directory/dr-rachel-babbitt  -> 301/308 to the practice URL
--
-- Co-owner photos and bios are the equal pair published on
-- https://www.risewellnesschiro.com/about (Rachel then Annie, the order on
-- their own site). The account row stays Rachel's for login and billing.
-- Annie is removed from team_members so she is not also listed as staff.

begin;

update public.doctors
set
  listing_format = 'practice',
  slug = 'rise-wellness-chiropractic',
  short_intro = 'Pediatric and perinatal chiropractic in Grand Rapids'' East Hills. Two co-owners with equal billing, offering gentle, nervous system focused care for moms, babies, kids, and families.',
  bio = 'Rise Wellness Chiropractic is a pediatric and perinatal practice in Grand Rapids'' East Hills. Co-owners Dr. Rachel Babbitt and Dr. Annie Bishop care for moms during pregnancy and after birth, for babies and kids, and for whole families, with a gentle, nervous system focused approach.',
  team_members = '[]'::jsonb,
  co_owners = $owners$[
    {
      "name": "Dr. Rachel Babbitt",
      "credentials": "DC",
      "role": "Co-owner",
      "photo_url": "https://static.wixstatic.com/media/b82089_ae879e8dc99f44418116c1b0c349c081~mv2.jpg/v1/crop/x_1531,y_0,w_4480,h_4480/fill/w_800,h_800,al_c,q_85,usm_0.66_1.00_0.01/JillDeVriesPhotography-13.jpg",
      "bio": "Dr. Rachel is a pediatric and perinatal focused chiropractor. She graduated from Life University in Marietta, GA in July of 2011 and practiced in Georgia for a few years before returning home to Michigan. She has done postgraduate training in chiropractic pediatrics through the International Chiropractic Pediatric Association (ICPA) including Webster Technique certification and advanced perinatal care. She also has additional training in Spinning Babies, pediatric cranial techniques, and is certified in Pediatric and Family Care by PX and Life University. Dr. Rachel attended Michigan State University for undergraduate studies in Kinesiology. Being the mother of twin girls has fueled her passion for chiropractic care throughout pregnancy and childhood."
    },
    {
      "name": "Dr. Annie Bishop",
      "credentials": "DC, CACCP",
      "role": "Co-owner",
      "photo_url": "https://static.wixstatic.com/media/b82089_84154cc2ae324137a0eef13cdedf26ef~mv2.jpg/v1/crop/x_398,y_0,w_4338,h_4338/fill/w_800,h_800,al_c,q_85,usm_0.66_1.00_0.01/JillDeVriesPhotography-34.jpg",
      "bio": "Dr. Annie is a pediatric and perinatal focused chiropractor and Certified by the Academy Council on Chiropractic Pediatrics (CACCP) with additional post doctorate studies through the ICPA. She is also certified in Webster Technique and Pediatric and Family care by PX and Life University. She graduated from Life University in Marietta, GA in March of 2017 and has been practicing in Grand Rapids since. Dr. Annie attended Aquinas College for undergraduate studies in Mathematics with minor concentrations in Physics and Biology. She is very passionate about working with children and families, and creating a strong community foundation focused on health and wellness. She also enjoys giving back to her community by serving on the East Hills Business Association, Midtown Neighborhood Association, and Uptown Boards."
    }
  ]$owners$::jsonb
where id = 'ec402c77-eb69-4cb6-9ef2-923e4c0903c5'
  and slug in ('dr-rachel-babbitt', 'rise-wellness-chiropractic');

insert into public.slug_redirects (old_slug, new_slug)
values ('dr-rachel-babbitt', 'rise-wellness-chiropractic')
on conflict (old_slug) do update
set new_slug = excluded.new_slug;

commit;
