#include "fileManager.h"
#include <LittleFS.h>
#include <WebServer.h>
#include "util.h"
#include "serverWeb.h"
#include "responseUtils.h"
#include <strip.h>
#include <fstream>
#include <sstream>
#include <vector>

// Function to convert CSV file to binary format with LittleFS
bool convertCSVToBinary(const String &csvPath)
{
    Serial.printf("Conversion du fichier CSV %s en format binaire\n", csvPath.c_str());
    // Vérification et remplacement de l'extension .csv par .bin
    String binaryPath;
    if (csvPath.endsWith(".csv"))
    {
        binaryPath = csvPath.substring(0, csvPath.length() - 4) + ".bin";
    }
    else
    {
        Serial.println("Erreur : Le fichier source doit avoir l'extension .csv");
        return false;
    }

    // Open CSV file in read mode
    File csvFile = LittleFS.open(csvPath, "r");
    if (!csvFile)
    {
        Serial.println("Erreur : Impossible d'ouvrir le fichier CSV " + csvPath);
        return false;
    }

    // Open binary file in write mode
    File binFile = LittleFS.open(binaryPath, "w");
    if (!binFile)
    {
        Serial.println("Erreur : Impossible d'ouvrir le fichier binaire " + binaryPath);
        csvFile.close();
        return false;
    }

    // Read the CSV file line by line
    while (csvFile.available())
    {
        // Read the entire line as a string
        String line = csvFile.readStringUntil('\n');

        // Ignorer les lignes de commentaires (commençant par #)
        if (line.startsWith("#"))
        {
            continue; // Passe à la ligne suivante
        }

        line.trim(); // Remove any trailing newline or whitespace

        // Parse the duration from the line
        int commaIndex = line.indexOf(',');
        if (commaIndex == -1)
        {
            Serial.println("Erreur : Format de ligne incorrect dans " + line);
            continue;
        }

        // Extract duration as a 16-bit integer
        uint16_t duration = line.substring(0, commaIndex).toInt();
        binFile.write((uint8_t *)&duration, sizeof(duration));

        // Parse each LED data section and count LEDs
        String ledData = line.substring(commaIndex + 1);
        uint16_t numLeds = 0;

        // Pré-traitement pour compter les LEDs
        String tempLedData = ledData;
        while (tempLedData.length() > 0)
        {
            commaIndex = tempLedData.indexOf(',');
            String segment = commaIndex == -1 ? tempLedData : tempLedData.substring(0, commaIndex);
            tempLedData = commaIndex == -1 ? "" : tempLedData.substring(commaIndex + 1);
            numLeds++;
        }

        // Write the number of LEDs (2 bytes)
        binFile.write((uint8_t *)&numLeds, sizeof(numLeds));

        // Reset ledData parsing
        while (ledData.length() > 0)
        {
            // Get the next LED data segment
            commaIndex = ledData.indexOf(',');
            String segment = commaIndex == -1 ? ledData : ledData.substring(0, commaIndex);
            ledData = commaIndex == -1 ? "" : ledData.substring(commaIndex + 1);

            // Trim any leading/trailing whitespace in segment
            segment.trim();

            // Parse individual components (ID, R, G, B)
            int space1 = segment.indexOf(' ');
            int space2 = segment.indexOf(' ', space1 + 1);
            int space3 = segment.indexOf(' ', space2 + 1);

            if (space1 == -1 || space2 == -1 || space3 == -1)
            {
                Serial.println("Erreur : Format incorrect pour les données LED dans : " + segment);
                continue;
            }

            uint16_t id = (uint16_t)segment.substring(0, space1).toInt();
            uint8_t r = (uint8_t)segment.substring(space1 + 1, space2).toInt();
            uint8_t g = (uint8_t)segment.substring(space2 + 1, space3).toInt();
            uint8_t b = (uint8_t)segment.substring(space3 + 1).toInt();

            //Serial.printf("ID: %d, R: %d, G: %d, B: %d\n", id, r, g, b);
            // Write binary data to file
            binFile.write(id);
            binFile.write(r);
            binFile.write(g);
            binFile.write(b);
        }
    }

    // Close files
    csvFile.close();
    binFile.close();
    Serial.println("Conversion terminée avec succès !");

    return true;
}

// Vérification de l'existence du fichier
bool exists(String path)
{
    File file = LittleFS.open(path, "r");
    bool fileExists = file && !file.isDirectory();
    file.close();
    return fileExists;
}

