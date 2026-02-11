import 'dart:async';

import 'package:driver_application/global/global_var.dart';
import 'package:flutter/material.dart';
import 'package:flutter_polyline_points/flutter_polyline_points.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class NavigationPage extends StatefulWidget {
  const NavigationPage({super.key, required this.destination});

  final LatLng destination;

  @override
  State<NavigationPage> createState() => _NavigationPageState();
}

class _NavigationPageState extends State<NavigationPage> {
  GoogleMapController? controllerGoogleMap;

  Position? driverCurrentPosition;

  StreamSubscription<Position>? positionStream;

  Set<Polyline> polylines = {};
  Set<Marker> markers = {};

  // ================= LIVE LOCATION TRACKING =================

  void startLiveLocationUpdates() {
    LocationSettings locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10, // update every 10 meters
    );

    positionStream =
        Geolocator.getPositionStream(locationSettings: locationSettings).listen(
          (Position position) {
            driverCurrentPosition = position;

            LatLng newPosition = LatLng(position.latitude, position.longitude);

            // Update marker
            Marker updatedMarker = Marker(
              markerId: const MarkerId("driverMarker"),
              position: newPosition,
              icon: BitmapDescriptor.defaultMarkerWithHue(
                BitmapDescriptor.hueRed,
              ),
              infoWindow: const InfoWindow(title: "You"),
            );

            if (!mounted) return;
            setState(() {
              // Maintain markers set for the map
              markers.removeWhere((m) => m.markerId.value == "driverMarker");
              markers.add(updatedMarker);
            });

            // Move camera with driver
            if (controllerGoogleMap != null) {
              controllerGoogleMap!.animateCamera(
                CameraUpdate.newLatLng(newPosition),
              );
            }
          },
        );
  }

  // ================= PERMISSION HANDLER =================

  Future<void> checkLocationPermission() async {
    LocationPermission permission = await Geolocator.checkPermission();

    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.deniedForever) {
      return;
    }

    startLiveLocationUpdates();
    drawRouteToDestination();
  }

  @override
  void dispose() {
    positionStream?.cancel();
    super.dispose();
  }

  // ================= ROUTE DRAWER =================

  Future<void> drawRouteToDestination() async {
    // Add destination marker
    Marker destinationMarker = Marker(
      markerId: const MarkerId("destinationMarker"),
      position: widget.destination,
      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
      infoWindow: const InfoWindow(title: "Destination"),
    );

    if (!mounted) return;
    setState(() {
      markers.add(destinationMarker);
    });

    driverCurrentPosition ??= await Geolocator.getCurrentPosition();

    if (driverCurrentPosition == null) return;

    final origin =
        "${driverCurrentPosition!.latitude},${driverCurrentPosition!.longitude}";
    final destination =
        "${widget.destination.latitude},${widget.destination.longitude}";

    final url =
        "https://maps.googleapis.com/maps/api/directions/json"
        "?origin=$origin"
        "&destination=$destination"
        "&key=$googleMapKey";

    try {
      final response = await http.get(Uri.parse(url));
      final data = json.decode(response.body);

      if (data["routes"].isNotEmpty) {
        final points = PolylinePoints.decodePolyline(
          data["routes"][0]["overview_polyline"]["points"],
        );

        if (!mounted) return;
        setState(() {
          polylines = {
            Polyline(
              polylineId: const PolylineId("route"),
              color: Colors.red,
              width: 5,
              points: points
                  .map((e) => LatLng(e.latitude, e.longitude))
                  .toList(),
            ),
          };
        });
      }
    } catch (e) {
      debugPrint("Error fetching directions: $e");
    }
  }

  // ================= UI =================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          GoogleMap(
            mapType: MapType.normal,
            myLocationEnabled: true,
            initialCameraPosition: CameraPosition(
              target: widget.destination,
              zoom: 14,
            ),
            markers: markers,
            polylines: polylines,
            onMapCreated: (GoogleMapController mapController) async {
              controllerGoogleMap = mapController;
              checkLocationPermission();
            },
          ),

          // Top Back Button
          Positioned(
            top: 50,
            left: 20,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 10,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: IconButton(
                icon: Icon(Icons.arrow_back, color: Colors.black),
                onPressed: () {
                  Navigator.pop(context);
                },
              ),
            ),
          ),

          // Bottom Info Card
          Positioned(
            bottom: 20,
            left: 20,
            right: 20,
            child: Container(
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 15,
                    offset: Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Icon(Icons.navigation, color: Colors.red.shade500),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          "Navigating to Destination",
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 15),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red.shade500,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      child: Text(
                        "END NAVIGATION",
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
