#include <TinyGPS.h>
#include <SoftwareSerial.h>
#include "SD.h"
#include <BLEDevice.h>
#include <EasyButton.h>

#include "date_time.h"
#include "sd_card.h"

#include "HardwareESPBLESerial.h"

#define USE_ARDUINO_INTERRUPTS false // Set-up low-level interrupts for most acurate BPM math.
#include <PulseSensorPlayground.h>   // Includes the PulseSensorPlayground Library.

TinyGPS gps; // Instantiate classes for communicating with the NEO-6M GPS module
SoftwareSerial ss(16, 17);

// See the following for generating UUIDs:
// https://www.uuidgenerator.net/
#define SERVICE_UUID "08bfe3db-2297-466d-9453-c32f65eb5747"
#define TIMER_CHARACTERISTIC_UUID "fde6d164-f411-49e6-997f-268a2adef697"

// Session data
#define SESSION_TRIGGER_CUUID "b488d6a7-668e-46c6-b96f-6f0750eb60b6"
#define SESSION_STATUS_CUUID "cbc435f5-2d35-4f8d-927e-358f74008aec"
#define SESSION_ID_CUUID "c27816aa-45d9-4015-9871-fc9d54fef218"
#define SESSION_START_T_CUUID "f8bed3ea-b942-4655-8034-1bcedaaebbd0"
#define SESSION_END_T_CUUID "495bc49a-ab9f-4e30-9f26-769d223b89ec"

#define DATA_TRANSMIT_TRIGGER_CUUID "378ef6c9-9ad1-4309-9534-e1dfe44698af"
#define DATA_TRANSMIT_PROGRESS_CUUID "feeadf3f-df3f-42f4-933d-20abf58e27ca"

#define BLE_SERVICE_UUID "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"

#define LOGGING_DELAY 5000

BLEServer *pServer;
BLEService *pService;

BLECharacteristic *pTimerCharacteristic; // Ble Characteristics

BLECharacteristic *pSessionTriggerCharacteristic; // Session Characteristics
BLECharacteristic *pSessionStatusCharacteristic;
BLECharacteristic *pSessionIDCharacteristic;
BLECharacteristic *pSessionStartTimeCharacteristic;
BLECharacteristic *pSessionEndTimeCharacteristic;

BLECharacteristic *pDataTransmitCharacteristic; // Data Transmit Characteristics
BLECharacteristic *pDataTransmitProgressCharacteristic;

#define SD_CS 5 // Define CS pin for the SD card module

const gpio_num_t buttonPin_DSL = GPIO_NUM_13; // number of the pushbutton pin
const int buttonPin_REC = GPIO_NUM_12;        // number of the pushbutton pin
const int ledPin_REC = GPIO_NUM_14;           // number of the LED pin

EasyButton buttonREC(buttonPin_REC, 50, false, false);
EasyButton buttonDSL(buttonPin_DSL, 50, false, false);

// Pulse sensor
const int PULSE_INPUT = GPIO_NUM_36; // PulseSensor input
const int PULSE_BLINK = GPIO_NUM_2;  // Pin 13 is the on-board LED
const int PULSE_THRESHOLD = 2000;    // Adjust this number to avoid noise when idle

PulseSensorPlayground pulseSensor; // Creates an instance of the PulseSensorPlayground
byte samplesUntilReport;
const byte SAMPLES_PER_SERIAL_SAMPLE = 10;

void getReadings();
void logSDCard();
void readPulseSensor();
void cbPowerBtn();
void cbRecordBtn();
void setTime();
void startRecording();
void stopRecording();
void notifyBleSessionCharacteristic(boolean isStopped);
void triggerTransmission();
void Task1code(void *pvParameters);

// initialize static variables
boolean device_status::deviceConnected = false; // Device status
session_status device_status::sessionStatus;
uint16_t device_status::connId = 0;

RTC_DATA_ATTR int readingID = 0; // Save reading number on RTC memory

String dataMessage; // Logging data
long sessionId;

float flat, flon; // Variables to save coordinates
unsigned long age, sats, hdop;
int bpm; // BPM

ESP32Time date_time::rtc = ESP32Time(); // ESP32Time rtc;
int offset = 19800;                     // Timezone offset (+05:30 LK)
date_time *dateTime;
long epoch;

