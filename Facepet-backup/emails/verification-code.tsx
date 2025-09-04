import { Heading, Hr, Section, Text } from '@react-email/components';
import EmailLayout from './email-layout';

const VerificationEmailContent = ({
  userFirstname,
  verificationCode
}: {
  verificationCode: string;
  userFirstname: string;
}) => {
  return (
    <EmailLayout userFirstname={userFirstname}>
      <Section>
        <Heading style={h1}>Verify your email address</Heading>
        <Text>
          Thanks for starting the new Facepet account creation process. We want
          to make sure it's really you. Please enter the following verification
          code when prompted. If you don&apos;t want to create an account, you
          can ignore this message.
        </Text>
        <Section style={verificationSection}>
          <Text style={verifyText}>Verification code</Text>
          <Text style={codeText}>{verificationCode}</Text>
          <Text style={validityText}>(This code is valid for 5 minutes)</Text>
        </Section>
        <Hr />
        <Section>
          <Text style={securityTitle}>
            <strong>Security Notice:</strong>
          </Text>
          <Text style={securityText}>
            • This code will expire in 5 minutes for your security
          </Text>
          <Text style={securityText}>• Never share this code with anyone</Text>
          <Text style={securityText}>
            • If you didn't request this verification, please ignore this email
          </Text>
          <Text style={securityText}>
            • Facepet will never ask you to disclose your password, credit card,
            or banking information via email
          </Text>
        </Section>
      </Section>
    </EmailLayout>
  );
};

VerificationEmailContent.PreviewProps = {
  userFirstname: 'Alan',
  verificationCode: 512355
} as unknown as { userFirstname: string; verificationCode: string };

export default VerificationEmailContent;

const h1 = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '15px'
};

const verifyText = {
  margin: 0,
  fontWeight: 'bold',
  textAlign: 'center' as const
};

const codeText = {
  fontWeight: 'bold',
  fontSize: '36px',
  margin: '10px 0',
  textAlign: 'center' as const
};

const validityText = {
  margin: '0px',
  textAlign: 'center' as const
};

const verificationSection = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const mainText = { marginBottom: '14px' };

const cautionText = { margin: '0px' };

const securityTitle = {
  fontSize: '14px',
  color: '#333',
  marginBottom: '10px'
};

const securityText = {
  fontSize: '12px',
  color: '#666',
  margin: '4px 0'
};
