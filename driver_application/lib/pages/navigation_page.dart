import 'package:driver_application/models/assignment.dart';
import 'package:driver_application/services/navigation_service.dart';
import 'package:driver_application/widgets/navigation_controls.dart';
import 'package:driver_application/widgets/navigation_preview_card.dart';
import 'package:flutter/material.dart';
import 'package:google_navigation_flutter/google_navigation_flutter.dart';
import 'package:intl/intl.dart';
import 'package:permission_handler/permission_handler.dart';

class NavigationPage extends StatefulWidget {
  const NavigationPage({super.key, required this.assignment});

  final Assignment assignment;

  @override
  State<NavigationPage> createState() => _NavigationPageState();
}

class _NavigationPageState extends State<NavigationPage> {
  final NavigationService _nav = NavigationService();

  bool _initializing = true;
  String? _initError;

  bool get _isReady => _nav.sessionReady && _nav.hasLocationFix;

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
        throw StateError('Navigation terms must be accepted to start guidance.');
      }

      await _nav.initializeSession();
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

  String? _timeText() {
    final seconds =
        _nav.navInfo?.timeToFinalDestinationSeconds ??
        _nav.navInfo?.timeToNextDestinationSeconds;
    if (seconds == null) return null;
    final minutes = (seconds / 60).round();
    if (minutes < 60) return '$minutes min';
    final hours = minutes ~/ 60;
    final rem = minutes % 60;
    return '${hours}h ${rem}m';
  }

  String? _etaText() {
    final seconds =
        _nav.navInfo?.timeToFinalDestinationSeconds ??
        _nav.navInfo?.timeToNextDestinationSeconds;
    if (seconds == null) return null;
    final eta = DateTime.now().add(Duration(seconds: seconds));
    return DateFormat('h:mm a').format(eta);
  }

  StepInfo? _nextStep() {
    final info = _nav.navInfo;
    return info?.currentStep ?? (info?.remainingSteps.isNotEmpty == true
        ? info!.remainingSteps.first
        : null);
  }

  String _formatStepDistance(int meters) {
    if (meters >= 1000) return '${(meters / 1000).toStringAsFixed(1)} km';
    return '$meters m';
  }

  Widget _buildTopBanner() {
    final step = _nextStep();
    if (step == null) return const SizedBox.shrink();

    final instruction = (step.fullInstructions ?? '').isEmpty
        ? 'Continue'
        : step.fullInstructions!;
    final metersToManeuver = _nav.navInfo?.distanceToCurrentStepMeters ?? 0;
    final dist = _formatStepDistance(metersToManeuver);

    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
        child: Material(
          elevation: 10,
          color: const Color(0xFF1A73E8),
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                SizedBox(
                  width: 30,
                  height: 30,
                  child: step.maneuverImage == null
                      ? const Icon(
                          Icons.turn_right_rounded,
                          color: Colors.white,
                        )
                      : FutureBuilder<Image?>(
                          future: getRegisteredImage(step.maneuverImage!),
                          builder: (context, snapshot) {
                            final img = snapshot.data;
                            if (img == null) {
                              return const Icon(
                                Icons.turn_right_rounded,
                                color: Colors.white,
                              );
                            }
                            return ColorFiltered(
                              colorFilter: const ColorFilter.mode(
                                Colors.white,
                                BlendMode.srcIn,
                              ),
                              child: img,
                            );
                          },
                        ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    instruction,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      height: 1.1,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  dist,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomPanel() {
    final time = _timeText();
    final distance = _distanceText();
    final eta = _etaText();

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
        child: Material(
          elevation: 14,
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        time ?? '--',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${distance ?? '--'} • ETA ${eta ?? '--'}',
                        style: const TextStyle(
                          color: Color(0xFF5F6368),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.directions_car_rounded,
                  color: Color(0xFF5F6368),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nav.disposeSession();
    super.dispose();
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

              if (_nav.isNavigating)
                Positioned(top: 0, left: 0, right: 0, child: _buildTopBanner()),
              if (_nav.isNavigating)
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: _buildBottomPanel(),
                ),

              if (_nav.isNavigating)
                Positioned(
                  right: 12,
                  bottom: 120,
                  child: NavigationControls(
                    onStop: () async {
                      await _nav.stopNavigation();
                      if (!context.mounted) return;
                      Navigator.of(context).pop();
                    },
                    onRecenter: () => _nav.recenter(),
                    onZoomIn: () => _nav.zoomIn(),
                    onZoomOut: () => _nav.zoomOut(),
                  ),
                ),

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
