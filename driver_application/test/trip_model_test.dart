import 'package:driver_application/models/trip_model.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Trip.fromJson', () {
    test('supports different key names and parses fields', () {
      final trip = Trip.fromJson('t1', {
        'pickupName': 'Pickup A',
        'dropName': 'Drop B',
        'patientName': 'Patient X',
        'timestamp': 1700000000, // seconds since epoch
        'status': 'In Progress',
        'distance': '12.34',
        'duration': '125',
        'fare': 100,
        'priority': 'urgent',
        'notes': 'note',
      });

      expect(trip.id, 't1');
      expect(trip.pickup, 'Pickup A');
      expect(trip.dropoff, 'Drop B');
      expect(trip.patientName, 'Patient X');
      expect(trip.timestamp.millisecondsSinceEpoch, 1700000000 * 1000);
      expect(trip.status, 'in_progress');
      expect(trip.distance, 12.34);
      expect(trip.duration, 125);
      expect(trip.earnings, 100.0);
      expect(trip.priority, 'urgent');
      expect(trip.notes, 'note');
    });

    test('normalizes canceled/cancelled', () {
      final trip = Trip.fromJson('t2', {
        'pickup': 'A',
        'dropoff': 'B',
        'timestamp': 1700000000000, // milliseconds since epoch
        'status': 'canceled',
      });

      expect(trip.status, 'cancelled');
      expect(trip.timestamp.millisecondsSinceEpoch, 1700000000000);
    });

    test('parses ISO timestamp strings', () {
      final trip = Trip.fromJson('t3', {
        'pickup': 'A',
        'dropoff': 'B',
        'timestamp': '2026-03-16T10:20:30.000Z',
        'status': 'completed',
      });

      expect(trip.timestamp.toUtc(), DateTime.parse('2026-03-16T10:20:30.000Z'));
      expect(trip.isCompleted, true);
    });
  });

  group('Trip.toJson', () {
    test('omits null optional fields', () {
      final trip = Trip(
        id: 't1',
        pickup: 'P',
        dropoff: 'D',
        timestamp: DateTime.fromMillisecondsSinceEpoch(1),
        status: 'completed',
      );

      final json = trip.toJson();
      expect(json['pickup'], 'P');
      expect(json['dropoff'], 'D');
      expect(json['timestamp'], 1);
      expect(json['status'], 'completed');
      expect(json.containsKey('patientName'), false);
      expect(json.containsKey('distance'), false);
      expect(json.containsKey('duration'), false);
      expect(json.containsKey('earnings'), false);
      expect(json.containsKey('priority'), false);
      expect(json.containsKey('notes'), false);
    });
  });

  group('Trip formatted getters', () {
    test('formattedDistance', () {
      expect(
        Trip(
          id: 't',
          pickup: 'P',
          dropoff: 'D',
          timestamp: DateTime.fromMillisecondsSinceEpoch(0),
          status: 'completed',
        ).formattedDistance,
        'N/A',
      );

      expect(
        Trip(
          id: 't',
          pickup: 'P',
          dropoff: 'D',
          timestamp: DateTime.fromMillisecondsSinceEpoch(0),
          status: 'completed',
          distance: 12.345,
        ).formattedDistance,
        '12.3 km',
      );
    });

    test('formattedDuration', () {
      expect(
        Trip(
          id: 't',
          pickup: 'P',
          dropoff: 'D',
          timestamp: DateTime.fromMillisecondsSinceEpoch(0),
          status: 'completed',
        ).formattedDuration,
        'N/A',
      );

      expect(
        Trip(
          id: 't',
          pickup: 'P',
          dropoff: 'D',
          timestamp: DateTime.fromMillisecondsSinceEpoch(0),
          status: 'completed',
          duration: 45,
        ).formattedDuration,
        '45m',
      );

      expect(
        Trip(
          id: 't',
          pickup: 'P',
          dropoff: 'D',
          timestamp: DateTime.fromMillisecondsSinceEpoch(0),
          status: 'completed',
          duration: 125,
        ).formattedDuration,
        '2h 5m',
      );
    });

    test('formattedEarnings', () {
      expect(
        Trip(
          id: 't',
          pickup: 'P',
          dropoff: 'D',
          timestamp: DateTime.fromMillisecondsSinceEpoch(0),
          status: 'completed',
        ).formattedEarnings,
        'N/A',
      );

      expect(
        Trip(
          id: 't',
          pickup: 'P',
          dropoff: 'D',
          timestamp: DateTime.fromMillisecondsSinceEpoch(0),
          status: 'completed',
          earnings: 100,
        ).formattedEarnings,
        'Rs. 100.00',
      );
    });
  });
}
