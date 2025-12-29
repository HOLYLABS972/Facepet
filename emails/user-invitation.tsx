import { Button, Section, Text } from '@react-email/components';
import EmailLayout from './email-layout';

interface UserInvitationEmailProps {
  userFirstname: string;
  email: string;
  signupUrl: string;
  language?: 'en' | 'he';
}

const translations = {
  en: {
    welcome: 'You have been invited to join Chapiz!',
    message: 'An administrator has invited you to create an account. Click the button below to get started.',
    signUp: 'Create Your Account',
    footer: 'If you did not expect this invitation, you can safely ignore this email.'
  },
  he: {
    welcome: 'הוזמנת להצטרף ל-Chapiz!',
    message: 'מנהל הזמין אותך ליצור חשבון. לחץ על הכפתור למטה כדי להתחיל.',
    signUp: 'צור את החשבון שלך',
    footer: 'אם לא ציפית להזמנה זו, תוכל להתעלם מהאימייל הזה בבטחה.'
  }
};

export const UserInvitationEmail = ({
  userFirstname,
  email,
  signupUrl,
  language = 'en'
}: UserInvitationEmailProps) => {
  const t = translations[language];
  
  return (
    <EmailLayout userFirstname={userFirstname}>
      <Text>
        {t.welcome}
      </Text>
      <Text>
        {t.message}
      </Text>
      <Section style={btnContainer}>
        <Button style={button} href={signupUrl}>
          {t.signUp}
        </Button>
      </Section>
      <Text style={footerStyle}>
        {t.footer}
      </Text>
    </EmailLayout>
  );
};

UserInvitationEmail.PreviewProps = {
  userFirstname: 'John',
  email: 'john@example.com',
  signupUrl: 'https://facepet.club/auth/signup?email=john@example.com',
  language: 'en'
} as UserInvitationEmailProps;

export default UserInvitationEmail;

const primaryColor = '#FF5722';

const btnContainer = {
  textAlign: 'center' as const,
  margin: '30px 0'
};

const button = {
  backgroundColor: primaryColor,
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px'
};

const footerStyle = {
  fontSize: '12px',
  color: '#666',
  marginTop: '30px',
  textAlign: 'center' as const
};

