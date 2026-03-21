import CryptoJS from 'crypto-js';

// IMPORTANT: In a production app, this key should be loaded from an environment variable or a secure vault.
// 256-bit key (32 bytes)
const SECRET_KEY = CryptoJS.enc.Utf8.parse('medigo-patient-secret-key-2025-!');
// 128-bit IV (16 bytes)
const FIXED_IV = CryptoJS.enc.Utf8.parse('medigo-initial-v');

/**
 * Encrypts a string using AES-256-CBC.
 * Returns the encrypted string in Base64 format or the original value if encryption fails.
 */
export const encryptData = (data: string | number | undefined | null): string => {
    if (data === undefined || data === null) return '';
    const stringValue = String(data);
    if (!stringValue) return '';

    try {
        const encrypted = CryptoJS.AES.encrypt(stringValue, SECRET_KEY, {
            iv: FIXED_IV,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return encrypted.toString(); // Base64
    } catch (error) {
        console.error('Encryption failed:', error);
        return stringValue;
    }
};

/**
 * Decrypts a string using AES-256-CBC.
 * Returns the decrypted string or the original value if decryption fails.
 */
export const decryptData = (ciphertext: string | number | undefined | null): string => {
    if (typeof ciphertext === 'number') return String(ciphertext);
    if (!ciphertext || typeof ciphertext !== 'string') return ciphertext?.toString() || '';

    // Heuristic: if it's too short or contains spaces, it's likely not encrypted
    if (ciphertext.length < 10 || ciphertext.includes(' ')) return ciphertext;

    try {
        const decrypted = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY, {
            iv: FIXED_IV,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        const result = decrypted.toString(CryptoJS.enc.Utf8);
        return result || ciphertext;
    } catch (error) {
        return ciphertext;
    }
};

/**
 * Recursively decrypts all string values in an object.
 */
export const decryptObject = <T>(obj: T): T => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => decryptObject(item)) as any;
    }

    const decrypted: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            decrypted[key] = decryptData(value);
        } else if (typeof value === 'object' && value !== null) {
            decrypted[key] = decryptObject(value);
        } else {
            decrypted[key] = value;
        }
    }
    return decrypted as T;
};
