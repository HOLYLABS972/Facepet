/**
 * Utility functions for contact interactions
 */

/**
 * Generate a prefill message for pet found notifications
 */
export function generatePetFoundMessage(petName: string, finderName?: string, language: string = 'en'): string {
  if (language === 'he') {
    const baseMessage = `מצאתי את חיית המחמד שלך "${petName}". חיית המחמד שלך בידיים בטוחות.`;
    
    if (finderName) {
      return `שלום, אני ${finderName}. ${baseMessage}`;
    }
    
    return baseMessage;
  }
  
  // Default English message
  const baseMessage = `I found your pet "${petName}". Your pet is in safe hands.`;
  
  if (finderName) {
    return `Hi, I'm ${finderName}. ${baseMessage}`;
  }
  
  return baseMessage;
}

/**
 * Generate email subject for pet found notifications
 */
export function generatePetFoundEmailSubject(petName: string, language: string = 'en'): string {
  if (language === 'he') {
    return `חיית מחמד נמצאה: ${petName}`;
  }
  
  return `Pet Found: ${petName}`;
}

/**
 * Generate email prefill URL with subject and body
 */
export function generateEmailPrefillUrl(
  email: string, 
  subject: string, 
  body: string
): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  
  return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Generate WhatsApp prefill URL with message
 */
export function generateWhatsAppPrefillUrl(phoneNumber: string, message: string): string {
  // Clean phone number - remove all non-digit characters except +
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure phone number starts with country code
  const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
  
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}


/**
 * Check if a phone number is likely a WhatsApp number
 * This is a simple heuristic - in practice, you might want to use WhatsApp Business API
 */
export function isLikelyWhatsApp(phoneNumber: string): boolean {
  // Simple check - if it starts with + and has 10+ digits, likely WhatsApp
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  return cleanPhone.startsWith('+') && cleanPhone.length >= 10;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters except +
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, add it
  if (!cleanPhone.startsWith('+')) {
    return `+${cleanPhone}`;
  }
  
  return cleanPhone;
}
