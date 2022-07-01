// Libraries for NEO-6M GPS module
#include <TinyGPS.h>
#include <SoftwareSerial.h>
#include <ezButton.h>

// Libraries for SD card
#include "SD.h"

// Libraries for Ble (Bluetooth Low Energy Server)
#include <BLEDevice.h>

#include <ESP32Time.h>

#include "ble_callback.h"

#define USE_ARDUINO_INTERRUPTS false // Set-up low-level interrupts for most acurate BPM math.
#include <PulseSensorPlayground.h>   // Includes the PulseSensorPlayground Library.

// Instantiate classes for communicating with the NEO-6M GPS module
TinyGPS gps;
SoftwareSerial ss(16, 17);

// See the following for generating UUIDs:
// https://www.uuidgenerator.net/
#define SERVICE_UUID "08bfe3db-2297-466d-9453-c32f65eb5747"
#define CHARACTERISTIC_UUID "055aedc8-c77b-4565-bf6c-be35f83997da"
#define TIMER_CHARACTERISTIC_UUID "fde6d164-f411-49e6-997f-268a2adef697"
#define SESSION_CHARACTERISTIC_UUID "cbc435f5-2d35-4f8d-927e-358f74008aec"

BLEServer *pServer;
BLEService *pService;
BLECharacteristic *pCharacteristic;

BLECharacteristic *bmeTimerCharacteristic;
BLECharacteristic *bmeSessionCharacteristic;

// Define CS pin for the SD card module
#define SD_CS 5

// Save reading number on RTC memory
RTC_DATA_ATTR int readingID = 0;

String dataMessage;

// Variables to save coordinates
float flat, flon;
unsigned long age, sats, hdop;

const gpio_num_t buttonPin_DSL = GPIO_NUM_13; // the number of the pushbutton pin
const int buttonPin_REC = GPIO_NUM_12;        // the number of the pushbutton pin
const int ledPin_REC = GPIO_NUM_14;           // the number of the LED pin

int button_DSL_state = 0;
ezButton buttonREC(buttonPin_REC); // create ezButton object
ezButton buttonDSL(buttonPin_DSL); // create ezButton object

// Pulse sensor
const int PULSE_INPUT = GPIO_NUM_36;
const int PULSE_BLINK = GPIO_NUM_2; // Pin 13 is the on-board LED
const int THRESHOLD = 2000;         // Adjust this number to avoid noise when idle

PulseSensorPlayground pulseSensor; // Creates an instance of the PulseSensorPlayground object called "pulseSensor"
byte samplesUntilReport;
const byte SAMPLES_PER_SERIAL_SAMPLE = 10;

int is_recording = 0;

void getReadings();
void getTimeStamp();
void logSDCard();
void writeFile(fs::FS &fs, const char *path, const char *message);
void appendFile(fs::FS &fs, const char *path, const char *message);
void listenButtonPress();
void print_wakeup_reason();
void readPulseSensor();

boolean ble_callback::deviceConnected = false;

// ESP32Time rtc;

int offset = 19800;
ESP32Time rtc(offset);

void setup()
{
  // Start serial communication for debugging purposes
  Serial.begin(115200);

  // setup ext wakeup
  print_wakeup_reason();
  esp_sleep_enable_ext0_wakeup(buttonPin_DSL, HIGH);

  // Setup buttons
  buttonREC.setDebounceTime(50); // set debounce time to 50 milliseconds
  buttonDSL.setDebounceTime(50);

  // initialize the LED pin as an output
  pinMode(ledPin_REC, OUTPUT);

  // Configure the PulseSensor object, by assigning our variables to it.
  pulseSensor.analogInput(PULSE_INPUT);
  pulseSensor.blinkOnPulse(PULSE_BLINK); // auto-magically blink Arduino's LED with heartbeat.
  pulseSensor.setThreshold(THRESHOLD);

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

  // Create the BLE Device
  BLEDevice::init("SMART SPORTS VEST");
  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ble_callback());
  // Create the BLE Service
  pService = pServer->createService(SERVICE_UUID);

  // Create BLE Characteristics and Create a BLE Descriptor
  pCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_READ |
          BLECharacteristic::PROPERTY_WRITE);

  pCharacteristic->setValue("Hello, World!");

  bmeTimerCharacteristic = pService->createCharacteristic(
      TIMER_CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);

  bmeTimerCharacteristic->setValue(String(rtc.getEpoch()).c_str());

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
  if (!SD.begin(SD_CS))
  {
    return; // init failed
  }

  // If the data.txt file doesn't exist
  // Create a file on the SD card and write the data labels
  File file = SD.open("/data.txt");
  if (!file)
  {
    writeFile(SD, "/data.txt", "Reading ID, Date, Time of Day, Latitude, Longitude, \r\n");
  }

  file.close();

  delay(2000);
}

void loop()
{
  buttonREC.loop();
  buttonDSL.loop();
  listenButtonPress();

  String epochStr = String(bmeTimerCharacteristic->getValue().c_str());
  unsigned long epoch = strtol(epochStr.c_str(), NULL, 10);

  rtc.setTime(epoch);

  Serial.print("TIME=");
  Serial.println(epochStr);
  Serial.println(epoch);
  Serial.println(rtc.getDateTime());

  if (pulseSensor.sawNewSample())
  {

    /*
       Every so often, send the latest Sample.
       We don't print every sample, because our baud rate
       won't support that much I/O.
    */
    if (--samplesUntilReport == (byte)0)
    {
      samplesUntilReport = SAMPLES_PER_SERIAL_SAMPLE;
      /*
         At about the beginning of every heartbeat,
         report the heart rate and inter-beat-interval.
      */
      Serial.print("Is Device connected ");
      Serial.println(ble_callback::deviceConnected);
      if (is_recording == HIGH)
      {
        getReadings();
        readPulseSensor();

        digitalWrite(ledPin_REC, HIGH);
        readingID++;
      }
      else
      {
        digitalWrite(ledPin_REC, LOW);
      }
    }
    delay(20);
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

void getTimeStamp()
{
  // TODO
}

// Write the sensor readings on the SD card
void logSDCard()
{
  dataMessage = String(readingID) + "," + String(flat) + "," + String(flon) + "\r\n";
  appendFile(SD, "/data.txt", dataMessage.c_str());
}

// Write to the SD card (DON'T MODIFY THIS FUNCTION)
void writeFile(fs::FS &fs, const char *path, const char *message)
{
  File file = fs.open(path, FILE_WRITE);
  if (!file)
  {
    return;
  }
  file.close();
}

// Append data to the SD card (DON'T MODIFY THIS FUNCTION)
void appendFile(fs::FS &fs, const char *path, const char *message)
{
  File file = fs.open(path, FILE_APPEND);
  if (!file)
  {
    return;
  }
  file.close();
}

void listenButtonPress()
{
  if (buttonREC.isPressed())
  {
    is_recording = !is_recording;
  }
  if (buttonDSL.isPressed())
  {
    Serial.println("Going to sleep now");
    delay(1000);
    esp_deep_sleep_start();
  }
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
  }
}