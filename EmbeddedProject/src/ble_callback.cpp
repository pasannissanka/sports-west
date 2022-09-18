#include "ble_callback.h"

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
