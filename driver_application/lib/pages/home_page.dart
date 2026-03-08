import 'dart:async';
import 'package:driver_application/models/assignment.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';

import 'package:connectivity_plus/connectivity_plus.dart';
import '../widgets/map_styles.dart';
import 'package:flutter/material.dart';
import 'package:google_navigation_flutter/google_navigation_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:driver_application/global/global_var.dart';
import '../widgets/side_menu.dart';
import 'package:driver_application/pages/navigation_page.dart';
import 'package:driver_application/services/trip_history_service.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  GoogleMapViewController? controllerGoogleMap;

  StreamSubscription<Position>? positionStream;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  Marker? driverMarker;
  Marker? destinationMarker;

  Timer? heartbeatTimer;

  String selectedMapStyle = "standard";
  MapType _mapType = MapType.normal;

  Assignment? currentAssignment;

  bool _isOnline = true;
  String _language = 'English';
  bool get _isSinhala => _language == 'Sinhala';
  bool get _isTamil => _language == 'Tamil';

  // Firebase reference for driver location tracking
  DatabaseReference? _driverLocationRef;

  String? _activeRequestDialogId;

  String t(String en, String si, [String? ta]) {
    if (_isSinhala) return si;
    if (_isTamil) return ta ?? en;
    return en;
  }

  @override
  void initState() {
    super.initState();
    _loadLanguage();
    _initConnectivityListener();
    MapStyles.selectedStyleNotifier.addListener(_onMapStyleChanged);
  }

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _language = prefs.getString('language') ?? 'English';
    });
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

            final newPosition = LatLng(
              latitude: position.latitude,
              longitude: position.longitude,
            );

            // Push location to Firebase for admin dashboard tracking
            _pushLocationToFirebase(position);

            controllerGoogleMap?.animateCamera(
              CameraUpdate.newLatLng(newPosition),
            );
          },
        );
  }

  Future<void> _upsertDestinationMarker(LatLng position, String title) async {
    final controller = controllerGoogleMap;
    if (controller == null) return;

    final options = MarkerOptions(
      position: position,
      infoWindow: InfoWindow(title: title),
    );

    if (destinationMarker == null) {
      final created = await controller.addMarkers([options]);
      destinationMarker = created.isNotEmpty ? created.first : null;
      return;
    }

    final updated = destinationMarker!.copyWith(options: options);
    final res = await controller.updateMarkers([updated]);
    destinationMarker = res.isNotEmpty ? res.first : destinationMarker;
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
          'status': 'offline',
          'timestamp': ServerValue.timestamp,
        });
        _onDisconnectSetup = true;

        // Fetch driver name from database if not already cached
        if (_cachedDriverName == null) {
          _fetchDriverName(user.uid);
        }

        // Push an initial online status immediately so dashboard sees driver is active
        Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high)
            .then((position) => _pushLocationToFirebase(position))
            .catchError((e) => debugPrint('Initial location fetch failed: $e'));

        // Start a periodic heartbeat every 60 seconds to keep driver online
        // even if they are stationary (stationary distance filter = 10m)
        heartbeatTimer?.cancel();
        heartbeatTimer = Timer.periodic(const Duration(minutes: 1), (timer) {
          Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.low)
              .then((position) => _pushLocationToFirebase(position))
              .catchError((e) => debugPrint('Heartbeat location failed: $e'));
        });
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
        'status': currentAssignment != null ? 'busy' : 'online',
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
        await _driverLocationRef!.update({'status': 'offline'});
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
          SnackBar(
            content: Text(
              t(
                'Location permission not granted',
                'ස්ථාන අවසරය ලබා දී නැහැ',
                'இட அனுமதி வழங்கப்படவில்லை',
              ),
            ),
          ),
        );
        return;
      }

      startLiveLocationUpdates();

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      final target = LatLng(
        latitude: position.latitude,
        longitude: position.longitude,
      );
      controllerGoogleMap?.animateCamera(
        CameraUpdate.newLatLngZoom(target, 16),
      );
    } catch (e) {
      debugPrint('Failed to get current location: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            t(
              'Unable to get current location',
              'වත්මන් ස්ථානය ලබාගත නොහැක',
              'தற்போதைய இடத்தை பெற முடியவில்லை',
            ),
          ),
        ),
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
          if (currentAssignment != null) return;

          final requests = data as Map<dynamic, dynamic>;

          // Find pending requests
          for (var entry in requests.entries) {
            final requestData = entry.value as Map<dynamic, dynamic>;
            if (requestData['status'] == 'pending') {
              final assignment = Assignment.fromJson(entry.key, requestData);
              if (_activeRequestDialogId == assignment.requestId) return;
              _showTripAlert(assignment);
              break; // Show one at a time
            }
          }
        });
  }

  /// Show trip alert dialog for incoming assignment
  void _showTripAlert(Assignment assignment) {
    if (!mounted) return;

    _activeRequestDialogId = assignment.requestId;
    final priority = assignment.priority.toLowerCase();

    const brandPrimary = Color(0xFFFF6B6B);
    const brandSecondary = Color(0xFFFF9B7B);

    late final Color priorityColor;
    late final List<Color> gradientColors;

    switch (priority) {
      case 'critical':
        priorityColor = Colors.red.shade800;
        gradientColors = [Colors.red.shade900, brandPrimary];
        break;
      case 'urgent':
        priorityColor = Colors.red.shade700;
        gradientColors = [Colors.red.shade800, brandSecondary];
        break;
      default:
        priorityColor = brandPrimary;
        gradientColors = [brandPrimary, brandSecondary];
    }

    final patientAge = assignment.patientAge?.toString() ?? '?';
    final patientGender = assignment.patientGender ?? '?';
    final hasRequirements =
        assignment.requiresDoctor ||
        assignment.requiresVentilator ||
        assignment.requiresOxygen;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => PopScope(
        canPop: false,
        child: TweenAnimationBuilder<double>(
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOutBack,
          tween: Tween(begin: 0.0, end: 1.0),
          builder: (context, value, child) {
            return Transform.scale(
              scale: value,
              child: Opacity(
                opacity: value.clamp(0.0, 1.0),
                child: Dialog(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                  elevation: 12,
                  backgroundColor: Colors.white,
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      maxHeight: MediaQuery.of(context).size.height * 0.78,
                    ),
                    child: Container(
                      width: MediaQuery.of(context).size.width * 0.85,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        color: Colors.white,
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // --- HEADER ---
                          Container(
                            padding: const EdgeInsets.symmetric(
                              vertical: 20,
                              horizontal: 16,
                            ),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: gradientColors,
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: const BorderRadius.only(
                                topLeft: Radius.circular(24),
                                topRight: Radius.circular(24),
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.2),
                                    shape: BoxShape.circle,
                                  ),
                                  child: priority == 'critical'
                                      ? const Icon(
                                          Icons.warning_rounded,
                                          color: Colors.white,
                                          size: 28,
                                        )
                                      : priority == 'urgent'
                                      ? const Icon(
                                          Icons.priority_high_rounded,
                                          color: Colors.white,
                                          size: 28,
                                        )
                                      : Image.asset(
                                          'assets/icon/app_icon.png',
                                          height: 28,
                                          width: 28,
                                          fit: BoxFit.contain,
                                        ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        t(
                                          'New Request',
                                          'නව ඉල්ලීම',
                                          'புதிய கோரிக்கை',
                                        ).toUpperCase(),
                                        style: TextStyle(
                                          color: Colors.white.withValues(
                                            alpha: 0.8,
                                          ),
                                          fontSize: 10,
                                          letterSpacing: 1.2,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                      Text(
                                        t(
                                          '${priority.toUpperCase()} Transfer',
                                          'නව ${priority.toUpperCase()} මාරු කිරීම',
                                          'புதிய ${priority.toUpperCase()} மாற்றம்',
                                        ),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // --- CONTENT ---
                          Flexible(
                            fit: FlexFit.loose,
                            child: SingleChildScrollView(
                              child: Padding(
                                padding: const EdgeInsets.fromLTRB(
                                  20,
                                  24,
                                  20,
                                  16,
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Patient Info
                                    Row(
                                      children: [
                                        CircleAvatar(
                                          radius: 22,
                                          backgroundColor: priorityColor
                                              .withValues(alpha: 0.1),
                                          child: Text(
                                            assignment.patientName.isNotEmpty
                                                ? assignment.patientName[0]
                                                      .toUpperCase()
                                                : 'P',
                                            style: TextStyle(
                                              color: priorityColor,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 14),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                assignment.patientName,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 16,
                                                  color: Color(0xFF2D3133),
                                                ),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                "${t("Age", "වයස", "வயது")}: $patientAge • ${t("Gender", "ස්ත්‍රී/පුරුෂ", "பாலினம்")}: $patientGender",
                                                style: const TextStyle(
                                                  color: Colors.black54,
                                                  fontSize: 13,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),

                                    const SizedBox(height: 24),

                                    // Route Timeline
                                    Row(
                                      children: [
                                        Column(
                                          children: [
                                            Icon(
                                              Icons.radio_button_checked,
                                              size: 18,
                                              color: priorityColor,
                                            ),
                                            Container(
                                              width: 2,
                                              height: 30,
                                              color: priorityColor.withValues(
                                                alpha: 0.2,
                                              ),
                                            ),
                                            Icon(
                                              Icons.location_on,
                                              size: 20,
                                              color: priorityColor,
                                            ),
                                          ],
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                assignment.pickupName,
                                                style: const TextStyle(
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                              const SizedBox(height: 18),
                                              Text(
                                                assignment.dropName,
                                                style: const TextStyle(
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),

                                    if (hasRequirements) ...[
                                      const SizedBox(height: 24),

                                      // Requirements Chips
                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 8,
                                        children: [
                                          if (assignment.requiresDoctor)
                                            _buildRequirementChip(
                                              '⚕️ ${t('Doctor', 'වෛද්‍ය', 'மருத்துவர்')}',
                                              const Color(0xFFFFE0E0),
                                              Colors.red.shade800,
                                            ),
                                          if (assignment.requiresVentilator)
                                            _buildRequirementChip(
                                              '🫁 ${t('Ventilator', 'වෙන්ටිලේටර්', 'வென்டிலேட்டர்')}',
                                              const Color(0xFFFFE6E6),
                                              Colors.red.shade700,
                                            ),
                                          if (assignment.requiresOxygen)
                                            _buildRequirementChip(
                                              '💨 ${t('Oxygen', 'ඔක්සිජන්', 'ஆக்ஸிஜன்')}',
                                              const Color(0xFFFFF0F0),
                                              Colors.red.shade700,
                                            ),
                                        ],
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          ),

                          // --- ACTIONS ---
                          Padding(
                            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                            child: Row(
                              children: [
                                Expanded(
                                  child: TextButton(
                                    onPressed: () {
                                      Navigator.pop(ctx);
                                      _rejectAssignment(assignment.requestId);
                                      _activeRequestDialogId = null;
                                    },
                                    style: TextButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 14,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                    ),
                                    child: Text(
                                      t('REJECT', 'ප්‍රතික්ෂේප', 'நிராகரி'),
                                      style: TextStyle(
                                        color: Colors.grey.shade600,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.1,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  flex: 2,
                                  child: GestureDetector(
                                    onTap: () {
                                      Navigator.pop(ctx);
                                      _acceptAssignment(assignment);
                                      _activeRequestDialogId = null;
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 14,
                                      ),
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: gradientColors,
                                        ),
                                        borderRadius: BorderRadius.circular(16),
                                        boxShadow: [
                                          BoxShadow(
                                            color: gradientColors[0].withValues(
                                              alpha: 0.4,
                                            ),
                                            blurRadius: 8,
                                            offset: const Offset(0, 4),
                                          ),
                                        ],
                                      ),
                                      child: Center(
                                        child: Text(
                                          t('ACCEPT', 'පිළිගන්න', 'ஏற்று'),
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 1.1,
                                          ),
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
                  ),
                ),
              ),
            );
          },
        ),
      ),
    ).then((_) {
      if (_activeRequestDialogId == assignment.requestId) {
        _activeRequestDialogId = null;
      }
    });
  }

  Widget _buildRequirementChip(
    String label,
    Color backgroundColor,
    Color textColor,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: textColor.withValues(alpha: 0.18)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
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

    await _driverLocationRef?.update({'status': 'busy'});

    setState(() {
      currentAssignment = assignment;
    });

    await _upsertDestinationMarker(assignment.dropLatLng, assignment.dropName);
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

    await _driverLocationRef?.update({'status': 'online'});

    if (!mounted) return;
    setState(() {
      if (currentAssignment?.requestId == requestId) {
        currentAssignment = null;
        destinationMarker = null;
      }
    });

    if (controllerGoogleMap != null) {
      await controllerGoogleMap!.clearMarkers();
      if (driverMarker != null) {
        await controllerGoogleMap!.addMarkers([driverMarker!.options]);
      }
    }
  }

  /// Mark trip as started (in_progress)
  Future<void> _startTrip() async {
    if (currentAssignment == null) return;

    final uid = FirebaseAuth.instance.currentUser?.uid;
    final requestRef = FirebaseDatabase.instance
        .ref()
        .child('transfer_requests')
        .child(currentAssignment!.requestId);

    await requestRef.update({
      'status': 'in_progress',
      'startedAt': ServerValue.timestamp,
    });

    if (uid != null) {
      await TripHistoryService().upsertTrip(
        driverId: uid,
        assignment: currentAssignment!,
        status: 'in_progress',
        extra: {'startedAt': ServerValue.timestamp},
      );
    }
  }

  Future<void> _clearCurrentAssignmentUi() async {
    if (!mounted) return;
    setState(() {
      currentAssignment = null;
      destinationMarker = null;
    });

    if (controllerGoogleMap != null) {
      await controllerGoogleMap!.clearMarkers();
      if (driverMarker != null) {
        await controllerGoogleMap!.addMarkers([driverMarker!.options]);
      }
    }
  }

  // ================= CLEANUP =================

  @override
  void dispose() {
    heartbeatTimer?.cancel();
    _assignmentSubscription?.cancel();
    MapStyles.selectedStyleNotifier.removeListener(_onMapStyleChanged);
    _connectivitySubscription?.cancel();
    positionStream?.cancel();
    _setDriverOffline();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _loadLanguage();

    loadMapStyle().then((_) {
      applyMapStyle();
    });
  }

  // ================= UI =================

  Widget _mapControlButton({
    required IconData icon,
    required String tooltip,
    VoidCallback? onTap,
  }) {
    return Material(
      color: Colors.white.withValues(alpha: 0.96),
      borderRadius: BorderRadius.circular(14),
      elevation: 5,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Tooltip(
          message: tooltip,
          child: SizedBox(
            width: 44,
            height: 44,
            child: Icon(icon, color: const Color(0xFF394145)),
          ),
        ),
      ),
    );
  }

  Widget _sheetActionTile({
    required IconData icon,
    required Color color,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: const Color(0xFFF9FAFC),
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                      if (subtitle != null)
                        Text(
                          subtitle,
                          style: const TextStyle(
                            color: Colors.black54,
                            fontSize: 13,
                          ),
                        ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: Colors.black45),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const SideMenu(),

      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.red.shade600, Colors.red.shade400],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        leading: Builder(
          builder: (context) => Padding(
            padding: const EdgeInsets.fromLTRB(8, 12, 8, 12),
            child: GestureDetector(
              onTap: () => Scaffold.of(context).openDrawer(),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.22),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: const Icon(Icons.menu, color: Colors.white),
              ),
            ),
          ),
        ),
        title: const Text(
          'MediGo',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.circle,
                    color: _isOnline ? Colors.lightGreenAccent : Colors.white70,
                    size: 10,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _isOnline
                        ? t('Online', 'සබැඳි', 'ஆன்லைன்')
                        : t('Offline', 'නොසබැඳි', 'ஆஃப்லைன்'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),

      body: Padding(
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
        child: Column(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x22000000),
                      blurRadius: 14,
                      offset: Offset(0, 6),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: Stack(
                    children: [
                      GoogleMapsMapView(
                        initialMapType: _mapType,
                        initialZoomControlsEnabled: false,
                        initialCameraPosition: googlePlexInitialPosition,
                        onViewCreated: (controller) async {
                          controllerGoogleMap = controller;

                          await controller.setMyLocationEnabled(true);
                          await controller.settings.setMyLocationButtonEnabled(
                            false,
                          );
                          try {
                            await controller.settings.setZoomControlsEnabled(
                              false,
                            );
                          } catch (_) {}

                          await loadMapStyle();
                          applyMapStyle();
                          checkLocationPermission();

                          final assignment = currentAssignment;
                          if (assignment != null) {
                            await _upsertDestinationMarker(
                              assignment.dropLatLng,
                              assignment.dropName,
                            );
                          }
                        },
                      ),
                      Positioned(
                        top: 12,
                        left: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.92),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.location_on_outlined,
                                size: 14,
                                color: Colors.red.shade600,
                              ),
                              const SizedBox(width: 5),
                              Text(
                                t("Live Map", "සජීවී සිතියම", "நேரடி வரைபடம்"),
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF3A3F45),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      Positioned(
                        top: 12,
                        right: 12,
                        child: PopupMenuButton<MapType>(
                          tooltip: t('Map type', 'සිතියම් වර්ගය', 'வரைபட வகை'),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          onSelected: (value) {
                            setState(() {
                              _mapType = value;
                            });
                            controllerGoogleMap?.setMapType(mapType: value);
                          },
                          itemBuilder: (context) => [
                            PopupMenuItem(
                              value: MapType.normal,
                              child: Text(
                                t('Default', 'සාමාන්‍ය', 'இயல்புநிலை'),
                              ),
                            ),
                            PopupMenuItem(
                              value: MapType.satellite,
                              child: Text(
                                t('Satellite', 'චන්ද්‍රිකා', 'சாடலைட்'),
                              ),
                            ),
                            PopupMenuItem(
                              value: MapType.terrain,
                              child: Text(t('Terrain', 'භූමි', 'பரப்பு')),
                            ),
                          ],
                          child: _mapControlButton(
                            icon: Icons.layers_outlined,
                            tooltip: t(
                              'Map type',
                              'සිතියම් වර්ගය',
                              'வரைபட வகை',
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 12,
                        right: 12,
                        child: _mapControlButton(
                          icon: Icons.my_location,
                          tooltip: t(
                            'Current location',
                            'වත්මන් ස්ථානය',
                            'தற்போதைய இடம்',
                          ),
                          onTap: _goToCurrentLocation,
                        ),
                      ),
                    ],
                  ),
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
                  gradient: const LinearGradient(
                    colors: [Colors.white, Color(0xFFFFF6F6)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
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
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            Icons.warning_amber_rounded,
                            color: Colors.red.shade600,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            t(
                              "Report Ambulance Issues",
                              "ගිලන් රථ ගැටලු වාර්තා කරන්න",
                              "ஆம்புலன்ஸ் பிரச்சனைகள் தெரிவிக்கவும்",
                            ),
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      t(
                        "Report service, maintenance, breakdown, or other problems before your next assignment.",
                        "ඊළඟ කාර්යයට පෙර සේවා, නඩත්තු, බිඳවැටීම් හෝ වෙනත් ගැටලු වාර්තා කරන්න.",
                        "அடுத்த பணிக்கு முன் சேவை, பராமரிப்பு, கோளாறு அல்லது பிற பிரச்சனைகளை தெரிவிக்கவும்.",
                      ),
                      style: TextStyle(color: Colors.black54),
                    ),
                    const SizedBox(height: 14),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _miniTag(t("Service", "සේවාව", "சேவை")),
                        _miniTag(t("Maintenance", "නඩත්තු", "பராமரிப்பு")),
                        _miniTag(t("Breakdown", "බිඳවැටීම", "கோளாறு")),
                      ],
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
                        label: Text(
                          t(
                            "Report Issue",
                            "ගැටළුව වාර්තා කරන්න",
                            "பிரச்சனை தெரிவிக்கவும்",
                          ),
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red.shade500,
                          elevation: 0,
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
                        gradient: LinearGradient(
                          colors: [Colors.red.shade600, Colors.red.shade400],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
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
                                Text(
                                  t(
                                    "Current Assignment",
                                    "දැනට ලැබුණු කාර්යය",
                                    "தற்போதைய பணி",
                                  ),
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  "${t("Trip ID", "ගමන් අංකය", "பயண ID")}: ${currentAssignment!.requestId}",
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
                            title: t(
                              "Pick Up From",
                              "රැගෙන යාම ආරම්භ වන ස්ථානය",
                              "எடுக்க வேண்டிய இடம்",
                            ),
                            name: currentAssignment!.pickupName,
                            address: currentAssignment!.pickupAddress,
                            icon: Icons.circle,
                          ),
                          const SizedBox(height: 18),
                          _locationTile(
                            title: t("Destination", "ගමනාන්තය", "இலக்கு"),
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
                          label: Text(
                            t(
                              "Start Navigation",
                              "නාවිකරණය ආරම්භ කරන්න",
                              "வழிகாட்டலை தொடங்கு",
                            ),
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          onPressed: () async {
                            final navigator = Navigator.of(context);
                            // Update trip status to in_progress
                            await _startTrip();
                            if (!mounted) return;
                            final result = await navigator.push(
                              MaterialPageRoute(
                                builder: (_) => NavigationPage(
                                  assignment: currentAssignment!,
                                ),
                              ),
                            );
                            if (!mounted) return;
                            if (result == NavigationExitResult.completed ||
                                result == NavigationExitResult.cancelled) {
                              await _clearCurrentAssignmentUi();
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red.shade500,
                            elevation: 0,
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
      backgroundColor: Colors.transparent,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 46,
                height: 4,
                margin: const EdgeInsets.only(bottom: 14),
                decoration: BoxDecoration(
                  color: Colors.black12,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            Text(
              t("Report Issue Type", "ගැටලුවේ වර්ගය", "பிரச்சனை வகை"),
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Text(
              t(
                "Choose the issue you want to report.",
                "ඔබට වාර්තා කිරීමට අවශ්‍ය ගැටලුව තෝරන්න.",
                "தெரிவிக்க வேண்டிய பிரச்சனையை தேர்வு செய்யவும்.",
              ),
              style: TextStyle(color: Colors.black54),
            ),
            const SizedBox(height: 12),
            _sheetActionTile(
              icon: Icons.miscellaneous_services,
              color: Colors.blue,
              title: t("Service", "සේවාව", "சேவை"),
              onTap: () =>
                  _showIssueDetailsDialog(ctx, t("Service", "සේවාව", "சேவை")),
            ),
            _sheetActionTile(
              icon: Icons.build_circle,
              color: Colors.orange,
              title: t("Maintenance", "නඩත්තු", "பராமரிப்பு"),
              onTap: () => _showIssueDetailsDialog(
                ctx,
                t("Maintenance", "නඩත්තු", "பராமரிப்பு"),
              ),
            ),
            _sheetActionTile(
              icon: Icons.car_repair,
              color: Colors.red,
              title: t("Breakdown", "බිඳවැටීම", "கோளாறு"),
              onTap: () => _showIssueDetailsDialog(
                ctx,
                t("Breakdown", "බිඳවැටීම", "கோளாறு"),
              ),
            ),
            _sheetActionTile(
              icon: Icons.error_outline,
              color: Colors.grey,
              title: t("Other Problems", "වෙනත් ගැටලු", "மற்ற பிரச்சனைகள்"),
              onTap: () => _showIssueDetailsDialog(
                ctx,
                t("Other Problems", "වෙනත් ගැටලු", "மற்ற பிரச்சனைகள்"),
              ),
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text("$issueType ${t("Issue", "ගැටළුව", "பிரச்சனை")}"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              t(
                "Add extra details if needed (optional).",
                "අමතර විස්තර අවශ්‍ය නම් එක් කරන්න (විකල්ප).",
                "தேவைப்பட்டால் கூடுதல் விவரம் சேர்க்கலாம் (விருப்பம்).",
              ),
              style: TextStyle(color: Colors.black54),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: detailsController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: t(
                  "Describe the problem...",
                  "ගැටලුව විස්තර කරන්න...",
                  "பிரச்சனையை விளக்கவும்...",
                ),
                filled: true,
                fillColor: const Color(0xFFF9FAFC),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE3E6EC)),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(t("Cancel", "අවලංගු", "ரத்து")),
          ),
          ElevatedButton(
            onPressed: () {
              final details = detailsController.text.trim();
              Navigator.pop(dialogContext);
              _submitIssue(issueType, details);
            },
            child: Text(t("Submit", "යවන්න", "அனுப்பு")),
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
              ? t(
                  "$issueType report sent with extra details.",
                  "$issueType වාර්තාව අමතර විස්තර සමඟ යවන ලදී.",
                  "$issueType அறிக்கை கூடுதல் விவரங்களுடன் அனுப்பப்பட்டது.",
                )
              : t(
                  "$issueType report sent successfully.",
                  "$issueType වාර්තාව සාර්ථකව යවන ලදී.",
                  "$issueType அறிக்கை வெற்றிகரமாக அனுப்பப்பட்டது.",
                ),
        ),
      ),
    );
  }

  Widget _priorityBadge(String priority) {
    Color bgColor = const Color(0xFF2E7D32);
    String label = t("Standard", "සාමාන්‍ය", "சாதாரண");

    if (priority == "critical") {
      bgColor = const Color(0xFFC62828);
      label = t("Critical", "අති ආපදා", "மிக அவசரம்");
    } else if (priority == "urgent") {
      bgColor = const Color(0xFFF57C00);
      label = t("Urgent", "හදිසි", "அவசரம்");
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

  Widget _miniTag(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFFFECEC),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFFFD1D1)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Color(0xFFA83A3A),
          fontSize: 12,
          fontWeight: FontWeight.w700,
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
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE7EAF0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: icon == Icons.circle
                  ? const Color(0xFFE8EEF6)
                  : const Color(0xFFFFECEC),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              size: icon == Icons.circle ? 10 : 18,
              color: icon == Icons.circle ? Colors.blueGrey : Colors.red,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.black54,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(address, style: const TextStyle(color: Colors.black54)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
