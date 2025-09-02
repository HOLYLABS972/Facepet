// Test file to demonstrate the OTP flow
// This shows how your API integration works

export async function testOTPFlow() {
  const email = "test@example.com";
  
  // Step 1: Send verification code
  console.log("Step 1: Sending verification code...");
  const response = await fetch(`https://api.theholylabs.com/global_auth?email=${encodeURIComponent(email)}`);
  const data = await response.json();
  
  console.log("API Response:", data);
  // Expected: {"message":"Verification code sent successfully","verification_code":"123456"}
  
  const verificationCode = data.verification_code;
  console.log("Stored verification code:", verificationCode);
  
  // Step 2: User enters code (simulated)
  const userEnteredCode = "123456"; // This would come from user input
  
  // Step 3: Compare codes
  if (verificationCode === userEnteredCode) {
    console.log("✅ Code matches! User verified successfully");
    // Now create Firebase user account
    return { success: true, message: "User verified and account created" };
  } else {
    console.log("❌ Code doesn't match");
    return { success: false, message: "Invalid verification code" };
  }
}

// How it works in your AuthContext:
/*
1. User enters email and clicks "Send Code"
2. sendVerificationCode() calls your API and stores the code
3. User enters the 6-digit code they received
4. verifyCodeAndCreateAccount() compares the codes
5. If match: Create Firebase user account
6. If no match: Show error message
*/