sd_card *SD_CARD;
TaskHandle_t Task1;

class ble_session_callback : public BLECharacteristicCallbacks
{
private:
  /* data */
public:
  ble_session_callback() {}
  ~ble_session_callback() {}

  void onWrite(BLECharacteristic *pCharacteristic)
  {
    if (device_status::sessionStatus.isRecording)
    {
      stopRecording();
    }
    else
    {
      startRecording();
    }
  }
};

boolean isTransmitting = false; // Transmission status
int transmissionProgress = 0;

class ble_dataTransmission_callback : public BLECharacteristicCallbacks
{
public:
  ble_dataTransmission_callback() {}
  ~ble_dataTransmission_callback() {}

  void onWrite(BLECharacteristic *pCharacteristic)
  {
    triggerTransmission();
  }
};

HardwareESPBLESerial &BLSerial = HardwareESPBLESerial::getInstance();

void setup()
{
  Serial.begin(115200); // Start serial communication for debugging purposes

  esp_sleep_enable_ext0_wakeup(buttonPin_DSL, HIGH); // setup ext wakeup

  buttonDSL.begin(); // Deep Sleep button
  buttonREC.begin(); // Record button

  pinMode(ledPin_REC, OUTPUT); // initialize the LED pin as an output

  buttonREC.onPressed(cbRecordBtn);
  buttonDSL.onPressedFor(2000, cbPowerBtn);

  // Configure the PulseSensor object, by assigning our variables to it.
  pulseSensor.analogInput(PULSE_INPUT);
  pulseSensor.blinkOnPulse(PULSE_BLINK); // auto-magically blink Arduino's LED with heartbeat.
  pulseSensor.setThreshold(PULSE_THRESHOLD);
  // Skip the first SAMPLES_PER_SERIAL_SAMPLE in the loop().
  samplesUntilReport = SAMPLES_PER_SERIAL_SAMPLE;
  // Double-check the "pulseSensor" object was created and "began" seeing a signal.
  if (pulseSensor.begin())
  {
    Serial.println("created pulseSensor Object !");
  }

  ss.begin(9600); // Start communication over software serial with the NEO-6M GPS module

  dateTime = new date_time(offset); // Initialize time;

  Serial.println("Starting BLE Server!"); // Bluetooth init

  BLEDevice::init("SMART SPORTS VEST"); // Create the BLE Device

  pServer = BLEDevice::createServer();       // Create the BLE Server
  pServer->setCallbacks(new ble_callback()); // Server callbacks

  pService = pServer->createService(SERVICE_UUID); // Create the BLE Service

  // Create Characteristics
  pTimerCharacteristic = pService->createCharacteristic(
      TIMER_CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE); // Device time Characteristic
  pTimerCharacteristic->setValue(String(dateTime->rtc.getEpoch()).c_str());

  pSessionTriggerCharacteristic = pService->createCharacteristic(
      SESSION_TRIGGER_CUUID,
      BLECharacteristic::PROPERTY_READ |
          BLECharacteristic::PROPERTY_WRITE |
          BLECharacteristic::PROPERTY_NOTIFY); // Session trigger Characteristics
  pSessionTriggerCharacteristic->setCallbacks(new ble_session_callback());

  pSessionStatusCharacteristic = pService->createCharacteristic(
      SESSION_STATUS_CUUID,
      BLECharacteristic::PROPERTY_READ); // Session status Characteristics
  pSessionStatusCharacteristic->setValue("false");

  pSessionIDCharacteristic = pService->createCharacteristic(
      SESSION_ID_CUUID,
      BLECharacteristic::PROPERTY_READ); // Session ID Characteristics
  pSessionIDCharacteristic->setValue("-1");

  pSessionStartTimeCharacteristic = pService->createCharacteristic(
      SESSION_START_T_CUUID,
      BLECharacteristic::PROPERTY_READ); // Session start time Characteristics
  pSessionStartTimeCharacteristic->setValue("-1");

  pSessionEndTimeCharacteristic = pService->createCharacteristic(
      SESSION_END_T_CUUID,
      BLECharacteristic::PROPERTY_READ); // Session end time Characteristics
  pSessionEndTimeCharacteristic->setValue("-1");

  // Data transmit Characteristics
  pDataTransmitCharacteristic = pService->createCharacteristic(
      DATA_TRANSMIT_TRIGGER_CUUID,
      BLECharacteristic::PROPERTY_WRITE |
          BLECharacteristic::PROPERTY_NOTIFY); // Data transmit status Characteristics
  pDataTransmitCharacteristic->setCallbacks(new ble_dataTransmission_callback());

  pDataTransmitProgressCharacteristic = pService->createCharacteristic(
      DATA_TRANSMIT_PROGRESS_CUUID,
      BLECharacteristic::PROPERTY_READ |
          BLECharacteristic::PROPERTY_NOTIFY); // Data transmit progress Characteristics
  pDataTransmitProgressCharacteristic->setValue(transmissionProgress);

  pService->start(); // Start the service

  BLSerial.begin(pServer);

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->addServiceUUID(BLE_SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06); // functions that help with iPhone connections issue
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  // Initialize SD card
  SD_CARD = new sd_card();

  SD.begin(SD_CS);
  if (!SD.begin(SD_CS))
  {
    return;
  }
  uint8_t cardType = SD.cardType();
  if (cardType == CARD_NONE)
  {
    return;
  }
  SD_CARD->init_files(SD);

  delay(500);
  xTaskCreatePinnedToCore(
      Task1code, /* Task function. */
      "Task1",   /* name of task. */
      10000,     /* Stack size of task */
      NULL,      /* parameter of the task */
      1,         /* priority of the task */
      &Task1,    /* Task handle to keep track of created task */
      0);        /* pin task to core 0 */

  delay(500);

  Serial.print("Main running on core ");
  Serial.println(xPortGetCoreID());

  Serial.println("Ready");
}

