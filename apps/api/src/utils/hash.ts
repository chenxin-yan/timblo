// Helper function to convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const hash = async (code: string): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(18));

  // Convert the salt to base64 string
  const storedSalt = arrayBufferToBase64(salt.buffer);

  const codeSalted = new TextEncoder().encode(code + storedSalt);
  const hashedCode = await crypto.subtle.digest("SHA-256", codeSalted);

  // Convert the hash to base64 string
  const hashedString = arrayBufferToBase64(hashedCode);

  return `${hashedString}:${storedSalt}`;
};

export const compare = async (
  code: string,
  storedHash: string,
): Promise<boolean> => {
  const [hash, salt] = storedHash.split(":");

  const codeSalted = new TextEncoder().encode(code + salt);
  const hashedCode = await crypto.subtle.digest("SHA-256", codeSalted);
  const hashedString = arrayBufferToBase64(hashedCode);

  return hash === hashedString;
};
