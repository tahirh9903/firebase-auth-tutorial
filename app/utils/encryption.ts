// This is a simple encryption implementation. In a production environment,
// you should use a more secure encryption method and proper key management
export const encrypt = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // Generate a random key
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt']
  );

  // Generate a random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the data
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    data
  );

  // Convert the encrypted data to base64
  const encryptedArray = new Uint8Array(encryptedData);
  const base64Encrypted = btoa(String.fromCharCode.apply(null, [...encryptedArray]));
  
  // Return the encrypted data with the IV
  const base64Iv = btoa(String.fromCharCode.apply(null, [...iv]));
  return `${base64Iv}.${base64Encrypted}`;
}; 