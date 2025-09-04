import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import EmailLayout from './email-layout';

interface PasswordResetEmailProps {
  userFirstname: string;
  resetUrl: string;
}

const PasswordResetEmail = ({
  userFirstname,
  resetUrl
}: PasswordResetEmailProps) => {
  return (
    <EmailLayout userFirstname={userFirstname}>
      <Section>
        <Heading style={h1}>Reset your password</Heading>
        <Text>
          We received a request to reset your password for your Facepet account.
          If you didn't make this request, you can safely ignore this email.
        </Text>
        <Text>
          To reset your password, click the button below. This link will expire
          in 1 hour for security reasons.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={resetUrl}>
            Reset Password
          </Button>
        </Section>
        <Text style={linkText}>
          Or copy and paste this URL into your browser:
        </Text>
        <Text style={urlText}>{resetUrl}</Text>
        <Hr />
        <Section>
          <Text style={securityText}>
            <strong>Security Notice:</strong>
          </Text>
          <Text style={securityText}>
            • This link will expire in 1 hour
          </Text>
          <Text style={securityText}>
            • If you didn't request this reset, please ignore this email
          </Text>
          <Text style={securityText}>
            • Never share this link with anyone
          </Text>
          <Text style={securityText}>
            • Facepet will never ask you to disclose your password via email
          </Text>
        </Section>
      </Section>
    </EmailLayout>
  );
};

PasswordResetEmail.PreviewProps = {
  userFirstname: 'Alan',
  resetUrl: 'https://facepet.club/auth/reset-password?token=abc123'
} as PasswordResetEmailProps;

export default PasswordResetEmail;

const h1 = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '15px'
};

const btnContainer = {
  textAlign: 'center' as const,
  margin: '20px 0'
};

const button = {
  backgroundColor: '#FF5722',
  borderRadius: '5px',
  color: '#fff',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: 'bold'
};

const linkText = {
  fontSize: '14px',
  color: '#666',
  marginTop: '20px'
};

const urlText = {
  fontSize: '12px',
  color: '#999',
  wordBreak: 'break-all' as const,
  backgroundColor: '#f5f5f5',
  padding: '8px',
  borderRadius: '3px',
  fontFamily: 'monospace'
};

const securityText = {
  fontSize: '12px',
  color: '#666',
  margin: '4px 0'
};
