#include "fileManager.h"
#include <LittleFS.h>
#include <WebServer.h>
#include "util.h"
#include "serverWeb.h"
#include "responseUtils.h"
#include <strip.h>

// Vérification de l'existence du fichier
bool exists(String path) {
    File file = LittleFS.open(path, "r");
    bool fileExists = file && !file.isDirectory();
    file.close();
    return fileExists;
}

// Lecture d'un fichier
bool handleFileRead(String path) {
    if (path.endsWith("/")) path += "index.html";
    String contentType = getContentType(path);
    String pathWithGz = path + ".gz";
    if (exists(pathWithGz) || exists(path)) {
        if (exists(pathWithGz)) path += ".gz";
        File file = LittleFS.open(path, "r");
        server.streamFile(file, contentType);
        file.close();
        return true;
    }
    return false;
}

// Liste des fichiers
void handleFileList() {
    if (!server.hasArg("dir")) {
        sendErrorResponse(&server, 500, "BAD ARGS");
        return;
    }
    String path = server.arg("dir");
    File root = LittleFS.open(path);
    String output = "[";
    if (root.isDirectory()) {
        File file = root.openNextFile();
        while (file) {
            if (output != "[") output += ',';
            output += "{\"type\":\"" + String(file.isDirectory() ? "dir" : "file") + "\",\"name\":\"" + String(file.path()).substring(1) + "\",\"size\":\"" + String(file.size()) + "\"}";
            file = root.openNextFile();
        }
    }
    output += "]";
    server.send(200, "text/json", output);
}

// Upload d'un fichier
void handleFileUpload() {
    HTTPUpload &upload = server.upload();
    String filename = "/animations" + (upload.filename.startsWith("/") ? upload.filename : "/" + upload.filename);
    // Serial.println("handleFileUpload: " + filename);
    // Serial.printf( "          status: %d (%d)\n", upload.status, upload.currentSize);
    if (upload.status == UPLOAD_FILE_START) {
        fsUploadFile = LittleFS.open(filename, "w");
        if (!fsUploadFile) {
            Serial.println("handleFileUpload: open file failed");
            sendErrorResponse(&server, 500, "open file failed");
        }
    } else if (upload.status == UPLOAD_FILE_WRITE) {
        fsUploadFile.write(upload.buf, upload.currentSize);
    } else if (upload.status == UPLOAD_FILE_END) { 
        fsUploadFile.close();
        //sendSuccessResponse(&server, 200, "Upload Success");
    } else if (upload.status == UPLOAD_FILE_ABORTED) {
        fsUploadFile.close();
    }
}

// Suppression d'un fichier
void handleFileDelete() {
    String path = "/animations/" + (server.arg(0).startsWith("/") ? server.arg(0) : "/" + server.arg(0)) + ".csv";
    if (exists(path)) LittleFS.remove(path) ? sendSuccessResponse(&server, 200, "File Deleted") : sendErrorResponse(&server, 500, "Delete Failed");
    else sendErrorResponse(&server, 404, "FileNotFound");
}
// Suppression de tous les fichiers dans le répertoire /animations
void handleDeleteAllFiles() {
    toggleStopAnimation(true);
    closeCurrentAnimFile();
    String path = "/animations";
    File root = LittleFS.open(path);
    if (!root.isDirectory()) {
        sendErrorResponse(&server, 500, "Path is not a directory");
        return;
    }

    File file = root.openNextFile();
    while (file) {
        if (!file.isDirectory()) {
            String filePath = file.path();
            file.close();
            if (!LittleFS.remove(filePath)) {
                sendErrorResponse(&server, 500, "Failed to delete %s", filePath);
                return;
            }
        }
        file = root.openNextFile();
    }
    sendSuccessResponse(&server, 200, "All files in /animations deleted");
}
// Exécution d'une animation
void handleExecAnim() {
    if (!server.hasArg("name")) {
        sendErrorResponse(&server, 500, "BAD ARGS");
        return;
    }
    String path = "/animations/" + server.arg("name") + ".csv";
    exists(path) ? startAnim(path) : sendErrorResponse(&server, 404, "FileNotFound");
}

// Renommage d'une animation
void handleRenameAnim() {
    String path1 = "/animations/" + server.arg("name1");
    String path2 = "/animations/" + server.arg("name2");
    if (exists(path1)) {
        LittleFS.rename(path1, path2);
    } else {
        sendErrorResponse(&server, 404, "FileNotFound");
        return;
    }   
}
