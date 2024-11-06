#include "ledController.h"
#include <WebServer.h>
#include "util.h"
#include "serverWeb.h"
#include "strip.h"
#include "responseUtils.h"

void setPixelsFromString(String leds_string, boolean has_index=false) {
   String led;
  uint8_t rgb_idx = 0;
  while (get_token(leds_string, led, rgb_idx, ',')) {
    led.trim();
    String idxS, rS, gS, bS;
    boolean result;
    if (has_index) {
      result = get_token(led, idxS, 0, ' ') && get_token(led, rS, 1, ' ') && get_token(led, gS, 2, ' ') && get_token(led, bS, 3, ' ');
    } else {
      idxS = rgb_idx;
      result = get_token(led, rS, 0, ' ') && get_token(led, gS, 1, ' ') && get_token(led, bS, 2, ' ');
    }
    if (result) {
      Serial.printf("led %s : '%s' '%s' '%s'\n", idxS, rS, gS, bS);
      setPixel(idxS.toInt(), RgbColor(rS.toInt(), gS.toInt(), bS.toInt()));
    } else {
      sendErrorResponse(&server, 400, "Bad Request (bad format for led %d)", rgb_idx);
      return;
    }
    rgb_idx++;
  }

  showStrip();
  sendSuccessResponse(&server, 200, "Ok");
}

void handleStripClear() {
    setAllPixel(RgbColor(0));
    showStrip();
    sendSuccessResponse(&server, 200, "Ok");
}

void handleStripSet() {
    if (server.method() != HTTP_POST) {
        sendErrorResponse(&server, 400, "Bad Request (should be POST)");
        return;
    }
    String leds_string = server.arg("leds");
    if (leds_string.length() == 0) {
        sendErrorResponse(&server, 400, "Bad Request (no leds body)");
        return;
    }
    setPixelsFromString(leds_string);
}

void handleStripChange() {
    String leds_string = server.arg("leds");
    if (leds_string.length() == 0) {
        sendErrorResponse(&server, 400, "Bad Request (no leds body)");
        return;
    }
    setPixelsFromString(leds_string, true);
}

void handleAnimStop() {
    toggleStopAnimation(true);
    setAllPixel(RgbColor(0));
    showStrip();
    sendSuccessResponse(&server, 200, "Stopped");
}

void handleAnimStart() {
    toggleStopAnimation(false);
    sendSuccessResponse(&server, 200, "Started");
}

