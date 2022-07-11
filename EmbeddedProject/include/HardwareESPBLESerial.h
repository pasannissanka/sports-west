#ifndef __BLE_SERIAL_H__
#define __BLE_SERIAL_H__

#include <Arduino.h>
#include <BLEServer.h>
#include <BLEDevice.h>

#define BLE_ATTRIBUTE_MAX_VALUE_LENGTH 20
#define BLE_SERIAL_RECEIVE_BUFFER_SIZE 256

#define BLE_SERVICE_UUID "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define RX_CHARACTERISTIC "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define TX_CHARACTERISTIC "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

template <size_t N>
class ByteRingBuffer
{
private:
  uint8_t ringBuffer[N];
  size_t newestIndex = 0;
  size_t length = 0;

public:
  void add(uint8_t value)
  {
    ringBuffer[newestIndex] = value;
    newestIndex = (newestIndex + 1) % N;
    length = min(length + 1, N);
  }
  int pop()
  { // pops the oldest value off the ring buffer
    if (length == 0)
    {
      return -1;
    }
    uint8_t result = ringBuffer[(N + newestIndex - length) % N];
    length -= 1;
    return result;
  }
  void clear()
  {
    newestIndex = 0;
    length = 0;
  }
  int get(size_t index)
  { // this.get(0) is the oldest value, this.get(this.getLength() - 1) is the newest value
    if (index < 0 || index >= length)
    {
      return -1;
    }
    return ringBuffer[(N + newestIndex - length + index) % N];
  }
  size_t getLength() { return length; }
};

class HardwareESPBLESerial
{
public:
  // singleton instance getter
  static HardwareESPBLESerial &getInstance()
  {
    static HardwareESPBLESerial instance; // instantiated on first use, guaranteed to be destroyed
    return instance;
  }

  void begin(BLEServer *pServer);
  void poll();
  void end();
  size_t available();
  int peek();
  int read();
  size_t write(uint8_t byte);
  void flush();

  size_t availableLines();
  size_t peekLine(char *buffer, size_t bufferSize);
  size_t readLine(char *buffer, size_t bufferSize);
  size_t print(const char *value);
  size_t println(const char *value);
  size_t print(char value);
  size_t println(char value);
  size_t print(int64_t value);
  size_t println(int64_t value);
  size_t print(uint64_t value);
  size_t println(uint64_t value);
  size_t print(double value);
  size_t println(double value);

  operator bool();

private:
  HardwareESPBLESerial();
  HardwareESPBLESerial(HardwareESPBLESerial const &other) = delete; // disable copy constructor
  void operator=(HardwareESPBLESerial const &other) = delete;       // disable assign constructor

  ByteRingBuffer<BLE_SERIAL_RECEIVE_BUFFER_SIZE> receiveBuffer;
  size_t numAvailableLines;

  unsigned long long lastFlushTime;
  size_t transmitBufferLength;
  uint8_t transmitBuffer[BLE_ATTRIBUTE_MAX_VALUE_LENGTH];

  BLEServer *pServer;
  BLEService *uartService;
  BLECharacteristic *receiveCharacteristic;
  BLECharacteristic *transmitCharacteristic;

  void onReceive(const uint8_t *data, size_t size);
  static void onBLEWritten(BLEDevice central, BLECharacteristic characteristic);

  class ReceiveCharacteristicCallback : public BLECharacteristicCallbacks
  {
  private:
    /* data */
  public:
    ReceiveCharacteristicCallback() {}
    ~ReceiveCharacteristicCallback() {}

    void onWrite(BLECharacteristic *pCharacteristic)
    {
      HardwareESPBLESerial::getInstance().onReceive(pCharacteristic->getData(), pCharacteristic->getLength());
    }
  };
};

#endif