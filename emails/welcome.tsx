import { Button, Section, Text } from '@react-email/components';
import EmailLayout from './email-layout';

interface ChapizWelcomeEmailProps {
  userFirstname: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : '';

export const ChapizWelcomeEmail = ({
  userFirstname
}: ChapizWelcomeEmailProps) => (
  <EmailLayout userFirstname={userFirstname}>
    <Text>
      Welcome to Chapiz, the pet safety platform that helps you keep your pets safe
      qualified leads and close deals faster.
    </Text>
    <Section style={btnContainer}>
      <Button style={button} href="https://facepet.club">
        Get started
      </Button>
    </Section>
  </EmailLayout>
);

ChapizWelcomeEmail.PreviewProps = {
  userFirstname: 'Alan'
} as ChapizWelcomeEmailProps;

export default ChapizWelcomeEmail;

const primaryColor = '#FF5722'; // Customize your accent color

const btnContainer = {
  textAlign: 'center' as const
};

const button = {
  backgroundColor: primaryColor,
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px'
};
