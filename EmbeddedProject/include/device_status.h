#include <Arduino.h>

struct session_status
{
  boolean isRecording = false;
  long sessionId = 0;
  long startTime = 0;
};
class device_status
{
  // status variable to share between device and app goes here
public:
  static bool deviceConnected;
  static session_status sessionStatus;

  static uint16_t connId;
};
