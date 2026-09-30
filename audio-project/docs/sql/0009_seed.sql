-- =============================================================================
-- 0009 — Données de référence
-- =============================================================================

insert into geographic_zones (level, code, name_fr, name_ar, path) values
  ('country','TN','Tunisie','تونس','tn');

insert into geographic_zones (parent_id, level, code, name_fr, name_ar, path)
select z.id, 'governorate', v.code, v.fr, v.ar, ('tn.' || v.slug)::ltree
from geographic_zones z, (values
  ('TN-11','Tunis','تونس','tunis'),
  ('TN-12','Ariana','أريانة','ariana'),
  ('TN-13','Ben Arous','بن عروس','ben_arous'),
  ('TN-14','Manouba','منوبة','manouba'),
  ('TN-21','Nabeul','نابل','nabeul'),
  ('TN-22','Zaghouan','زغوان','zaghouan'),
  ('TN-23','Bizerte','بنزرت','bizerte'),
  ('TN-31','Beja','باجة','beja'),
  ('TN-32','Jendouba','جندوبة','jendouba'),
  ('TN-33','Le Kef','الكاف','kef'),
  ('TN-34','Siliana','سليانة','siliana'),
  ('TN-41','Kairouan','القيروان','kairouan'),
  ('TN-42','Kasserine','القصرين','kasserine'),
  ('TN-43','Sidi Bouzid','سيدي بوزيد','sidi_bouzid'),
  ('TN-51','Sousse','سوسة','sousse'),
  ('TN-52','Monastir','المنستير','monastir'),
  ('TN-53','Mahdia','المهدية','mahdia'),
  ('TN-61','Sfax','صفاقس','sfax'),
  ('TN-71','Gafsa','قفصة','gafsa'),
  ('TN-72','Tozeur','توزر','tozeur'),
  ('TN-73','Kebili','قبلي','kebili'),
  ('TN-81','Gabes','قابس','gabes'),
  ('TN-82','Medenine','مدنين','medenine'),
  ('TN-83','Tataouine','تطاوين','tataouine')
) as v(code, fr, ar, slug)
where z.code = 'TN';

insert into telecom_operators (code, name) values
  ('TT','Tunisie Telecom'),
  ('ORANGE','Orange Tunisie'),
  ('OOREDOO','Ooredoo Tunisie');

-- Barème initial. DÉRIVÉ DE L'ÉCONOMIE UNITAIRE, PAS DE L'INTUITION (cf. docs/16).
-- Contrainte : cout_par_point <= 0.5 * revenu_par_point, avec
--   revenu_par_point = (CPM_en_TND) / points_par_impression   [en millimes]
-- À CPM = 5 TND et 1 point/impression : cout max = 2,5 millimes/point,
-- soit ~0,83 Mo par point à 3 millimes/Mo de coût de gros.
--
-- ⚠ LE CPM DOIT ÊTRE VALIDÉ AUPRÈS D'ANNONCEURS RÉELS AVANT LE LANCEMENT.
--   À CPM = 2 TND ce barème est déjà déficitaire (-19 % de marge).
--   Le bonus d'appel est DÉSACTIVÉ par défaut (0 point) : c'est le poste
--   le moins défendable économiquement et le moins mesurable (nul sur iOS).
insert into point_rules (
  version, effective_from, points_per_impression, points_per_call_bonus,
  min_call_seconds_for_bonus, monthly_bonus_points, welcome_bonus_points,
  referral_bonus_points, daily_impression_cap, freq_cap_minutes,
  daily_call_bonus_cap, points_validity_months)
values (1, now(), 1, 0, 30, 10, 20, 30, 6, 10, 0, 12);

-- Version de bundle initiale par zone
insert into ad_bundle_versions (zone_id, version)
select id, to_char(now(),'YYYYMMDDHH24MISS') from geographic_zones
where level = 'governorate';

