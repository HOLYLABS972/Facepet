import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import EmailLayout from './email-layout';

interface PasswordChangeNotificationProps {
  userFirstname: string;
}

const PasswordChangeNotification = ({
  userFirstname
}: PasswordChangeNotificationProps) => {
  const supportUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://facepet.club'}/support`;
  
  return (
    <EmailLayout userFirstname={userFirstname}>
      <Section>
        <Heading style={h1}>Your password has been changed</Heading>
        <Text>
          This email confirms that the password for your Facepet account has
          been successfully changed.
        </Text>
        <Text>
          <strong>When:</strong> {new Date().toLocaleString()}
        </Text>
        <Text>
          If you made this change, no further action is required. Your account
          is secure and you can continue using Facepet with your new password.
        </Text>
        <Hr />
        <Section style={alertSection}>
          <Text style={alertTitle}>
            <strong>⚠️ Didn't change your password?</strong>
          </Text>
          <Text style={alertText}>
            If you did not make this change, your account may have been
            compromised. Please take immediate action:
          </Text>
          <Text style={alertText}>
            1. Contact our support team immediately
          </Text>
          <Text style={alertText}>
            2. Check your account for any unauthorized activity
          </Text>
          <Text style={alertText}>
            3. Consider enabling two-factor authentication
          </Text>
          <Section style={btnContainer}>
            <Button style={alertButton} href={supportUrl}>
              Contact Support
            </Button>
          </Section>
        </Section>
        <Hr />
        <Section>
          <Text style={securityText}>
            <strong>Security Tips:</strong>
          </Text>
          <Text style={securityText}>
            • Use a strong, unique password for your Facepet account
          </Text>
          <Text style={securityText}>
            • Never share your password with anyone
          </Text>
          <Text style={securityText}>
            • Consider using a password manager
          </Text>
          <Text style={securityText}>
            • Log out of shared or public devices
          </Text>
        </Section>
      </Section>
    </EmailLayout>
  );
};

PasswordChangeNotification.PreviewProps = {
  userFirstname: 'Alan'
} as PasswordChangeNotificationProps;

export default PasswordChangeNotification;

const h1 = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '15px'
};

const btnContainer = {
  textAlign: 'center' as const,
  margin: '20px 0'
};

const alertButton = {
  backgroundColor: '#dc3545',
  borderRadius: '5px',
  color: '#fff',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: 'bold'
};

const alertSection = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeaa7',
  borderRadius: '5px',
  padding: '15px',
  margin: '20px 0'
};

const alertTitle = {
  color: '#856404',
  fontSize: '16px',
  marginBottom: '10px'
};

const alertText = {
  color: '#856404',
  fontSize: '14px',
  margin: '5px 0'
};

const securityText = {
  fontSize: '12px',
  color: '#666',
  margin: '4px 0'
};
