#include "ble_callback.h"

ble_callback::ble_callback(/* args */)
{
}

ble_callback::~ble_callback()
{
}

void ble_callback::onConnect(BLEServer *pServer)
{
  deviceConnected = true;
}

void ble_callback::onDisconnect(BLEServer *pServer)
{
  deviceConnected = false;
}