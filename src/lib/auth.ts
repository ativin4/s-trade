import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from '@prisma/extension-accelerate'

// Singleton to avoid exhausting connections on dev hot-reloads
declare global { var _prismaBase: PrismaClient | undefined }
const prismaClient = globalThis._prismaBase ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalThis._prismaBase = prismaClient
export const prisma = prismaClient.$extends(withAccelerate())

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prismaClient),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      'use server'
      if (user) {
        token.id = user.id
      }
      return token
    },
    session: async ({ session, token }) => {
      'use server'
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== 'production',
  pages: {
    signIn: '/',
    error: '/',
  },
}