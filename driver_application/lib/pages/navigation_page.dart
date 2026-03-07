import 'dart:async';
import 'dart:ui';

import 'package:driver_application/models/assignment.dart';
import 'package:driver_application/services/navigation_service.dart';
import 'package:driver_application/services/trip_history_service.dart';
import 'package:driver_application/widgets/navigation_preview_card.dart';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:google_navigation_flutter/google_navigation_flutter.dart';
import 'package:intl/intl.dart';
import 'package:permission_handler/permission_handler.dart';

enum NavigationExitResult { completed, cancelled }

class NavigationPage extends StatefulWidget {
  const NavigationPage({super.key, required this.assignment});

  final Assignment assignment;

  @override
  State<NavigationPage> createState() => _NavigationPageState();
}

class _NavigationPageState extends State<NavigationPage> {
  final NavigationService _nav = NavigationService();
  final TripHistoryService _history = TripHistoryService();

  bool _initializing = true;
  String? _initError;

  bool get _isReady => _nav.sessionReady && _nav.hasLocationFix;

  StreamSubscription<OnArrivalEvent>? _arrivalSub;
  bool _arrivalSheetOpen = false;
  bool _disposedSession = false;

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    setState(() {
      _initializing = true;
      _initError = null;
    });

    try {
      final permissionOk = await _ensureLocationPermission();
      if (!permissionOk) {
        throw StateError('Location permission is required for navigation.');
      }

      final accepted = await GoogleMapsNavigator.showTermsAndConditionsDialog(
        'Navigation',
        'MediGo',
      );
      if (!accepted) {
        throw StateError(
          'Navigation terms must be accepted to start guidance.',
        );
      }

      await _nav.initializeSession();
      await _arrivalSub?.cancel();
      _arrivalSub = GoogleMapsNavigator.setOnArrivalListener((event) {
        if (_arrivalSheetOpen) return;
        _arrivalSheetOpen = true;
        if (!context.mounted) return;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!context.mounted) return;
          _showArrivedCard();
        });
      });
      await _nav.setDestination(
        target: LatLng(
          latitude: widget.assignment.dropLatLng.latitude,
          longitude: widget.assignment.dropLatLng.longitude,
        ),
        title: widget.assignment.dropName,
      );
    } catch (e) {
      _initError = e.toString();
    } finally {
      if (context.mounted) {
        setState(() => _initializing = false);
      }
    }
  }

  Future<bool> _ensureLocationPermission() async {
    final status = await Permission.locationWhenInUse.request();
    return status.isGranted;
  }

  String? _distanceText() {
    final meters =
        _nav.navInfo?.distanceToFinalDestinationMeters ??
        _nav.navInfo?.distanceToNextDestinationMeters;
    if (meters == null) return null;
    if (meters >= 1000) return '${(meters / 1000).toStringAsFixed(1)} km';
    return '$meters m';
  }

  String? _etaText() {
    final seconds =
        _nav.navInfo?.timeToFinalDestinationSeconds ??
        _nav.navInfo?.timeToNextDestinationSeconds;
    if (seconds == null) return null;
    final eta = DateTime.now().add(Duration(seconds: seconds));
    return DateFormat('h:mm a').format(eta);
  }

  Widget _buildCancelButtonOverlay() {
    return SafeArea(
      bottom: false,
      child: Align(
        alignment: Alignment.bottomRight,
        child: Padding(
          padding: const EdgeInsets.only(right: 20, bottom: 8),
          child: Tooltip(
            message: 'Cancel trip',
            child: ClipRRect(
              borderRadius: BorderRadius.circular(32),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Material(
                  color: const Color.fromARGB(
                    10,
                    158,
                    145,
                    145,
                  ).withValues(alpha: 0.92),
                  elevation: 10,
                  child: InkWell(
                    onTap: _confirmCancelNavigation,
                    child: const SizedBox(
                      width: 54,
                      height: 54,
                      child: Icon(Icons.close_rounded, color: Colors.white),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _arrivalSub?.cancel();
    if (!_disposedSession) {
      _nav.disposeSession();
    }
    super.dispose();
  }

  Future<void> _showArrivedCard() async {
    await showModalBottomSheet<void>(
      context: context,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.flag_rounded, color: Color(0xFF34A853)),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'arrive to your destination',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () async {
                        Navigator.of(ctx).pop();
                        await _completeTripAndExit();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF34A853),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        'Complete',
                        style: TextStyle(fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _completeTripAndExit() async {
    try {
      final uid = FirebaseAuth.instance.currentUser?.uid;
      if (uid == null) return;

      await _nav.stopNavigation();

      final requestRef = FirebaseDatabase.instance
          .ref()
          .child('transfer_requests')
          .child(widget.assignment.requestId);

      await requestRef.update({
        'status': 'completed',
        'completedAt': ServerValue.timestamp,
      });

      await _history.upsertTrip(
        driverId: uid,
        assignment: widget.assignment,
        status: 'completed',
        extra: {'completedAt': ServerValue.timestamp},
      );

      await _nav.disposeSession();
      _disposedSession = true;
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to complete trip: $e')));
      return;
    }

    if (!mounted) return;
    Navigator.of(context).pop(NavigationExitResult.completed);
  }

  Future<void> _confirmCancelNavigation() async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.close_rounded, color: Color(0xFFEA4335)),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Cancel trip?',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'This will stop guidance, cancel this assignment, and return to Home. You can redo this trip from History.',
                      style: TextStyle(
                        color: Color(0xFF5F6368),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.of(ctx).pop(),
                          style: OutlinedButton.styleFrom(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: const Text('Keep'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () async {
                            Navigator.of(ctx).pop();
                            await _cancelTripAndExit();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFEA4335),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: const Text(
                            'Confirm',
                            style: TextStyle(fontWeight: FontWeight.w900),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _cancelTripAndExit() async {
    try {
      final uid = FirebaseAuth.instance.currentUser?.uid;
      if (uid == null) return;

      await _nav.stopNavigation();

      final requestRef = FirebaseDatabase.instance
          .ref()
          .child('transfer_requests')
          .child(widget.assignment.requestId);

      await requestRef.update({
        'status': 'cancelled',
        'cancelledAt': ServerValue.timestamp,
        // Keep assigned to this driver so it can be redone from History.
        'driverId': uid,
      });

      await _history.upsertTrip(
        driverId: uid,
        assignment: widget.assignment,
        status: 'cancelled',
        extra: {'cancelledAt': ServerValue.timestamp},
      );

      await _nav.disposeSession();
      _disposedSession = true;
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to cancel trip: $e')));
      return;
    }

    if (!mounted) return;
    Navigator.of(context).pop(NavigationExitResult.cancelled);
  }

  @override
  Widget build(BuildContext context) {
    final destinationTitle = widget.assignment.dropName;
    final destinationSubtitle = widget.assignment.dropAddress;

    return AnimatedBuilder(
      animation: _nav,
      builder: (context, _) {
        return Scaffold(
          backgroundColor: Colors.black,
          body: Stack(
            children: [
              GoogleMapsNavigationView(
                initialNavigationUIEnabledPreference:
                    NavigationUIEnabledPreference.disabled,
                onViewCreated: (controller) async {
                  await _nav.attachController(controller);
                },
              ),

              if (_nav.isNavigating) _buildCancelButtonOverlay(),

              if (!_nav.isNavigating)
                Positioned(
                  left: 12,
                  right: 12,
                  bottom: 12,
                  child: NavigationPreviewCard(
                    title: destinationTitle,
                    subtitle: destinationSubtitle,
                    etaText: _etaText() == null ? null : 'ETA ${_etaText()}',
                    distanceText: _distanceText(),
                    isLoading: _initializing || !_nav.sessionReady,
                    primaryCtaLabel: _initError != null
                        ? 'Retry'
                        : (_isReady ? 'Start Navigation' : 'Getting GPS…'),
                    onPrimaryCta: (_initError != null)
                        ? _boot
                        : (_isReady
                              ? () async {
                                  await _nav.startNavigation();
                                }
                              : null),
                  ),
                ),

              if (_initError != null && !_initializing)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Material(
                        color: const Color(0xFFEA4335),
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Text(
                            _initError!,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
