
#include <Arduino.h>

// FLASH_MAP_SETUP_CONFIG(FLASH_MAP_MAX_FS);

#include "localFS.h"
#include "serverWeb.h"
#include "ResponseUtils.h"
#include "FileManager.h"
#include "LedController.h"
#include "strip.h"
#include "wifiCommunication.h"


unsigned long previousMillis1000Cycle = 0;
unsigned long interval1000Cycle = 1000;
unsigned long previousMillis10000Cycle = 0;
unsigned long interval10000Cycle = 10000;

void blinkLeds() {
  // Serial.printf("%d, %d, %d\n", getPixel(0).R, getPixel(0).G, getPixel(0).B);

  RgbColor colors[4] = {
      RgbColor(colorSaturation, 0, 0),
      RgbColor(0, colorSaturation, 0),
      RgbColor(0, 0, colorSaturation),
      RgbColor(colorSaturation, colorSaturation, colorSaturation)};

  RgbColor color = getPixel(0);

  if (color.R == 0) {
    // Serial.println("Colors R, G, B...");

    for (size_t i = 0; i < getPixelCount(); i++) {
      setPixel(i, colors[i % (sizeof(colors) / sizeof(RgbColor))]);
    }
    showStrip();
  } else {
    // Serial.println("Off ...");
    // turn off the pixels
    setAllPixel(RgbColor(0));
    showStrip();
  }
}

void setup() {
  Serial.begin(115200);
  while (!Serial)
    ;  // wait for serial attach

  Serial.println();
  Serial.println("Setting things up ...");
  Serial.flush();

  randomSeed(analogRead(4));

  initStrip();
  wifi_setup();
  initServerWeb();

  Serial.println();
  Serial.println("Settings done");

  startNextAnim();
}

void loop() {
  updateAnim();
  wifi_check_status();
  handleServerWebClient();

  unsigned long currentMillis = millis();

  // functions that shall be called every 1000 ms
  if ((currentMillis - previousMillis1000Cycle) >= interval1000Cycle) {
    previousMillis1000Cycle = currentMillis;

    // blinkLeds();
  }

  // functions that shall be called every 10000 ms
  if ((currentMillis - previousMillis10000Cycle) >= interval10000Cycle) {
    previousMillis10000Cycle = currentMillis;
  }
}
