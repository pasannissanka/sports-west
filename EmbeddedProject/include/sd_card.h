#include "FS.h"

class sd_card
{
private:
  /* data */
public:
  sd_card(/* args */);
  ~sd_card();

  void create_recording_dir(fs::FS &fs, String path, String record);
  void write_file(fs::FS &fs, String full_path, const char *message);
  void append_file(fs::FS &fs, String full_path, const char *message);
};
