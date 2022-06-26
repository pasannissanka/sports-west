// Libraries for NEO-6M GPS module
#include <TinyGPS.h>
#include <SoftwareSerial.h>
#include <ezButton.h>

// Libraries for SD card
#include "SD.h"

// Libraries for Ble (Bluetooth Low Energy Server)
#include <BLEDevice.h>
#include <BLEServer.h>

// Instantiate classes for communicating with the NEO-6M GPS module
TinyGPS gps;
SoftwareSerial ss(16, 17);

// See the following for generating UUIDs:
// https://www.uuidgenerator.net/

#define SERVICE_UUID "08bfe3db-2297-466d-9453-c32f65eb5747"
#define CHARACTERISTIC_UUID "055aedc8-c77b-4565-bf6c-be35f83997da"

BLEServer *pServer;
BLEService *pService;
BLECharacteristic *pCharacteristic;

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

int is_recording = 0;

void getReadings();
void getTimeStamp();
void logSDCard();
void writeFile(fs::FS &fs, const char *path, const char *message);
void appendFile(fs::FS &fs, const char *path, const char *message);
void listenButtonPress();
void print_wakeup_reason();

void setup()
{
  // Start serial communication for debugging purposes
  Serial.begin(115200);

  // Setup buttons
  buttonREC.setDebounceTime(50); // set debounce time to 50 milliseconds
  buttonDSL.setDebounceTime(50);

  // initialize the LED pin as an output
  pinMode(ledPin_REC, OUTPUT);

  Serial.println("Starting BLE Server!");

  BLEDevice::init("ESP32-BLE-Server");
  pServer = BLEDevice::createServer();
  pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_READ |
          BLECharacteristic::PROPERTY_WRITE);

  pCharacteristic->setValue("Hello, World!");
  pService->start();
  // BLEAdvertising *pAdvertising = pServer->getAdvertising();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06); // functions that help with iPhone connections issue
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  // pAdvertising->start();
  Serial.println("Characteristic defined! Now you can read it in the Client!");

  delay(2000);

  // Start communication over software serial with the NEO-6M GPS module
  ss.begin(9600);

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

  print_wakeup_reason();

  // setup ext wakeup
  esp_sleep_enable_ext0_wakeup(buttonPin_DSL, HIGH);
}

void loop()
{
  buttonREC.loop();
  buttonDSL.loop();

  listenButtonPress();
  Serial.print("Is recoring");
  Serial.println(is_recording);

  if (is_recording == HIGH)
  {
    // getReadings();  // from the NEO-6M GPS module
    // getTimeStamp(); // from the NTP server
    // logSDCard();
    digitalWrite(ledPin_REC, HIGH);
  }
  else
  {
    digitalWrite(ledPin_REC, LOW);
  }

  std::string value = pCharacteristic->getValue();
  Serial.print("The new characteristic value is: ");
  Serial.println(value.c_str());

  delay(1000);

  // Increment readingID on every new reading
  // readingID++;
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