#include <TinyGPS.h>
#include <SoftwareSerial.h>
#include "SD.h"
#include <BLEDevice.h>
#include <EasyButton.h>

#include "date_time.h"
#include "sd_card.h"

#define USE_ARDUINO_INTERRUPTS false // Set-up low-level interrupts for most acurate BPM math.
#include <PulseSensorPlayground.h>   // Includes the PulseSensorPlayground Library.

// Instantiate classes for communicating with the NEO-6M GPS module
TinyGPS gps;
SoftwareSerial ss(16, 17);

// See the following for generating UUIDs:
// https://www.uuidgenerator.net/
#define SERVICE_UUID "08bfe3db-2297-466d-9453-c32f65eb5747"
#define TIMER_CHARACTERISTIC_UUID "fde6d164-f411-49e6-997f-268a2adef697"
#define SESSION_CHARACTERISTIC_UUID "cbc435f5-2d35-4f8d-927e-358f74008aec"

BLEServer *pServer;
BLEService *pService;

// Ble Characteristics
BLECharacteristic *bmeTimerCharacteristic;
BLECharacteristic *bmeSessionCharacteristic;

// Define CS pin for the SD card module
#define SD_CS 5

// Save reading number on RTC memory
RTC_DATA_ATTR int readingID = 0;

// Logging data
String dataMessage;
long sessionId;

// Variables to save coordinates
float flat, flon;
unsigned long age, sats, hdop;
int bpm;

const gpio_num_t buttonPin_DSL = GPIO_NUM_13; // number of the pushbutton pin
const int buttonPin_REC = GPIO_NUM_12;        // number of the pushbutton pin
const int ledPin_REC = GPIO_NUM_14;           // number of the LED pin

EasyButton buttonREC(buttonPin_REC, 50, false, false);
EasyButton buttonDSL(buttonPin_DSL, 50, false, false);

// Pulse sensor
const int PULSE_INPUT = GPIO_NUM_36;
const int PULSE_BLINK = GPIO_NUM_2; // Pin 13 is the on-board LED
const int PULSE_THRESHOLD = 2000;   // Adjust this number to avoid noise when idle

PulseSensorPlayground pulseSensor; // Creates an instance of the PulseSensorPlayground object called "pulseSensor"
byte samplesUntilReport;
const byte SAMPLES_PER_SERIAL_SAMPLE = 10;

boolean is_recording = false;

void getReadings();
void logSDCard();
void print_wakeup_reason();
void readPulseSensor();
void cbPowerBtn();
void cbRecordBtn();
void setTime();

void Task1code(void *pvParameters);

// initialize static variables
boolean ble_callback::deviceConnected = false;
ESP32Time date_time::rtc = ESP32Time();

// ESP32Time rtc;
int offset = 19800;
date_time *dateTime;
long epoch;

sd_card *SD_CARD;

TaskHandle_t Task1;

void setup()
{
  // Start serial communication for debugging purposes
  Serial.begin(115200);

  // setup ext wakeup
  print_wakeup_reason();
  esp_sleep_enable_ext0_wakeup(buttonPin_DSL, HIGH);

  buttonDSL.begin();
  buttonREC.begin();

  // initialize the LED pin as an output
  pinMode(ledPin_REC, OUTPUT);

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
    Serial.println("created pulseSensor Object !"); // This prints one time at Arduino power-up,  or on Arduino reset.
  }

  // Start communication over software serial with the NEO-6M GPS module
  ss.begin(9600);

  // Bluetooth init
  Serial.println("Starting BLE Server!");

  // Initialize time;
  dateTime = new date_time(offset);

  // Create the BLE Device
  BLEDevice::init("SMART SPORTS VEST");
  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ble_callback());
  // Create the BLE Service
  pService = pServer->createService(SERVICE_UUID);

  bmeTimerCharacteristic = pService->createCharacteristic(
      TIMER_CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);

  bmeTimerCharacteristic->setValue(String(dateTime->rtc.getEpoch()).c_str());

  bmeSessionCharacteristic = pService->createCharacteristic(
      SESSION_CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);

  bmeSessionCharacteristic->setValue(String(is_recording).c_str());

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06); // functions that help with iPhone connections issue
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  // Serial.println("Characteristic defined! Now you can read it in the Client!");

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

