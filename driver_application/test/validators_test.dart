import 'package:driver_application/core/utils/validators.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Validators.validateName', () {
    test('requires non-empty', () {
      expect(Validators.validateName(null), 'Name is required');
      expect(Validators.validateName(''), 'Name is required');
      expect(Validators.validateName('   '), 'Name is required');
    });

    test('requires at least 2 characters', () {
      expect(
        Validators.validateName('A'),
        'Name must be at least 2 characters',
      );
      expect(
        Validators.validateName(' A '),
        'Name must be at least 2 characters',
      );
    });

    test('accepts valid names', () {
      expect(Validators.validateName('Ab'), isNull);
      expect(Validators.validateName('  Ab  '), isNull);
      expect(Validators.validateName('John Doe'), isNull);
    });
  });

  group('Validators.validateEmail', () {
    test('requires non-empty', () {
      expect(Validators.validateEmail(null), 'Email is required');
      expect(Validators.validateEmail(''), 'Email is required');
      expect(Validators.validateEmail('   '), 'Email is required');
    });

    test('allows only @medigo.lk emails', () {
      expect(
        Validators.validateEmail('test@gmail.com'),
        'Please enter a valid @medigo.lk email address',
      );
      expect(Validators.validateEmail('driver@medigo.lk'), isNull);
      expect(Validators.validateEmail('driver@medigo.lk '), isNull);
    });
  });

  group('Validators.validatePhone', () {
    test('requires non-empty', () {
      expect(Validators.validatePhone(null), 'Phone number is required');
      expect(Validators.validatePhone(''), 'Phone number is required');
      expect(Validators.validatePhone('   '), 'Phone number is required');
    });

    test('accepts Sri Lankan local format', () {
      expect(Validators.validatePhone('0771234567'), isNull);
      expect(Validators.validatePhone('(077) 123-4567'), isNull);
      expect(Validators.validatePhone('077 123 4567'), isNull);
    });

    test('accepts Sri Lankan international format', () {
      expect(Validators.validatePhone('+94771234567'), isNull);
    });

    test('rejects invalid formats', () {
      expect(
        Validators.validatePhone('771234567'),
        'Please enter a valid phone number (e.g., 0771234567)',
      );
      expect(
        Validators.validatePhone('01112345678'),
        'Please enter a valid phone number (e.g., 0771234567)',
      );
    });
  });

  group('Validators.validatePassword', () {
    test('allows empty (optional password change)', () {
      expect(Validators.validatePassword(null), isNull);
      expect(Validators.validatePassword(''), isNull);
    });

    test('enforces strength rules', () {
      expect(
        Validators.validatePassword('Ab1'),
        'Password must be at least 8 characters',
      );
      expect(
        Validators.validatePassword('abcdefgh1'),
        'Password must contain at least one uppercase letter',
      );
      expect(
        Validators.validatePassword('ABCDEFGH1'),
        'Password must contain at least one lowercase letter',
      );
      expect(
        Validators.validatePassword('Abcdefgh'),
        'Password must contain at least one number',
      );
      expect(Validators.validatePassword('Abcdefg1'), isNull);
    });
  });

  group('Validators.validatePasswordConfirmation', () {
    test('requires confirmation when changing password', () {
      expect(
        Validators.validatePasswordConfirmation('', 'Abcdefg1'),
        'Please confirm your new password',
      );
      expect(
        Validators.validatePasswordConfirmation('Different', 'Abcdefg1'),
        'Passwords do not match',
      );
      expect(
        Validators.validatePasswordConfirmation('Abcdefg1', 'Abcdefg1'),
        isNull,
      );
    });

    test('does nothing when original password is empty', () {
      expect(Validators.validatePasswordConfirmation(null, ''), isNull);
      expect(Validators.validatePasswordConfirmation('', ''), isNull);
      expect(Validators.validatePasswordConfirmation('anything', ''), isNull);
    });
  });

  group('Validators.validateCurrentPassword', () {
    test('requires current password only when new password is provided', () {
      expect(
        Validators.validateCurrentPassword('', true),
        'Current password is required to change password',
      );
      expect(Validators.validateCurrentPassword('', false), isNull);
      expect(Validators.validateCurrentPassword('current', true), isNull);
    });
  });

  group('Validators password strength helpers', () {
    test('strength is capped at 4', () {
      expect(Validators.getPasswordStrength(''), 0);
      expect(Validators.getPasswordStrength('abcdefgh'), 2);
      expect(Validators.getPasswordStrength('Abcdefg1'), 4);
      expect(Validators.getPasswordStrength('Abcdefg1!@#XYZ'), 4);
    });

    test('strength labels match', () {
      expect(Validators.getPasswordStrengthLabel(0), 'Very Weak');
      expect(Validators.getPasswordStrengthLabel(1), 'Weak');
      expect(Validators.getPasswordStrengthLabel(2), 'Fair');
      expect(Validators.getPasswordStrengthLabel(3), 'Good');
      expect(Validators.getPasswordStrengthLabel(4), 'Strong');
      expect(Validators.getPasswordStrengthLabel(99), '');
    });
  });
}
