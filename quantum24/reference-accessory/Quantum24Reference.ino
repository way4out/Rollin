// Quantum24 Reference Accessory BLE GATT v1
// Harmless reference target: telemetry + PING/ACK only.
#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

static const char* NAME="Quantum24 Reference";
static const char* SERVICE_UUID="7b5a0001-7f24-4c24-9b24-000000000024";
static const char* TELEMETRY_UUID="7b5a0002-7f24-4c24-9b24-000000000024";
static const char* COMMAND_UUID="7b5a0003-7f24-4c24-9b24-000000000024";
static const char* ACK_UUID="7b5a0004-7f24-4c24-9b24-000000000024";

BLECharacteristic* telemetry;
BLECharacteristic* ackChar;
uint32_t counter=0;

String telemetryJson(){
  counter++;
  float temp=25.0f + ((millis()/1000)%7)*0.1f;
  return String("{\"batteryPct\":100,\"temperatureC\":")+String(temp,1)+",\"deviceStatus\":\"READY\",\"firmware\":\"q24-ref-1.0.0\",\"counter\":"+String(counter)+"}";
}

class CommandCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* c) override {
    std::string v=c->getValue();
    String s(v.c_str());
    int p=s.indexOf("\"id\"");
    String id="unknown";
    if(p>=0){int q=s.indexOf('\"',p+4);q=s.indexOf('\"',q+1);int r=s.indexOf('\"',q+1);if(q>=0&&r>q)id=s.substring(q+1,r);}
    String out=String("{\"id\":\"")+id+"\",\"command\":\"PING\",\"status\":\"ACK\",\"counter\":"+String(counter)+"}";
    ackChar->setValue(out.c_str()); ackChar->notify();
  }
};

void setup(){
  Serial.begin(115200);
  BLEDevice::init(NAME);
  BLEServer* server=BLEDevice::createServer();
  BLEService* service=server->createService(SERVICE_UUID);
  telemetry=service->createCharacteristic(TELEMETRY_UUID,BLECharacteristic::PROPERTY_READ|BLECharacteristic::PROPERTY_NOTIFY);
  telemetry->addDescriptor(new BLE2902());
  BLECharacteristic* command=service->createCharacteristic(COMMAND_UUID,BLECharacteristic::PROPERTY_WRITE);
  command->setCallbacks(new CommandCallbacks());
  ackChar=service->createCharacteristic(ACK_UUID,BLECharacteristic::PROPERTY_READ|BLECharacteristic::PROPERTY_NOTIFY);
  ackChar->addDescriptor(new BLE2902());
  telemetry->setValue(telemetryJson().c_str());
  ackChar->setValue("{\"status\":\"IDLE\"}");
  service->start();
  BLEAdvertising* adv=BLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID); adv->setScanResponse(true); adv->start();
}

void loop(){
  delay(5000);
  String t=telemetryJson(); telemetry->setValue(t.c_str()); telemetry->notify();
}
