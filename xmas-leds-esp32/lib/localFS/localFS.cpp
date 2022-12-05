#include "localFS_internal.h"

//format bytes
String formatBytes(size_t bytes) {
  if (bytes < 1024) {
    return String(bytes) + "B";
  } else if (bytes < (1024 * 1024)) {
    return String(bytes / 1024.0) + "KB";
  } else if (bytes < (1024 * 1024 * 1024)) {
    return String(bytes / 1024.0 / 1024.0) + "MB";
  } else {
    return String(bytes / 1024.0 / 1024.0 / 1024.0) + "GB";
  }
}

/*********************************
 * External : Setup the fs
 *********************************/
void localFS_setup() {

  if (FORMAT_FILESYSTEM) {
    FileFS.format();
  }

  // Format FileFS if not yet
  if (!FileFS.begin(true)) {
    Serial.println(F("SPIFFS/LittleFS failed! Already tried formatting."));

    if (!FileFS.begin()) {
      // prevents debug info from the library to hide err message.
      delay(100);
      Serial.println(F("LittleFS failed!. Please use SPIFFS or EEPROM. Stay forever"));
      while (true) {
        delay(1);
      }
    }
  }

  // {
  //     File root = FileFS.open("/");
  //     File file = root.openNextFile();
  //     while(file){
  //         String fileName = file.name();
  //         size_t fileSize = file.size();
  //         boolean isDir = file.isDirectory();
  //         Serial.printf("FS File: %s, isDir: %s, size: %s\n", fileName.c_str(), isDir ? "true" : "false", formatBytes(fileSize).c_str());
  //         file = root.openNextFile();
  //     }
  //     Serial.printf("\n");
  // }
}