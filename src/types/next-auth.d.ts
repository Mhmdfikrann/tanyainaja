import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: "user" | "superadmin";
    };
  }

  interface User {
    id: string;
    email?: string | null;
    name: string;
    image?: string | null;
    role?: "user" | "superadmin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string;
    name?: string;
    image?: string | null;
    role?: "user" | "superadmin";
  }
}
