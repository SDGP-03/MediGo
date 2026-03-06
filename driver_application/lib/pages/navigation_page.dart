import 'dart:async';
import 'dart:math' as math;

import 'package:driver_application/models/assignment.dart';
import 'package:driver_application/models/directions_route.dart';
import 'package:driver_application/services/directions_service.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';

class NavigationPage extends StatefulWidget {
  const NavigationPage({super.key, required this.assignment});

  final Assignment assignment;

  @override
  State<NavigationPage> createState() => _NavigationPageState();
}

class _NavigationPageState extends State<NavigationPage>
    with TickerProviderStateMixin {
  final DirectionsService _directions = DirectionsService();

  GoogleMapController? _mapController;
  StreamSubscription<Position>? _positionSub;

  LatLng? _driverLatLng;
  double _driverHeading = 0;
  int _driverSpeedKmh = 0;
  int _distanceToNextTurnMeters = 0;

  int _remainingDistanceMeters = 0;
  int _remainingDurationSeconds = 0;

  bool _isFollowing = false;
  bool _navigationStarted = false;
  bool _isLoadingRoute = true;
  String? _routeError;

  DirectionsRoute? _route;
  int _currentStepIndex = 0;
  int _routeProgressPointIndex = 0;

  Set<Polyline> _polylines = {};
  Set<Marker> _markers = {};

  LatLng get _destination => widget.assignment.dropLatLng;

  late final Marker _destinationMarker;
  BitmapDescriptor? _navArrowIcon;

  late final AnimationController _markerAnimController;
  Animation<LatLng>? _markerLatLngAnim;
  DateTime? _lastGpsTimestamp;
  DateTime? _lastMarkerRenderAt;

  bool _isProgrammaticCameraMove = false;
  int _programmaticCameraMoveToken = 0;
  DateTime? _lastCameraAnimAt;

  @override
  void initState() {
    super.initState();
    _destinationMarker = Marker(
      markerId: const MarkerId("destination"),
      position: _destination,
      infoWindow: InfoWindow(title: widget.assignment.dropName),
    );
    _markers = {_destinationMarker};

    _markerAnimController = AnimationController(vsync: this)
      ..addListener(_onMarkerTick);

    _loadNavArrowIcon();
    _initLocationAndRoute();
  }

  Future<void> _loadNavArrowIcon() async {
    try {
      final icon = await BitmapDescriptor.asset(
        const ImageConfiguration(size: Size(56, 56)),
        'assets/icon/navigation_arrow.png',
      );
      if (!mounted) return;
      setState(() {
        _navArrowIcon = icon;
        _refreshMarkers();
      });
    } catch (_) {
      // Fallback to default marker if asset loading fails.
    }
  }

  Future<void> _initLocationAndRoute() async {
    try {
      final hasPerm = await _ensureLocationPermission();
      if (!hasPerm) return;

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.bestForNavigation,
        ),
      );
      _updateDriver(position, animateCamera: false);

      await _loadRoute();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _routeError = "Failed to start navigation: $e";
        _isLoadingRoute = false;
      });
    }
  }

  Future<bool> _ensureLocationPermission() async {
    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.deniedForever ||
        perm == LocationPermission.denied) {
      if (!mounted) return false;
      setState(() {
        _routeError = "Location permission denied.";
        _isLoadingRoute = false;
      });
      return false;
    }

    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      if (!mounted) return false;
      setState(() {
        _routeError = "Location services are disabled.";
        _isLoadingRoute = false;
      });
      return false;
    }

    return true;
  }

  Future<void> _loadRoute() async {
    final origin = _driverLatLng;
    if (origin == null) return;

    setState(() {
      _isLoadingRoute = true;
      _routeError = null;
    });

    try {
      final route = await _directions.getDrivingRoute(
        origin: origin,
        destination: _destination,
      );

      if (!mounted) return;
      final (remainingDistanceMeters, remainingDurationSeconds) =
          _computeRemaining(route, 0);
      setState(() {
        _route = route;
        _isLoadingRoute = false;
        _currentStepIndex = 0;
        _routeProgressPointIndex = 0;
        _remainingDistanceMeters = remainingDistanceMeters;
        _remainingDurationSeconds = remainingDurationSeconds;
        _polylines = _buildRoutePolylines(route);
      });

      _zoomToRoute(route);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _routeError = "Failed to fetch route: $e";
        _isLoadingRoute = false;
      });
    }
  }

  Future<void> _zoomToRoute(DirectionsRoute route) async {
    final controller = _mapController;
    if (controller == null) return;
    await controller.animateCamera(
      CameraUpdate.newLatLngBounds(route.bounds, 70),
    );
  }

  double _normalizeHeading(double heading) {
    final h = heading % 360.0;
    return h < 0 ? h + 360.0 : h;
  }

  double _smoothHeading({
    required double previous,
    required double next,
    double alpha = 0.3,
  }) {
    final prev = _normalizeHeading(previous);
    final nxt = _normalizeHeading(next);
    var delta = (nxt - prev) % 360.0;
    if (delta > 180.0) delta -= 360.0;
    if (delta < -180.0) delta += 360.0;
    return _normalizeHeading(prev + delta * alpha);
  }

  Duration _markerAnimationDuration(Position pos) {
    final ts = pos.timestamp;
    final prev = _lastGpsTimestamp;
    _lastGpsTimestamp = ts;
    if (prev == null) {
      return const Duration(milliseconds: 650);
    }
    final ms = ts.difference(prev).inMilliseconds;
    final clamped = ms.clamp(300, 1200);
    return Duration(milliseconds: clamped);
  }

  void _refreshMarkers() {
    final driver = _driverLatLng;
    final driverMarker = driver == null
        ? null
        : Marker(
            markerId: const MarkerId("driver"),
            position: driver,
            anchor: const Offset(0.5, 0.5),
            rotation: _driverHeading,
            flat: true,
            zIndexInt: 3,
            icon: _navArrowIcon ?? BitmapDescriptor.defaultMarker,
          );

    final driverSet = driverMarker == null ? null : {driverMarker};
    _markers = {_destinationMarker, ...?driverSet};
  }

  void _onMarkerTick() {
    final anim = _markerLatLngAnim;
    if (anim == null) return;

    final now = DateTime.now();
    final last = _lastMarkerRenderAt;
    if (last != null && now.difference(last).inMilliseconds < 33) return;
    _lastMarkerRenderAt = now;

    if (!mounted) return;
    setState(() {
      _driverLatLng = anim.value;
      _refreshMarkers();
    });
  }

  void _startMarkerAnimation({
    required LatLng from,
    required LatLng to,
    required Duration duration,
  }) {
    if (from == to) {
      _markerLatLngAnim = null;
      _markerAnimController.stop();
      return;
    }

    _markerAnimController.stop();
    _markerAnimController.duration = duration;
    _markerLatLngAnim = _LatLngTween(begin: from, end: to).animate(
      CurvedAnimation(
        parent: _markerAnimController,
        curve: Curves.easeOutCubic,
      ),
    );
    _markerAnimController
      ..reset()
      ..forward();
  }

  int _closestRoutePointIndex({
    required List<LatLng> points,
    required LatLng target,
    required int hintIndex,
  }) {
    if (points.isEmpty) return 0;
    final start = math.max(0, hintIndex - 60);
    final end = math.min(points.length - 1, hintIndex + 120);

    var bestIndex = hintIndex.clamp(0, points.length - 1);
    var bestDist = double.infinity;

    for (var i = start; i <= end; i++) {
      final p = points[i];
      final d = Geolocator.distanceBetween(
        target.latitude,
        target.longitude,
        p.latitude,
        p.longitude,
      );
      if (d < bestDist) {
        bestDist = d;
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  Set<Polyline> _buildRoutePolylines(DirectionsRoute route) {
    final points = route.polylinePoints;
    if (!_navigationStarted || points.length < 2) {
      return {
        Polyline(
          polylineId: const PolylineId("route_outline"),
          points: points,
          width: 10,
          color: const Color(0xFF0D47A1),
          zIndex: 0,
        ),
        Polyline(
          polylineId: const PolylineId("route"),
          points: points,
          width: 6,
          color: const Color(0xFF4285F4),
          zIndex: 1,
          geodesic: true,
        ),
      };
    }

    final split = _routeProgressPointIndex.clamp(0, points.length - 1);
    final completed = points.sublist(0, math.min(split + 1, points.length));
    final remaining = points.sublist(split, points.length);

    return {
      if (completed.length >= 2) ...{
        Polyline(
          polylineId: const PolylineId("route_completed_outline"),
          points: completed,
          width: 10,
          color: const Color(0xFFB0BEC5),
          zIndex: 0,
        ),
        Polyline(
          polylineId: const PolylineId("route_completed"),
          points: completed,
          width: 6,
          color: const Color(0xFF9E9E9E),
          zIndex: 1,
          geodesic: true,
        ),
      },
      if (remaining.length >= 2) ...{
        Polyline(
          polylineId: const PolylineId("route_remaining_outline"),
          points: remaining,
          width: 10,
          color: const Color(0xFF0D47A1),
          zIndex: 2,
        ),
        Polyline(
          polylineId: const PolylineId("route_remaining"),
          points: remaining,
          width: 6,
          color: const Color(0xFF4285F4),
          zIndex: 3,
          geodesic: true,
        ),
      },
    };
  }

  Future<void> _animateFollowCamera({
    required LatLng target,
    required double bearing,
  }) async {
    final controller = _mapController;
    if (controller == null) return;

    final now = DateTime.now();
    final last = _lastCameraAnimAt;
    if (last != null && now.difference(last).inMilliseconds < 500) return;
    _lastCameraAnimAt = now;

    _isProgrammaticCameraMove = true;
    final token = ++_programmaticCameraMoveToken;
    try {
      await controller.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(target: target, zoom: 18, tilt: 60, bearing: bearing),
        ),
      );
    } finally {
      // onCameraMoveStarted can fire late; keep a short guard window.
      Future.delayed(const Duration(milliseconds: 350), () {
        if (!mounted) return;
        if (token != _programmaticCameraMoveToken) return;
        _isProgrammaticCameraMove = false;
      });
    }
  }

  void _zoomIn() {
    final controller = _mapController;
    if (controller == null) return;
    _isProgrammaticCameraMove = true;
    final token = ++_programmaticCameraMoveToken;
    controller.animateCamera(CameraUpdate.zoomIn()).whenComplete(() {
      Future.delayed(const Duration(milliseconds: 350), () {
        if (!mounted) return;
        if (token != _programmaticCameraMoveToken) return;
        _isProgrammaticCameraMove = false;
      });
    });
  }

  void _zoomOut() {
    final controller = _mapController;
    if (controller == null) return;
    _isProgrammaticCameraMove = true;
    final token = ++_programmaticCameraMoveToken;
    controller.animateCamera(CameraUpdate.zoomOut()).whenComplete(() {
      Future.delayed(const Duration(milliseconds: 350), () {
        if (!mounted) return;
        if (token != _programmaticCameraMoveToken) return;
        _isProgrammaticCameraMove = false;
      });
    });
  }

  void _updateDriver(Position pos, {bool animateCamera = true}) {
    final gpsLatLng = LatLng(pos.latitude, pos.longitude);
    final headingRaw = (pos.heading.isNaN ? _driverHeading : pos.heading)
        .toDouble();
    final heading = _smoothHeading(previous: _driverHeading, next: headingRaw);
    final speedMs = pos.speed.isNaN ? 0.0 : pos.speed;
    final speedKmh = (speedMs * 3.6).round();

    if (!mounted) return;
    final route = _route;
    int distanceToNextTurn = _distanceToNextTurnMeters;
    if (_navigationStarted &&
        route != null &&
        route.steps.isNotEmpty &&
        _currentStepIndex < route.steps.length) {
      final nextEnd = route.steps[_currentStepIndex].endLocation;
      distanceToNextTurn = Geolocator.distanceBetween(
        gpsLatLng.latitude,
        gpsLatLng.longitude,
        nextEnd.latitude,
        nextEnd.longitude,
      ).round();
      if (distanceToNextTurn < 0) distanceToNextTurn = 0;
    }

    final duration = _markerAnimationDuration(pos);

    setState(() {
      _driverLatLng ??= gpsLatLng;
      _driverHeading = heading;
      _driverSpeedKmh = speedKmh < 0 ? 0 : speedKmh;
      _distanceToNextTurnMeters = distanceToNextTurn;
      _refreshMarkers();
    });

    final currentMarkerPos = _driverLatLng!;
    _startMarkerAnimation(
      from: currentMarkerPos,
      to: gpsLatLng,
      duration: duration,
    );

    if (_navigationStarted &&
        route != null &&
        route.polylinePoints.length >= 2) {
      final newIndex = _closestRoutePointIndex(
        points: route.polylinePoints,
        target: gpsLatLng,
        hintIndex: _routeProgressPointIndex,
      );
      if (newIndex != _routeProgressPointIndex) {
        setState(() {
          _routeProgressPointIndex = newIndex;
          _polylines = _buildRoutePolylines(route);
        });
      }
    }

    if (_navigationStarted && _isFollowing && animateCamera) {
      _animateFollowCamera(target: gpsLatLng, bearing: heading);
    }
  }

  void _advanceStepsIfNeeded() {
    if (!_navigationStarted) return;
    final route = _route;
    final driver = _driverLatLng;
    if (route == null || driver == null) return;
    if (_currentStepIndex >= route.steps.length) return;

    final nextEnd = route.steps[_currentStepIndex].endLocation;
    final meters = Geolocator.distanceBetween(
      driver.latitude,
      driver.longitude,
      nextEnd.latitude,
      nextEnd.longitude,
    );

    if (meters <= 30) {
      final nextIndex = (_currentStepIndex + 1).clamp(0, route.steps.length);
      final (remainingDistanceMeters, remainingDurationSeconds) =
          _computeRemaining(route, nextIndex);
      setState(() {
        _currentStepIndex = nextIndex;
        _remainingDistanceMeters = remainingDistanceMeters;
        _remainingDurationSeconds = remainingDurationSeconds;
      });
    }
  }

  (int, int) _computeRemaining(DirectionsRoute route, int stepIndex) {
    if (route.steps.isEmpty) {
      return (route.totalDistanceMeters, route.totalDurationSeconds);
    }
    var distance = 0;
    var duration = 0;
    final clamped = stepIndex.clamp(0, route.steps.length);
    for (var i = clamped; i < route.steps.length; i++) {
      distance += route.steps[i].distanceMeters;
      duration += route.steps[i].durationSeconds;
    }
    return (distance, duration);
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

  Future<void> _startNavigation() async {
    if (_navigationStarted) return;

    final hasPerm = await _ensureLocationPermission();
    if (!hasPerm) return;

    if (_driverLatLng == null) {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.bestForNavigation,
        ),
      );
      _updateDriver(position, animateCamera: false);
    }

    if (!mounted) return;
    final route = _route;
    final (remainingDistanceMeters, remainingDurationSeconds) = route == null
        ? (0, 0)
        : _computeRemaining(route, 0);
    setState(() {
      _navigationStarted = true;
      _isFollowing = true;
      _currentStepIndex = 0;
      _remainingDistanceMeters = remainingDistanceMeters;
      _remainingDurationSeconds = remainingDurationSeconds;
    });

    // Immediately jump into navigation camera mode
    _recenterNavigation();
    _syncRouteProgressWithDriver();

    // Start live location stream only after Start Navigation is pressed
    _positionSub ??=
        Geolocator.getPositionStream(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.bestForNavigation,
            distanceFilter: 5,
          ),
        ).listen((pos) {
          _updateDriver(pos);
          _advanceStepsIfNeeded();
        });
  }

  void _stopNavigation() {
    final route = _route;
    final (remainingDistanceMeters, remainingDurationSeconds) = route == null
        ? (0, 0)
        : _computeRemaining(route, 0);
    setState(() {
      _navigationStarted = false;
      _isFollowing = false;
      _currentStepIndex = 0;
      _routeProgressPointIndex = 0;
      _distanceToNextTurnMeters = 0;
      _driverSpeedKmh = 0;
      _remainingDistanceMeters = remainingDistanceMeters;
      _remainingDurationSeconds = remainingDurationSeconds;
      if (_route != null) {
        _polylines = _buildRoutePolylines(_route!);
      }
    });
    _positionSub?.cancel();
    _positionSub = null;

    if (_route != null) {
      _zoomToRoute(_route!);
    }
  }

  void _recenterNavigation() {
    if (_driverLatLng == null) return;
    setState(() => _isFollowing = true);
    _animateFollowCamera(target: _driverLatLng!, bearing: _driverHeading);
  }

  void _syncRouteProgressWithDriver() {
    final route = _route;
    final driver = _driverLatLng;
    if (route == null || driver == null) return;
    if (route.polylinePoints.length < 2) return;

    final idx = _closestRoutePointIndex(
      points: route.polylinePoints,
      target: driver,
      hintIndex: _routeProgressPointIndex,
    );
    if (!mounted) return;
    setState(() {
      _routeProgressPointIndex = idx;
      _polylines = _buildRoutePolylines(route);
    });
  }

  @override
  void dispose() {
    _positionSub?.cancel();
    _markerAnimController.dispose();
    _mapController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final route = _route;
    final nextStep =
        (_navigationStarted &&
            route != null &&
            route.steps.isNotEmpty &&
            _currentStepIndex < route.steps.length)
        ? route.steps[_currentStepIndex]
        : null;

    return Scaffold(
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: _driverLatLng ?? _destination,
              zoom: 15,
            ),
            onMapCreated: (c) {
              _mapController = c;
              final route = _route;
              if (!_navigationStarted && route != null) {
                _zoomToRoute(route);
              }
            },
            myLocationEnabled: false,
            myLocationButtonEnabled: false,
            markers: _markers,
            polylines: _polylines,
            trafficEnabled: _navigationStarted,
            mapToolbarEnabled: false,
            compassEnabled: false,
            zoomControlsEnabled: false,
            onCameraMoveStarted: () {
              if (_navigationStarted &&
                  _isFollowing &&
                  !_isProgrammaticCameraMove) {
                setState(() => _isFollowing = false);
              }
            },
          ),

          SafeArea(
            child: Stack(
              children: [
                if (_navigationStarted)
                  Positioned(
                    top: 10,
                    left: 12,
                    right: 12,
                    child: _TopNavBanner(
                      step: nextStep,
                      metersToTurn: _distanceToNextTurnMeters,
                      formatDistance: _formatDistance,
                    ),
                  ),

                if (!_navigationStarted)
                  Positioned(
                    top: 10,
                    left: 12,
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black26,
                            blurRadius: 6,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: IconButton(
                        icon: const Icon(
                          Icons.arrow_back,
                          color: Colors.black87,
                        ),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ),
                  ),

                Positioned(
                  right: 16,
                  top: _navigationStarted ? 160 : 60,
                  child: Column(
                    children: [
                      if (_navigationStarted && !_isFollowing) ...[
                        _FloatingNavButton(
                          icon: Icons.my_location,
                          color: Colors.blueAccent,
                          onPressed: _recenterNavigation,
                        ),
                        const SizedBox(height: 10),
                      ],
                      if (_navigationStarted) ...[
                        _FloatingNavButton(icon: Icons.add, onPressed: _zoomIn),
                        const SizedBox(height: 10),
                        _FloatingNavButton(
                          icon: Icons.remove,
                          onPressed: _zoomOut,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),

          if (_navigationStarted)
            Positioned(
              left: 16,
              bottom: 150, // Above bottom banner
              child: Container(
                width: 65,
                height: 65,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.grey.shade300, width: 2),
                  boxShadow: const [
                    BoxShadow(
                      color: Colors.black12,
                      blurRadius: 4,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "$_driverSpeedKmh",
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        height: 1.0,
                      ),
                    ),
                    const Text(
                      "km/h",
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _navigationStarted
                ? _BottomNavBanner(
                    route: route,
                    remainingDistanceText: _formatDistance(
                      _remainingDistanceMeters,
                    ),
                    remainingDurationText: _formatDuration(
                      _remainingDurationSeconds,
                    ),
                    remainingDurationSeconds: _remainingDurationSeconds,
                    onStop: _stopNavigation,
                    onShowSteps: route == null
                        ? null
                        : () => _showStepsSheet(route),
                  )
                : _RoutePreviewCard(
                    isLoading: _isLoadingRoute,
                    error: _routeError,
                    destinationName: widget.assignment.dropName,
                    totalDistance: route?.totalDistanceText,
                    totalDuration: route?.totalDurationText,
                    onStartNavigation:
                        (_isLoadingRoute ||
                            _routeError != null ||
                            route == null)
                        ? null
                        : _startNavigation,
                  ),
          ),
        ],
      ),
    );
  }

  void _showStepsSheet(DirectionsRoute route) {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (_) => SafeArea(
        child: ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          itemCount: route.steps.length,
          separatorBuilder: (_, index) => const Divider(height: 20),
          itemBuilder: (_, i) {
            final step = route.steps[i];
            final active = i == _currentStepIndex;
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 10,
                  height: 10,
                  margin: const EdgeInsets.only(top: 6),
                  decoration: BoxDecoration(
                    color: active ? Colors.redAccent : Colors.grey.shade400,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        step.instruction,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: active
                              ? FontWeight.w700
                              : FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "${step.distanceText} • ${step.durationText}",
                        style: TextStyle(color: Colors.grey.shade700),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _FloatingNavButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;
  final Color? color;

  const _FloatingNavButton({
    required this.icon,
    required this.onPressed,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: const BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(color: Colors.black26, blurRadius: 5, offset: Offset(0, 2)),
        ],
      ),
      child: IconButton(
        icon: Icon(icon, color: color ?? Colors.black87),
        onPressed: onPressed,
      ),
    );
  }
}

class _TopNavBanner extends StatelessWidget {
  final DirectionsStep? step;
  final int metersToTurn;
  final String Function(int meters) formatDistance;

  const _TopNavBanner({
    this.step,
    required this.metersToTurn,
    required this.formatDistance,
  });

  IconData _iconForManeuver(String? maneuver) {
    final m = (maneuver ?? "").toLowerCase();
    if (m.contains('uturn')) return Icons.u_turn_left;
    if (m.contains('turn-left') ||
        m.contains('turn_left') ||
        m.contains('left')) {
      return Icons.turn_left;
    }
    if (m.contains('turn-right') ||
        m.contains('turn_right') ||
        m.contains('right')) {
      return Icons.turn_right;
    }
    if (m.contains('merge')) return Icons.merge;
    if (m.contains('fork')) return Icons.call_split;
    if (m.contains('roundabout')) return Icons.roundabout_right;
    if (m.contains('ramp')) return Icons.trending_up;
    if (m.contains('straight') || m.contains('continue')) {
      return Icons.arrow_upward;
    }
    return Icons.arrow_upward;
  }

  @override
  Widget build(BuildContext context) {
    final icon = _iconForManeuver(step?.maneuver);
    final distanceText = step == null
        ? ""
        : formatDistance(metersToTurn.clamp(0, 999999));

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(
              color: Color(0xFF1A73E8),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 26),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (step != null) ...[
                  if (distanceText.isNotEmpty)
                    Text(
                      distanceText,
                      style: const TextStyle(
                        color: Colors.black87,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        height: 1.0,
                      ),
                    ),
                  const SizedBox(height: 2),
                  Text(
                    step!.instruction,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.black87,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      height: 1.15,
                    ),
                  ),
                ] else ...[
                  const Text(
                    "Head to destination",
                    style: TextStyle(
                      color: Colors.black87,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BottomNavBanner extends StatelessWidget {
  final DirectionsRoute? route;
  final String remainingDistanceText;
  final String remainingDurationText;
  final int remainingDurationSeconds;
  final VoidCallback onStop;
  final VoidCallback? onShowSteps;

  const _BottomNavBanner({
    this.route,
    required this.remainingDistanceText,
    required this.remainingDurationText,
    required this.remainingDurationSeconds,
    required this.onStop,
    this.onShowSteps,
  });

  @override
  Widget build(BuildContext context) {
    String etaTime = "--:--";
    String mins = remainingDurationText.isEmpty
        ? "-- min"
        : remainingDurationText;
    if (route != null && remainingDurationSeconds > 0) {
      final eta = DateTime.now().add(
        Duration(seconds: remainingDurationSeconds),
      );
      etaTime = DateFormat.Hm().format(eta);
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 10,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _BottomActionButton(
            icon: Icons.close,
            label: 'Stop',
            onPressed: onStop,
          ),

          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    mins,
                    style: const TextStyle(
                      color: Colors.black87,
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.eco, color: Color(0xFF2E7D32), size: 20),
                ],
              ),
              const SizedBox(height: 2),
              Text(
                "${remainingDistanceText.isEmpty ? (route?.totalDistanceText ?? '-- km') : remainingDistanceText} • $etaTime",
                style: TextStyle(
                  color: Colors.grey.shade700,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),

          _BottomActionButton(
            icon: Icons.alt_route,
            label: 'Steps',
            onPressed: onShowSteps,
          ),
        ],
      ),
    );
  }
}

class _BottomActionButton extends StatelessWidget {
  const _BottomActionButton({
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onPressed,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: Colors.grey.shade300, width: 1.2),
            boxShadow: const [
              BoxShadow(
                color: Colors.black12,
                blurRadius: 6,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: Colors.black87, size: 20),
              const SizedBox(width: 6),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.black87,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoutePreviewCard extends StatelessWidget {
  const _RoutePreviewCard({
    required this.isLoading,
    required this.error,
    required this.destinationName,
    required this.totalDistance,
    required this.totalDuration,
    required this.onStartNavigation,
  });

  final bool isLoading;
  final String? error;
  final String destinationName;
  final String? totalDistance;
  final String? totalDuration;
  final VoidCallback? onStartNavigation;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16).copyWith(bottom: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.place, color: Colors.redAccent),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    destinationName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            if (isLoading) ...[
              const SizedBox(height: 16),
              const LinearProgressIndicator(),
            ] else if (error != null) ...[
              const SizedBox(height: 16),
              Text(error!, style: const TextStyle(color: Colors.red)),
            ] else ...[
              const SizedBox(height: 8),
              if ((totalDistance ?? "").isNotEmpty ||
                  (totalDuration ?? "").isNotEmpty)
                Text(
                  "${totalDistance ?? ""} • ${totalDuration?.replaceAll('mins', 'min') ?? ""}",
                  style: TextStyle(
                    color: Colors.grey.shade700,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: onStartNavigation,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color.fromARGB(208, 241, 47, 21),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    "Start Navigation",
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _LatLngTween extends Tween<LatLng> {
  _LatLngTween({required super.begin, required super.end});

  @override
  LatLng lerp(double t) {
    final b = begin!;
    final e = end!;
    return LatLng(
      b.latitude + (e.latitude - b.latitude) * t,
      b.longitude + (e.longitude - b.longitude) * t,
    );
  }
}
