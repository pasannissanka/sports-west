#include "HardwareESPBLESerial.h"

HardwareESPBLESerial::HardwareESPBLESerial()
{
  this->numAvailableLines = 0;
  this->transmitBufferLength = 0;
  this->lastFlushTime = 0;
}

void HardwareESPBLESerial::begin(BLEServer *pServer)
{
  uartService = pServer->createService(BLE_SERVICE_UUID);
  receiveCharacteristic = uartService->createCharacteristic(RX_CHARACTERISTIC, BLECharacteristic::PROPERTY_WRITE_NR);
  transmitCharacteristic = uartService->createCharacteristic(TX_CHARACTERISTIC, BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ);

  receiveCharacteristic->setCallbacks(new ReceiveCharacteristicCallback());

  uartService->start();

  // BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  // pAdvertising->addServiceUUID(BLE_SERVICE_UUID);
  // pAdvertising->setScanResponse(true);
  // pAdvertising->setMinPreferred(0x06); // functions that help with iPhone connections issue
  // pAdvertising->setMinPreferred(0x12);
  // BLEDevice::startAdvertising();
}

void HardwareESPBLESerial::end()
{
  receiveCharacteristic->setCallbacks(NULL);
  this->receiveBuffer.clear();
  flush();
}

size_t HardwareESPBLESerial::available()
{
  return this->receiveBuffer.getLength();
}

int HardwareESPBLESerial::peek()
{
  if (this->receiveBuffer.getLength() == 0)
    return -1;
  return this->receiveBuffer.get(0);
}

int HardwareESPBLESerial::read()
{
  int result = this->receiveBuffer.pop();
  if (result == (int)'\n')
  {
    this->numAvailableLines--;
  }
  return result;
}

size_t HardwareESPBLESerial::write(uint8_t byte)
{

  // if (this->transmitCharacteristic.subscribed() == false)
  // {
  //   return 0;
  // }
  this->transmitBuffer[this->transmitBufferLength] = byte;
  this->transmitBufferLength++;
  if (this->transmitBufferLength == sizeof(this->transmitBuffer))
  {
    flush();
  }
  return 1;
}

void HardwareESPBLESerial::flush()
{
  if (this->transmitBufferLength > 0)
  {
    transmitCharacteristic->setValue(transmitBuffer, transmitBufferLength);
    transmitCharacteristic->notify();

    this->transmitBufferLength = 0;
  }
  this->lastFlushTime = millis();
}

size_t HardwareESPBLESerial::availableLines()
{
  return this->numAvailableLines;
}

size_t HardwareESPBLESerial::peekLine(char *buffer, size_t bufferSize)
{
  if (this->availableLines() == 0)
  {
    buffer[0] = '\0';
    return 0;
  }
  size_t i = 0;
  for (; i < bufferSize - 1; i++)
  {
    int chr = this->receiveBuffer.get(i);
    if (chr == -1 || chr == '\n')
    {
      break;
    }
    else
    {
      buffer[i] = chr;
    }
  }
  buffer[i] = '\0';
  return i;
}

size_t HardwareESPBLESerial::readLine(char *buffer, size_t bufferSize)
{
  if (this->availableLines() == 0)
  {
    buffer[0] = '\0';
    return 0;
  }
  size_t i = 0;
  for (; i < bufferSize - 1; i++)
  {
    int chr = this->read();
    if (chr == -1 || chr == '\n')
    {
      break;
    }
    else
    {
      buffer[i] = chr;
    }
  }
  buffer[i] = '\0';
  return i;
}

size_t HardwareESPBLESerial::print(const char *str)
{
  // if (this->transmitCharacteristic.subscribed() == false)
  // {
  //   return 0;
  // }
  size_t written = 0;
  for (size_t i = 0; str[i] != '\0'; i++)
  {
    written += this->write(str[i]);
  }
  return written;
}
size_t HardwareESPBLESerial::println(const char *str) { return this->print(str) + this->write('\n'); }

size_t HardwareESPBLESerial::print(char value)
{
  char buf[2] = {value, '\0'};
  return this->print(buf);
}
size_t HardwareESPBLESerial::println(char value) { return this->print(value) + this->write('\n'); }

size_t HardwareESPBLESerial::print(int64_t value)
{
  char buf[21];
  snprintf(buf, 21, "%lld", value); // the longest representation of a uint64_t is for -2^63, 20 characters plus null terminator
  return this->print(buf);
}
size_t HardwareESPBLESerial::println(int64_t value) { return this->print(value) + this->write('\n'); }

size_t HardwareESPBLESerial::print(uint64_t value)
{
  char buf[21];
  snprintf(buf, 21, "%llu", value); // the longest representation of a uint64_t is for 2^64-1, 20 characters plus null terminator
  return this->print(buf);
}
size_t HardwareESPBLESerial::println(uint64_t value) { return this->print(value) + this->write('\n'); }

size_t HardwareESPBLESerial::print(double value)
{
  char buf[319];
  snprintf(buf, 319, "%f", value); // the longest representation of a double is for -1e308, 318 characters plus null terminator
  return this->print(buf);
}
size_t HardwareESPBLESerial::println(double value) { return this->print(value) + this->write('\n'); }

HardwareESPBLESerial::operator bool()
{
  return pServer->getConnectedCount() > 0;
}

void HardwareESPBLESerial::onReceive(const uint8_t *data, size_t size)
{
  for (size_t i = 0; i < min(size, sizeof(this->receiveBuffer)); i++)
  {
    this->receiveBuffer.add(data[i]);
    if (data[i] == '\n')
    {
      this->numAvailableLines++;
    }
  }
}
