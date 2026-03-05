import 'dart:async';

import 'package:driver_application/models/assignment.dart';
import 'package:driver_application/models/directions_route.dart';
import 'package:driver_application/services/directions_service.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class NavigationPage extends StatefulWidget {
  const NavigationPage({super.key, required this.assignment});

  final Assignment assignment;

  @override
  State<NavigationPage> createState() => _NavigationPageState();
}

class _NavigationPageState extends State<NavigationPage> {
  final DirectionsService _directions = DirectionsService();

  GoogleMapController? _mapController;
  StreamSubscription<Position>? _positionSub;

  LatLng? _driverLatLng;
  double _driverHeading = 0;

  bool _isFollowing = true;
  bool _isLoadingRoute = true;
  String? _routeError;

  DirectionsRoute? _route;
  int _currentStepIndex = 0;

  Set<Polyline> _polylines = {};
  Set<Marker> _markers = {};

  LatLng get _destination => widget.assignment.dropLatLng;

  @override
  void initState() {
    super.initState();
    _markers = {
      Marker(
        markerId: const MarkerId("destination"),
        position: _destination,
        infoWindow: InfoWindow(title: widget.assignment.dropName),
      ),
    };
    _initLocationAndRoute();
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

      _positionSub = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.bestForNavigation,
          distanceFilter: 5,
        ),
      ).listen((pos) {
        _updateDriver(pos);
        _advanceStepsIfNeeded();
      });
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
      setState(() {
        _route = route;
        _isLoadingRoute = false;
        _currentStepIndex = 0;
        _polylines = {
          Polyline(
            polylineId: const PolylineId("route"),
            points: route.polylinePoints,
            width: 6,
            color: Colors.blueAccent,
          ),
        };
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

  void _updateDriver(Position pos, {bool animateCamera = true}) {
    final newLatLng = LatLng(pos.latitude, pos.longitude);
    final heading = (pos.heading.isNaN ? 0 : pos.heading).toDouble();

    if (!mounted) return;
    setState(() {
      _driverLatLng = newLatLng;
      _driverHeading = heading;
    });

    if (_isFollowing && animateCamera) {
      _mapController?.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(
            target: newLatLng,
            zoom: 18,
            tilt: 60,
            bearing: heading,
          ),
        ),
      );
    }
  }

  void _advanceStepsIfNeeded() {
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
      setState(() {
        _currentStepIndex =
            (_currentStepIndex + 1).clamp(0, route.steps.length);
      });
    }
  }

  @override
  void dispose() {
    _positionSub?.cancel();
    _mapController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final route = _route;
    final nextStep =
        (route != null &&
                route.steps.isNotEmpty &&
                _currentStepIndex < route.steps.length)
            ? route.steps[_currentStepIndex]
            : null;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Navigation"),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: _driverLatLng ?? _destination,
              zoom: 15,
            ),
            onMapCreated: (c) => _mapController = c,
            myLocationEnabled: true,
            myLocationButtonEnabled: false,
            markers: _markers,
            polylines: _polylines,
            mapToolbarEnabled: false,
            compassEnabled: true,
            onCameraMoveStarted: () {
              if (_isFollowing) {
                setState(() => _isFollowing = false);
              }
            },
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: _NavigationCard(
              isLoading: _isLoadingRoute,
              error: _routeError,
              destinationName: widget.assignment.dropName,
              totalDistance: route?.totalDistanceText,
              totalDuration: route?.totalDurationText,
              nextInstruction: nextStep?.instruction,
              nextDistance: nextStep?.distanceText,
              onShowSteps: route == null ? null : () => _showStepsSheet(route),
              onRecenter: _driverLatLng == null
                  ? null
                  : () {
                      setState(() => _isFollowing = true);
                      _mapController?.animateCamera(
                        CameraUpdate.newCameraPosition(
                          CameraPosition(
                            target: _driverLatLng!,
                            zoom: 18,
                            tilt: 60,
                            bearing: _driverHeading,
                          ),
                        ),
                      );
                    },
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
                    color: active ? Colors.blueAccent : Colors.grey.shade400,
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
                          fontWeight: active ? FontWeight.w700 : FontWeight.w600,
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

class _NavigationCard extends StatelessWidget {
  const _NavigationCard({
    required this.isLoading,
    required this.error,
    required this.destinationName,
    required this.totalDistance,
    required this.totalDuration,
    required this.nextInstruction,
    required this.nextDistance,
    required this.onShowSteps,
    required this.onRecenter,
  });

  final bool isLoading;
  final String? error;
  final String destinationName;
  final String? totalDistance;
  final String? totalDuration;
  final String? nextInstruction;
  final String? nextDistance;
  final VoidCallback? onShowSteps;
  final VoidCallback? onRecenter;

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 10,
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.all(14),
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
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: onRecenter,
                  tooltip: "Follow",
                  icon: const Icon(Icons.my_location),
                ),
              ],
            ),
            if (isLoading) ...[
              const SizedBox(height: 10),
              const LinearProgressIndicator(),
            ] else if (error != null) ...[
              const SizedBox(height: 10),
              Text(
                error!,
                style: const TextStyle(color: Colors.red),
              ),
            ] else ...[
              if ((totalDistance ?? "").isNotEmpty || (totalDuration ?? "").isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    "${totalDistance ?? ""} • ${totalDuration ?? ""}",
                    style: TextStyle(color: Colors.grey.shade700),
                  ),
                ),
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF4F7FF),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.directions, color: Colors.blueAccent),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        (nextInstruction ?? "Continue"),
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    if ((nextDistance ?? "").isNotEmpty)
                      Text(
                        nextDistance!,
                        style: TextStyle(color: Colors.grey.shade700),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onShowSteps,
                      icon: const Icon(Icons.list),
                      label: const Text("Steps"),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
