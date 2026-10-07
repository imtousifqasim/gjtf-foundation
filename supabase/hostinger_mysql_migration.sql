-- ========================================================
-- Ghais Jhuggi Taleem Foundation (GJTF)
-- Full MySQL / MariaDB Database Migration
-- Target Database: u994156402_gjtff @ Hostinger (srv1676.hstgr.io)
-- Generated: 2026-10-07T14:39:50.451Z
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Profiles Table
DROP TABLE IF EXISTS `profiles`;
CREATE TABLE `profiles` (
  `id` VARCHAR(64) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) DEFAULT NULL,
  `is_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_profiles_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Donations Table
DROP TABLE IF EXISTS `donations`;
CREATE TABLE `donations` (
  `id` VARCHAR(64) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cause` VARCHAR(100) NOT NULL,
  `frequency` VARCHAR(50) NOT NULL,
  `currency` VARCHAR(10) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `donation_type` VARCHAR(50) NOT NULL,
  `country` VARCHAR(100) NOT NULL,
  `donor_name` VARCHAR(255) DEFAULT NULL,
  `donor_email` VARCHAR(255) DEFAULT NULL,
  `donor_phone` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `payment_reference` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_donations_status` (`status`),
  KEY `idx_donations_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Contact Submissions Table
DROP TABLE IF EXISTS `contact_submissions`;
CREATE TABLE `contact_submissions` (
  `id` VARCHAR(64) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'new',
  PRIMARY KEY (`id`),
  KEY `idx_contact_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Volunteer Signups Table
DROP TABLE IF EXISTS `volunteer_signups`;
CREATE TABLE `volunteer_signups` (
  `id` VARCHAR(64) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` VARCHAR(50) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(100) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `university` VARCHAR(255) DEFAULT NULL,
  `message` TEXT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'new',
  PRIMARY KEY (`id`),
  KEY `idx_volunteers_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Schools Table
DROP TABLE IF EXISTS `schools`;
CREATE TABLE `schools` (
  `id` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `campus_type` VARCHAR(100) NOT NULL DEFAULT 'Primary',
  `shift` VARCHAR(100) NOT NULL DEFAULT 'Morning',
  `city` VARCHAR(100) NOT NULL,
  `province` VARCHAR(100) NOT NULL,
  `area_sq_ft` INT NOT NULL DEFAULT 6500,
  `classrooms` INT NOT NULL DEFAULT 6,
  `student_capacity` INT NOT NULL DEFAULT 180,
  `current_students` INT NOT NULL DEFAULT 0,
  `established_year` INT NOT NULL DEFAULT 2017,
  `description` TEXT NOT NULL,
  `facilities` JSON NOT NULL,
  `card_image` TEXT NOT NULL,
  `hero_image` TEXT NOT NULL,
  `gallery_images` JSON NOT NULL,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_schools_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Stories Table
DROP TABLE IF EXISTS `stories`;
CREATE TABLE `stories` (
  `id` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `excerpt` TEXT NOT NULL,
  `body` LONGTEXT NOT NULL,
  `cover_image_url` TEXT NOT NULL,
  `author_name` VARCHAR(255) NOT NULL DEFAULT 'GJTF Team',
  `author_role` VARCHAR(255) NOT NULL DEFAULT 'Communications',
  `published_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_stories_slug` (`slug`),
  KEY `idx_stories_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Newsletter Subscribers Table
DROP TABLE IF EXISTS `newsletter_subscribers`;
CREATE TABLE `newsletter_subscribers` (
  `id` VARCHAR(64) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subscribers_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. SMTP Settings Table
DROP TABLE IF EXISTS `smtp_settings`;
CREATE TABLE `smtp_settings` (
  `id` VARCHAR(50) NOT NULL DEFAULT 'default',
  `host` VARCHAR(255) NOT NULL DEFAULT '',
  `port` INT NOT NULL DEFAULT 587,
  `secure` TINYINT(1) NOT NULL DEFAULT 0,
  `user_name` VARCHAR(255) NOT NULL DEFAULT '',
  `password` VARCHAR(255) NOT NULL DEFAULT '',
  `from_name` VARCHAR(255) NOT NULL DEFAULT 'Ghais Jhuggi Taleem Foundation',
  `from_email` VARCHAR(255) NOT NULL DEFAULT 'info@gjtfoundation.com',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Admin Security Table
DROP TABLE IF EXISTS `admin_security`;
CREATE TABLE `admin_security` (
  `id` VARCHAR(50) NOT NULL DEFAULT 'default',
  `admin_email` VARCHAR(255) NOT NULL DEFAULT 'tousifdev@outlook.com',
  `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `two_factor_secret` VARCHAR(255) DEFAULT '',
  `recovery_codes` JSON DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Site Settings Table
DROP TABLE IF EXISTS `site_settings`;
CREATE TABLE `site_settings` (
  `id` VARCHAR(50) NOT NULL DEFAULT 'default',
  `head_office_address` TEXT NOT NULL,
  `telephone` VARCHAR(100) NOT NULL DEFAULT '04235236622',
  `mobile` VARCHAR(100) NOT NULL DEFAULT '03033934771',
  `whatsapp` VARCHAR(100) NOT NULL DEFAULT '+923033934771',
  `email` VARCHAR(255) NOT NULL DEFAULT 'jhuggitaleemiproject@gmail.com',
  `secondary_email` VARCHAR(255) DEFAULT NULL,
  `contact_person` VARCHAR(255) DEFAULT NULL,
  `toll_free` VARCHAR(100) NOT NULL DEFAULT '0800-45831',
  `facebook_url` VARCHAR(500) NOT NULL DEFAULT 'https://facebook.com/gjtfoundation',
  `instagram_url` VARCHAR(500) NOT NULL DEFAULT 'https://instagram.com/gjtfoundation',
  `youtube_url` VARCHAR(500) NOT NULL DEFAULT 'https://youtube.com/@gjtfoundation',
  `twitter_url` VARCHAR(500) NOT NULL DEFAULT 'https://x.com/gjtfoundation',
  `linkedin_url` VARCHAR(500) NOT NULL DEFAULT 'https://linkedin.com/company/gjtfoundation',
  `tiktok_url` VARCHAR(500) DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auth Users Table (Mirror from Supabase auth.users)
DROP TABLE IF EXISTS `auth_users`;
CREATE TABLE `auth_users` (
  `id` VARCHAR(64) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `encrypted_password` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_auth_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `auth_users` (`id`, `email`, `encrypted_password`, `created_at`) VALUES ('1ccd6e2f-69cc-4214-b4b3-167a80dcf7b3', 'tousifdev@outlook.com', '$2a$10$WGm/EogC6thAaKqWcixFZe5pzVxYXsOT9J8v20GfMjyIdgufW7rQW', '2026-09-13 18:36:17.82166+00');

-- Data for `profiles` (1 rows)
INSERT INTO `profiles` (`id`, `email`, `full_name`, `is_admin`, `created_at`) VALUES ('1ccd6e2f-69cc-4214-b4b3-167a80dcf7b3', 'tousifdev@outlook.com', 'Tousif Dev', 1, '2026-09-13 18:36:17.819767+00');

-- Data for `donations` (4 rows)
INSERT INTO `donations` (`id`, `created_at`, `cause`, `frequency`, `currency`, `amount`, `donation_type`, `country`, `donor_name`, `donor_email`, `donor_phone`, `status`, `payment_reference`) VALUES ('7582b10e-9097-407c-8054-a2fc8bf2a7d2', '2026-09-13 18:36:22.558754+00', 'Support a Classroom', 'once', 'PKR', '45000.00', 'Sadqah', 'Pakistan', 'Fatima Tariq', 'fatima.tariq@yahoo.com', '+92 321 7654321', 'completed', 'JC-44910283');
INSERT INTO `donations` (`id`, `created_at`, `cause`, `frequency`, `currency`, `amount`, `donation_type`, `country`, `donor_name`, `donor_email`, `donor_phone`, `status`, `payment_reference`) VALUES ('ff2c27b9-6a71-4505-b444-86c3d4c5278d', '2026-09-13 18:36:22.558754+00', 'General Education', 'once', 'AED', '1000.00', 'General', 'United Arab Emirates', 'Rashid Al-Mansoor', 'rashid.mansoor@dubaimail.ae', '+971 50 1234567', 'completed', 'STRIPE-CH-88231');
INSERT INTO `donations` (`id`, `created_at`, `cause`, `frequency`, `currency`, `amount`, `donation_type`, `country`, `donor_name`, `donor_email`, `donor_phone`, `status`, `payment_reference`) VALUES ('5908e981-4832-404b-a808-dce3c0ba534f', '2026-09-13 18:36:22.558754+00', 'Support a Child: KG to Matric', 'monthly', 'PKR', '15000.00', 'Zakat', 'Pakistan', 'Bilal Hussain', 'bilal.h@outlook.com', '+92 333 5556677', 'pending', 'MBL-ONLINE-99120');
INSERT INTO `donations` (`id`, `created_at`, `cause`, `frequency`, `currency`, `amount`, `donation_type`, `country`, `donor_name`, `donor_email`, `donor_phone`, `status`, `payment_reference`) VALUES ('ddadc233-eeac-4346-a77c-7373f4292211', '2026-09-13 18:36:22.558754+00', 'Educate a Child', 'once', 'PKR', '9000.00', 'Sadqah', 'United Kingdom', 'Zainab Begum', 'zainab.uk@gmail.com', '+44 7911 123456', 'completed', 'WISE-TRX-10294');

-- Data for `contact_submissions` (3 rows)
INSERT INTO `contact_submissions` (`id`, `created_at`, `name`, `email`, `subject`, `message`, `status`) VALUES ('576bf3a8-8b5a-453d-80d9-036c57645f11', '2026-09-13 18:36:22.558754+00', 'Dr. Usman Malik', 'usman.malik@kemu.edu.pk', 'Volunteer Medical Camp for Slum Children', 'Hello GJTF team, our medical students society at KEMU would like to arrange a free health and dental checkup camp at your Jallo Pind campus.', 'new');
INSERT INTO `contact_submissions` (`id`, `created_at`, `name`, `email`, `subject`, `message`, `status`) VALUES ('319dae93-f687-4f75-bfb3-99c313d01d65', '2026-09-13 18:36:22.558754+00', 'Ayesha Siddiqui', 'ayesha.siddiqui@corppartner.pk', 'CSR Sponsorship & Tablet Donation', 'Our corporate CSR committee is looking to donate 50 Android tablets for your digital literacy lab. Please share the procedure for formal handover.', 'new');
INSERT INTO `contact_submissions` (`id`, `created_at`, `name`, `email`, `subject`, `message`, `status`) VALUES ('fed7f1d9-c4fb-40b5-88b7-ccd6e7b5cdcc', '2026-09-13 18:36:22.558754+00', 'Hamza Farooq', 'hamza.f@gmail.com', 'School Visit & Documentary Coverage', 'I am a documentary filmmaker working on stories of resilience in informal settlements. Would love to request permission to film a short segment at GJTF.', 'read');

-- Data for `volunteer_signups` (4 rows)
INSERT INTO `volunteer_signups` (`id`, `created_at`, `type`, `full_name`, `email`, `phone`, `city`, `university`, `message`, `status`) VALUES ('8df76d0e-1e6c-40ee-ae8e-8ff870821578', '2026-09-13 18:36:22.558754+00', 'university_chapter', 'Sara Rehman', 'sara.rehman@lums.edu.pk', '+92 300 8877665', 'Lahore', 'LUMS (Lahore University of Management Sciences)', 'Eager to establish the GJTF Student Chapter at LUMS and mobilize 100+ volunteers for weekend teaching sessions.', 'new');
INSERT INTO `volunteer_signups` (`id`, `created_at`, `type`, `full_name`, `email`, `phone`, `city`, `university`, `message`, `status`) VALUES ('96d69d91-72b8-460f-a96c-94ec5513e0fe', '2026-09-13 18:36:22.558754+00', 'city_chapter', 'Kashif Ali', 'kashif.ali@karachichapter.org', '+92 321 9988776', 'Karachi', 'IBA Karachi', 'Experienced community lead applying for Karachi City Chapter Lead to expand operations across slum settlements in Machar Colony and Lyari.', 'new');
INSERT INTO `volunteer_signups` (`id`, `created_at`, `type`, `full_name`, `email`, `phone`, `city`, `university`, `message`, `status`) VALUES ('24f037f6-1b8a-4e7d-9a6a-dbef217f6aa7', '2026-09-13 18:36:22.558754+00', 'general', 'Maryam Noor', 'maryam.noor@gmail.com', '+92 334 1122334', 'Islamabad', 'NUST', 'Software engineer wanting to volunteer 4 hours every Saturday to teach basic coding and computer literacy to children.', 'contacted');
INSERT INTO `volunteer_signups` (`id`, `created_at`, `type`, `full_name`, `email`, `phone`, `city`, `university`, `message`, `status`) VALUES ('c7a3d8e1-4dcb-40a1-b5d2-67db0c07b8b0', '2026-09-13 20:52:53.865133+00', 'city_chapter', 'Tousf', 'tousifqasim@gmal.com', '03286477314', 'Hujra', 'Hujra', 'g', 'new');

-- Data for `schools` (7 rows)
INSERT INTO `schools` (`id`, `slug`, `name`, `campus_type`, `shift`, `city`, `province`, `area_sq_ft`, `classrooms`, `student_capacity`, `current_students`, `established_year`, `description`, `facilities`, `card_image`, `hero_image`, `gallery_images`, `featured`, `created_at`) VALUES ('sch-001', 'meghani-family-campus-primary-morning', 'Meghani Family Campus Primary Morning', 'Primary', 'Morning', 'Karachi', 'Sindh', 6500, 6, 180, 172, 2017, 'A flagship GJTF landmark campus dedicated to educating nomadic and slum-dwelling children in Karachi. The school offers airy, sunlit classrooms, an administrative block, activity library, digital learning tablet lab, and a safe outdoor playground.', '[\"Airy & Well-Lit Classrooms\",\"Administrative Block\",\"Digital Tablet Learning Corner\",\"Child Activity Library\",\"Enclosed Playground\",\"Clean Drinking Water & Sanitation\",\"First Aid Station\",\"Nutritional Meal Support\"]', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1800&auto=format&fit=crop', '[\"https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=900\",\"https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=900\"]', 1, '2026-09-13 18:21:07.941083+00');
INSERT INTO `schools` (`id`, `slug`, `name`, `campus_type`, `shift`, `city`, `province`, `area_sq_ft`, `classrooms`, `student_capacity`, `current_students`, `established_year`, `description`, `facilities`, `card_image`, `hero_image`, `gallery_images`, `featured`, `created_at`) VALUES ('sch-002', 'lahore-model-town-jhuggi-unit-1', 'Lahore Model Town Jhuggi Campus', 'Primary', 'Morning', 'Lahore', 'Punjab', 5800, 5, 150, 144, 2015, 'Established right at the heart of nomadic settlements in Lahore, this school unit has empowered dozens of families to break out of generational poverty through primary education and vocational craft programs.', '[\"Modular Weatherproof Classrooms\",\"Sewing & Vocational Center for Mothers\",\"Digital Tablet Lab\",\"Reading & Storytelling Corner\",\"Daily Nutritional Meal\",\"Solar Powered Lighting\"]', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=900&auto=format&fit=crop', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1800&auto=format&fit=crop', '[\"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=900&auto=format&fit=crop\",\"https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=900&auto=format&fit=crop\"]', 1, '2026-09-13 18:36:22.558754+00');
INSERT INTO `schools` (`id`, `slug`, `name`, `campus_type`, `shift`, `city`, `province`, `area_sq_ft`, `classrooms`, `student_capacity`, `current_students`, `established_year`, `description`, `facilities`, `card_image`, `hero_image`, `gallery_images`, `featured`, `created_at`) VALUES ('sch-003', 'faisalabad-settlement-campus', 'Faisalabad Settlement Learning Campus', 'Primary', 'Afternoon', 'Faisalabad', 'Punjab', 6200, 6, 180, 165, 2018, 'Equipped with modern learning tablets and interactive learning resources, this campus serves children who previously worked in brick kilns and scrap collection, restoring their right to childhood.', '[\"Well-Ventilated Classrooms\",\"Digital Literacy Lab\",\"Activity Playground\",\"Uniform & Stationery Corner\",\"Community Counseling Hall\"]', 'https://gjtfoundation.com/wp-content/uploads/2025/06/Faisalbad-School-scaled.jpg', 'https://gjtfoundation.com/wp-content/uploads/2025/06/Faisalbad-School-scaled.jpg', '[\"https://gjtfoundation.com/wp-content/uploads/2025/06/Faisalbad-School-scaled.jpg\",\"https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=900&auto=format&fit=crop\"]', 1, '2026-09-13 19:56:46.982613+00');
INSERT INTO `schools` (`id`, `slug`, `name`, `campus_type`, `shift`, `city`, `province`, `area_sq_ft`, `classrooms`, `student_capacity`, `current_students`, `established_year`, `description`, `facilities`, `card_image`, `hero_image`, `gallery_images`, `featured`, `created_at`) VALUES ('sch-004', 'raiwind-school-campus', 'GJTF Raiwind School Campus', 'Primary', 'Morning', 'Raiwind', 'Punjab', 5500, 5, 160, 152, 2019, 'A dedicated community school unit in Raiwind providing high-quality primary education and free learning kits directly to nomadic settlement children.', '[\"5 Solar-Equipped Classrooms\",\"Digital Tablet Learning Station\",\"Play Area & Sports Field\",\"Clean Drinking Water Unit\"]', 'https://gjtfoundation.com/wp-content/uploads/2025/06/Raiwind-school-3.jpeg', 'https://gjtfoundation.com/wp-content/uploads/2025/06/Raiwind-school-3.jpeg', '[\"https://gjtfoundation.com/wp-content/uploads/2025/06/Raiwind-school-3.jpeg\",\"https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=900&auto=format&fit=crop\"]', 1, '2026-09-13 19:56:47.580901+00');
INSERT INTO `schools` (`id`, `slug`, `name`, `campus_type`, `shift`, `city`, `province`, `area_sq_ft`, `classrooms`, `student_capacity`, `current_students`, `established_year`, `description`, `facilities`, `card_image`, `hero_image`, `gallery_images`, `featured`, `created_at`) VALUES ('sch-005', 'sheikhupura-jhuggi-taleemi-center', 'Sheikhupura Jhuggi Taleemi Center', 'Primary', 'Morning', 'Sheikhupura', 'Punjab', 6000, 5, 150, 138, 2019, 'A vibrant rural and semi-urban learning hub where nomadic students receive high-standard early education alongside seasonal warmth clothing, health screenings, and moral guidance.', '[\"5 Airy Classrooms\",\"Science and Nature Corner\",\"Digital Tablets for Learning\",\"Clean Drinking Water Unit\",\"Playground with Sports Gear\"]', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=900&auto=format&fit=crop', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1800&auto=format&fit=crop', '[\"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=900&auto=format&fit=crop\"]', 0, '2026-09-13 19:56:47.904294+00');
INSERT INTO `schools` (`id`, `slug`, `name`, `campus_type`, `shift`, `city`, `province`, `area_sq_ft`, `classrooms`, `student_capacity`, `current_students`, `established_year`, `description`, `facilities`, `card_image`, `hero_image`, `gallery_images`, `featured`, `created_at`) VALUES ('sch-006', 'rawalpindi-islamabad-sub-campus', 'Rawalpindi Gangal West Campus', 'Secondary', 'Morning', 'Rawalpindi', 'Punjab', 9000, 5, 180, 168, 2021, 'Our premier secondary school facility preparing older nomadic youth for Matriculation examinations, technical skills, and transition into colleges and professional apprenticeships.', '[\"5 Large Secondary Classrooms (36 capacity each)\",\"Science & Physics/Chemistry Demo Corner\",\"Full Computer Lab\",\"Career Guidance Counseling\",\"Sports Ground\"]', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=900&auto=format&fit=crop', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1800&auto=format&fit=crop', '[\"https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=900&auto=format&fit=crop\"]', 0, '2026-09-13 19:56:48.230741+00');
INSERT INTO `schools` (`id`, `slug`, `name`, `campus_type`, `shift`, `city`, `province`, `area_sq_ft`, `classrooms`, `student_capacity`, `current_students`, `established_year`, `description`, `facilities`, `card_image`, `hero_image`, `gallery_images`, `featured`, `created_at`) VALUES ('sch-007', 'jallo-pind-campus-lahore', 'GJTF Jallo Pind Campus', 'Primary', 'Morning', 'Lahore', 'Punjab', 5200, 5, 150, 142, 2018, 'Located in the outskirts of Lahore near Jallo, this campus provides free holistic education, uniform, and books to children living in temporary jhuggi settlements.', '[\"Classrooms with Solar Power\",\"Drinking Water Filtration Unit\",\"Digital Learning Lab\",\"Art and Storytelling Hall\",\"Sports Field\"]', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1800&auto=format&fit=crop', '[\"https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=900&auto=format&fit=crop\",\"https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=900&auto=format&fit=crop\"]', 1, '2026-09-13 19:56:48.554877+00');

-- Data for `stories` (6 rows)
INSERT INTO `stories` (`id`, `slug`, `title`, `category`, `excerpt`, `body`, `cover_image_url`, `author_name`, `author_role`, `published_at`, `created_at`) VALUES ('story-004', 'cm-murad-ali-shah-lauds-gjtf', 'CM Murad Ali Shah lauds GJTF efforts for educating less-privileged children', 'GJTF in Media', 'A collaboration with the Ramon Magsaysay Award Foundation hosted an event in Karachi.', 'Sindh Chief Minister Murad Ali Shah commended the relentless efforts of Ghais Jhuggi Taleem Foundation (GJTF) in mainstreaming out-of-school nomadic youth during an educational symposium in Karachi.\n\nThe Chief Minister highlighted GJTF\'s innovative approach of embedding weatherproof classrooms and mobile educational units directly inside slum colonies, removing logistical barriers that traditionally prevented children from attending conventional schools.\n\nProvincial officials pledged enhanced coordination with civil society initiatives like GJTF to accelerate out-of-school children reintegration across Sindh.', 'https://gjtfoundation.com/wp-content/uploads/2025/06/Murad-Ali-shah-3.jpg', 'Media Relations', 'Press Release', '2024-09-02 00:00:00+00', '2026-09-13 18:36:22.558754+00');
INSERT INTO `stories` (`id`, `slug`, `title`, `category`, `excerpt`, `body`, `cover_image_url`, `author_name`, `author_role`, `published_at`, `created_at`) VALUES ('story-005', 'mahira-khan-appeal', 'Mahira Khan\'s heartfelt appeal to support GJTF this Ramzan', 'Events', 'Renowned Pakistani actor urges support this Ramzan to light up a child\'s world with education.', 'Celebrated cultural icon and philanthropist Mahira Khan has issued a poignant video appeal encouraging overseas Pakistanis and nationwide donors to direct their Zakat and Sadqah towards GJTF\'s Jhuggi Taleemi Project.\n\n\'When you witness these little children holding their school bags in the middle of nomadic settlements with sparkles in their eyes, you realize how powerful hope is. GJTF is giving them not just pencils and books, but a dignified future,\' she highlighted.\n\nHer appeal helped drive vital contributions towards opening 50 new classroom units and distributing winter uniforms across nomadic settlements.', 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=900&auto=format&fit=crop', 'Campaign Desk', 'Community Outreach', '2024-03-10 00:00:00+00', '2026-09-13 20:42:01.394232+00');
INSERT INTO `stories` (`id`, `slug`, `title`, `category`, `excerpt`, `body`, `cover_image_url`, `author_name`, `author_role`, `published_at`, `created_at`) VALUES ('story-001', 'khan-academy-partnership', 'GJTF Partners with Khan Academy for AI-Powered Learning', 'Blogs', 'An AI-powered innovative collaboration to support teachers and enhance learning outcomes for slum students.', 'In a monumental milestone for nomadic education in Pakistan, Ghais Jhuggi Taleem Foundation (GJTF) has announced a dynamic partnership with Khan Academy. This initiative introduces localized, AI-powered interactive learning tools tailored specifically for children residing in nomadic settlements (\'Jhuggi Nasheen\').\n\nThrough this collaboration, teachers across GJTF\'s school units in Lahore, Karachi, and Faisalabad are equipped with real-time diagnostics and bilingual instructional tools. Even children with zero prior literacy exposure can advance at their own pace, building confidence in foundational mathematics and Urdu comprehension.\n\n\'Every child, regardless of whether their home is a tent or a concrete building, deserves access to world-class learning tools,\' stated the foundation\'s academic lead. Early trials indicate a 40\% improvement in concept retention among primary students.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=900', 'GJTF Academic Team', 'Curriculum & Innovation', '2025-01-15 00:00:00+00', '2026-09-13 18:21:07.941083+00');
INSERT INTO `stories` (`id`, `slug`, `title`, `category`, `excerpt`, `body`, `cover_image_url`, `author_name`, `author_role`, `published_at`, `created_at`) VALUES ('story-002', 'sadia-police-officer', 'Sadia\'s Path from GJTF Graduate to Police Officer', 'Success Stories', 'Amidst the rhythmic chaos of the police station, Sadia calmly takes control of the unpredictable days.', 'Ten years ago, Sadia\'s morning routine involved helping her mother gather scrap materials along the highway perimeter. Today, dressed in a crisp uniform, Sub-Inspector Sadia commands respect and brings justice to her district.\n\nSadia was among the early batches of young girls enrolled when GJTF set up its makeshift learning tent in her settlement. Overcoming severe societal skepticism and financial hurdles, she completed her matriculation and intermediate studies with top honors under GJTF\'s mentorship.\n\n\'GJTF did not just teach me the alphabet; they taught me that my background does not define my destiny. When you educate a girl from the slums, you emancipate an entire family from silence,\' Sadia reflects with a confident smile.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=900', 'Communications Desk', 'GJTF Stories', '2024-11-28 00:00:00+00', '2026-09-13 18:21:07.941083+00');
INSERT INTO `stories` (`id`, `slug`, `title`, `category`, `excerpt`, `body`, `cover_image_url`, `author_name`, `author_role`, `published_at`, `created_at`) VALUES ('story-003', 'my-fate-changed-asad', '\'My fate changed when I came to GJTF\' — Asad\'s Journey', 'Success Stories', 'Meet Asad, an alumnus from Old Muzaffarabad Colony, a low-income town in Landhi, Karachi.', 'Asad still vividly remembers the day a GJTF volunteer sat down in his tent community in Landhi, holding out a colorful picture book and a clean slate. Before that day, education felt like an unimaginable luxury reserved for wealthy city dwellers.\n\nThrough persistent guidance from passionate volunteer teachers, Asad discovered a deep affinity for mathematics and problem-solving. Supported by GJTF\'s scholarship and digital tablet program, he progressed through secondary school and is now pursuing a bachelor\'s degree in Software Engineering.\n\n\'My father drove a donkey cart for forty years. Today, I am building mobile applications. GJTF did not just change my fate; they rewrote our family\'s entire legacy for generations to come,\' Asad shares.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=900&auto=format&fit=crop', 'Alumni Network', 'GJTF Karachi', '2024-10-14 00:00:00+00', '2026-09-13 18:36:22.558754+00');
INSERT INTO `stories` (`id`, `slug`, `title`, `category`, `excerpt`, `body`, `cover_image_url`, `author_name`, `author_role`, `published_at`, `created_at`) VALUES ('story-006', 'witness-change-in-action', 'Witness Change in Action: A Decade of Uplifting 20 Million Nomads', 'Videos', 'What education makes possible is truly remarkable — hope given today grows into tomorrow\'s miracles.', 'Step behind the scenes with our documentary team as we travel across 24 cities in Pakistan — from the shifting sands of Sindh to the outskirts of Lahore and Faisalabad.\n\nThis mini-documentary captures the daily life of Jhuggi Nasheen children, the dedication of our volunteer educators, and the transformative ripple effect that literacy has on entire slum communities.\n\nEvery smile, every recited poem, and every graduation cap tells a story of perseverance against all odds. Watch the full feature and share with your community.', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=900&auto=format&fit=crop', 'GJTF Media Cell', 'Documentary Production', '2024-01-05 00:00:00+00', '2026-09-13 20:42:01.9898+00');

-- Data for `smtp_settings` (1 rows)
INSERT INTO `smtp_settings` (`id`, `host`, `port`, `secure`, `user_name`, `password`, `from_name`, `from_email`, `created_at`, `updated_at`) VALUES ('default', 'smtp.gmail.com', 587, 0, '', '', 'Ghais Jhuggi Taleem Foundation', 'info@gjtfoundation.com', '2026-09-13 21:12:08.854756+00', '2026-09-13 21:12:08.854756+00');

-- Data for `admin_security` (1 rows)
INSERT INTO `admin_security` (`id`, `admin_email`, `two_factor_enabled`, `two_factor_secret`, `recovery_codes`, `updated_at`) VALUES ('default', 'tousifdev@outlook.com', 0, '', '[\"GJTF-7821-9941\",\"GJTF-5390-1284\",\"GJTF-8842-6619\",\"GJTF-3105-7792\"]', '2026-09-14 04:17:38.038025+00');

-- Data for `site_settings` (1 rows)
INSERT INTO `site_settings` (`id`, `head_office_address`, `telephone`, `mobile`, `whatsapp`, `email`, `toll_free`, `facebook_url`, `instagram_url`, `youtube_url`, `twitter_url`, `linkedin_url`, `updated_at`, `secondary_email`, `contact_person`, `tiktok_url`) VALUES ('default', 'Office # 46-47 First Floor, New Liberty Tower, Model Town Link Road, Lahore', '04235236622', '+923033934771', '+923033934771', 'jhuggitaleemiproject@gmail.com', '0800-00823', 'https://facebook.com/gjtfoundation', 'https://instagram.com/gjtfoundation', 'https://youtube.com/@gjtfoundation', 'https://x.com/gjtfoundation', 'https://linkedin.com/company/gjtfoundation', '2026-09-14 05:23:14.923+00', 'gjtfoundation1@gmail.com', 'Asra Ahmed', 'https://tiktok.com/@gjtfoundation');

SET FOREIGN_KEY_CHECKS = 1;
