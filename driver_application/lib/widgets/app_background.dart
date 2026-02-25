import 'package:flutter/material.dart';

/// A widget that renders the app-wide gradient background with decorative
/// circle accents behind every page/route.
class AppBackground extends StatelessWidget {
  const AppBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Gradient background
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFFFFEAEA), Colors.white],
            ),
          ),
        ),
        // Top-right decorative circle
        Positioned(
          top: -80,
          right: -40,
          child: Container(
            width: 210,
            height: 210,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFFFF6B6B).withValues(alpha: 0.18),
            ),
          ),
        ),
        // Left decorative circle
        Positioned(
          top: 180,
          left: -70,
          child: Container(
            width: 180,
            height: 180,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFFFF9B7B).withValues(alpha: 0.15),
            ),
          ),
        ),
        // Page content
        child,
      ],
    );
  }
}
