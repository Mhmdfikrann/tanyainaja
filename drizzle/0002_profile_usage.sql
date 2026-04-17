ALTER TABLE `users`
  ADD COLUMN `avatar_url` varchar(500);

CREATE TABLE `ai_usage_events` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `conversation_id` varchar(36),
  `model` varchar(100) NOT NULL,
  `prompt_tokens` int NOT NULL DEFAULT 0,
  `completion_tokens` int NOT NULL DEFAULT 0,
  `total_tokens` int NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  CONSTRAINT `ai_usage_events_id` PRIMARY KEY(`id`)
);

CREATE INDEX `ai_usage_events_user_id_idx` ON `ai_usage_events` (`user_id`);
CREATE INDEX `ai_usage_events_conversation_id_idx` ON `ai_usage_events` (`conversation_id`);
CREATE INDEX `ai_usage_events_created_at_idx` ON `ai_usage_events` (`created_at`);
