# Quantum24 Native Targets

Shared production web UI plus native capability/evidence reporting.

- iOS/iPadOS: SwiftUI + WKWebView + AccessorySetupKit/Core Bluetooth.
- Android: Kotlin + WebView + Bluetooth/BLE + USB + NFC capability reporting.
- Server contract: /api/device-integration/schema, /api/device-integration/report, /api/devices, /api/providers/*.
- CERTIFIED is evidence-gated; capability support is never presented as an active connection.
- RF transmit remains disabled until real authorized hardware, configuration, and compliance evidence exist.

iOS/iPadOS AccessorySetupKit discovery must be tested on a physical device; Android Bluetooth permissions are runtime permissions.