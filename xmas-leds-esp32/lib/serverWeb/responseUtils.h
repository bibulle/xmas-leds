#ifndef RESPONSE_UTILS_H
#define RESPONSE_UTILS_H

#include <WebServer.h>

// Déclaration des fonctions
void sendResponse(WebServer *server, int code, const char *resultType, const char *format, ...);
void sendSuccessResponse(WebServer *server, int successCode, const char *format, ...);
void sendErrorResponse(WebServer *server, int errorCode, const char *format, ...);
String getContentType(String filename);

#endif // RESPONSE_UTILS_H
