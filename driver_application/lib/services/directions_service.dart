import 'dart:convert';

import 'package:driver_application/global/global_var.dart';
import 'package:driver_application/models/directions_route.dart';
import 'package:flutter_polyline_points/flutter_polyline_points.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:http/http.dart' as http;

class DirectionsService {
  Future<DirectionsRoute> getDrivingRoute({
    required LatLng origin,
    required LatLng destination,
  }) async {
    // Google Routes API (Directions v2): https://routes.googleapis.com/directions/v2:computeRoutes
    final uri = Uri.parse(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
    );

    final body = <String, dynamic>{
      "origin": {
        "location": {
          "latLng": {
            "latitude": origin.latitude,
            "longitude": origin.longitude,
          },
        },
      },
      "destination": {
        "location": {
          "latLng": {
            "latitude": destination.latitude,
            "longitude": destination.longitude,
          },
        },
      },
      "travelMode": "DRIVE",
      "routingPreference": "TRAFFIC_AWARE_OPTIMAL",
      "computeAlternativeRoutes": false,
      "units": "METRIC",
      "languageCode": "en-US",
    };

    final response = await http.post(
      uri,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleMapKey,
        "X-Goog-FieldMask":
            "routes.distanceMeters,"
            "routes.duration,"
            "routes.polyline.encodedPolyline,"
            "routes.viewport,"
            "routes.legs.steps.distanceMeters,"
            "routes.legs.steps.staticDuration,"
            "routes.legs.steps.endLocation.latLng,"
            "routes.legs.steps.navigationInstruction.instructions,"
            "routes.legs.steps.navigationInstruction.maneuver",
      },
      body: json.encode(body),
    );

    final decodedBody = json.decode(response.body) as Map<String, dynamic>;

    if (response.statusCode != 200) {
      final error = decodedBody["error"] as Map<String, dynamic>?;
      final message = error?["message"]?.toString() ?? "Unknown error";
      final status = error?["status"]?.toString() ?? "UNKNOWN";
      throw Exception("Routes API failed ($status): $message");
    }

    final routes = (decodedBody["routes"] as List?)?.cast<Map<String, dynamic>>();
    if (routes == null || routes.isEmpty) {
      throw Exception("Routes API returned no routes");
    }

    final firstRoute = routes.first;
    final polyline = firstRoute["polyline"] as Map<String, dynamic>? ?? {};
    final encodedPolyline = polyline["encodedPolyline"]?.toString() ?? "";
    final polylineDecoded = PolylinePoints.decodePolyline(encodedPolyline);
    final polylinePoints =
        polylineDecoded.map((p) => LatLng(p.latitude, p.longitude)).toList();

    final totalDistanceMeters = (firstRoute["distanceMeters"] as num?)?.toInt() ?? 0;
    final totalDurationSeconds = _parseDurationSeconds(firstRoute["duration"]);

    final steps = <DirectionsStep>[];
    final legs = (firstRoute["legs"] as List?)?.cast<Map<String, dynamic>>() ?? const [];
    if (legs.isNotEmpty) {
      final leg0 = legs.first;
      final stepsJson =
          (leg0["steps"] as List?)?.cast<Map<String, dynamic>>() ?? const [];
      for (final step in stepsJson) {
        steps.add(_parseRoutesStep(step));
      }
    }

    final bounds = _parseBounds(firstRoute["viewport"], polylinePoints);

    return DirectionsRoute(
      polylinePoints: polylinePoints,
      steps: steps,
      totalDistanceText: _formatDistance(totalDistanceMeters),
      totalDistanceMeters: totalDistanceMeters,
      totalDurationText: _formatDuration(totalDurationSeconds),
      totalDurationSeconds: totalDurationSeconds,
      bounds: bounds,
    );
  }

  DirectionsStep _parseRoutesStep(Map<String, dynamic> step) {
    final distanceMeters = (step["distanceMeters"] as num?)?.toInt() ?? 0;
    final durationSeconds = _parseDurationSeconds(step["staticDuration"]);

    final instructionObj = step["navigationInstruction"] as Map<String, dynamic>?;
    final instruction =
        instructionObj?["instructions"]?.toString().trim().isNotEmpty == true
            ? instructionObj!["instructions"].toString()
            : "Continue";

    final endLoc = step["endLocation"] as Map<String, dynamic>? ?? {};
    final endLatLng = endLoc["latLng"] as Map<String, dynamic>? ?? {};
    final end = LatLng(
      (endLatLng["latitude"] as num?)?.toDouble() ?? 0,
      (endLatLng["longitude"] as num?)?.toDouble() ?? 0,
    );

    return DirectionsStep(
      instruction: instruction,
      maneuver: instructionObj?["maneuver"]?.toString(),
      distanceText: _formatDistance(distanceMeters),
      distanceMeters: distanceMeters,
      durationText: _formatDuration(durationSeconds),
      durationSeconds: durationSeconds,
      endLocation: end,
    );
  }

  int _parseDurationSeconds(Object? duration) {
    // Routes API returns protobuf Duration strings like "123s".
    if (duration == null) return 0;
    final s = duration.toString().trim();
    if (!s.endsWith("s")) return 0;
    final numeric = s.substring(0, s.length - 1);
    return int.tryParse(numeric) ?? 0;
  }

  String _formatDistance(int meters) {
    if (meters < 1000) return "$meters m";
    final km = meters / 1000.0;
    return "${km.toStringAsFixed(km < 10 ? 1 : 0)} km";
  }

  String _formatDuration(int seconds) {
    if (seconds < 60) return "${seconds}s";
    final minutes = (seconds / 60).round();
    if (minutes < 60) return "$minutes min";
    final hours = minutes ~/ 60;
    final remMin = minutes % 60;
    if (remMin == 0) return "$hours hr";
    return "$hours hr $remMin min";
  }

  LatLngBounds _parseBounds(Object? viewport, List<LatLng> points) {
    final vp = viewport as Map<String, dynamic>?;
    if (vp != null) {
      final low = vp["low"] as Map<String, dynamic>?;
      final high = vp["high"] as Map<String, dynamic>?;
      final lowLatLng = low?["latitude"] != null && low?["longitude"] != null
          ? LatLng(
              (low!["latitude"] as num).toDouble(),
              (low["longitude"] as num).toDouble(),
            )
          : null;
      final highLatLng = high?["latitude"] != null && high?["longitude"] != null
          ? LatLng(
              (high!["latitude"] as num).toDouble(),
              (high["longitude"] as num).toDouble(),
            )
          : null;
      if (lowLatLng != null && highLatLng != null) {
        return LatLngBounds(southwest: lowLatLng, northeast: highLatLng);
      }
    }

    // Fallback: compute bounds from polyline points.
    if (points.isEmpty) {
      return LatLngBounds(
        southwest: LatLng(0, 0),
        northeast: LatLng(0, 0),
      );
    }
    double minLat = points.first.latitude;
    double maxLat = points.first.latitude;
    double minLng = points.first.longitude;
    double maxLng = points.first.longitude;
    for (final p in points) {
      minLat = p.latitude < minLat ? p.latitude : minLat;
      maxLat = p.latitude > maxLat ? p.latitude : maxLat;
      minLng = p.longitude < minLng ? p.longitude : minLng;
      maxLng = p.longitude > maxLng ? p.longitude : maxLng;
    }
    return LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );
  }
}
