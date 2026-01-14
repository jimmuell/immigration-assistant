import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { users, organizations } from "./db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("Missing credentials");
            return null;
          }

          const result = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email as string))
            .limit(1);

          const user = result[0];

          if (!user || !user.password) {
            console.log("User not found or no password");
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            console.log("Invalid password");
            return null;
          }

          // Get organization name if user has an organization
          let organizationName = '';
          if (user.organizationId) {
            const [organization] = await db
              .select()
              .from(organizations)
              .where(eq(organizations.id, user.organizationId))
              .limit(1);
            organizationName = organization?.name || '';
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role as 'client' | 'attorney' | 'org_admin' | 'super_admin',
            organizationId: user.organizationId || '',
            organizationName,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "client" | "attorney" | "org_admin" | "super_admin";
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName as string | undefined;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Get the callback URL from the query string
      const urlObj = new URL(url, baseUrl);
      const callbackUrl = urlObj.searchParams.get('callbackUrl');
      
      // If there's a callback URL, use it
      if (callbackUrl && callbackUrl.startsWith('/')) {
        return `${baseUrl}${callbackUrl}`;
      }
      
      // Default redirect is handled by middleware based on role
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
});