// Lecture d'un fichier
bool handleFileRead(String path)
{
    if (path.endsWith("/"))
        path += "index.html";
    String contentType = getContentType(path);
    String pathWithGz = path + ".gz";
    if (exists(pathWithGz) || exists(path))
    {
        if (exists(pathWithGz))
            path += ".gz";
        File file = LittleFS.open(path, "r");
        server.streamFile(file, contentType);
        file.close();
        return true;
    }
    return false;
}

// Liste des fichiers
void handleFileList()
{
    if (!server.hasArg("dir"))
    {
        sendErrorResponse(&server, 500, "BAD ARGS");
        return;
    }
    String path = server.arg("dir");
    File root = LittleFS.open(path);
    String output = "[";
    if (root.isDirectory())
    {
        File file = root.openNextFile();
        while (file)
        {
            if (output != "[")
                output += ',';
            output += "{\"type\":\"" + String(file.isDirectory() ? "dir" : "file") + "\",\"name\":\"" + String(file.path()).substring(1) + "\",\"size\":\"" + String(file.size()) + "\"}";
            file = root.openNextFile();
        }
    }
    output += "]";
    server.send(200, "text/json", output);
}

// Upload d'un fichier
void handleFileUpload()
{
    HTTPUpload &upload = server.upload();
    String filename = "/animations" + (upload.filename.startsWith("/") ? upload.filename : "/" + upload.filename);
    // Serial.println("handleFileUpload: " + filename);
    // Serial.printf( "          status: %d (%d)\n", upload.status, upload.currentSize);
    if (upload.status == UPLOAD_FILE_START)
    {
        fsUploadFile = LittleFS.open(filename, "w");
        if (!fsUploadFile)
        {
            Serial.println("handleFileUpload: open file failed");
            sendErrorResponse(&server, 500, "open file failed");
        }
    }
    else if (upload.status == UPLOAD_FILE_WRITE)
    {
        fsUploadFile.write(upload.buf, upload.currentSize);
    }
    else if (upload.status == UPLOAD_FILE_END)
    {
        fsUploadFile.close();

        if (upload.filename.endsWith(".csv") && upload.filename != "program.csv")
        {
            if (convertCSVToBinary(filename.c_str()))
            {
                LittleFS.remove(filename);
            }
            else
            {
                sendErrorResponse(&server, 500, "conversion to binary failed");
            };
        }
    }
    else if (upload.status == UPLOAD_FILE_ABORTED)
    {
        fsUploadFile.close();
    }
}

// Suppression d'un fichier
void handleFileDelete()
{
    String path = "/animations/" + (server.arg(0).startsWith("/") ? server.arg(0) : "/" + server.arg(0)) + ".csv";
    if (exists(path))
        LittleFS.remove(path) ? sendSuccessResponse(&server, 200, "File Deleted") : sendErrorResponse(&server, 500, "Delete Failed");
    else
        sendErrorResponse(&server, 404, "FileNotFound");
}
// Suppression de tous les fichiers dans le répertoire /animations
void handleDeleteAllFiles()
{
    toggleStopAnimation(true);
    setAllPixel(RgbColor(0));
    showStrip();

    closeCurrentProgramFile();
    closeCurrentAnimFile();
    String path = "/animations";
    File root = LittleFS.open(path);
    if (!root.isDirectory())
    {
        sendErrorResponse(&server, 500, "Path is not a directory");
        return;
    }

    File file = root.openNextFile();
    while (file)
    {
        if (!file.isDirectory())
        {
            String filePath = file.path();
            file.close();
            if (!LittleFS.remove(filePath))
            {
                sendErrorResponse(&server, 500, "Failed to delete %s", filePath);
                return;
            }
        }
        file = root.openNextFile();
    }
    sendSuccessResponse(&server, 200, "All files in /animations deleted");
}
// Exécution d'une animation
void handleExecAnim()
{
    if (!server.hasArg("name"))
    {
        sendErrorResponse(&server, 500, "BAD ARGS");
        return;
    }
    String path = "/animations/" + server.arg("name") + ".csv";
    exists(path) ? startAnim(path) : sendErrorResponse(&server, 404, "FileNotFound");
}

// Renommage d'une animation
void handleRenameAnim()
{
    String path1 = "/animations/" + server.arg("name1");
    String path2 = "/animations/" + server.arg("name2");
    if (exists(path1))
    {
        LittleFS.rename(path1, path2);
    }
    else
    {
        sendErrorResponse(&server, 404, "FileNotFound");
        return;
    }
}
