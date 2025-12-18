import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import EmailLayout from './email-layout';

interface EmailChangeConfirmationProps {
  userFirstname: string;
  confirmUrl: string;
}

const EmailChangeConfirmation = ({
  userFirstname,
  confirmUrl
}: EmailChangeConfirmationProps) => {
  return (
    <EmailLayout userFirstname={userFirstname}>
      <Section>
        <Heading style={h1}>Confirm your new email address</Heading>
        <Text>
          We received a request to change the email address associated with your
          Chapiz account to this email address.
        </Text>
        <Text>
          To confirm this change and complete the process, please click the
          button below. This link will expire in 24 hours for security reasons.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={confirmUrl}>
            Confirm Email Change
          </Button>
        </Section>
        <Text style={linkText}>
          Or copy and paste this URL into your browser:
        </Text>
        <Text style={urlText}>{confirmUrl}</Text>
        <Hr />
        <Section>
          <Text style={securityText}>
            <strong>Security Notice:</strong>
          </Text>
          <Text style={securityText}>
            • This link will expire in 24 hours
          </Text>
          <Text style={securityText}>
            • If you didn't request this change, please ignore this email
          </Text>
          <Text style={securityText}>
            • Your current email address will remain active until you confirm this change
          </Text>
          <Text style={securityText}>
            • If you have concerns, please contact our support team immediately
          </Text>
        </Section>
      </Section>
    </EmailLayout>
  );
};

EmailChangeConfirmation.PreviewProps = {
  userFirstname: 'Alan',
  confirmUrl: 'https://facepet.club/auth/confirm-email-change?token=abc123'
} as EmailChangeConfirmationProps;

export default EmailChangeConfirmation;

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