void loop()
{
  buttonREC.read();
  buttonDSL.read();

  setTime();

  if (pulseSensor.sawNewSample())
  {
    getReadings();
    if (--samplesUntilReport == (byte)0)
    {
      samplesUntilReport = SAMPLES_PER_SERIAL_SAMPLE;
      readPulseSensor();
    }
    delay(20);
  }
}

void Task1code(void *pvParameters)
{
  Serial.print("Task1 running on core ");
  Serial.println(xPortGetCoreID());
  for (;;)
  {
    if (is_recording == true)
    {
      digitalWrite(ledPin_REC, HIGH);
      logSDCard();
      readingID++;
    }
    else
    {
      digitalWrite(ledPin_REC, LOW);
    }
    delay(1000);
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
  dataMessage = String(readingID) + "," + String(dateTime->rtc.getDate()) + "," + String(dateTime->rtc.getEpoch()) + "," + String(flat) + "," + String(flon) + "," + String(bpm) + ",\r\n";
  SD_CARD->append_record(SD, String(sessionId), dataMessage.c_str());
  Serial.print("Written log ");
  Serial.print(dataMessage);
}

void cbPowerBtn()
{
  Serial.println("Power button has been pressed!");
  Serial.println("Going to sleep now");
  delay(1000);
  esp_deep_sleep_start();
}

void cbRecordBtn()
{
  Serial.println("Record button has been pressed!");
  if (is_recording == false)
  {
    Serial.println("Start recording");
    sessionId = dateTime->rtc.getEpoch();
    SD_CARD->create_record(SD, String(sessionId));
  }
  else
  {
    Serial.println("Stopped recording");
  }
  readingID = 0;
  is_recording = !is_recording;
}

void print_wakeup_reason()
{
  esp_sleep_wakeup_cause_t wakeup_reason;

  wakeup_reason = esp_sleep_get_wakeup_cause();

  switch (wakeup_reason)
  {
  case ESP_SLEEP_WAKEUP_EXT0:
    Serial.println("Wakeup caused by external signal using RTC_IO");
    break;
  case ESP_SLEEP_WAKEUP_EXT1:
    Serial.println("Wakeup caused by external signal using RTC_CNTL");
    break;
  case ESP_SLEEP_WAKEUP_TIMER:
    Serial.println("Wakeup caused by timer");
    break;
  case ESP_SLEEP_WAKEUP_TOUCHPAD:
    Serial.println("Wakeup caused by touchpad");
    break;
  case ESP_SLEEP_WAKEUP_ULP:
    Serial.println("Wakeup caused by ULP program");
    break;
  default:
    Serial.printf("Wakeup was not caused by deep sleep: %d\n", wakeup_reason);
    break;
  }
}

void readPulseSensor()
{
  int myBPM = pulseSensor.getBeatsPerMinute(); // Calls function on our pulseSensor object that returns BPM as an "int".
                                               // "myBPM" hold this BPM value now.

  if (pulseSensor.sawStartOfBeat())
  {                                               // Constantly test to see if "a beat happened".
    Serial.println("♥  A HeartBeat Happened ! "); // If test is "true", print a message "a heartbeat happened".
    Serial.print("BPM: ");                        // Print phrase "BPM: "
    Serial.println(myBPM);                        // Print the value inside of myBPM.
    bpm = myBPM;
  }
}

void setTime()
{
  String epochStr = String(bmeTimerCharacteristic->getValue().c_str());
  long epochl = strtol(epochStr.c_str(), NULL, 10);

  if (epoch != epochl)
  {
    epoch = epochl;
    dateTime->rtc.setTime(epoch);
  }
}