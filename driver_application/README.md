# driver_application

A new Flutter project.

## Google Navigation SDK setup (production)

This app uses the official Navigation SDK via `google_navigation_flutter` for real turn-by-turn navigation.

### 1) Google Cloud

1. In Google Cloud Console, select your project and enable billing.
2. Enable these APIs for the project:
   - Navigation SDK
   - Maps SDK for Android
   - Maps SDK for iOS
3. Create an API key and restrict it to your app:
   - Android: restrict by package name + SHA-1
   - iOS: restrict by bundle id

### 2) Android API key

Set your key in `driver_application/android/app/src/main/AndroidManifest.xml` under:

`com.google.android.geo.API_KEY`

### 3) iOS API key

This project reads the key from `GMSApiKey` in `driver_application/ios/Runner/Info.plist`.

Set the `GMS_API_KEY` build setting in Xcode (Runner target → Build Settings), or add it to your `ios/Flutter/*.xcconfig`:

`GMS_API_KEY=YOUR_API_KEY_HERE`

### 4) Permissions

- Android: location permissions are in `driver_application/android/app/src/main/AndroidManifest.xml`.
- iOS: location permission strings are in `driver_application/ios/Runner/Info.plist`.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
