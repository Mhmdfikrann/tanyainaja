ALTER TABLE `users`
  ADD COLUMN `phone` varchar(20),
  MODIFY COLUMN `email` varchar(255),
  MODIFY COLUMN `password_hash` varchar(255);

ALTER TABLE `users`
  ADD CONSTRAINT `users_phone_unique` UNIQUE(`phone`);

CREATE TABLE `auth_otp_codes` (
  `id` varchar(36) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `code_hash` varchar(255) NOT NULL,
  `attempts` int NOT NULL DEFAULT 0,
  `expires_at` datetime NOT NULL,
  `consumed_at` datetime,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  CONSTRAINT `auth_otp_codes_id` PRIMARY KEY(`id`)
);

CREATE INDEX `auth_otp_codes_phone_idx` ON `auth_otp_codes` (`phone`);
CREATE INDEX `auth_otp_codes_expires_at_idx` ON `auth_otp_codes` (`expires_at`);
