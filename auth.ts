import { compare } from 'bcryptjs';
import NextAuth, { User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// Note: We'll use the existing database queries for now to avoid Edge Runtime issues
import { getUserDetailsByEmail } from './utils/database/queries/users';

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt'
  },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('Missing credentials');
          return null;
        }

        // Convert email to lowercase for a case-insensitive match
        const emailLower = credentials.email.toString().toLowerCase();

        const user = await getUserDetailsByEmail(emailLower);

        if (!user) {
          console.log('User not found for email:', emailLower);
          return null;
        }

        // Compare the provided password with the stored hash
        const isPasswordValid = await compare(
          credentials.password.toString(),
          user.password
        );

        if (!isPasswordValid) return null;

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.fullName,
          role: user.role
        } as User;
      }
    })
  ],
  pages: {
    signIn: '/auth/sign-in'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }

      return session;
    }
  }
});
