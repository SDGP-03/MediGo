import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:google_navigation_flutter/google_navigation_flutter.dart';

/// Manages a single Navigation SDK session and exposes UI-friendly state.
class NavigationService extends ChangeNotifier {
  GoogleNavigationViewController? _controller;

  bool _sessionReady = false;
  bool _isNavigating = false;
  bool _hasLocationFix = false;

  NavigationWaypoint? _destination;
  NavInfo? _navInfo;

  StreamSubscription<RoadSnappedLocationUpdatedEvent>? _roadSnappedSub;
  StreamSubscription<NavInfoEvent>? _navInfoSub;

  bool get sessionReady => _sessionReady;
  bool get isNavigating => _isNavigating;
  bool get hasLocationFix => _hasLocationFix;

  GoogleNavigationViewController? get controller => _controller;
  NavInfo? get navInfo => _navInfo;
  NavigationWaypoint? get destination => _destination;

  Future<void> attachController(GoogleNavigationViewController controller) async {
    _controller = controller;

    // Keep SDK-provided overlay controls off; we render our own UI.
    await controller.setNavigationHeaderEnabled(false);
    await controller.setNavigationFooterEnabled(false);
    await controller.setNavigationTripProgressBarEnabled(false);
    await controller.setRecenterButtonEnabled(false);

    notifyListeners();
  }

  /// Initializes the Navigation SDK session and listeners.
  ///
  /// Must be called before setting destinations / starting guidance.
  Future<void> initializeSession() async {
    if (_sessionReady) return;

    await GoogleMapsNavigator.initializeNavigationSession(
      taskRemovedBehavior: TaskRemovedBehavior.continueService,
    );

    _sessionReady = true;

    await _roadSnappedSub?.cancel();
    _roadSnappedSub = await GoogleMapsNavigator
        .setRoadSnappedLocationUpdatedListener((event) {
          if (!_hasLocationFix) {
            _hasLocationFix = true;
            notifyListeners();
          }
        });

    _navInfoSub?.cancel();
    _navInfoSub = GoogleMapsNavigator.setNavInfoListener(
      (event) {
        _navInfo = event.navInfo;
        notifyListeners();
      },
      numNextStepsToPreview: 3,
      stepImageGenerationOptions: const StepImageGenerationOptions(
        generateManeuverImages: true,
        generateLaneImages: true,
      ),
    );

    notifyListeners();
  }

  /// Sets the single destination used for preview and guidance.
  Future<void> setDestination({
    required LatLng target,
    required String title,
  }) async {
    _destination = NavigationWaypoint.withLatLngTarget(
      title: title,
      target: target,
    );

    await GoogleMapsNavigator.setDestinations(
      Destinations(
        waypoints: [_destination!],
        displayOptions: NavigationDisplayOptions(showDestinationMarkers: true),
      ),
    );
    notifyListeners();
  }

  /// Starts turn-by-turn guidance (driving mode).
  Future<void> startNavigation() async {
    if (!_sessionReady) {
      throw StateError('Navigation session not initialized.');
    }
    if (_destination == null) {
      throw StateError('Destination not set.');
    }

    await GoogleMapsNavigator.startGuidance();
    await _controller?.setNavigationUIEnabled(true);

    _isNavigating = true;
    notifyListeners();
  }

  Future<void> stopNavigation() async {
    if (!_sessionReady) return;

    await GoogleMapsNavigator.stopGuidance();
    await _controller?.setNavigationUIEnabled(false);

    _isNavigating = false;
    notifyListeners();
  }

  Future<void> recenter() async {
    await _controller?.followMyLocation(CameraPerspective.tilted);
  }

  Future<void> zoomIn() async {
    await _controller?.animateCamera(CameraUpdate.zoomIn());
  }

  Future<void> zoomOut() async {
    await _controller?.animateCamera(CameraUpdate.zoomOut());
  }

  /// Fully cleans up native resources. Call from `dispose()` of the page.
  Future<void> disposeSession() async {
    try {
      await stopNavigation();
      _roadSnappedSub?.cancel();
      _roadSnappedSub = null;
      await _navInfoSub?.cancel();
      _navInfoSub = null;
      await GoogleMapsNavigator.cleanup();
    } finally {
      _controller = null;
      _sessionReady = false;
      _isNavigating = false;
      _hasLocationFix = false;
      _destination = null;
      _navInfo = null;
    }
  }
}
