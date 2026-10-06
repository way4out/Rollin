/*
 Quantum24 Reference BLE Accessory
 ESP32-class Arduino reference implementation.
 Safe telemetry + ping acknowledgment only; no physical actuator control.
*/
#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>
static const char* SERVICE_UUID="7B1A0001-8E8A-4B2B-9D24-243300000024";
static const char* TELEMETRY_UUID="7B1A0002-8E8A-4B2B-9D24-243300000024";
static const char* COMMAND_UUID="7B1A0003-8E8A-4B2B-9D24-243300000024";
static const char* ACK_UUID="7B1A0004-8E8A-4B2B-9D24-243300000024";
BLECharacteristic* telemetryChar; BLECharacteristic* ackChar; uint32_t counter=0;
void publishTelemetry(){StaticJsonDocument<256> d;d["battery"]=100;d["temperatureC"]=25.0+(millis()%500)/100.0;d["deviceStatus"]="READY";d["firmware"]="q24-ref-1.0.0";d["counter"]=++counter;String out;serializeJson(d,out);telemetryChar->setValue(out.c_str());telemetryChar->notify();}
class CommandCallbacks:public BLECharacteristicCallbacks{void onWrite(BLECharacteristic*c)override{std::string raw=c->getValue();if(raw.empty())return;StaticJsonDocument<192> req;if(deserializeJson(req,raw))return;const char*op=req["op"]|"",*id=req["id"]|"";if(String(op)!="ping")return;StaticJsonDocument<192> a;a["ok"]=true;a["op"]="ping";a["id"]=id;a["counter"]=counter;String out;serializeJson(a,out);ackChar->setValue(out.c_str());ackChar->notify();}};
void setup(){Serial.begin(115200);BLEDevice::init("Quantum24 Reference");BLEServer*server=BLEDevice::createServer();BLEService*s=server->createService(SERVICE_UUID);telemetryChar=s->createCharacteristic(TELEMETRY_UUID,BLECharacteristic::PROPERTY_READ|BLECharacteristic::PROPERTY_NOTIFY);telemetryChar->addDescriptor(new BLE2902());BLECharacteristic*cmd=s->createCharacteristic(COMMAND_UUID,BLECharacteristic::PROPERTY_WRITE|BLECharacteristic::PROPERTY_WRITE_NR);cmd->setCallbacks(new CommandCallbacks());ackChar=s->createCharacteristic(ACK_UUID,BLECharacteristic::PROPERTY_READ|BLECharacteristic::PROPERTY_NOTIFY);ackChar->addDescriptor(new BLE2902());s->start();BLEAdvertising*a=BLEDevice::getAdvertising();a->addServiceUUID(SERVICE_UUID);a->setScanResponse(true);BLEDevice::startAdvertising();publishTelemetry();}
void loop(){static uint32_t last=0;if(millis()-last>5000){last=millis();publishTelemetry();}delay(25);}