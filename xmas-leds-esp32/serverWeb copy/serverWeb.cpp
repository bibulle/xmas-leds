#include "serverWeb.h"
#include <LittleFS.h>
#include <WebServer.h>
#include "strip.h"
#include "util.h"

WebServer server(80);
File fsUploadFile;

/**
 * Fonction générique pour envoyer une réponse
 * success: true si c'est un succès, false si c'est une erreur
 */
void sendResponse(WebServer *server, int code, const char *resultType, const char *format, ...)
{
  char msg[200];

  // Utilisation de va_list pour gérer le format du message
  va_list arglist;
  va_start(arglist, format);
  vsnprintf(msg, sizeof(msg), format, arglist); // Utilisation de vsnprintf pour éviter les débordements
  va_end(arglist);

  // Construction du message JSON (succès ou erreur)
  String jsonResponse = "{\"" + String(resultType) + "\":{";
  jsonResponse += "\"code\":" + String(code) + ",";
  jsonResponse += "\"message\":\"" + String(msg) + "\"";
  jsonResponse += "}}";

  // Envoi de la réponse avec code HTTP et type de contenu JSON
  server->send(code, "application/json", jsonResponse.c_str());
}

/**
 * Envoie une réponse de succès avec un message JSON
 */
void sendSuccessResponse(WebServer *server, int successCode, const char *format, ...)
{
  va_list arglist;
  va_start(arglist, format);
  sendResponse(server, successCode, "success", format, arglist);
  va_end(arglist);
}

/**
 * Envoie une réponse d'erreur avec un message JSON
 */
void sendErrorResponse(WebServer *server, int errorCode, const char *format, ...)
{
  va_list arglist;
  va_start(arglist, format);
  sendResponse(server, errorCode, "error", format, arglist);
  va_end(arglist);
}

/**
 * Gestion des types de fichiers
 */
String getContentType(String filename)
{
  if (server.hasArg("download"))
  {
    return "application/octet-stream";
  }

  // Table des types MIME
  static const struct
  {
    const char *extension;
    const char *mimeType;
  } mimeTypes[] = {
      {".htm", "text/html"},
      {".html", "text/html"},
      {".css", "text/css"},
      {".js", "application/javascript"},
      {".png", "image/png"},
      {".gif", "image/gif"},
      {".jpg", "image/jpeg"},
      {".ico", "image/x-icon"},
      {".xml", "text/xml"},
      {".pdf", "application/pdf"},
      {".zip", "application/zip"},
      {".json", "application/json"}};

  // Vérification pour les fichiers compressés en .gz
  if (filename.endsWith(".gz"))
  {
    filename = filename.substring(0, filename.length() - 3); // Supprime le suffixe .gz
  }

  // Recherche du type MIME correspondant à l'extension
  for (auto &type : mimeTypes)
  {
    if (filename.endsWith(type.extension))
    {
      return type.mimeType;
    }
  }

  // Type par défaut
  return "text/plain";
}

/**
 * Vérifie si un fichier existe dans le système de fichiers
 */
bool exists(String path)
{
  bool yes = false;
  if (!LittleFS.exists(path))
  {
    return false;
  }
  File file = LittleFS.open(path, "r");
  if (file.available() && !file.isDirectory())
  {
    yes = true;
  }
  file.close();
  return yes;
}

/**
 * Liste des fichiers
 */
