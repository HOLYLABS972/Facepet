import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { upsertUser } from '@/src/lib/supabase/database/users';

// Mark this route as dynamic since it's an OAuth callback
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const requestUrl = request.nextUrl;
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/';

    if (code) {
        // Create Supabase client for server-side route handler
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    persistSession: false, // Server-side, no session persistence needed
                },
            }
        );

        try {
            // Exchange the code for a session
            const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

            if (sessionError) {
                console.error('Error exchanging code for session:', sessionError);
                return NextResponse.redirect(new URL('/auth?error=oauth_failed', requestUrl));
            }

            if (session?.user) {
                const user = session.user;
                console.log('OAuth user authenticated:', user.email);

                // Get user metadata from OAuth provider
                const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
                const profileImage = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

                // Create or update user in database
                try {
                    const cookiePreference = false; // Default for OAuth users, they can update later

                    await upsertUser({
                        email: user.email!,
                        full_name: fullName,
                        display_name: fullName,
                        phone: user.user_metadata?.phone || '',
                        address: '',
                        role: 'user', // All OAuth users get 'user' role by default
                        language: 'en',
                        accept_cookies: cookiePreference,
                        profile_image: profileImage,
                    });

                    console.log('✅ OAuth user created/updated in database:', user.email);
                } catch (dbError) {
                    console.error('Error creating/updating OAuth user in database:', dbError);
                    // Don't fail the OAuth flow if database update fails
                    // User is still authenticated, they can update profile later
                }
            }

            // Redirect to the next URL or home page
            return NextResponse.redirect(new URL(next, requestUrl));
        } catch (error) {
            console.error('OAuth callback error:', error);
            return NextResponse.redirect(new URL('/auth?error=oauth_failed', requestUrl));
        }
    }

    // No code provided, redirect to auth page
    return NextResponse.redirect(new URL('/auth', requestUrl));
}