-- RBAC ----------------------------------------------------------------------
insert into role_permissions (role, permission) values
  -- admin : tout
  ('admin','customers:read'),('admin','customers:write'),
  ('admin','companies:read'),('admin','companies:write'),
  ('admin','campaigns:read'),('admin','campaigns:write'),('admin','campaigns:approve'),
  ('admin','ads:read'),('admin','ads:write'),('admin','ads:approve'),
  ('admin','zones:read'),('admin','zones:write'),
  ('admin','wallets:read'),('admin','wallets:adjust'),
  ('admin','redemptions:read'),('admin','redemptions:write'),
  ('admin','rewards:read'),('admin','rewards:write'),
  ('admin','fraud:read'),('admin','fraud:write'),
  ('admin','analytics:read'),('admin','audit:read'),
  ('admin','billing:read'),('admin','billing:write'),
  ('admin','employees:read'),('admin','employees:write'),
  ('admin','settings:read'),('admin','settings:write'),
  -- manager : opérationnel + validation, pas de gestion des employés/réglages
  ('manager','customers:read'),('manager','customers:write'),
  ('manager','companies:read'),('manager','companies:write'),
  ('manager','campaigns:read'),('manager','campaigns:write'),('manager','campaigns:approve'),
  ('manager','ads:read'),('manager','ads:write'),('manager','ads:approve'),
  ('manager','zones:read'),
  ('manager','wallets:read'),('manager','wallets:adjust'),
  ('manager','redemptions:read'),('manager','redemptions:write'),
  ('manager','rewards:read'),('manager','rewards:write'),
  ('manager','fraud:read'),('manager','fraud:write'),
  ('manager','analytics:read'),('manager','audit:read'),
  ('manager','billing:read'),
  -- operator : saisie, AUCUNE validation, AUCUN ajustement de points
  ('operator','customers:read'),
  ('operator','companies:read'),('operator','companies:write'),
  ('operator','campaigns:read'),('operator','campaigns:write'),
  ('operator','ads:read'),('operator','ads:write'),
  ('operator','zones:read'),
  ('operator','redemptions:read'),('operator','redemptions:write'),
  ('operator','rewards:read'),
  ('operator','analytics:read'),
  -- analyst : lecture seule
  ('analyst','customers:read'),('analyst','companies:read'),
  ('analyst','campaigns:read'),('analyst','ads:read'),('analyst','zones:read'),
  ('analyst','wallets:read'),('analyst','redemptions:read'),('analyst','rewards:read'),
  ('analyst','fraud:read'),('analyst','analytics:read'),('analyst','billing:read');

-- Réglages système ----------------------------------------------------------
insert into system_settings (key, value, description) values
  ('redemption', '{"min_account_age_hours":72,"max_open":1,"require_verified_msisdn":true}',
   'Règles de conversion'),
  ('sync', '{"max_batch":100,"max_clock_skew_hours":24,"bundle_ttl_days":7,"stale_grace_hours":48}',
   'Paramètres de synchronisation'),
  ('fraud', '{"max_installs_per_phone_hash":3,"max_accounts_per_install":1,
              "impression_rate_zscore":3.5,"auto_limit_score":70,"auto_suspend_score":90}',
   'Seuils anti-fraude'),
  ('retention', '{"impressions_days":90,"calls_days":180,"sync_events_days":30,
                  "audio_archive_days":90,"audio_purge_days":180,"msisdn_enc_days":90}',
   'Politique de rétention'),
  ('features', '{"ios_credit_enabled":true,"call_bonus_enabled":true,
                 "precise_location":false,"radius_targeting":false}',
   'Feature flags');

-- Catalogue. La valeur en Mo est DÉRIVÉE de la contrainte ci-dessus, pas choisie.
-- cost_millimes = VOTRE coût d'achat en gros (hypothèse : 3 millimes / Mo).
-- Avec 190 points/mois gagnables : ~142 Mo/mois de récompense soutenable.
--
-- ⚠ Écart avec l'intuition initiale du brief (100 pts -> 500 Mo, 500 pts -> 3 Go) :
--   ce barème-là représente ~10x la récompense soutenable au volume in-app (ALT-D).
--   Il ne devient tenable qu'en captant TOUS les appels (ALT-A / ALT-E, ~40 pubs/jour)
--   ET avec un CPM >= 5 TND. Voir le tableau de sensibilité dans docs/16.
insert into data_packages (operator_id, name_fr, name_ar, data_mb, points_cost, cost_millimes, sort_order)
select o.id, v.fr, v.ar, v.mb, v.pts, v.cost, v.ord
from telecom_operators o, (values
  ('100 Mo','100 ميغا', 100, 130,  300, 1),
  ('300 Mo','300 ميغا', 300, 380,  900, 2),
  ('1 Go','1 جيغا',    1024,1250, 3072, 3)
) as v(fr, ar, mb, pts, cost, ord)
where o.is_active;
