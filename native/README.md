# Quantum24 Native Targets

Shared production web UI plus native capability/evidence reporting.

## Reference accessory protocol

protocol/quantum24-reference-ble.json is the canonical BLE contract for the first real reference accessory.

- Advertised name: Quantum24 Reference
- Service UUID: 7B1A0001-8E8A-4B2B-9D24-243300000024
- Telemetry: ...0002 read/notify JSON
- Command: ...0003 write JSON
- Acknowledgment: ...0004 read/notify JSON
- Required telemetry: battery, temperatureC, deviceStatus, firmware, counter
- Safe command: ping only

The ESP32-class Arduino reference firmware is in protocol/quantum24_reference_esp32.ino. It has no physical actuator and does not claim energy generation, RF transmission, payments, or other unsupported capabilities.

## Certification path

DISCOVERED -> AUTHORIZED -> CONNECTED -> TELEMETRY_VERIFIED -> ACTION_VERIFIED -> CERTIFIED

Certification is evidence-gated. A UI label never substitutes for device evidence. RF transmit remains disabled until real authorized hardware, configuration, and compliance evidence exist.

iOS/iPadOS uses AccessorySetupKit for privacy-preserving discovery, then CoreBluetooth using the selected accessory's real Bluetooth identifier. Android requests Nearby-device permissions, discovers the reference service, connects with GATT, reads telemetry, sends ping, and verifies the acknowledgment.

Physical-device validation is still required before production certification.
