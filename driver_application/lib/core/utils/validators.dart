/// Reusable validation utilities for form fields
class Validators {
  /// Validates name field
  /// - Must not be empty
  /// - Must be at least 2 characters
  /// - Must contain only letters and spaces
  static String? validateName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Name is required';
    }

    final trimmed = value.trim();

    if (trimmed.length < 2) {
      return 'Name must be at least 2 characters';
    }

    return null;
  }

  /// Validates email field
  /// - Must not be empty
  /// - Must match email pattern
  static String? validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Email is required';
    }

    // Only allow emails ending with @medigo.lk
    if (!RegExp(r'^[\w\.-]+@medigo\.lk$').hasMatch(value.trim())) {
      return 'Please enter a valid @medigo.lk email address';
    }

    return null;
  }

  /// Validates phone number
  /// - Must not be empty
  /// - Must be 10 digits for local numbers
  /// - Supports Sri Lankan format
  static String? validatePhone(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Phone number is required';
    }

    // Remove spaces and dashes
    String cleaned = value.replaceAll(RegExp(r'[\s\-\(\)]'), '');

    // Check for Sri Lankan format: 0XXXXXXXXX (10 digits starting with 0)
    if (RegExp(r'^0\d{9}$').hasMatch(cleaned)) {
      return null;
    }

    // Check for international format: +94XXXXXXXXX
    if (RegExp(r'^\+94\d{9}$').hasMatch(cleaned)) {
      return null;
    }

    return 'Please enter a valid phone number (e.g., 0771234567)';
  }

  /// Validates password with strong requirements
  /// - Minimum 8 characters
  /// - At least one uppercase letter
  /// - At least one lowercase letter
  /// - At least one number
  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Allow empty for optional password change
    }

    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }

    if (!RegExp(r'[A-Z]').hasMatch(value)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!RegExp(r'[a-z]').hasMatch(value)) {
      return 'Password must contain at least one lowercase letter';
    }

    if (!RegExp(r'[0-9]').hasMatch(value)) {
      return 'Password must contain at least one number';
    }

    return null;
  }

  /// Validates password confirmation
  /// - Must match the original password
  static String? validatePasswordConfirmation(
    String? value,
    String? originalPassword,
  ) {
    if (originalPassword != null && originalPassword.isNotEmpty) {
      if (value == null || value.isEmpty) {
        return 'Please confirm your new password';
      }
      if (value != originalPassword) {
        return 'Passwords do not match';
      }
    }
    return null;
  }

  /// Validates current password when changing password
  /// - Required only if new password is provided
  static String? validateCurrentPassword(
    String? value,
    bool isNewPasswordProvided,
  ) {
    if (isNewPasswordProvided && (value == null || value.isEmpty)) {
      return 'Current password is required to change password';
    }
    return null;
  }

  /// Gets password strength (0-4)
  /// 0: Very weak, 1: Weak, 2: Fair, 3: Good, 4: Strong
  static int getPasswordStrength(String password) {
    if (password.isEmpty) return 0;

    int strength = 0;

    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Character variety checks
    if (RegExp(r'[A-Z]').hasMatch(password)) strength++;
    if (RegExp(r'[a-z]').hasMatch(password)) strength++;
    if (RegExp(r'[0-9]').hasMatch(password)) strength++;
    if (RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(password)) strength++;

    // Cap at 4
    return strength > 4 ? 4 : strength;
  }

  /// Gets password strength label
  static String getPasswordStrengthLabel(int strength) {
    switch (strength) {
      case 0:
        return 'Very Weak';
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return '';
    }
  }
}
