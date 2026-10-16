-- ==============================================================================
-- GJTF Foundation Database Migration: Update Official Contact & Social Details
-- Date: 2026-10-16
-- Description:
--   Updates site_settings and payment_settings to the new unified contact details:
--   - Address: Office # 46-47, First Floor, New Liberty Tower, Model Town Link Road, Lahore
--   - Telephone: 04235236622 (tel:+924235236622)
--   - Mobile / WhatsApp: 03033934771 (tel:+923033934771)
--   - Email: jhuggitaleemiproject@gmail.com
--   - Socials: Instagram, TikTok, YouTube, Facebook (@jhuggitaleemiproject)
--   - Removed: 0800-00823 toll-free, Civic Centre / Johar Town address, LinkedIn
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Forward Migration: Update site_settings
-- ------------------------------------------------------------------------------
UPDATE site_settings
SET
  head_office_address = 'Office # 46-47, First Floor, New Liberty Tower, Model Town Link Road, Lahore',
  telephone = '04235236622',
  mobile = '03033934771',
  whatsapp = '03033934771',
  email = 'jhuggitaleemiproject@gmail.com',
  secondary_email = 'jhuggitaleemiproject@gmail.com',
  toll_free = '',
  facebook_url = 'https://www.facebook.com/jhuggitaleemiproject',
  instagram_url = 'https://www.instagram.com/jhuggitaleemiproject',
  youtube_url = 'https://www.youtube.com/@jhuggitaleemiproject',
  tiktok_url = 'https://www.tiktok.com/@jhuggitaleemiproject',
  linkedin_url = '',
  updated_at = NOW()
WHERE id = 'default';

-- If site_settings does not exist, insert it:
INSERT INTO site_settings (
  id,
  head_office_address,
  telephone,
  mobile,
  whatsapp,
  email,
  secondary_email,
  toll_free,
  facebook_url,
  instagram_url,
  youtube_url,
  tiktok_url,
  linkedin_url,
  updated_at
) VALUES (
  'default',
  'Office # 46-47, First Floor, New Liberty Tower, Model Town Link Road, Lahore',
  '04235236622',
  '03033934771',
  '03033934771',
  'jhuggitaleemiproject@gmail.com',
  'jhuggitaleemiproject@gmail.com',
  '',
  'https://www.facebook.com/jhuggitaleemiproject',
  'https://www.instagram.com/jhuggitaleemiproject',
  'https://www.youtube.com/@jhuggitaleemiproject',
  'https://www.tiktok.com/@jhuggitaleemiproject',
  '',
  NOW()
) ON DUPLICATE KEY UPDATE
  head_office_address = VALUES(head_office_address),
  telephone = VALUES(telephone),
  mobile = VALUES(mobile),
  whatsapp = VALUES(whatsapp),
  email = VALUES(email),
  secondary_email = VALUES(secondary_email),
  toll_free = VALUES(toll_free),
  facebook_url = VALUES(facebook_url),
  instagram_url = VALUES(instagram_url),
  youtube_url = VALUES(youtube_url),
  tiktok_url = VALUES(tiktok_url),
  linkedin_url = VALUES(linkedin_url),
  updated_at = NOW();

-- ------------------------------------------------------------------------------
-- 2. Forward Migration: Update payment_settings
-- ------------------------------------------------------------------------------
UPDATE payment_settings
SET
  doorstep_phone = '04235236622',
  jazzcash_number = '03033934771',
  updated_at = NOW()
WHERE id = 'default';

-- ------------------------------------------------------------------------------
-- 3. Forward Migration: Update smtp_settings (Hostinger SMTP SSL)
-- ------------------------------------------------------------------------------
INSERT INTO smtp_settings (
  id, host, port, secure, user_name, password, from_name, from_email, updated_at
) VALUES (
  'default', 'smtp.hostinger.com', 465, 1, 'admin@gjtfoundation.com', '4hZN6j9Nr+', 'Ghais Jhuggi Taleem Foundation', 'admin@gjtfoundation.com', NOW()
) ON DUPLICATE KEY UPDATE
  host = VALUES(host),
  port = VALUES(port),
  secure = VALUES(secure),
  user_name = VALUES(user_name),
  password = VALUES(password),
  from_name = VALUES(from_name),
  from_email = VALUES(from_email),
  updated_at = NOW();

-- ==============================================================================
-- ROLLBACK SCRIPT (In case reversal is required)
-- ==============================================================================
/*
UPDATE site_settings
SET
  head_office_address = '23-Civic Centre, Johar Town, Lahore',
  telephone = '042-35236622',
  mobile = '+92 303 3934771',
  whatsapp = '+92 303 3934771',
  email = 'jhuggitaleemiproject@gmail.com',
  secondary_email = 'gjtfoundation1@gmail.com',
  toll_free = '0800-00823',
  facebook_url = 'https://facebook.com/gjtfoundation',
  instagram_url = 'https://instagram.com/gjtfoundation',
  youtube_url = 'https://youtube.com/@gjtfoundation',
  tiktok_url = 'https://tiktok.com/@gjtfoundation',
  linkedin_url = 'https://linkedin.com/company/gjtfoundation',
  updated_at = NOW()
WHERE id = 'default';

UPDATE payment_settings
SET
  doorstep_phone = '0800-00823',
  jazzcash_number = '0303-3934771',
  updated_at = NOW()
WHERE id = 'default';
*/
