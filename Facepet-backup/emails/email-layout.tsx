import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Text
} from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
  userFirstname: string;
  children: React.ReactNode;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.facepet.club';

const bgColor = '#f0f0f0'; // Customize your primary background color

export const EmailLayout = ({ userFirstname, children }: EmailLayoutProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>Tiny pet guardians for big peace of mind.</Preview>
      <Container style={container}>
        <Img
          src={`${baseUrl}/assets/Facepet-logo.png`}
          width="221"
          height="86"
          alt="Facepet"
          style={logo}
        />
        <Text style={paragraph}>Hi {userFirstname},</Text>
        {children}
        <Text style={paragraph}>
          Best,
          <br />
          The Facepet team
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Tel Aviv, Israel</Text>
      </Container>
    </Body>
  </Html>
);

EmailLayout.PreviewProps = {
  userFirstname: 'Alan'
} as EmailLayoutProps;

export default EmailLayout;

const main = {
  backgroundColor: bgColor,
  color: '#333',
  paddingRight: '4px',
  paddingLeft: '4px',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px'
};

const logo = {
  margin: '0 auto'
};

const paragraph = {
  lineHeight: '26px'
};

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0'
};

const footer = {
  color: '#8898aa',
  fontSize: '12px'
};
