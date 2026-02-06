import 'dart:async';
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

            setState(() {
              driverMarker = updatedMarker;
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
  }

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

  // ================= CLEANUP =================

  @override
  void dispose() {
    positionStream?.cancel();
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

                  onMapCreated: (GoogleMapController mapController) async {
                    controllerGoogleMap = mapController;
                    googleMapsCompleterController.complete(mapController);

                    await loadMapStyle(); // load saved style
                    applyMapStyle(); // apply style

                    checkLocationPermission();
                  },
                ),
              ),
            ),

            const SizedBox(height: 10),

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
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                "Trip ID",
                                style: TextStyle(color: Colors.white70),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            "High Priority",
                            style: TextStyle(color: Colors.white, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // BODY
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        // PICKUP
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Icon(Icons.circle, size: 12, color: Colors.grey),
                            SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    "Pick Up From",
                                    style: TextStyle(color: Colors.black54),
                                  ),
                                  SizedBox(height: 4),
                                  Text(
                                    "City General Hospital",
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    "123 Medical Center Dr, Downtown",
                                    style: TextStyle(color: Colors.black54),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 18),

                        // DELIVERY
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Icon(Icons.location_on, color: Colors.red),
                            SizedBox(width: 6),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    "Deliver To",
                                    style: TextStyle(color: Colors.black54),
                                  ),
                                  SizedBox(height: 4),
                                  Text(
                                    "St. Mary's Medical Center",
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    "456 Healthcare Ave, Uptown",
                                    style: TextStyle(color: Colors.black54),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 18),

                        // ETA & DISTANCE
                        Row(
                          children: [
                            Expanded(
                              child: _InfoTile(
                                icon: Icons.access_time,
                                label: "ETA",
                                value: "18 mins",
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _InfoTile(
                                icon: Icons.near_me,
                                label: "Distance",
                                value: "12.4 km",
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 18),

                        // REQUESTED BY
                        Row(
                          children: [
                            const Icon(Icons.person_outline),
                            const SizedBox(width: 10),
                            const Expanded(
                              child: Text(
                                "Dr. Sarah Johnson",
                                style: TextStyle(fontWeight: FontWeight.w600),
                              ),
                            ),
                            ElevatedButton.icon(
                              onPressed: () {},
                              icon: const Icon(Icons.call, size: 16),
                              label: const Text("Call"),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.black,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // START NAVIGATION
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                    child: SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.navigation),
                        label: const Text(
                          "Start Navigation",
                          style: TextStyle(fontSize: 16),
                        ),
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
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.red.shade400),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: Colors.black54)),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
