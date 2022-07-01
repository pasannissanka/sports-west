#include <BLEServer.h>

class ble_callback : public BLEServerCallbacks
{
private:
  /* data */
public:
  ble_callback(/* args */);
  ~ble_callback();

  void onConnect(BLEServer *pServer);
  void onDisconnect(BLEServer *pServer);

  static bool deviceConnected;
};
