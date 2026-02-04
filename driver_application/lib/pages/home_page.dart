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

      body: GoogleMap(
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
    );
  }
}