void handleFileList()
{
  if (!server.hasArg("dir"))
  {
    sendErrorResponse(&server, 500, "BAD ARGS");
    return;
  }

  String path = server.arg("dir");
  Serial.println("handleFileList: " + path);

  File root = LittleFS.open(path);
  path = String();

  String output = "[";
  if (root.isDirectory())
  {
    File file = root.openNextFile();
    while (file)
    {
      if (output != "[")
      {
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
 * Lecture d'un fichier depuis le système de fichiers
 */
bool handleFileRead(String path)
{
  Serial.println("handleFileRead: " + path);

  // Si le chemin commence par un ".", on renvoie une erreur
  String token;
  uint8_t token_idx = 0;
  while (get_token(path, token, token_idx, '/'))
  {
    if (token.length() > 1 && token.charAt(0) == '.')
    {
      return false;
    }
    token_idx++;
  }

  if (path.endsWith("/"))
  {
    path += "index.html";
  }
  String contentType = getContentType(path);
  String pathWithGz = path + ".gz";
  if (exists(pathWithGz) || exists(path))
  {
    if (exists(pathWithGz))
    {
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
 * Upload d'un fichier
 */
void handleFileUpload()
{
  HTTPUpload &upload = server.upload();
  if (upload.status == UPLOAD_FILE_START)
  {
    String filename = upload.filename;
    if (!filename.startsWith("/"))
    {
      filename = "/" + filename;
    }
    filename = "/animations" + filename;
    Serial.print("handleFileUpload Name: ");
    Serial.println(filename);
    fsUploadFile = LittleFS.open(filename, "w");
  }
  else if (upload.status == UPLOAD_FILE_WRITE)
  {
    if (fsUploadFile)
    {
      fsUploadFile.write(upload.buf, upload.currentSize);
    }
  }
  else if (upload.status == UPLOAD_FILE_END)
  {
    if (fsUploadFile)
    {
      fsUploadFile.close();
    }
    Serial.print("handleFileUpload Size: ");
    Serial.println(upload.totalSize);
    sendSuccessResponse(&server, 200, "Upload Success");
  }
}

/**
 * Suppression d'un fichier
 */
void handleFileDelete()
{
  if (server.args() == 0)
  {
    sendErrorResponse(&server, 500, "BAD ARGS");
    return;
  }
  String path = server.arg(0);
  if (!path.startsWith("/"))
  {
    path = "/" + path;
  }
  if (!path.endsWith(".csv"))
  {
    path = path + ".csv";
  }
  path = "/animations" + path;
  Serial.println("handleFileDelete: " + path);
  if (path == "/")
  {
    sendErrorResponse(&server, 500, "BAD PATH");
    return;
  }
  if (!exists(path))
  {
    sendErrorResponse(&server, 404, "FileNotFound");
    return;
  }
  LittleFS.remove(path);
  sendSuccessResponse(&server, 200, "File Deleted");
}

/**
 * Efface les pixels de la bande LED
 */
void handleStripClear()
{
  Serial.println("receive /strip/clear");
  setAllPixel(RgbColor(0));
  showStrip();
  sendSuccessResponse(&server, 200, "Ok");
}

/**
 * Définit l'état des pixels de la bande LED
 */
void handleStripSet()
{
  Serial.println("receive /strip/set");
  if (server.method() != HTTP_POST)
  {
    sendErrorResponse(&server, 400, "Bad Request (should be POST)");
    return;
  }

  String leds_string = "";
  for (uint8_t i = 0; i < server.args(); i++)
  {
    if (server.argName(i) == "leds")
    {
      leds_string = server.arg(i);
    }
  }
  if (leds_string.length() == 0)
  {
    sendErrorResponse(&server, 400, "Bad Request (no leds body)");
    return;
  }

  String led;
  uint8_t rgb_idx = 0;
  while (get_token(leds_string, led, rgb_idx, ','))
  {
    led.trim();
    String rS, gS, bS;
    if (get_token(led, rS, 0, ' ') && get_token(led, gS, 1, ' ') && get_token(led, bS, 2, ' '))
    {
      setPixel(rgb_idx, RgbColor(rS.toInt(), gS.toInt(), bS.toInt()));
    }
    else
    {
      sendErrorResponse(&server, 400, "Bad Request (bad format for led %d)", rgb_idx);
      return;
    }
    rgb_idx++;
  }

  showStrip();
  sendSuccessResponse(&server, 200, "Ok");
}

/**
 * Handle strip change
 *    POST with load "leds: 0 255 0 0, 5 0 255 0, ....."
 *                          ^          ^
 *                          led0       led5
 */
void handleStripChange()
{
  Serial.println("receive /strip/change");
  if (server.method() != HTTP_POST)
  {
    sendErrorResponse(&server, 400, "Bad Request (should be POST)");
    return;
  }

  String leds_string = "";
  for (uint8_t i = 0; i < server.args(); i++)
  {
    Serial.println(server.argName(i) + ": " + server.arg(i));
    if (server.argName(i) == "leds")
    {
      leds_string = server.arg(i);
    }
  }
  if (leds_string.length() == 0)
  {
    sendErrorResponse(&server, 400, "Bad Request (no leds body)");
    return;
  }

  String led;
  uint8_t rgb_idx = 0;
  while (get_token(leds_string, led, rgb_idx, ','))
  {
    led.trim();
    String idxS, rS, gS, bS;
    if (get_token(led, idxS, 0, ' ') && get_token(led, rS, 1, ' ') && get_token(led, gS, 2, ' ') && get_token(led, bS, 3, ' '))
    {
      Serial.printf("led %s : '%s' '%s' '%s'\n", idxS, rS, gS, bS);
      setPixel(idxS.toInt(), RgbColor(rS.toInt(), gS.toInt(), bS.toInt()));
    }
    else
    {
      sendErrorResponse(&server, 400, "Bad Request (bad format for led %d)", rgb_idx);
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
void handleGetStatus()
{
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
  payload += ",\"animOn\":";
  payload += !isStopAnimation();
  payload += "}";
  server.send(200, "text/json", payload);
}

/**
 * Gère l'exécution d'une animation
 */
void handleExecAnim()
{
  if (!server.hasArg("name"))
  {
    sendErrorResponse(&server, 500, "BAD ARGS");
    return;
  }

  String animation = server.arg("name");
  Serial.println("handleExecAnim: " + animation);

  String path = "/animations/" + animation + ".csv";
  if (!exists(path))
  {
    sendErrorResponse(&server, 404, "FileNotFound");
    return;
  }

  startAnim(path);
}
void handleRenameAnim()
{
  if (!server.hasArg("name1") || !server.hasArg("name2"))
  {
    server.send(500, "text/plain", "BAD ARGS");
    return;
  }

  String animation1 = server.arg("name1");
  String animation2 = server.arg("name2");
  Serial.println("handleRenameAnim: " + animation1 + " " + animation2);

  String path1 = "/animations/" + animation1;
  String path2 = "/animations/" + animation2;
  if (!exists(path1))
  {
    return server.send(404, "text/plain", "FileNotFound " + path1);
  }

  bool ret = LittleFS.rename(path1, path2);
  if (ret)
  {
    server.send(200, "text/plain", "Renamed");
  }
  else
  {
    server.send(500, "text/plain", "Cannot rename");
  }
}
/**
 * change stop/start animations
 */
void handleAnimStop()
{
  toggleStopAnimation(true);

  setAllPixel(RgbColor(0));
  showStrip();

  server.send(200, "text/plain", "Stopped");
}
void handleAnimStart()
{
  toggleStopAnimation(false);
  server.send(200, "text/plain", "Started");
}
/**
 * --------------------
 * Init the web server
 * --------------------
 */
void initServerWeb(void)
{
  LittleFS.mkdir("/animations");

  // manage the uri to change leds
  server.on("/list", handleFileList);
  server.on("/strip/clear", handleStripClear);
  server.on("/strip/set", handleStripSet);
  server.on("/strip/change", handleStripChange);
  server.on("/getStatus", handleGetStatus);
  server.on("/anim/stop", handleAnimStop);
  server.on("/anim/start", handleAnimStart);
  server.on(
      "/upload", HTTP_POST, []()
      { server.send(200, "text/plain", ""); },
      handleFileUpload);
  server.on("/anim", HTTP_DELETE, handleFileDelete);
  server.on("/anim/exec", handleExecAnim);
  server.on("/anim/exec", handleExecAnim);
  server.on("/anim/rename", handleRenameAnim);

  // called when the url is not defined here
  // use it to load content from FILESYSTEM
  server.onNotFound([]()
                    {
    if (!handleFileRead(server.uri())) {
      server.send(404, "text/plain", "FileNotFound");
    } });

  server.begin();
}

/**
 * --------------------
 * Handle the client request
 * --------------------
 */
void handleServerWebClient(void)
{
  server.handleClient();
}