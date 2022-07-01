#include "sd_card.h"

sd_card::sd_card(/* args */)
{
}

sd_card::~sd_card()
{
}

void sd_card::create_recording_dir(fs::FS &fs, String path, String record)
{
  String full_path = path + record;
  if (!fs.mkdir(full_path))
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