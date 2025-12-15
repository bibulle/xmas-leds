#include <Arduino.h>

#include "localFS.h"

// Use from 0 to 4. Higher number, more debugging messages and memory usage.
#define _WIFIMGR_LOGLEVEL_ 0

// Default pin choices; override by defining macros in board or build flags
// For boards with an onboard LED, set WIFIMGR_PIN_LED via build flags if needed.
constexpr int WIFIMGR_PIN_LED = 2; // default LED pin
#define WIFIMGR_LED_ON HIGH
#define WIFIMGR_LED_OFF LOW

// Trigger pin for entering config portal; -1 disables the feature
constexpr int WIFIMGR_TRIGGER_PIN = -1; // disabled by default

void wifi_setup(void);
void wifi_check_status(void);
