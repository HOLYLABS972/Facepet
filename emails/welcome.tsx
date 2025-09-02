import { Button, Section, Text } from '@react-email/components';
import EmailLayout from './email-layout';

interface FacepetWelcomeEmailProps {
  userFirstname: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : '';

export const FacepetWelcomeEmail = ({
  userFirstname
}: FacepetWelcomeEmailProps) => (
  <EmailLayout userFirstname={userFirstname}>
    <Text>
      Welcome to Facepet, the sales intelligence platform that helps you uncover
      qualified leads and close deals faster.
    </Text>
    <Section style={btnContainer}>
      <Button style={button} href="https://facepet.site">
        Get started
      </Button>
    </Section>
  </EmailLayout>
);

FacepetWelcomeEmail.PreviewProps = {
  userFirstname: 'Alan'
} as FacepetWelcomeEmailProps;

export default FacepetWelcomeEmail;

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
