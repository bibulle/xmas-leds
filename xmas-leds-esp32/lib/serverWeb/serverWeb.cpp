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
void sendBadRequest(WebServer* server, const char* format, ...) {
  char msg[100];

  va_list arglist;
  va_start(arglist, format);
  vsprintf(msg, format, arglist);
  va_end(arglist);

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
 * Get dir list
 */
void handleFileList() {
  if (!server.hasArg("dir")) {
    server.send(500, "text/plain", "BAD ARGS");
    return;
  }

  String path = server.arg("dir");
  Serial.println("handleFileList: " + path);


  File root = LittleFS.open(path);
  path = String();

  String output = "[";
  if(root.isDirectory()){
      File file = root.openNextFile();
      while(file){
          if (output != "[") {
            output += ',';
          }
          output += "{\"type\":\"";
          output += (file.isDirectory()) ? "dir" : "file";
          output += "\",\"name\":\"";
          output += String(file.path()).substring(1);
          output += "\",\"size\":\"";
          output += String(file.size());
          output += "\"}";
          file = root.openNextFile();
      }
  }
  output += "]";
  server.send(200, "text/json", output);
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
 * Receive animation  (from the client)
 */
void handleFileUpload() {
  HTTPUpload& upload = server.upload();
  Serial.println(upload.filename);
  Serial.println(upload.status);
  Serial.println(upload.name);
  Serial.println(upload.type);
  if (upload.status == UPLOAD_FILE_START) {
    String filename = upload.filename;
    if (!filename.startsWith("/")) {
      filename = "/" + filename;
    }
    filename = "/animations" + filename;
    Serial.print("handleFileUpload Name: ");
    Serial.println(filename);
    fsUploadFile = LittleFS.open(filename, "w");
    Serial.println(fsUploadFile);

    filename = String();
  } else if (upload.status == UPLOAD_FILE_WRITE) {
    Serial.print("handleFileUpload Data: ");
    Serial.println(upload.currentSize);
    if (fsUploadFile) {
      fsUploadFile.write(upload.buf, upload.currentSize);
    }
  } else if (upload.status == UPLOAD_FILE_END) {
    if (fsUploadFile) {
      fsUploadFile.close();
    }
    Serial.print("handleFileUpload Size: ");
    Serial.println(upload.totalSize);
    server.send(200, "text/plain", "Ok");
  }
}
/**
 * Delete animation from the strips
 */
void handleFileDelete() {
  if (server.args() == 0) {
    return server.send(500, "text/plain", "BAD ARGS");
  }
  String path = server.arg(0);
  if (!path.startsWith("/")) {
    path = "/" + path;
  }
  path = "/animations" + path;
  Serial.println("handleFileDelete: " + path);
  if (path == "/") {
    return server.send(500, "text/plain", "BAD PATH");
  }
  if (!exists(path)) {
    return server.send(404, "text/plain", "FileNotFound");
  }
  LittleFS.remove(path);
  server.send(200, "text/plain", "");
  path = String();
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
 * handleGetStatus
 */
void handleGetStatus() {
  String payload = "";
  payload += "{\"up\":";
  payload += String(millis());
  payload += ",\"heapSize\":";
  payload += String(ESP.getHeapSize());
  payload += ",\"heapFree\":";
  payload += String(ESP.getFreeHeap());
  payload += ",\"heapMin\":";
  payload += String(ESP.getMinFreeHeap());
  payload += ",\"heapMax\":";
  payload += String(ESP.getMaxAllocHeap());
  payload += ",\"totalBytes\":";
  payload += String(LittleFS.totalBytes());
  payload += ",\"usedBytes\":";
  payload += String(LittleFS.usedBytes());
  payload += "}";
  server.send(200, "text/json", payload);
}

/**
 * --------------------
 * Init the web server
 * --------------------
 */
void initServerWeb(void) {
  LittleFS.mkdir("/animations");

  // manage the uri to change leds
  server.on("/list", handleFileList);
  server.on("/strip/clear", handleStripClear);
  server.on("/strip/set", handleStripSet);
  server.on("/strip/change", handleStripChange);
  server.on("/getStatus", handleGetStatus);
  server.on(
      "/upload", HTTP_POST, []() {
        server.send(200, "text/plain", "");
      },
      handleFileUpload);

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