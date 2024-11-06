#include "ResponseUtils.h"
#include <LittleFS.h>
#include "serverWeb.h"


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
