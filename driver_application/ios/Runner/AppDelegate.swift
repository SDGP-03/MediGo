import UIKit
import Flutter
import GoogleMaps
import GoogleNavigation

#if canImport(Flutter)
typealias AppDelegateBase = FlutterAppDelegate
#elseif canImport(UIKit)
class AppDelegateBase: UIResponder, UIApplicationDelegate {
  var window: UIWindow?
}
#else
class AppDelegateBase {}
#endif

@main
@objc class AppDelegate: AppDelegateBase {
  private func isValidGmsApiKey(_ key: String) -> Bool {
    let trimmed = key.trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmed.isEmpty { return false }
    // Treat unresolved build-setting placeholders like "$(GMS_API_KEY)" as not configured
    if trimmed.contains("$(") { return false }
    return true
  }

#if canImport(Flutter)
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    let rawApiKey = (Bundle.main.object(forInfoDictionaryKey: "GMSApiKey") as? String) ?? ""
    let hasValidApiKey = isValidGmsApiKey(rawApiKey)

#if canImport(GoogleMaps)
    if hasValidApiKey {
      GMSServices.provideAPIKey(rawApiKey)
    }
#endif

    GeneratedPluginRegistrant.register(with: self)

    if let controller = window?.rootViewController as? FlutterViewController {
      let channel = FlutterMethodChannel(
        name: "com.medigo.driver/config",
        binaryMessenger: controller.binaryMessenger
      )
      channel.setMethodCallHandler { call, result in
        switch call.method {
        case "gmsApiKeyStatus":
          result([
            "configured": hasValidApiKey,
            "raw": rawApiKey,
          ])
        default:
          result(FlutterMethodNotImplemented)
        }
      }
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
#else
  // No-op fallback when Flutter is not available to the editor indexer.
#endif
}
