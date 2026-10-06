import SwiftUI
import UIKit
import WebKit
import Combine
import AccessorySetupKit
import CoreBluetooth
import CryptoKit

@main
struct Quantum24App: App {
    @StateObject private var integration = IntegrationReporter()
    var body: some Scene {
        WindowGroup {
            ZStack(alignment: .topTrailing) {
                QuantumWebView(integration: integration).ignoresSafeArea()
                Button("Connect accessory") { integration.onboardBluetooth() }
                    .padding(12)
                    .background(.ultraThinMaterial)
                    .clipShape(Capsule())
                    .padding()
            }
        }
    }
}

final class IntegrationReporter: NSObject, ObservableObject, CBCentralManagerDelegate, CBPeripheralDelegate {
    private let session = ASAccessorySession()
    private var central: CBCentralManager!
    private var peripheral: CBPeripheral?
    private var pendingAccessory: ASAccessory?
    private let endpoint = URL(string: "https://quantum24-gains.onrender.com/api/device-integration/report")!
    private let serviceUUID = CBUUID(string: "7B5A0001-7F24-4C24-9B24-000000000024")
    private let telemetryUUID = CBUUID(string: "7B5A0002-7F24-4C24-9B24-000000000024")
    private let commandUUID = CBUUID(string: "7B5A0003-7F24-4C24-9B24-000000000024")
    private let ackUUID = CBUUID(string: "7B5A0004-7F24-4C24-9B24-000000000024")
    private var commandId: String?
    @Published var deviceId: String?

    override init() {
        super.init()
        central = CBCentralManager(delegate: self, queue: .main)
        session.activate(on: .main) { [weak self] event in
            switch event.eventType {
            case .accessoryAdded:
                guard let accessory = event.accessory else { return }
                self?.pendingAccessory = accessory
                self?.report(state: "AUTHORIZED", evidence: [
                    "authorization": true,
                    "displayName": accessory.displayName
                ])
            case .pickerDidDismiss:
                self?.connectAuthorizedAccessory()
            case .accessoryRemoved:
                self?.report(state: "OFFLINE", evidence: ["connection": false])
            default:
                break
            }
        }
    }

    func capabilities() -> [String] {
        var c = ["ios_native", "media", "camera"]
        if central.state == .poweredOn { c.append("bluetooth") }
        if peripheral != nil { c.append("bluetooth_gatt") }
        return c
    }

    func onboardBluetooth() {
        var descriptor = ASDiscoveryDescriptor()
        descriptor.bluetoothServiceUUID = CBUUID(string: "7B1A0001-8E8A-4B2B-9D24-243300000024")
        descriptor.bluetoothNameSubstring = "Quantum24 Reference"
        let item = ASPickerDisplayItem(
            name: "Quantum24 accessory",
            productImage: UIImage(systemName: "dot.radiowaves.left.and.right")!,
            descriptor: descriptor
        )
        session.showPicker(for: [item]) { [weak self] error in
            if let error {
                self?.report(state: "EVIDENCE_REQUIRED", evidence: [
                    "authorization": false,
                    "setupError": error.localizedDescription
                ])
            }
        }
    }

    private func connectAuthorizedAccessory() {
        guard let accessory = pendingAccessory,
              let identifier = accessory.bluetoothIdentifier,
              central.state == .poweredOn else { return }
        guard deviceId != nil else {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self] in
                self?.connectAuthorizedAccessory()
            }
            return
        }
        pendingAccessory = nil
        let matches = central.retrievePeripherals(withIdentifiers: [identifier])
        guard let p = matches.first else {
            report(state: "OFFLINE", evidence: [
                "connection": false,
                "bluetoothIdentifierAvailable": true,
                "reason": "authorized peripheral not returned by CoreBluetooth"
            ])
            return
        }
        peripheral = p
        p.delegate = self
        central.connect(p, options: nil)
    }

    func report(state: String, evidence: [String: Any]) {
        var body: [String: Any] = [
            "platform": "ios",
            "model": UIDevice.current.model,
            "appVersion": "native-v2",
            "capabilities": capabilities(),
            "state": state,
            "evidence": evidence
        ]
        if let id = deviceId { body["deviceId"] = id }
        guard let data = try? JSONSerialization.data(withJSONObject: body) else { return }
        var req = URLRequest(url: endpoint)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = data
        URLSession.shared.dataTask(with: req) { [weak self] data, _, _ in
            guard let data,
                  let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let returned = obj["deviceId"] as? String else { return }
            DispatchQueue.main.async { self?.deviceId = returned }
        }.resume()
    }

    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        report(
            state: central.state == .poweredOn ? "DISCOVERED" : "UNSUPPORTED",
            evidence: ["bluetoothAvailable": central.state == .poweredOn]
        )
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        report(state: "CONNECTED", evidence: [
            "connection": true,
            "peripheralIdentifier": peripheral.identifier.uuidString
        ])
        peripheral.discoverServices(nil)
    }

    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        report(state: "OFFLINE", evidence: [
            "connection": false,
            "error": error?.localizedDescription ?? "connect_failed"
        ])
    }

    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        report(state: "OFFLINE", evidence: [
            "connection": false,
            "error": error?.localizedDescription ?? "disconnected"
        ])
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard error == nil else {
            report(state: "OFFLINE", evidence: ["connection": true, "serviceDiscovery": false])
            return
        }
        let services = peripheral.services ?? []
        for service in services { peripheral.discoverCharacteristics([telemetryUUID, commandUUID, ackUUID], for: service) }
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        guard error == nil else { return }
        for characteristic in service.characteristics ?? [] {
            if characteristic.properties.contains(.read) {
                peripheral.readValue(for: characteristic)
            }
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        guard error == nil, let value = characteristic.value, !value.isEmpty else { return }
        report(state: "TELEMETRY_VERIFIED", evidence: [
            "connection": true,
            "telemetry": true,
            "serviceUUID": characteristic.service?.uuid.uuidString ?? "",
            "characteristicUUID": characteristic.uuid.uuidString,
            "byteCount": value.count,
            "valueSHA256": value.map { String(format: "%02x", $0) }.joined().sha256()
        ])
    }
}

private extension String {
    func sha256() -> String {
        SHA256.hash(data: Data(utf8)).map { String(format: "%02x", $0) }.joined()
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
