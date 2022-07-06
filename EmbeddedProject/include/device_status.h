class device_status
{
  // status variable to share between device and app goes here
public:
  static bool deviceConnected;
  static bool sessionRecording;

  static uint16_t connId;
};