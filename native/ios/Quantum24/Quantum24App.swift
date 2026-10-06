import SwiftUI
import UIKit
import WebKit
import Combine
import AccessorySetupKit
import CoreBluetooth

@main
struct Quantum24App: App {
    @StateObject private var integration = IntegrationReporter()
    var body: some Scene { WindowGroup { QuantumWebView(integration: integration).ignoresSafeArea() } }
}

final class IntegrationReporter: NSObject, ObservableObject, CBCentralManagerDelegate {
    private let session = ASAccessorySession()
    private var central: CBCentralManager!
    private let endpoint = URL(string: "https://quantum24-gains.onrender.com/api/device-integration/report")!
    @Published var deviceId: String?

    override init() {
        super.init()
        central = CBCentralManager(delegate: self, queue: .main)
        session.activate(on: .main) { [weak self] event in
            if event.eventType == .accessoryAdded {
                self?.report(state: "AUTHORIZED", evidence: ["authorization": true])
            }
        }
    }

    func capabilities() -> [String] {
        var c = ["ios_native", "media", "camera"]
        if central.state == .poweredOn { c.append("bluetooth") }
        return c
    }

    func onboardBluetooth() {
        var descriptor = ASDiscoveryDescriptor()
        descriptor.bluetoothServiceUUID = CBUUID(string: "0000FD6F-0000-1000-8000-00805F9B34FB")
        descriptor.bluetoothNameSubstring = "Quantum24"
        let item = ASPickerDisplayItem(
            name: "Quantum24 accessory",
            productImage: UIImage(systemName: "dot.radiowaves.left.and.right")!,
            descriptor: descriptor
        )
        session.showPicker(for: [item]) { [weak self] error in
            if error != nil { self?.report(state: "EVIDENCE_REQUIRED", evidence: ["authorization": false]) }
        }
    }

    func report(state: String, evidence: [String: Any]) {
        let body: [String: Any] = [
            "platform": "ios",
            "model": UIDevice.current.model,
            "appVersion": "native-v1",
            "capabilities": capabilities(),
            "state": state,
            "evidence": evidence
        ]
        guard let data = try? JSONSerialization.data(withJSONObject: body) else { return }
        var req = URLRequest(url: endpoint)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = data
        URLSession.shared.dataTask(with: req) { [weak self] data, _, _ in
            guard let data, let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }
            DispatchQueue.main.async { self?.deviceId = obj["deviceId"] as? String }
        }.resume()
    }

    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        report(state: central.state == .poweredOn ? "DISCOVERED" : "UNSUPPORTED",
               evidence: ["bluetoothAvailable": central.state == .poweredOn])
    }
}

struct QuantumWebView: UIViewRepresentable {
    let integration: IntegrationReporter
    func makeUIView(context: Context) -> WKWebView {
        let w = WKWebView(frame: .zero)
        w.configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        w.load(URLRequest(url: URL(string: "https://quantum24-gains.onrender.com")!))
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            integration.report(state: "DISCOVERED", evidence: ["nativeShell": true])
        }
        return w
    }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
