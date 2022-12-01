#include <Arduino.h>

#include "localFS.h"

// Use from 0 to 4. Higher number, more debugging messages and memory usage.
#define _WIFIMGR_LOGLEVEL_ 0

const int WIFIMGR_PIN_LED = LED_BUILTIN;
#define WIFIMGR_LED_ON HIGH
#define WIFIMGR_LED_OFF LOW

const int WIFIMGR_TRIGGER_PIN = T1; // Boot button

void wifi_setup(void);
void wifi_check_status(void);
