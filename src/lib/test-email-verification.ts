// Test file to verify the email verification flow works correctly
// This shows how your simple API integration works

export async function testEmailVerificationFlow() {
  const email = "test@example.com";
  
  console.log("Testing email verification flow...");
  
  // Step 1: Send verification code
  console.log("Step 1: Sending verification code...");
  const response = await fetch(`https://api.theholylabs.com/global_auth?email=${encodeURIComponent(email)}`);
  const data = await response.json();
  
  console.log("API Response:", data);
  // Expected: {"message":"Verification code sent successfully","verification_code":"123456"}
  
  const verificationCode = data.verification_code;
  console.log("Verification code received:", verificationCode);
  
  // Step 2: User enters code (simulated)
  const userEnteredCode = "123456"; // This would come from user input
  
  // Step 3: Compare codes
  if (verificationCode === userEnteredCode) {
    console.log("✅ Code matches! User verified successfully");
    return { success: true, message: "Email verification successful" };
  } else {
    console.log("❌ Code doesn't match");
    return { success: false, message: "Invalid verification code" };
  }
}

// How it works in your app now:
/*
1. User enters email and clicks "Sign Up"
2. AuthPage calls sendVerificationCode() which calls your API
3. User gets redirected to /auth/verify-email?email=user@email.com&password=***&fullName=***
4. EmailVerificationPage shows the verification form
5. User enters the 6-digit code they received in email
6. verifyCodeAndCreateAccount() compares the codes
7. If match: Create Firebase user account
8. If no match: Show error message

NO TOKENS - Simple and clean!
*/
