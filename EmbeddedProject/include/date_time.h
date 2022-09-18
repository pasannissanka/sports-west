#include <ESP32Time.h>

class date_time
{
private:
  /* data */
public:
  date_time();
  date_time(int offset);
  ~date_time();

  int offset;
  static ESP32Time rtc;
};
