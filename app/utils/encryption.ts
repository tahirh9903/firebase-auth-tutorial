// This is a simple encryption implementation for demo purposes.
// In a production environment, use a more secure encryption method.
export const encrypt = async (text: string): Promise<string> => {
  // Simple base64 encoding for demo purposes
  if (typeof text !== 'string') {
    throw new Error('Input must be a string');
  }
  
  try {
    // Use btoa for web, and a fallback for React Native
    if (typeof btoa === 'function') {
      return btoa(text);
    } else {
      // React Native environment
      return Buffer.from(text).toString('base64');
    }
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

export const decrypt = async (encryptedText: string): Promise<string> => {
  if (typeof encryptedText !== 'string') {
    throw new Error('Input must be a string');
  }

  try {
    // Use atob for web, and a fallback for React Native
    if (typeof atob === 'function') {
      return atob(encryptedText);
    } else {
      // React Native environment
      return Buffer.from(encryptedText, 'base64').toString('utf-8');
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}; 