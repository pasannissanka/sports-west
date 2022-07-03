#include "sd_card.h"

sd_card::sd_card(/* args */)
{
}

sd_card::~sd_card()
{
}

#define SESSION_FILE "session.txt"
#define DATA_DIR "data"

void sd_card::init_files(fs::FS &fs)
{
  File session_file = fs.open(SESSION_FILE);
  if (!session_file)
  {
    write_file(fs, SESSION_FILE, "ID, IS_CONNECTED, \r\n");
  }
  session_file.close();
  if (!fs.exists("data"))
  {
    make_dir(fs, "data");
  }
}

void sd_card::create_record(fs::FS &fs, String sId)
{
  String sData = sId + String(ble_callback::deviceConnected);
  append_file(fs, SESSION_FILE, sData.c_str());

  String dataPath = String(DATA_DIR) + "/" + sId + ".txt";
  write_file(fs, dataPath, "ID, Data, Time, Lat, Lon, BPM, \r\n");
}

void sd_card::make_dir(fs::FS &fs, String path)
{
  if (!fs.mkdir(path))
  {
    Serial.println("sd_card:: MKDIR FAILED!");
  }
}

void sd_card::write_file(fs::FS &fs, String full_path, const char *message)
{
  File file = fs.open(full_path, FILE_WRITE);
  if (!file)
  {
    return;
  }
  if (!file.print(message))
  {
    Serial.println("sd_card:: WRITE_FILE FAILED!");
  }
  file.close();
}

void sd_card::append_file(fs::FS &fs, String full_path, const char *message)
{
  File file = fs.open(full_path, FILE_APPEND);
  if (!file)
  {
    return;
  }
  if (!file.print(message))
  {
    Serial.println("sd_card:: APPEND_FILE FAILED!");
  }
  file.close();
}
