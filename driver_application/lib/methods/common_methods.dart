import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

class ScrollIfNeeded extends StatefulWidget {
  const ScrollIfNeeded({
    super.key,
    this.padding,
    this.controller,
    this.fillViewport = false,
    required this.child,
  });

  final EdgeInsetsGeometry? padding;
  final ScrollController? controller;
  final bool fillViewport;
  final Widget child;

  @override
  State<ScrollIfNeeded> createState() => _ScrollIfNeededState();
}

class _ScrollIfNeededState extends State<ScrollIfNeeded> {
  double _contentExtent = 0;

  void _onContentSizeChanged(Size size) {
    final newExtent = size.height;
    if (!mounted) return;
    if (newExtent == _contentExtent) return;
    setState(() => _contentExtent = newExtent);
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final viewportExtent = constraints.maxHeight;
        final shouldScroll = _contentExtent > viewportExtent + 0.5;

        Widget content = _MeasureSize(
          onChange: _onContentSizeChanged,
          child: widget.child,
        );

        if (widget.fillViewport) {
          content = ConstrainedBox(
            constraints: BoxConstraints(minHeight: viewportExtent),
            child: content,
          );
        }

        return SingleChildScrollView(
          controller: widget.controller,
          physics: shouldScroll ? null : const NeverScrollableScrollPhysics(),
          padding: widget.padding,
          child: content,
        );
      },
    );
  }
}

typedef _OnWidgetSizeChange = void Function(Size size);

class _MeasureSize extends SingleChildRenderObjectWidget {
  const _MeasureSize({required this.onChange, required super.child});

  final _OnWidgetSizeChange onChange;

  @override
  RenderObject createRenderObject(BuildContext context) =>
      _RenderMeasureSize(onChange);

  @override
  void updateRenderObject(
    BuildContext context,
    covariant _RenderMeasureSize renderObject,
  ) {
    renderObject.onChange = onChange;
  }
}

class _RenderMeasureSize extends RenderProxyBox {
  _RenderMeasureSize(this.onChange);

  _OnWidgetSizeChange onChange;
  Size? _oldSize;

  @override
  void performLayout() {
    super.performLayout();
    final newSize = child?.size ?? Size.zero;
    if (_oldSize == newSize) return;
    _oldSize = newSize;
    WidgetsBinding.instance.addPostFrameCallback((_) => onChange(newSize));
  }
}

class CommonMethods {
  Future<bool> checkConnectivity(BuildContext context) async {
    var connectionResult = await Connectivity().checkConnectivity();

    // No network at all
    if (!connectionResult.any((result) => result != ConnectivityResult.none)) {
      if (!context.mounted) return false;
      displaySnackBar(
        "No network connection. Please turn on Wi-Fi or mobile data.",
        context,
      );
      return false;
    }

    // Network exists, check real internet
    bool hasInternet = await _hasInternetAccess();
    if (!hasInternet) {
      if (!context.mounted) return false;
      displaySnackBar(
        "Connected to a network, but no internet access.",
        context,
      );
      return false;
    }

    return true;
  }

  Future<bool> _hasInternetAccess() async {
    try {
      final result = await InternetAddress.lookup(
        'google.com',
      ).timeout(const Duration(seconds: 5));
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  void displaySnackBar(String messageText, BuildContext context) {
    final snackBar = SnackBar(content: Text(messageText));
    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }
}
