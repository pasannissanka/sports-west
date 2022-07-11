#include "sd_card.h"

sd_card::sd_card(/* args */)
{
}

sd_card::~sd_card()
{
}

void sd_card::init_files(fs::FS &fs)
{
  File session_file = fs.open(String(SESSION_FILE));
  if (!session_file)
  {
    write_file(fs, String(SESSION_FILE), "ID,IS_CONNECTED,\r\n");
  }
  session_file.close();
  if (!fs.exists(DATA_DIR))
  {
    make_dir(fs, DATA_DIR);
  }
}

void sd_card::create_record(fs::FS &fs, String sId, boolean deviceConnected)
{
  String sData = sId + "," + String(deviceConnected) + ", \r\n";
  append_file(fs, String(SESSION_FILE), sData.c_str());

  String dataPath = String(DATA_DIR) + "/" + sId + ".txt";
  write_file(fs, dataPath, "ID, Data, Time, Lat, Lon, BPM, \r\n");
}

void sd_card::append_record(fs::FS &fs, String sId, const char *message)
{
  String path = String(DATA_DIR) + "/" + sId + ".txt";
  append_file(fs, path, message);
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
