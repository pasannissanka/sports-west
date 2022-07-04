#include "FS.h"
#include "SD.h"

#include "ble_callback.h"

class sd_card
{
private:
  /* data */
public:
  sd_card(/* args */);
  ~sd_card();

  // create/ ensure init.txt, data dir
  void init_files(fs::FS &fs);

  // create record .txt
  void create_record(fs::FS &fs, String sId);

  void append_record(fs::FS &fs, String sId, const char *message);

  static fs::SDFS SD;

private:
  void make_dir(fs::FS &fs, String path);
  void write_file(fs::FS &fs, String full_path, const char *message);
  void append_file(fs::FS &fs, String full_path, const char *message);
};