// loop
void loop()
{
  buttonREC.read();
  buttonDSL.read();

  if (isTransmitting == false)
  {
    setTime();
    if (pulseSensor.sawNewSample())
    {
      // getReadings();
      if (--samplesUntilReport == (byte)0)
      {
        samplesUntilReport = SAMPLES_PER_SERIAL_SAMPLE;
        readPulseSensor();
      }
    }
  }
  else
  {
    // Do transmitting
    String filePath = String(DATA_DIR) + "/" + String(device_status::sessionStatus.sessionId) + ".txt";
    File dataFile = SD.open(filePath.c_str());

    Serial.println(filePath);

    if (dataFile)
    {
      unsigned long start = millis();
      while (dataFile.available())
      {
        int size = dataFile.size();
        BLSerial.write(dataFile.read());
        // Serial.write(dataFile.read());

        int position = dataFile.position();
        int progress = ceil(position / size * 100);
        if (progress != transmissionProgress)
        {
          transmissionProgress = progress;

          if (millis() - start > 5000)
          {
            Serial.print("Progress : ");
            Serial.println(transmissionProgress);
          }
        }
      }
      dataFile.close();
      isTransmitting = false;
      pDataTransmitCharacteristic->setValue(String(isTransmitting == true ? "true" : "false").c_str());
      pDataTransmitCharacteristic->notify();
      pDataTransmitProgressCharacteristic->setValue(transmissionProgress);
      pDataTransmitProgressCharacteristic->notify();
    }
    else
    {
      Serial.println("error opening data file");
    }
  }
}

// Data logging task on core 0
void Task1code(void *pvParameters)
{
  Serial.print("Task1 running on core ");
  Serial.println(xPortGetCoreID());

  for (;;)
  {
    if (device_status::sessionStatus.isRecording == true)
    {
      digitalWrite(ledPin_REC, HIGH);
      logSDCard();
      readingID++;
    }
    else
    {
      digitalWrite(ledPin_REC, LOW);
    }
    // time between logs (5s)
    delay(LOGGING_DELAY);
  }
}

