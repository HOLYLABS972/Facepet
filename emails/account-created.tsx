import { Button, Section, Text } from '@react-email/components';
import EmailLayout from './email-layout';

interface AccountCreatedEmailProps {
  userFirstname: string;
  email: string;
  password: string;
  loginUrl: string;
  language?: 'en' | 'he';
}

const translations = {
  en: {
    welcome: 'Your account has been created successfully! Welcome to Chapiz.',
    credentials: 'Here are your login credentials:',
    emailLabel: 'Email:',
    passwordLabel: 'Password:',
    important: 'Important:',
    changePassword: 'Please change your password after your first login for security.',
    signInNow: 'Sign In Now',
    footer: 'If you did not request this account, please contact support immediately.'
  },
  he: {
    welcome: 'החשבון שלך נוצר בהצלחה! ברוכים הבאים ל-Chapiz.',
    credentials: 'להלן פרטי ההתחברות שלך:',
    emailLabel: 'אימייל:',
    passwordLabel: 'סיסמה:',
    important: 'חשוב:',
    changePassword: 'אנא שנה את הסיסמה שלך לאחר ההתחברות הראשונה למען האבטחה.',
    signInNow: 'התחבר עכשיו',
    footer: 'אם לא ביקשת חשבון זה, אנא פנה לתמיכה מיד.'
  }
};

export const AccountCreatedEmail = ({
  userFirstname,
  email,
  password,
  loginUrl,
  language = 'en'
}: AccountCreatedEmailProps) => {
  const t = translations[language];
  
  return (
    <EmailLayout userFirstname={userFirstname}>
      <Text>
        {t.welcome}
      </Text>
      <Text>
        {t.credentials}
      </Text>
      <Section style={credentialsBox}>
        <Text style={labelStyle}>{t.emailLabel}</Text>
        <Text style={valueStyle}>{email}</Text>
        <Text style={labelStyle}>{t.passwordLabel}</Text>
        <Text style={passwordStyle}>{password}</Text>
      </Section>
      <Text style={warningStyle}>
        <strong>{t.important}</strong> {t.changePassword}
      </Text>
      <Section style={btnContainer}>
        <Button style={button} href={loginUrl}>
          {t.signInNow}
        </Button>
      </Section>
      <Text style={footerStyle}>
        {t.footer}
      </Text>
    </EmailLayout>
  );
};

AccountCreatedEmail.PreviewProps = {
  userFirstname: 'John',
  email: 'john@example.com',
  password: 'TempPass123!',
  loginUrl: 'https://facepet.club/auth/login',
  language: 'en'
} as AccountCreatedEmailProps;

export default AccountCreatedEmail;

const primaryColor = '#FF5722';

const credentialsBox = {
  backgroundColor: '#f5f5f5',
  border: '1px solid #ddd',
  borderRadius: '5px',
  padding: '20px',
  margin: '20px 0'
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '10px 0 5px 0',
  color: '#333'
};

const valueStyle = {
  fontSize: '16px',
  margin: '0 0 15px 0',
  color: '#555',
  fontFamily: 'monospace'
};

const passwordStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 15px 0',
  color: '#FF5722',
  fontFamily: 'monospace',
  letterSpacing: '2px'
};

const warningStyle = {
  fontSize: '14px',
  color: '#d32f2f',
  margin: '20px 0',
  padding: '10px',
  backgroundColor: '#ffebee',
  borderRadius: '5px'
};

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

