import 'dart:async';
import 'dart:convert';
import 'package:driver_application/models/assignment.dart';
import 'package:driver_application/pages/navigation_page.dart';
import 'package:flutter_polyline_points/flutter_polyline_points.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:connectivity_plus/connectivity_plus.dart';
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
  GoogleMapController? controllerGoogleMap;

  StreamSubscription<Position>? positionStream;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  Marker? driverMarker;

  String selectedMapStyle = "standard";
  MapType _mapType = MapType.normal;

  Assignment? currentAssignment;

  Set<Polyline> polylines = {};

  bool _isOnline = true;

  // Firebase reference for driver location tracking
  DatabaseReference? _driverLocationRef;

  @override
  void initState() {
    super.initState();
    _initConnectivityListener();
    MapStyles.selectedStyleNotifier.addListener(_onMapStyleChanged);
  }

  void _initConnectivityListener() {
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen((
      List<ConnectivityResult> results,
    ) {
      bool online = results.any((result) => result != ConnectivityResult.none);
      setState(() {
        _isOnline = online;
      });
    });

    // Check initial state
    Connectivity().checkConnectivity().then((results) {
      bool online = results.any((result) => result != ConnectivityResult.none);
      setState(() {
        _isOnline = online;
      });
    });
  }

  // ================= LIVE LOCATION TRACKING =================

  void startLiveLocationUpdates() {
    LocationSettings locationSettings = const LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    );

    positionStream =
        Geolocator.getPositionStream(locationSettings: locationSettings).listen(
          (Position position) {
            // Start listening for assignments once we have location
            if (currentAssignment == null && _assignmentSubscription == null) {
              _startListeningForAssignments();
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

  bool _onDisconnectSetup = false;

  void _initDriverLocationRef() {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      _driverLocationRef = FirebaseDatabase.instance
          .ref()
          .child('driver_locations')
          .child(user.uid);

      // Set up onDisconnect to automatically mark driver offline
      // This runs on Firebase server when client disconnects (even if app crashes)
      if (!_onDisconnectSetup) {
        _driverLocationRef!.onDisconnect().update({
          'isOnline': false,
          'timestamp': ServerValue.timestamp,
        });
        _onDisconnectSetup = true;

        // Fetch driver name from database if not already cached
        if (_cachedDriverName == null) {
          _fetchDriverName(user.uid);
        }
      }
    }
  }

  // Cached driver name from the drivers database
  String? _cachedDriverName;

  /// Fetch driver name from the drivers database node
  Future<void> _fetchDriverName(String uid) async {
    try {
      final driversRef = FirebaseDatabase.instance
          .ref()
          .child('drivers')
          .child(uid);
      final snapshot = await driversRef.child('name').get();
      if (snapshot.exists && snapshot.value != null) {
        _cachedDriverName = snapshot.value.toString();
      }
    } catch (e) {
      debugPrint('Failed to fetch driver name: $e');
    }
  }

  Future<void> _pushLocationToFirebase(Position position) async {
    if (_driverLocationRef == null) {
      _initDriverLocationRef();
    }
    if (_driverLocationRef == null) return;

    try {
      final user = FirebaseAuth.instance.currentUser;

      // Ensure we have the driver name before pushing (fetch if not cached)
      if (_cachedDriverName == null && user != null) {
        await _fetchDriverName(user.uid);
      }

      await _driverLocationRef!.set({
        'lat': position.latitude,
        'lng': position.longitude,
        'accuracy': position.accuracy,
        'timestamp': ServerValue.timestamp,
        'isOnline': true,
        'driverName':
            _cachedDriverName ?? user?.displayName ?? user?.email ?? 'Driver',
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

  Future<void> _goToCurrentLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();

      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.deniedForever ||
          permission == LocationPermission.denied) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Location permission not granted')),
        );
        return;
      }

      startLiveLocationUpdates();

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      final target = LatLng(position.latitude, position.longitude);
      controllerGoogleMap?.animateCamera(CameraUpdate.newLatLngZoom(target, 16));
    } catch (e) {
      debugPrint('Failed to get current location: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to get current location')),
      );
    }
  }

  // ================= MAP STYLE HANDLER =================

  Future<void> loadMapStyle() async {
    final prefs = await SharedPreferences.getInstance();
    selectedMapStyle = MapStyles.normalizeStyle(prefs.getString("mapStyle"));
    MapStyles.setSelectedStyle(selectedMapStyle);
  }

  void applyMapStyle() {
    if (controllerGoogleMap == null) return;
    final styleJson = MapStyles.byName(selectedMapStyle);
    controllerGoogleMap!.setMapStyle(styleJson.isEmpty ? null : styleJson);
  }

  void _onMapStyleChanged() {
    if (!mounted) return;
    final newStyle = MapStyles.selectedStyleNotifier.value;
    if (newStyle == selectedMapStyle) return;

    setState(() {
      selectedMapStyle = newStyle;
    });
    applyMapStyle();
  }

  // ================= ASSIGNMENT HANDLER =================

  StreamSubscription<DatabaseEvent>? _assignmentSubscription;

  /// Listen to Firebase for transfer requests assigned to this driver
  void _startListeningForAssignments() {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final requestsRef = FirebaseDatabase.instance.ref().child(
      'transfer_requests',
    );

    // Listen for requests assigned to this driver with status 'pending'
    _assignmentSubscription = requestsRef
        .orderByChild('driverId')
        .equalTo(user.uid)
        .onValue
        .listen((event) {
          final data = event.snapshot.value;
          if (data == null) return;

          final requests = data as Map<dynamic, dynamic>;

          // Find pending requests
          for (var entry in requests.entries) {
            final requestData = entry.value as Map<dynamic, dynamic>;
            if (requestData['status'] == 'pending') {
              final assignment = Assignment.fromJson(entry.key, requestData);
              _showTripAlert(assignment);
              break; // Show one at a time
            }
          }
        });
  }

  /// Show trip alert dialog for incoming assignment
  void _showTripAlert(Assignment assignment) {
    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(
              assignment.priority == 'critical'
                  ? Icons.warning
                  : assignment.priority == 'urgent'
                  ? Icons.priority_high
                  : Icons.local_hospital,
              color: assignment.priority == 'critical'
                  ? Colors.red
                  : assignment.priority == 'urgent'
                  ? Colors.orange
                  : Colors.green,
            ),
            const SizedBox(width: 8),
            Text(
              'New ${assignment.priority.toUpperCase()} Transfer',
              style: const TextStyle(fontSize: 18),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Patient: ${assignment.patientName}',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              if (assignment.patientAge != null)
                Text('Age: ${assignment.patientAge}'),
              if (assignment.patientGender != null)
                Text('Gender: ${assignment.patientGender}'),
              const Divider(),
              Text('From: ${assignment.pickupName}'),
              Text('To: ${assignment.dropName}'),
              const Divider(),
              if (assignment.requiresDoctor)
                const Text(
                  '⚕️ Doctor Required',
                  style: TextStyle(color: Colors.red),
                ),
              if (assignment.requiresVentilator)
                const Text(
                  '🫁 Ventilator Required',
                  style: TextStyle(color: Colors.orange),
                ),
              if (assignment.requiresOxygen)
                const Text(
                  '💨 Oxygen Required',
                  style: TextStyle(color: Colors.blue),
                ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _rejectAssignment(assignment.requestId);
            },
            child: const Text('REJECT', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            onPressed: () {
              Navigator.pop(ctx);
              _acceptAssignment(assignment);
            },
            child: const Text('ACCEPT'),
          ),
        ],
      ),
    );
  }

  /// Accept the assignment
  Future<void> _acceptAssignment(Assignment assignment) async {
    final requestRef = FirebaseDatabase.instance
        .ref()
        .child('transfer_requests')
        .child(assignment.requestId);

    await requestRef.update({
      'status': 'accepted',
      'acceptedAt': ServerValue.timestamp,
    });

    setState(() {
      currentAssignment = assignment;
    });

    drawRouteToDestination();
  }

  /// Reject the assignment
  Future<void> _rejectAssignment(String requestId) async {
    final requestRef = FirebaseDatabase.instance
        .ref()
        .child('transfer_requests')
        .child(requestId);

    await requestRef.update({
      'status': 'cancelled',
      'driverId': null, // Unassign so admin can reassign
    });
  }

  /// Mark trip as started (in_progress)
  Future<void> _startTrip() async {
    if (currentAssignment == null) return;

    final requestRef = FirebaseDatabase.instance
        .ref()
        .child('transfer_requests')
        .child(currentAssignment!.requestId);

    await requestRef.update({
      'status': 'in_progress',
      'startedAt': ServerValue.timestamp,
    });
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
        "&key=$googleMapKey";

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
    _assignmentSubscription?.cancel();
    _connectivitySubscription?.cancel();
    MapStyles.selectedStyleNotifier.removeListener(_onMapStyleChanged);
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
        leading: Builder(
          builder: (context) => Padding(
            padding: const EdgeInsets.fromLTRB(8, 12, 8, 12),
            child: GestureDetector(
              onTap: () => Scaffold.of(context).openDrawer(),
              child: Container(
                decoration: BoxDecoration(
                  color: const Color.fromARGB(133, 237, 164, 164),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.menu, color: Colors.white),
              ),
            ),
          ),
        ),
        title: const Text('MediGo', style: TextStyle(color: Colors.white)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(
              children: [
                Icon(
                  Icons.circle,
                  color: _isOnline ? Colors.green : Colors.grey,
                  size: 12,
                ),
                const SizedBox(width: 6),
                Text(
                  _isOnline ? 'Online' : 'Offline',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
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
                child: Stack(
                  children: [
                    GoogleMap(
                      mapType: _mapType,
                      zoomControlsEnabled: false,
                      myLocationEnabled: true,
                      myLocationButtonEnabled: false,
                      initialCameraPosition: googlePlexInitialPosition,
                      markers: driverMarker != null ? {driverMarker!} : {},
                      polylines: polylines,
                      onMapCreated: (GoogleMapController mapController) async {
                        controllerGoogleMap = mapController;

                        await loadMapStyle();
                        applyMapStyle();
                        checkLocationPermission();
                      },
                    ),
                    Positioned(
                      top: 12,
                      right: 12,
                      child: Material(
                        color: Colors.white,
                        shape: const CircleBorder(),
                        elevation: 4,
                        child: PopupMenuButton<MapType>(
                          tooltip: 'Map type',
                          icon: const Icon(Icons.layers_outlined),
                          onSelected: (value) {
                            setState(() {
                              _mapType = value;
                            });
                          },
                          itemBuilder: (context) => const [
                            PopupMenuItem(
                              value: MapType.normal,
                              child: Text('Default'),
                            ),
                            PopupMenuItem(
                              value: MapType.satellite,
                              child: Text('Satellite'),
                            ),
                            PopupMenuItem(
                              value: MapType.terrain,
                              child: Text('Terrain'),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 12,
                      right: 12,
                      child: Material(
                        color: Colors.white,
                        shape: const CircleBorder(),
                        elevation: 4,
                        child: IconButton(
                          tooltip: 'Current location',
                          icon: const Icon(Icons.my_location),
                          onPressed: _goToCurrentLocation,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 10),

            // ================= ISSUE REPORT CARD =================
            if (currentAssignment == null)
              Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.all(18),
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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Expanded(
                          child: Text(
                            "Report Ambulance Issues",
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      "Report service, maintenance, breakdown, or other problems before your next assignment.",
                      style: TextStyle(color: Colors.black54),
                    ),
                    const SizedBox(height: 14),

                    SizedBox(
                      width: double.infinity,
                      height: 46,
                      child: ElevatedButton.icon(
                        onPressed: _showIssueReportOptions,
                        icon: const Icon(
                          Icons.edit_note_rounded,
                          color: Colors.white,
                        ),
                        label: const Text(
                          "Report Issue",
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red.shade500,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

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
                              children: [
                                const Text(
                                  "Current Assignment",
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  "Trip ID: ${currentAssignment!.requestId}",
                                  style: const TextStyle(
                                    color: Color.fromARGB(255, 223, 223, 223),
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          _priorityBadge(currentAssignment!.priority),
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
                          icon: const Icon(
                            Icons.navigation,
                            color: Colors.white,
                          ),
                          label: const Text(
                            "Start Navigation",
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          onPressed: () async {
                            // Update trip status to in_progress
                            await _startTrip();
                            _showNavigationOptionDialog();
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

  void _showIssueReportOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Report Issue Type",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            const Text(
              "Choose the issue you want to report.",
              style: TextStyle(color: Colors.black54),
            ),
            const SizedBox(height: 12),
            ListTile(
              leading: const Icon(
                Icons.miscellaneous_services,
                color: Colors.blue,
              ),
              title: const Text("Service"),
              onTap: () => _showIssueDetailsDialog(ctx, "Service"),
            ),
            ListTile(
              leading: const Icon(Icons.build_circle, color: Colors.orange),
              title: const Text("Maintenance"),
              onTap: () => _showIssueDetailsDialog(ctx, "Maintenance"),
            ),
            ListTile(
              leading: const Icon(Icons.car_repair, color: Colors.red),
              title: const Text("Breakdown"),
              onTap: () => _showIssueDetailsDialog(ctx, "Breakdown"),
            ),
            ListTile(
              leading: const Icon(Icons.error_outline, color: Colors.grey),
              title: const Text("Other Problems"),
              onTap: () => _showIssueDetailsDialog(ctx, "Other Problems"),
            ),
          ],
        ),
      ),
    );
  }

  void _showIssueDetailsDialog(BuildContext sheetContext, String issueType) {
    Navigator.pop(sheetContext);
    final detailsController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text("$issueType Issue"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Add extra details if needed (optional).",
              style: TextStyle(color: Colors.black54),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: detailsController,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: "Describe the problem...",
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () {
              final details = detailsController.text.trim();
              Navigator.pop(dialogContext);
              _submitIssue(issueType, details);
            },
            child: const Text("Submit"),
          ),
        ],
      ),
    );
  }

  void _submitIssue(String issueType, String details) {
    final hasDetails = details.isNotEmpty;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          hasDetails
              ? "$issueType report sent with extra details."
              : "$issueType report sent successfully.",
        ),
      ),
    );
  }

  void _showNavigationOptionDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Select Navigation Method",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.map, color: Colors.blue),
              title: const Text("Google Maps"),
              subtitle: const Text("Use external Google Maps app"),
              onTap: () async {
                Navigator.pop(ctx);
                final lat = currentAssignment!.dropLatLng.latitude;
                final lng = currentAssignment!.dropLatLng.longitude;
                final url = Uri.parse(
                  'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&travelmode=driving',
                );

                if (await canLaunchUrl(url)) {
                  await launchUrl(url, mode: LaunchMode.externalApplication);
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Could not open Google Maps')),
                  );
                }
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.navigation, color: Colors.red),
              title: const Text("MediGo Navigation"),
              subtitle: const Text("Stay inside the MediGo app"),
              onTap: () {
                Navigator.pop(ctx);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => NavigationPage(
                      destination: currentAssignment!.dropLatLng,
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  Widget _priorityBadge(String priority) {
    Color bgColor = Colors.green;
    String label = "Standard";

    if (priority == "critical") {
      label = "Critical";
    } else if (priority == "urgent") {
      label = "Urgent";
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.bold,
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
