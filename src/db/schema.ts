import {
  datetime,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  varchar,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  avatarUrl: text("avatar_url"),
  createdAt: datetime("created_at", { mode: "date" }).notNull(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
});

export const authOtpCodes = mysqlTable(
  "auth_otp_codes",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    phone: varchar("phone", { length: 20 }).notNull(),
    codeHash: varchar("code_hash", { length: 255 }).notNull(),
    attempts: int("attempts").notNull().default(0),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    consumedAt: datetime("consumed_at", { mode: "date" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => ({
    phoneIdx: index("auth_otp_codes_phone_idx").on(table.phone),
    expiresAtIdx: index("auth_otp_codes_expires_at_idx").on(table.expiresAt),
  }),
);

export const conversations = mysqlTable(
  "conversations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => ({
    userIdIdx: index("conversations_user_id_idx").on(table.userId),
  }),
);

export const messages = mysqlTable(
  "messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    conversationId: varchar("conversation_id", { length: 36 }).notNull(),
    role: mysqlEnum("role", ["user", "assistant"]).notNull(),
    content: text("content").notNull(),
    attachments: json("attachments"),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (table) => ({
    conversationIdIdx: index("messages_conversation_id_idx").on(table.conversationId),
  }),
);

export const attachments = mysqlTable("attachments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  messageId: varchar("message_id", { length: 36 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: int("file_size").notNull(),
  storagePath: varchar("storage_path", { length: 500 }).notNull(),
  createdAt: datetime("created_at", { mode: "date" }).notNull(),
});

export const aiUsageEvents = mysqlTable(
  "ai_usage_events",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    conversationId: varchar("conversation_id", { length: 36 }),
    model: varchar("model", { length: 100 }).notNull(),
    promptTokens: int("prompt_tokens").notNull().default(0),
    completionTokens: int("completion_tokens").notNull().default(0),
    totalTokens: int("total_tokens").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (table) => ({
    userIdIdx: index("ai_usage_events_user_id_idx").on(table.userId),
    conversationIdIdx: index("ai_usage_events_conversation_id_idx").on(table.conversationId),
    createdAtIdx: index("ai_usage_events_created_at_idx").on(table.createdAt),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  usageEvents: many(aiUsageEvents),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
  usageEvents: many(aiUsageEvents),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  message: one(messages, {
    fields: [attachments.messageId],
    references: [messages.id],
  }),
}));

export const aiUsageEventsRelations = relations(aiUsageEvents, ({ one }) => ({
  user: one(users, {
    fields: [aiUsageEvents.userId],
    references: [users.id],
  }),
  conversation: one(conversations, {
    fields: [aiUsageEvents.conversationId],
    references: [conversations.id],
  }),
}));

export type ConversationAttachment = {
  id?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  publicUrl?: string;
};
