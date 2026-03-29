import CIryptoJS from 'crypto-js';//brings in a library of "math recipes" used for encryption.

// SECRET_KEY — This is the "Password" for your encryption. Without this exact string, nobody can unlock the data.
// 256-bit key (32 bytes)
const SECRET_KEY = CryptoJS.enc.Utf8.parse('medigo-patient-secret-key-2025-!');
// 128-bit IV-Initialization Vector,adds an extra layer of complexity so the encryption isn't predictable.(16 bytes)
const FIXED_IV = CryptoJS.enc.Utf8.parse('medigo-initial-v');

/**
 * Encrypts a string using AES-256-CBC.
 * Returns the encrypted string in Base64 format or the original value if encryption fails.
 */
export const encryptData = (data: string | number | undefined | null): string => {//This function takes your plain text and scrambles it.
    if (data === undefined || data === null) return '';
    const stringValue = String(data);
    if (!stringValue) return '';//Checks if the data is empty, it returns an empty string.

    try {
        const encrypted = CryptoJS.AES.encrypt(stringValue, SECRET_KEY, {//This is the actual "lock" being applied.
            iv: FIXED_IV,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return encrypted.toString(); // Returns the scrambled text in a format called Base64
    } catch (error) {//goes wrong, it just returns the original text instead of crashing the app.
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
            iv: FIXED_IV,//ses the AES recipe in reverse to "unlock" the text using the same Secret Key.
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        const result = decrypted.toString(CryptoJS.enc.Utf8);//Converts the raw decrypted bytes back into readable text.
        return result || ciphertext;
    } catch (error) {
        return ciphertext;
    }
};

/**
 * Recursively decrypts all string values in an object.
 */
export const decryptObject = <T>(obj: T): T => {//unlock an entire folder (object) of data at once.
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {//If it finds a List (Array), it runs the decryption on every item in that list.
        return obj.map(item => decryptObject(item)) as any;
    }

    const decrypted: any = {};
    for (const [key, value] of Object.entries(obj)) {//It goes through every "Label" (key) in the folder.
        if (typeof value === 'string') {//If the value is a string, it decrypts it.
            decrypted[key] = decryptData(value);
        } else if (typeof value === 'object' && value !== null) {//If the value is another object, it repeats the process (recursion).
            decrypted[key] = decryptObject(value);
        } else {//If it’s a number or something else, it leaves it alone.
            decrypted[key] = value;
        }
    }
    return decrypted as T;
};
