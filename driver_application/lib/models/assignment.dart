import 'package:google_maps_flutter/google_maps_flutter.dart';

class Assignment {
  final String pickupName;
  final String pickupAddress;
  final LatLng pickupLatLng;

  final String dropName;
  final String dropAddress;
  final LatLng dropLatLng;

  Assignment({
    required this.pickupName,
    required this.pickupAddress,
    required this.pickupLatLng,
    required this.dropName,
    required this.dropAddress,
    required this.dropLatLng,
  });
}
