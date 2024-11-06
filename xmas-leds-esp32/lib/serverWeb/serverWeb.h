#ifndef SERVER_WEB_H
#define SERVER_WEB_H

#include <WebServer.h>
#include <FS.h>

extern WebServer server;  // Déclaration de server pour accès global
extern File fsUploadFile;

void initServerWeb();
void handleServerWebClient();

#endif
