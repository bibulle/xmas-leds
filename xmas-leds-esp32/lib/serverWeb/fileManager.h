#ifndef FILE_MANAGER_H
#define FILE_MANAGER_H

#include <Arduino.h>
#include <WebServer.h>

bool handleFileRead(String path);
bool exists(String path);
void handleFileList();
void handleFileUpload();
void handleFileDelete();
void handleDeleteAllFiles();
void handleExecAnim();
void handleRenameAnim();

#endif
