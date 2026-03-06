import 'package:flutter/material.dart';

class NavigationPreviewCard extends StatelessWidget {
  const NavigationPreviewCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.primaryCtaLabel,
    required this.onPrimaryCta,
    this.etaText,
    this.distanceText,
    this.isLoading = false,
  });

  final String title;
  final String subtitle;
  final String primaryCtaLabel;
  final VoidCallback? onPrimaryCta;
  final String? etaText;
  final String? distanceText;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Material(
      elevation: 10,
      borderRadius: BorderRadius.circular(18),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.place_rounded, color: Color(0xFF1A73E8)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: const Color(0xFF5F6368),
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 10),
            if (etaText != null || distanceText != null)
              Wrap(
                spacing: 10,
                runSpacing: 8,
                children: [
                  if (etaText != null)
                    _pill(icon: Icons.schedule_rounded, label: etaText!),
                  if (distanceText != null)
                    _pill(icon: Icons.route_rounded, label: distanceText!),
                ],
              ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton(
                onPressed: isLoading ? null : onPrimaryCta,
                child: isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(primaryCtaLabel),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _pill({required IconData icon, required String label}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F3F4),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: const Color(0xFF3C4043)),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Color(0xFF3C4043),
            ),
          ),
        ],
      ),
    );
  }
}

