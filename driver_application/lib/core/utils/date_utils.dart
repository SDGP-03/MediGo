import 'package:intl/intl.dart';

/// Utility class for date and time formatting
class AppDateUtils {
  /// Get relative time string (e.g., "2 hours ago", "Yesterday")
  static String getRelativeTime(DateTime dateTime, {DateTime? now}) {
    final reference = now ?? DateTime.now();
    final difference = reference.difference(dateTime);
    final isFuture = difference.isNegative;
    final duration = difference.abs();

    if (duration.inSeconds < 60) {
      return isFuture ? 'in a few seconds' : 'Just now';
    } else if (duration.inMinutes < 60) {
      final minutes = duration.inMinutes;
      return isFuture
          ? 'in $minutes ${minutes == 1 ? 'minute' : 'minutes'}'
          : '$minutes ${minutes == 1 ? 'minute' : 'minutes'} ago';
    } else if (duration.inHours < 24) {
      final hours = duration.inHours;
      return isFuture
          ? 'in $hours ${hours == 1 ? 'hour' : 'hours'}'
          : '$hours ${hours == 1 ? 'hour' : 'hours'} ago';
    } else if (!isFuture && duration.inDays == 1) {
      return 'Yesterday';
    } else if (isFuture && duration.inDays == 1) {
      return 'Tomorrow';
    } else if (duration.inDays < 7) {
      return isFuture
          ? 'in ${duration.inDays} days'
          : '${duration.inDays} days ago';
    } else if (duration.inDays < 30) {
      final weeks = (duration.inDays / 7).floor();
      return isFuture
          ? 'in $weeks ${weeks == 1 ? 'week' : 'weeks'}'
          : '$weeks ${weeks == 1 ? 'week' : 'weeks'} ago';
    } else if (duration.inDays < 365) {
      final months = (duration.inDays / 30).floor();
      return isFuture
          ? 'in $months ${months == 1 ? 'month' : 'months'}'
          : '$months ${months == 1 ? 'month' : 'months'} ago';
    } else {
      final years = (duration.inDays / 365).floor();
      return isFuture
          ? 'in $years ${years == 1 ? 'year' : 'years'}'
          : '$years ${years == 1 ? 'year' : 'years'} ago';
    }
  }

  /// Format date as "MMM dd, yyyy" (e.g., "Jan 15, 2024")
  static String formatDate(DateTime dateTime) {
    return DateFormat('MMM dd, yyyy').format(dateTime);
  }

  /// Format time as "hh:mm a" (e.g., "02:30 PM")
  static String formatTime(DateTime dateTime) {
    return DateFormat('hh:mm a').format(dateTime);
  }

  /// Format date and time (e.g., "Jan 15, 2024 at 02:30 PM")
  static String formatDateTime(DateTime dateTime) {
    return DateFormat("MMM dd, yyyy 'at' hh:mm a").format(dateTime);
  }

  /// Get day label (Today, Yesterday, or formatted date)
  static String getDayLabel(DateTime dateTime, {DateTime? now}) {
    final reference = now ?? DateTime.now();
    final today = startOfDay(reference);
    final yesterday = today.subtract(const Duration(days: 1));
    final dateOnly = startOfDay(dateTime);

    if (dateOnly == today) {
      return 'Today';
    } else if (dateOnly == yesterday) {
      return 'Yesterday';
    } else if (reference.difference(dateOnly).inDays < 7) {
      return DateFormat('EEEE').format(dateTime); // e.g. "Monday"
    } else {
      return formatDate(dateTime);
    }
  }

  /// Check if two dates are on the same day
  static bool isSameDay(DateTime date1, DateTime date2) {
    return date1.year == date2.year &&
        date1.month == date2.month &&
        date1.day == date2.day;
  }

  /// Get start of day
  static DateTime startOfDay(DateTime dateTime) {
    return DateTime(dateTime.year, dateTime.month, dateTime.day);
  }

  /// Get end of day
  static DateTime endOfDay(DateTime dateTime) {
    return DateTime(
      dateTime.year,
      dateTime.month,
      dateTime.day,
      23,
      59,
      59,
      999,
    );
  }

  /// Check if date is today
  static bool isToday(DateTime dateTime, {DateTime? now}) {
    final reference = now ?? DateTime.now();
    return isSameDay(dateTime, reference);
  }

  /// Check if date is yesterday
  static bool isYesterday(DateTime dateTime, {DateTime? now}) {
    final reference = now ?? DateTime.now();
    return isSameDay(dateTime, reference.subtract(const Duration(days: 1)));
  }

  /// Get month name
  static String getMonthName(DateTime dateTime) {
    return DateFormat('MMMM').format(dateTime);
  }

  /// Get short month name
  static String getShortMonthName(DateTime dateTime) {
    return DateFormat('MMM').format(dateTime);
  }
}
