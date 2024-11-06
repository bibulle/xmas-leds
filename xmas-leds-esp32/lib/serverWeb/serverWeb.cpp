#include "serverWeb.h"
#include <LittleFS.h>
#include <WebServer.h>
#include "fileManager.h"
#include "ledController.h"
#include "util.h"
#include "strip.h"
#include "responseUtils.h"

WebServer server(80);
File fsUploadFile;

// Fonctions d'envoi de réponse
void sendResponse(WebServer *server, int code, const char *resultType, const char *format, ...);
void sendSuccessResponse(WebServer *server, int successCode, const char *format, ...);
void sendErrorResponse(WebServer *server, int errorCode, const char *format, ...);

// Routes du serveur web
void handleFileList();
void handleFileDelete();
void handleFileUpload();
void handleGetStatus();
void handleExecAnim();
void handleRenameAnim();

// Gestion des LEDs
void handleStripClear();
void handleStripSet();
void handleStripChange();
void handleAnimStop();
void handleAnimStart();

void initServerWeb() {
    LittleFS.mkdir("/animations");

    server.on("/list", handleFileList);
    server.on("/strip/clear", handleStripClear);
    server.on("/strip/set", handleStripSet);
    server.on("/strip/change", handleStripChange);
    server.on("/getStatus", handleGetStatus);
    server.on("/anim/stop", handleAnimStop);
    server.on("/anim/start", handleAnimStart);
    server.on("/upload", HTTP_POST, []() { server.send(200, "text/plain", ""); }, handleFileUpload);
    server.on("/anim", HTTP_DELETE, handleFileDelete);
    server.on("/anim/all", HTTP_DELETE, handleDeleteAllFiles);
    server.on("/anim/exec", handleExecAnim);
    server.on("/anim/rename", handleRenameAnim);

    server.onNotFound([]() {
        if (!handleFileRead(server.uri())) {
            server.send(404, "text/plain", "FileNotFound");
        }
    });

    server.begin();
}

void handleServerWebClient() {
    server.handleClient();
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