CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  CONSTRAINT `users_id` PRIMARY KEY(`id`),
  CONSTRAINT `users_email_unique` UNIQUE(`email`)
);

CREATE TABLE `conversations` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);

CREATE TABLE `messages` (
  `id` varchar(36) NOT NULL,
  `conversation_id` varchar(36) NOT NULL,
  `role` enum('user','assistant') NOT NULL,
  `content` text NOT NULL,
  `attachments` json,
  `created_at` datetime NOT NULL,
  CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);

CREATE TABLE `attachments` (
  `id` varchar(36) NOT NULL,
  `message_id` varchar(36) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` varchar(50) NOT NULL,
  `file_size` int NOT NULL,
  `storage_path` varchar(500) NOT NULL,
  `created_at` datetime NOT NULL,
  CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);

CREATE INDEX `conversations_user_id_idx` ON `conversations` (`user_id`);
CREATE INDEX `messages_conversation_id_idx` ON `messages` (`conversation_id`);
