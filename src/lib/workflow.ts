'use server';

import { qstashClient } from '@/lib/clients'; // now not a "use server" file
import { resend } from '@upstash/qstash';

export const sendEmail = async ({
  email,
  subject,
  message
}: {
  email: string;
  subject: string;
  message: any;
}) => {
  await qstashClient.publishJSON({
    api: {
      name: 'email',
      provider: resend({ token: process.env.RESEND_TOKEN! })
    },
    body: {
      // from: 'Facepet <noreply@facepet.club>',
      from: 'Facepet <onboarding@resend.dev>',
      to: [email],
      subject,
      html: message
    }
  });
};
