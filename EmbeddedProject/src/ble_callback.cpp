#include "ble_callback.h"
#include <Arduino.h>

ble_callback::ble_callback(/* args */)
{
}

ble_callback::~ble_callback()
{
}

void ble_callback::onConnect(BLEServer *pServer)
{
  device_status::connId = pServer->getConnId();
  device_status::deviceConnected = true;
}

void ble_callback::onDisconnect(BLEServer *pServer)
{
  device_status::deviceConnected = false;
}

ble_session_callback::ble_session_callback() {}
ble_session_callback::~ble_session_callback() {}

void ble_session_callback::onRead(BLECharacteristic *pCharacteristic)
{
  String val = device_status::sessionRecording == true ? "true" : "false";
  pCharacteristic->setValue(val.c_str());
  pCharacteristic->notify();
}

void ble_session_callback::onWrite(BLECharacteristic *pCharacteristic)
{
  bool val = strcmp(pCharacteristic->getValue().c_str(), "true") == 1 ? true : false;
  device_status::sessionRecording = val;

  String valStr = val ? "true" : "false";
  pCharacteristic->setValue(valStr.c_str());
  pCharacteristic->notify();
}