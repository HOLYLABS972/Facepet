import 'dotenv/config'; // Loads environment variables from .env

async function testEmail() {
  try {
    // await sendVerificationEmail('amitb324@gmail.com', '123456');
    console.log('Test email sent successfully.');
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

testEmail();
