import 'package:flutter/material.dart';

class NavigationControls extends StatelessWidget {
  const NavigationControls({
    super.key,
    required this.onStop,
    required this.onRecenter,
    required this.onZoomIn,
    required this.onZoomOut,
  });

  final VoidCallback onStop;
  final VoidCallback onRecenter;
  final VoidCallback onZoomIn;
  final VoidCallback onZoomOut;

  @override
  Widget build(BuildContext context) {
    Widget button({
      required IconData icon,
      required String tooltip,
      required VoidCallback onPressed,
      Color? background,
      Color? foreground,
    }) {
      return Material(
        elevation: 6,
        color: background ?? Colors.white,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onPressed,
          child: Tooltip(
            message: tooltip,
            child: SizedBox(
              width: 46,
              height: 46,
              child: Icon(
                icon,
                color: foreground ?? const Color(0xFF394145),
              ),
            ),
          ),
        ),
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        button(
          icon: Icons.close_rounded,
          tooltip: 'Stop navigation',
          onPressed: onStop,
          background: const Color(0xFFEA4335),
          foreground: Colors.white,
        ),
        const SizedBox(height: 10),
        button(
          icon: Icons.my_location_rounded,
          tooltip: 'Recenter',
          onPressed: onRecenter,
        ),
        const SizedBox(height: 10),
        button(
          icon: Icons.add_rounded,
          tooltip: 'Zoom in',
          onPressed: onZoomIn,
        ),
        const SizedBox(height: 10),
        button(
          icon: Icons.remove_rounded,
          tooltip: 'Zoom out',
          onPressed: onZoomOut,
        ),
      ],
    );
  }
}

