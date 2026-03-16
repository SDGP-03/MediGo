import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:google_navigation_flutter/google_navigation_flutter.dart';

/// Manages a single Navigation SDK session and exposes UI-friendly state.
class NavigationService extends ChangeNotifier {
  GoogleNavigationViewController? _controller;

  bool _sessionReady = false;
  bool _isNavigating = false;
  bool _isStartingNavigation = false;
  bool _hasLocationFix = false;
  bool _hasRoute = false;
  bool _routeOverviewShown = false;

  NavigationWaypoint? _destination;
  NavInfo? _navInfo;
  NavigationRouteStatus? _routeStatus;

  StreamSubscription<RoadSnappedLocationUpdatedEvent>? _roadSnappedSub;
  StreamSubscription<NavInfoEvent>? _navInfoSub;
  StreamSubscription<void>? _routeChangedSub;

  bool get sessionReady => _sessionReady;
  bool get isNavigating => _isNavigating;
  bool get isStartingNavigation => _isStartingNavigation;
  bool get hasLocationFix => _hasLocationFix;
  bool get hasRoute => _hasRoute;
  bool get canStartNavigation =>
      _sessionReady &&
      _hasLocationFix &&
      _hasRoute &&
      !_isNavigating &&
      !_isStartingNavigation;

  NavInfo? get navInfo => _navInfo;
  NavigationRouteStatus? get routeStatus => _routeStatus;

  Future<void> showRouteOverview() => _maybeShowRouteOverview(force: true);

  Future<void> attachController(
    GoogleNavigationViewController controller,
  ) async {
    _controller = controller;

    // Use SDK-provided overlay controls (header/footer/progress/recenter).
    await controller.setNavigationHeaderEnabled(true);
    await controller.setNavigationFooterEnabled(true);
    await controller.setNavigationTripProgressBarEnabled(false);
    await controller.setRecenterButtonEnabled(true);

    unawaited(_maybeShowRouteOverview());
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
    _roadSnappedSub =
        await GoogleMapsNavigator.setRoadSnappedLocationUpdatedListener((
          event,
        ) {
          if (!_hasLocationFix) {
            _hasLocationFix = true;
            notifyListeners();
          }
        });

    _navInfoSub?.cancel();
    _navInfoSub = GoogleMapsNavigator.setNavInfoListener(
      (event) {
        _navInfo = event.navInfo;
        unawaited(_maybeShowRouteOverview());
        notifyListeners();
      },
      numNextStepsToPreview: 3,
      stepImageGenerationOptions: const StepImageGenerationOptions(
        generateManeuverImages: true,
        generateLaneImages: true,
      ),
    );

    await _routeChangedSub?.cancel();
    _routeChangedSub = GoogleMapsNavigator.setOnRouteChangedListener(() {
      _hasRoute = true;
      unawaited(_maybeShowRouteOverview(force: true));
      notifyListeners();
    });

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

    _hasRoute = false;
    _routeStatus = null;
    _routeOverviewShown = false;
    final status = await GoogleMapsNavigator.setDestinations(
      Destinations(
        waypoints: [_destination!],
        displayOptions: NavigationDisplayOptions(showDestinationMarkers: true),
      ),
    );

    _routeStatus = status;
    if (status != NavigationRouteStatus.statusOk) {
      throw StateError('Route could not be prepared: $status');
    }

    unawaited(_maybeShowRouteOverview());
    notifyListeners();
  }

  Future<void> _maybeShowRouteOverview({bool force = false}) async {
    if (!_sessionReady) return;
    if (_controller == null) return;
    if (_isNavigating) return;
    if (_destination == null) return;
    if (!force && _routeOverviewShown) return;

    try {
      await _controller!.showRouteOverview();
      _routeOverviewShown = true;
    } catch (_) {
      // Best-effort; the SDK can reject this if route isn't ready yet.
    }
  }

  /// Starts turn-by-turn guidance (driving mode).
  Future<void> startNavigation() async {
    if (!_sessionReady) {
      throw StateError('Navigation session not initialized.');
    }
    if (_destination == null) {
      throw StateError('Destination not set.');
    }
    if (!_hasRoute) {
      throw StateError('Route is still loading. Please wait a moment.');
    }
    if (_isStartingNavigation || _isNavigating) {
      return;
    }

    _isStartingNavigation = true;
    notifyListeners();

    try {
      await GoogleMapsNavigator.startGuidance();
      await _controller?.setNavigationUIEnabled(true);

      _isNavigating = true;
    } finally {
      _isStartingNavigation = false;
      notifyListeners();
    }
  }

  Future<void> stopNavigation() async {
    if (!_sessionReady) return;

    await GoogleMapsNavigator.stopGuidance();
    await _controller?.setNavigationUIEnabled(false);

    _isNavigating = false;
    notifyListeners();
  }

  /// Fully cleans up native resources. Call from `dispose()` of the page.
  Future<void> disposeSession() async {
    try {
      await stopNavigation();
      _roadSnappedSub?.cancel();
      _roadSnappedSub = null;
      await _navInfoSub?.cancel();
      _navInfoSub = null;
      await _routeChangedSub?.cancel();
      _routeChangedSub = null;
      await GoogleMapsNavigator.cleanup();
    } finally {
      _controller = null;
      _sessionReady = false;
      _isNavigating = false;
      _isStartingNavigation = false;
      _hasLocationFix = false;
      _hasRoute = false;
      _routeOverviewShown = false;
      _destination = null;
      _navInfo = null;
      _routeStatus = null;
    }
  }
}
