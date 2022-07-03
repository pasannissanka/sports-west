#include "date_time.h"

date_time::date_time()
{
}

date_time::date_time(int offset)
{
  this->offset = offset;
  this->rtc.offset = offset;
}

date_time::~date_time()
{
}