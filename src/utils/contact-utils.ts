/**
 * Utility functions for contact interactions
 */

/**
 * Generate a prefill message for pet found notifications
 */
export function generatePetFoundMessage(petName: string, finderName?: string): string {
  const baseMessage = `I found your pet "${petName}". Your pet is in safe hands.`;
  
  if (finderName) {
    return `Hi, I'm ${finderName}. ${baseMessage}`;
  }
  
  return baseMessage;
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
 * Generate SMS prefill URL with message
 */
export function generateSMSPrefillUrl(phoneNumber: string, message: string): string {
  // Clean phone number - remove all non-digit characters except +
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  const encodedMessage = encodeURIComponent(message);
  
  return `sms:${cleanPhone}?body=${encodedMessage}`;
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