// Function to get the GPS data
void getReadings()
{
  bool newData = false;
  unsigned long chars;
  unsigned short sentences, failed;

  // For one second we parse GPS data and report some key values
  for (unsigned long start = millis(); millis() - start < 1000;)
  {
    while (ss.available())
    {
      char c = ss.read();
      if (gps.encode(c)) // Did a new valid sentence come in?
        newData = true;
    }
  }

  if (newData)
  {
    gps.f_get_position(&flat, &flon, &age);
    flat = flat == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : flat, 6;
    flon = flon == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : flon, 6;
    sats = gps.satellites() == TinyGPS::GPS_INVALID_SATELLITES ? 0 : gps.satellites();
    hdop = gps.hdop() == TinyGPS::GPS_INVALID_HDOP ? 0 : gps.hdop();
    Serial.print("LAT=");
    Serial.print(flat);
    Serial.print(" LON=");
    Serial.print(flon);
    Serial.print(" SAT=");
    Serial.print(sats);
    Serial.print(" PREC=");
    Serial.print(hdop);
    return;
  }
}

// Write the sensor readings on the SD card
void logSDCard()
{
  dataMessage = String(readingID) + "," + String(dateTime->rtc.getLocalEpoch()) + "," + String(flat) + "," + String(flon) + "," + String(bpm) + "\r\n";
  SD_CARD->append_record(SD, String(device_status::sessionStatus.sessionId), dataMessage.c_str());
  Serial.print("Written log ");
  Serial.print(dataMessage);
}

void cbPowerBtn()
{
  Serial.println("Power button has been pressed!");
  Serial.println("Going to sleep now");
  pServer->disconnect(device_status::connId);
  delay(1000);
  esp_deep_sleep_start();
}

void startRecording()
{
  readingID = 0;
  device_status::sessionStatus.sessionId = dateTime->rtc.getLocalEpoch();
  device_status::sessionStatus.isRecording = true;
  SD_CARD->create_record(SD, String(device_status::sessionStatus.sessionId), device_status::deviceConnected);
  device_status::sessionStatus.startTime = dateTime->rtc.getLocalEpoch();

  notifyBleSessionCharacteristic(false);
}

void notifyBleSessionCharacteristic(boolean isStopped)
{
  pSessionStatusCharacteristic->setValue(String(device_status::sessionStatus.isRecording ? "true" : "false").c_str());
  pSessionStatusCharacteristic->notify();

  pSessionIDCharacteristic->setValue(String(device_status::sessionStatus.sessionId).c_str());
  pSessionIDCharacteristic->notify();

  pSessionStartTimeCharacteristic->setValue(String(device_status::sessionStatus.startTime).c_str());
  pSessionStartTimeCharacteristic->notify();

  if (isStopped)
  {
    pSessionEndTimeCharacteristic->setValue(String(dateTime->rtc.getEpoch()).c_str());
    pSessionEndTimeCharacteristic->notify();
  }
}

void stopRecording()
{
  readingID = 0;
  // device_status::sessionStatus.sessionId = -1;
  device_status::sessionStatus.startTime = -1;
  device_status::sessionStatus.isRecording = false;

  notifyBleSessionCharacteristic(true);
}

void cbRecordBtn()
{
  Serial.println("Record button has been pressed!");
  if (device_status::sessionStatus.isRecording == false)
  {
    Serial.println("Start recording");
    startRecording();
  }
  else
  {
    Serial.println("Stopped recording");
    stopRecording();
  }
}

void readPulseSensor()
{
  int myBPM = pulseSensor.getBeatsPerMinute(); // Calls function on our pulseSensor object that returns BPM as an "int".
                                               // "myBPM" hold this BPM value now.

  if (pulseSensor.sawStartOfBeat())
  { // Constantly test to see if "a beat happened".
    // Serial.println("♥  A HeartBeat Happened ! "); // If test is "true", print a message "a heartbeat happened".
    // Serial.print("BPM: ");                        // Print phrase "BPM: "
    // Serial.println(myBPM);                        // Print the value inside of myBPM.
    bpm = myBPM;
  }
}

void setTime()
{
  String epochStr = String(pTimerCharacteristic->getValue().c_str());
  long epochl = strtol(epochStr.c_str(), NULL, 10);

  if (epoch != epochl)
  {
    epoch = epochl;
    dateTime->rtc.setTime(epoch);
  }
}

void triggerTransmission()
{
  if (isTransmitting == true)
  {
    isTransmitting = false;
  }
  else
  {
    isTransmitting = true;
  }
  Serial.println(isTransmitting);
  pDataTransmitCharacteristic->setValue(String(isTransmitting == true ? "true" : "false").c_str());
  pDataTransmitCharacteristic->notify();
}