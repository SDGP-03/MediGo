import 'dart:async';
import 'dart:convert';
import 'package:driver_application/models/assignment.dart';
import 'package:driver_application/pages/navigation_page.dart';
import 'package:flutter_polyline_points/flutter_polyline_points.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';

import '../widgets/map_styles.dart';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:driver_application/global/global_var.dart';
import '../widgets/side_menu.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final Completer<GoogleMapController> googleMapsCompleterController =
      Completer<GoogleMapController>();

  GoogleMapController? controllerGoogleMap;

  Position? driverCurrentPosition;

  StreamSubscription<Position>? positionStream;

  Marker? driverMarker;

  String selectedMapStyle = "standard";

  Assignment? currentAssignment;

  Set<Polyline> polylines = {};

  // Firebase reference for driver location tracking
  DatabaseReference? _driverLocationRef;

  // ================= LIVE LOCATION TRACKING =================

  void startLiveLocationUpdates() {
    LocationSettings locationSettings = const LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    );

    positionStream =
        Geolocator.getPositionStream(locationSettings: locationSettings).listen(
          (Position position) {
            driverCurrentPosition = position;

            // FETCH ASSIGNMENT ON FIRST LOCATION
            if (currentAssignment == null) {
              fetchAssignedTask();
            }

            LatLng newPosition = LatLng(position.latitude, position.longitude);

            Marker updatedMarker = Marker(
              markerId: const MarkerId("driverMarker"),
              position: newPosition,
              icon: BitmapDescriptor.defaultMarkerWithHue(
                BitmapDescriptor.hueRed,
              ),
              infoWindow: const InfoWindow(title: "You"),
            );

            setState(() {
              driverMarker = updatedMarker;
            });

            // Push location to Firebase for admin dashboard tracking
            _pushLocationToFirebase(position);

            controllerGoogleMap?.animateCamera(
              CameraUpdate.newLatLng(newPosition),
            );
          },
        );
  }

  // ================= FIREBASE LOCATION PUSH =================

  void _initDriverLocationRef() {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      _driverLocationRef = FirebaseDatabase.instance
          .ref()
          .child('driver_locations')
          .child(user.uid);
    }
  }

  Future<void> _pushLocationToFirebase(Position position) async {
    if (_driverLocationRef == null) {
      _initDriverLocationRef();
    }
    if (_driverLocationRef == null) return;

    try {
      final user = FirebaseAuth.instance.currentUser;
      await _driverLocationRef!.set({
        'lat': position.latitude,
        'lng': position.longitude,
        'accuracy': position.accuracy,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'isOnline': true,
        'driverName': user?.displayName ?? user?.email ?? 'Driver',
      });
    } catch (e) {
      debugPrint('Failed to push location to Firebase: $e');
    }
  }

  Future<void> _setDriverOffline() async {
    if (_driverLocationRef != null) {
      try {
        await _driverLocationRef!.update({'isOnline': false});
      } catch (e) {
        debugPrint('Failed to set driver offline: $e');
      }
    }
  }

  // ================= PERMISSION HANDLER =================

  Future<void> checkLocationPermission() async {
    LocationPermission permission = await Geolocator.checkPermission();

    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.deniedForever) return;

    startLiveLocationUpdates();
  }

  // ================= MAP STYLE HANDLER =================

  Future<void> loadMapStyle() async {
    final prefs = await SharedPreferences.getInstance();
    selectedMapStyle = prefs.getString("mapStyle") ?? "standard";
  }

  void applyMapStyle() {
    if (controllerGoogleMap == null) return;

    switch (selectedMapStyle) {
      case "silver":
        controllerGoogleMap!.setMapStyle(MapStyles.silver);
        break;

      case "retro":
        controllerGoogleMap!.setMapStyle(MapStyles.retro);
        break;

      case "dark":
        controllerGoogleMap!.setMapStyle(MapStyles.dark);
        break;

      case "night":
        controllerGoogleMap!.setMapStyle(MapStyles.night);
        break;

      case "aubergine":
        controllerGoogleMap!.setMapStyle(MapStyles.aubergine);
        break;

      default:
        controllerGoogleMap!.setMapStyle(null); // Standard
    }
  }

  // ================= ASSIGNMENT HANDLER =================

  Future<void> fetchAssignedTask() async {
    await Future.delayed(const Duration(seconds: 1));

    if (driverCurrentPosition == null) return;

    setState(() {
      currentAssignment = Assignment(
        pickupName: "Pickup Location",
        pickupAddress: "Address",
        pickupLatLng: LatLng(
          driverCurrentPosition!.latitude,
          driverCurrentPosition!.longitude,
        ),
        dropName: "Destination",
        dropAddress: "Address",
        dropLatLng: const LatLng(6.9271, 79.8612),
      );
    });

    drawRouteToDestination();
  }

  // ================= ROUTE DRAWER =================

  Future<void> drawRouteToDestination() async {
    if (currentAssignment == null) return;

    final origin =
        "${currentAssignment!.pickupLatLng.latitude},${currentAssignment!.pickupLatLng.longitude}";
    final destination =
        "${currentAssignment!.dropLatLng.latitude},${currentAssignment!.dropLatLng.longitude}";

    final url =
        "https://maps.googleapis.com/maps/api/directions/json"
        "?origin=$origin"
        "&destination=$destination"
        "&key=YOUR_GOOGLE_MAP_KEY";

    final response = await http.get(Uri.parse(url));
    final data = json.decode(response.body);

    final points = PolylinePoints.decodePolyline(
      data["routes"][0]["overview_polyline"]["points"],
    );

    setState(() {
      polylines = {
        Polyline(
          polylineId: const PolylineId("route"),
          color: Colors.red,
          width: 5,
          points: points.map((e) => LatLng(e.latitude, e.longitude)).toList(),
        ),
      };
    });
  }

  // ================= CLEANUP =================

  @override
  void dispose() {
    positionStream?.cancel();
    _setDriverOffline();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    loadMapStyle().then((_) {
      applyMapStyle();
    });
  }

  // ================= UI =================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const SideMenu(),

      appBar: AppBar(
        backgroundColor: Colors.red.shade500,
        title: const Text('MediGo', style: TextStyle(color: Colors.white)),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: Row(
              children: [
                Icon(Icons.circle, color: Colors.green, size: 10),
                SizedBox(width: 6),
                Text('Online', style: TextStyle(color: Colors.white)),
              ],
            ),
          ),
        ],
      ),

      body: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),

                child: GoogleMap(
                  mapType: MapType.normal,
                  myLocationEnabled: true,
                  initialCameraPosition: googlePlexInitialPosition,
                  markers: driverMarker != null ? {driverMarker!} : {},
                  polylines: polylines,
                  onMapCreated: (GoogleMapController mapController) async {
                    controllerGoogleMap = mapController;
                    googleMapsCompleterController.complete(mapController);

                    await loadMapStyle();
                    applyMapStyle();
                    checkLocationPermission();
                  },
                ),
              ),
            ),

            const SizedBox(height: 10),

            // ================= ASSIGNMENT CARD =================
            if (currentAssignment != null)
              Container(
                margin: const EdgeInsets.only(bottom: 6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: const [
                    BoxShadow(
                      color: Colors.black12,
                      blurRadius: 12,
                      offset: Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // HEADER
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.red.shade500,
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(24),
                          topRight: Radius.circular(24),
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text(
                                  "Current Assignment",
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  "Trip ID",
                                  style: TextStyle(
                                    color: Color.fromARGB(255, 223, 223, 223),
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          _locationTile(
                            title: "Pick Up From",
                            name: currentAssignment!.pickupName,
                            address: currentAssignment!.pickupAddress,
                            icon: Icons.circle,
                          ),
                          const SizedBox(height: 18),
                          _locationTile(
                            title: "Destination",
                            name: currentAssignment!.dropName,
                            address: currentAssignment!.dropAddress,
                            icon: Icons.location_on,
                          ),
                        ],
                      ),
                    ),

                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
                      child: SizedBox(
                        width: double.infinity,
                        height: 54,
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.navigation),
                          label: const Text(
                            "Start Navigation",
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => NavigationPage(
                                  destination: currentAssignment!.dropLatLng,
                                ),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red.shade500,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _locationTile({
    required String title,
    required String name,
    required String address,
    required IconData icon,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          icon,
          size: icon == Icons.circle ? 12 : 24,
          color: icon == Icons.circle ? Colors.grey : Colors.red,
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.black54)),
              const SizedBox(height: 4),
              Text(
                name,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(address, style: const TextStyle(color: Colors.black54)),
            ],
          ),
        ),
      ],
    );
  }
}
