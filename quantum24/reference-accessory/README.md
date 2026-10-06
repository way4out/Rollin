# Quantum24 Reference BLE Accessory

This is the first physical-reference target for Quantum24 native certification. It is intentionally harmless: telemetry read/notify plus a `PING` write that returns an `ACK`.

## GATT

- Service: `7b5a0001-7f24-4c24-9b24-000000000024`
- Telemetry: `7b5a0002-7f24-4c24-9b24-000000000024` — read/notify
- Command: `7b5a0003-7f24-4c24-9b24-000000000024` — write
- Ack: `7b5a0004-7f24-4c24-9b24-000000000024` — read/notify
- Advertised name: `Quantum24 Reference`

Telemetry is UTF-8 JSON with battery percentage, temperature, device status, firmware, and a monotonic counter. The command payload is UTF-8 JSON `{\"id\":\"...\",\"command\":\"PING\"}`. The acknowledgement echoes the id and returns `{status:\"ACK\"}`.

The protocol is deliberately separate from any claimed production hardware. A physical ESP32-class board implementing these UUIDs becomes the reference accessory used to prove the full iOS/Android loop.
