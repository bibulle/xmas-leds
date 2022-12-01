#include "serverWeb.h"

#include <LittleFS.h>
#include <WebServer.h>

#include "strip.h"
#include "util.h"

WebServer server(80);
File fsUploadFile;

/**
 * send bad request
*/
void sendBadRequest(WebServer *server, const char* format, ...) {
    char msg[100];
    
    va_list arglist;
    va_start( arglist, format );
    vsprintf(msg, format, arglist );
    va_end( arglist );

    server->send(400, "text/plain", msg);
}
/**
 * Get content type by file
 */
String getContentType(String filename) {
  if (server.hasArg("download")) {
    return "application/octet-stream";
  } else if (filename.endsWith(".htm")) {
    return "text/html";
  } else if (filename.endsWith(".html")) {
    return "text/html";
  } else if (filename.endsWith(".css")) {
    return "text/css";
  } else if (filename.endsWith(".js")) {
    return "application/javascript";
  } else if (filename.endsWith(".png")) {
    return "image/png";
  } else if (filename.endsWith(".gif")) {
    return "image/gif";
  } else if (filename.endsWith(".jpg")) {
    return "image/jpeg";
  } else if (filename.endsWith(".ico")) {
    return "image/x-icon";
  } else if (filename.endsWith(".xml")) {
    return "text/xml";
  } else if (filename.endsWith(".pdf")) {
    return "application/x-pdf";
  } else if (filename.endsWith(".zip")) {
    return "application/x-zip";
  } else if (filename.endsWith(".gz")) {
    return "application/x-gzip";
  }
  return "text/plain";
}
/**
 * Do a file exists in the filesystem
 */
bool exists(String path) {
  // Serial.println("exists: " + path);
  bool yes = false;
  File file = LittleFS.open(path, "r");
  if (file.available() && !file.isDirectory()) {
    yes = true;
  }
  file.close();
  return yes;
}
/**
 * Send file to server (for the client)
 */
bool handleFileRead(String path) {
  Serial.println("handleFileRead: " + path);

  // If there is a dot at first char in the path, say not found
  String token;
  uint8_t token_idx = 0;
  while (get_token(path, token, token_idx, '/')) {
    if (token.length() > 1 && token.charAt(0) == '.') {
      return false;
    }
    token_idx++;
  }

  if (path.endsWith("/")) {
    path += "index.html";
  }
  String contentType = getContentType(path);
  String pathWithGz = path + ".gz";
  if (exists(pathWithGz) || exists(path)) {
    if (exists(pathWithGz)) {
      path += ".gz";
    }
    File file = LittleFS.open(path, "r");
    server.streamFile(file, contentType);
    file.close();
    return true;
  }
  return false;
}

/**
 * Handle strip clear
 */
void handleStripClear() {
  Serial.println("receive /strip/clear");
  setAllPixel(RgbColor(0));
  showStrip();
  server.send(200, "text/plain", "Ok");
}
/**
 * Handle strip set
 *    POST with load "leds: 255 0 0, 0 255 0, ....."
 *                          ^        ^
 *                          led0     led1
 */
void handleStripSet() {
  Serial.println("receive /strip/set");
  if (server.method() != HTTP_POST) {
    sendBadRequest(&server, "Bad Request (should be POST)");
    return;
  }

  String leds_string = "";
  for (uint8_t i = 0; i < server.args(); i++) {
    Serial.println(server.argName(i) + ": " + server.arg(i));
    if (server.argName(i) == "leds") {
      leds_string = server.arg(i);
    }
  }
  if (leds_string.length() == 0) {
    sendBadRequest(&server, "Bad Request (no leds body)");
    return;
  }

  String led;
  uint8_t rgb_idx = 0;
  while (get_token(leds_string, led, rgb_idx, ',')) {
    led.trim();
    String rS, gS, bS;
    if (get_token(led, rS, 0, ' ') && get_token(led, gS, 1, ' ') && get_token(led, bS, 2, ' ')) {
      Serial.printf("led %d : '%s' '%s' '%s'\n", rgb_idx, rS, gS, bS);
      setPixel(rgb_idx, RgbColor(rS.toInt(), gS.toInt(), bS.toInt()));
    } else {
      sendBadRequest(&server, "Bad Request (bad format for led %d)", rgb_idx);
      return;
    }
    rgb_idx++;
  }

  showStrip();
  server.send(200, "text/plain", "Ok");
}
/**
 * Handle strip change
 *    POST with load "leds: 0 255 0 0, 5 0 255 0, ....."
 *                          ^          ^
 *                          led0       led5
 */
void handleStripChange() {
  Serial.println("receive /strip/change");
  if (server.method() != HTTP_POST) {
    sendBadRequest(&server, "Bad Request (should be POST)");
    return;
  }

  String leds_string = "";
  for (uint8_t i = 0; i < server.args(); i++) {
    Serial.println(server.argName(i) + ": " + server.arg(i));
    if (server.argName(i) == "leds") {
      leds_string = server.arg(i);
    }
  }
  if (leds_string.length() == 0) {
    sendBadRequest(&server, "Bad Request (no leds body)");
    return;
  }

  String led;
  uint8_t rgb_idx = 0;
  while (get_token(leds_string, led, rgb_idx, ',')) {
    led.trim();
    String idxS, rS, gS, bS;
    if (get_token(led, idxS, 0, ' ') && get_token(led, rS, 1, ' ') && get_token(led, gS, 2, ' ') && get_token(led, bS, 3, ' ')) {
      Serial.printf("led %s : '%s' '%s' '%s'\n", idxS, rS, gS, bS);
      setPixel(idxS.toInt(), RgbColor(rS.toInt(), gS.toInt(), bS.toInt()));
    } else {
      sendBadRequest(&server, "Bad Request (bad format for led %d)", rgb_idx);
      return;
    }
    rgb_idx++;
  }

  showStrip();
  server.send(200, "text/plain", "Ok");
}


/**
 * --------------------
 * Init the web server
 * --------------------
 */
void initServerWeb(void) {
  // manage the uri to change leds
  server.on("/strip/clear", handleStripClear);
  server.on("/strip/set", handleStripSet);
  server.on("/strip/change", handleStripChange);

  // called when the url is not defined here
  // use it to load content from FILESYSTEM
  server.onNotFound([]() {
    if (!handleFileRead(server.uri())) {
      server.send(404, "text/plain", "FileNotFound");
    }
  });

  server.begin();
}

/**
 * --------------------
 * Handle the client request
 * --------------------
 */
void handleServerWebClient(void) {
  server.handleClient();
}