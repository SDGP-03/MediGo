import 'package:encrypt/encrypt.dart';

class EncryptionUtils {
  // IMPORTANT: In a production app, this key should be loaded from a secure source.
  // Must be 32 characters for AES-256.
  static const String _secretKey = 'medigo-patient-secret-key-2025-!';
  static const String _initialVector = 'medigo-initial-v';
  
  static final _key = Key.fromUtf8(_secretKey);
  static final _iv = IV.fromUtf8(_initialVector);
  
  static String encrypt(String? plainText) {
    if (plainText == null || plainText.isEmpty) return '';
    
    try {
      final encrypter = Encrypter(AES(_key, mode: AESMode.cbc));
      final encrypted = encrypter.encrypt(plainText, iv: _iv);
      return encrypted.base64;
    } catch (e) {
      return plainText;
    }
  }

  static String decrypt(String? cipherText) {
    if (cipherText == null || cipherText.isEmpty) return '';
    
    // Heuristic: if it's too short or contains spaces, it's likely not encrypted
    if (cipherText.length < 10 || cipherText.contains(' ')) return cipherText;

    try {
      final encrypter = Encrypter(AES(_key, mode: AESMode.cbc));
      return encrypter.decrypt(Encrypted.fromBase64(cipherText), iv: _iv);
    } catch (e) {
      return cipherText;
    }
  }
}
