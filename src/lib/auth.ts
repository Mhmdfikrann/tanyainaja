import { randomUUID } from "node:crypto";
import { compare } from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { authOtpCodes, conversations, users } from "@/db/schema";
import { env } from "@/lib/env";
import { loginSchema, verifyOtpSchema } from "@/lib/validators";
import { hashOtpCode, otpPolicy } from "@/lib/wa-auth";

export const authOptions: NextAuthOptions = {
  secret: env.nextAuthSecret,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email));

        if (!user) {
          return null;
        }

        if (!user.passwordHash) {
          return null;
        }

        const valid = await compare(parsed.data.password, user.passwordHash);

        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl ?? undefined,
          role: "user",
        };
      },
    }),
    CredentialsProvider({
      name: "Superadmin",
      id: "superadmin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        if (!env.superAdminEmail || !env.superAdminPassword) {
          return null;
        }

        if (
          parsed.data.email !== env.superAdminEmail
          || parsed.data.password !== env.superAdminPassword
        ) {
          return null;
        }

        return {
          id: "superadmin",
          name: "Superadmin",
          email: env.superAdminEmail,
          image: null,
          role: "superadmin",
        };
      },
    }),
    CredentialsProvider({
      name: "WhatsApp OTP",
      id: "wa-otp",
      credentials: {
        otpSessionId: { label: "OTP Session", type: "text" },
        code: { label: "OTP Code", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(rawCredentials) {
        const parsed = verifyOtpSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const now = new Date();
        const policy = otpPolicy();
        const [otpSession] = await db
          .select()
          .from(authOtpCodes)
          .where(eq(authOtpCodes.id, parsed.data.otpSessionId));

        if (!otpSession) {
          return null;
        }

        if (otpSession.consumedAt || otpSession.expiresAt <= now) {
          return null;
        }

        if (otpSession.attempts >= policy.maxAttempts) {
          await db
            .update(authOtpCodes)
            .set({
              consumedAt: now,
              updatedAt: now,
            })
            .where(eq(authOtpCodes.id, otpSession.id));

          return null;
        }

        const expectedHash = hashOtpCode(otpSession.id, parsed.data.code);

        if (expectedHash !== otpSession.codeHash) {
          const nextAttempts = otpSession.attempts + 1;

          await db
            .update(authOtpCodes)
            .set({
              attempts: nextAttempts,
              consumedAt: nextAttempts >= policy.maxAttempts ? now : otpSession.consumedAt,
              updatedAt: now,
            })
            .where(eq(authOtpCodes.id, otpSession.id));

          return null;
        }

        await db
          .update(authOtpCodes)
          .set({
            consumedAt: now,
            updatedAt: now,
          })
          .where(eq(authOtpCodes.id, otpSession.id));

        let [user] = await db.select().from(users).where(eq(users.phone, otpSession.phone));

        if (!user) {
          const userId = randomUUID();
          const generatedName = parsed.data.name?.trim() || `User ${otpSession.phone.slice(-4)}`;

          await db.insert(users).values({
            id: userId,
            name: generatedName,
            phone: otpSession.phone,
            email: null,
            passwordHash: null,
            createdAt: now,
            updatedAt: now,
          });

          [user] = await db.select().from(users).where(eq(users.id, userId));
        }

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? undefined,
          image: user.avatarUrl ?? undefined,
          role: "user",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email ?? undefined;
        token.image = user.image ?? undefined;
        token.role = user.role ?? "user";
      }

      if (trigger === "update" && session) {
        if (typeof session.name === "string") {
          token.name = session.name;
        }

        if ("image" in session) {
          token.image = typeof session.image === "string" ? session.image : null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.name = token.name ?? session.user.name ?? "";
        session.user.email = token.email ?? session.user.email ?? null;
        session.user.image = token.image ?? session.user.image ?? null;
        session.user.role = token.role ?? "user";
      }

      return session;
    },
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function ensureConversationOwnership(conversationId: string, userId: string) {
  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));

  return conversation;
}
