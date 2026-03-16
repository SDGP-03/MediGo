import 'package:driver_application/core/utils/date_utils.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';

void main() {
  setUpAll(() {
    Intl.defaultLocale = 'en_US';
  });

  group('AppDateUtils.getRelativeTime', () {
    final now = DateTime(2026, 3, 16, 12, 0, 0);

    test('handles seconds', () {
      expect(
        AppDateUtils.getRelativeTime(now.subtract(const Duration(seconds: 30)), now: now),
        'Just now',
      );
      expect(
        AppDateUtils.getRelativeTime(now.add(const Duration(seconds: 30)), now: now),
        'in a few seconds',
      );
    });

    test('handles minutes', () {
      expect(
        AppDateUtils.getRelativeTime(now.subtract(const Duration(minutes: 1)), now: now),
        '1 minute ago',
      );
      expect(
        AppDateUtils.getRelativeTime(now.add(const Duration(minutes: 2)), now: now),
        'in 2 minutes',
      );
    });

    test('handles hours', () {
      expect(
        AppDateUtils.getRelativeTime(now.subtract(const Duration(hours: 1)), now: now),
        '1 hour ago',
      );
      expect(
        AppDateUtils.getRelativeTime(now.add(const Duration(hours: 3)), now: now),
        'in 3 hours',
      );
    });

    test('handles yesterday/tomorrow', () {
      expect(
        AppDateUtils.getRelativeTime(now.subtract(const Duration(days: 1)), now: now),
        'Yesterday',
      );
      expect(
        AppDateUtils.getRelativeTime(now.add(const Duration(days: 1)), now: now),
        'Tomorrow',
      );
    });

    test('handles days/weeks/months/years', () {
      expect(
        AppDateUtils.getRelativeTime(now.subtract(const Duration(days: 3)), now: now),
        '3 days ago',
      );
      expect(
        AppDateUtils.getRelativeTime(now.add(const Duration(days: 6)), now: now),
        'in 6 days',
      );
      expect(
        AppDateUtils.getRelativeTime(now.subtract(const Duration(days: 14)), now: now),
        '2 weeks ago',
      );
      expect(
        AppDateUtils.getRelativeTime(now.add(const Duration(days: 30)), now: now),
        'in 1 month',
      );
      expect(
        AppDateUtils.getRelativeTime(now.subtract(const Duration(days: 365)), now: now),
        '1 year ago',
      );
    });
  });

  group('AppDateUtils formatting', () {
    test('formatDate/formatTime/formatDateTime are stable', () {
      final dt = DateTime(2026, 3, 16, 14, 30);
      expect(AppDateUtils.formatDate(dt), 'Mar 16, 2026');
      expect(AppDateUtils.formatTime(dt), '02:30 PM');
      expect(AppDateUtils.formatDateTime(dt), 'Mar 16, 2026 at 02:30 PM');
    });

    test('month helpers', () {
      final dt = DateTime(2026, 3, 16);
      expect(AppDateUtils.getMonthName(dt), 'March');
      expect(AppDateUtils.getShortMonthName(dt), 'Mar');
    });
  });

  group('AppDateUtils day helpers', () {
    final now = DateTime(2026, 3, 16, 12, 0, 0); // Monday

    test('getDayLabel returns Today/Yesterday', () {
      expect(AppDateUtils.getDayLabel(now, now: now), 'Today');
      expect(
        AppDateUtils.getDayLabel(now.subtract(const Duration(days: 1)), now: now),
        'Yesterday',
      );
    });

    test('getDayLabel returns weekday name within a week', () {
      expect(
        AppDateUtils.getDayLabel(now.subtract(const Duration(days: 2)), now: now),
        'Saturday',
      );
    });

    test('getDayLabel falls back to formatted date for older dates', () {
      final old = now.subtract(const Duration(days: 10));
      expect(AppDateUtils.getDayLabel(old, now: now), AppDateUtils.formatDate(old));
    });

    test('isSameDay/startOfDay/endOfDay/isToday/isYesterday', () {
      final morning = DateTime(2026, 3, 16, 0, 1);
      final evening = DateTime(2026, 3, 16, 23, 59);
      expect(AppDateUtils.isSameDay(morning, evening), true);

      expect(AppDateUtils.startOfDay(evening), DateTime(2026, 3, 16));
      expect(AppDateUtils.endOfDay(morning), DateTime(2026, 3, 16, 23, 59, 59, 999));

      expect(AppDateUtils.isToday(evening, now: now), true);
      expect(AppDateUtils.isYesterday(now.subtract(const Duration(days: 1)), now: now), true);
    });
  });
}
