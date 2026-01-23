import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';

class CommonMethods {
  Future<bool> checkConnectivity(BuildContext context) async {
    var connectionResult = await Connectivity().checkConnectivity();

    // No network at all
    if (connectionResult == ConnectivityResult.none) {
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
