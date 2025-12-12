/****************************************************************************************************************************
 * https://github.com/khoih-prog/ESPAsync_WiFiManager
 *****************************************************************************************************************************/
#include "wifiCommunication_internal.h"

// -------------------------------
// ------ Config management ------
// -------------------------------
WiFi_AP_IPConfig WM_AP_IPconfig;
WiFi_STA_IPConfig WM_STA_IPconfig;

void initAPIPConfigStruct(WiFi_AP_IPConfig &in_WM_AP_IPconfig) {
  in_WM_AP_IPconfig._ap_static_ip = APStaticIP;
  in_WM_AP_IPconfig._ap_static_gw = APStaticGW;
  in_WM_AP_IPconfig._ap_static_sn = APStaticSN;
}
void initSTAIPConfigStruct(WiFi_STA_IPConfig &in_WM_STA_IPconfig) {
  in_WM_STA_IPconfig._sta_static_ip = stationIP;
  in_WM_STA_IPconfig._sta_static_gw = gatewayIP;
  in_WM_STA_IPconfig._sta_static_sn = netMask;
  in_WM_STA_IPconfig._sta_static_dns1 = dns1IP;
  in_WM_STA_IPconfig._sta_static_dns2 = dns2IP;
}
void displayIPConfigStruct(WiFi_STA_IPConfig in_WM_STA_IPconfig) {
  LOGERROR3(F("stationIP ="), in_WM_STA_IPconfig._sta_static_ip, ", gatewayIP =", in_WM_STA_IPconfig._sta_static_gw);
  LOGERROR1(F("netMask ="), in_WM_STA_IPconfig._sta_static_sn);
  LOGERROR3(F("dns1IP ="), in_WM_STA_IPconfig._sta_static_dns1, ", dns2IP =", in_WM_STA_IPconfig._sta_static_dns2);
}
int calcChecksum(uint8_t *address, uint16_t sizeToCalc) {
  uint16_t checkSum = 0;

  for (uint16_t index = 0; index < sizeToCalc; index++) {
    checkSum += *(((byte *)address) + index);
  }

  return checkSum;
}
bool loadConfigData() {
  File file = FileFS.open(CONFIG_FILENAME, "r");
  LOGERROR(F("LoadWiFiCfgFile "));

  memset((void *)&WM_config, 0, sizeof(WM_config));
  memset((void *)&WM_STA_IPconfig, 0, sizeof(WM_STA_IPconfig));

  if (file) {
    file.readBytes((char *)&WM_config, sizeof(WM_config));
    file.readBytes((char *)&WM_STA_IPconfig, sizeof(WM_STA_IPconfig));

    file.close();
    LOGERROR(F("OK"));

    if (WM_config.checksum != calcChecksum((uint8_t *)&WM_config, sizeof(WM_config) - sizeof(WM_config.checksum))) {
      LOGERROR(F("WM_config checksum wrong"));

      return false;
    }

    displayIPConfigStruct(WM_STA_IPconfig);

    return true;
  } else {
    LOGERROR(F("failed"));

    return false;
  }
}
void saveConfigData() {
  File file = FileFS.open(CONFIG_FILENAME, "w");
  LOGERROR(F("SaveWiFiCfgFile "));

  if (file) {
    WM_config.checksum = calcChecksum((uint8_t *)&WM_config, sizeof(WM_config) - sizeof(WM_config.checksum));

    file.write((uint8_t *)&WM_config, sizeof(WM_config));

    displayIPConfigStruct(WM_STA_IPconfig);

    file.write((uint8_t *)&WM_STA_IPconfig, sizeof(WM_STA_IPconfig));

    file.close();
    LOGERROR(F("OK"));
  } else {
    LOGERROR(F("failed"));
  }
}

// -------------------------------
// ------    Connect Wifi   ------
// -------------------------------
uint8_t connectMultiWiFi() {
  uint8_t status;

  // WiFi.mode(WIFI_STA);

  LOGERROR(F("ConnectMultiWiFi with :"));

  if ((Router_SSID != "") && (Router_Pass != "")) {
    LOGERROR3(F("* Flash-stored Router_SSID = "), Router_SSID, F(", Router_Pass = "), Router_Pass);
    LOGERROR3(F("* Add SSID = "), Router_SSID, F(", PW = "), Router_Pass);
    wifiMulti.addAP(Router_SSID.c_str(), Router_Pass.c_str());
  }

  for (uint8_t i = 0; i < NUM_WIFI_CREDENTIALS; i++) {
    // Don't permit NULL SSID and password len < MIN_AP_PASSWORD_SIZE (8)
    if ((String(WM_config.WiFi_Creds[i].wifi_ssid) != "") && (strlen(WM_config.WiFi_Creds[i].wifi_pw) >= MIN_AP_PASSWORD_SIZE)) {
      LOGERROR3(F("* Additional SSID = "), WM_config.WiFi_Creds[i].wifi_ssid, F(", PW = "), WM_config.WiFi_Creds[i].wifi_pw);
    }
  }

  LOGERROR(F("Connecting MultiWifi..."));

  // WiFi.mode(WIFI_STA);

  int i = 0;
  status = wifiMulti.run();
  delay(WIFI_MULTI_1ST_CONNECT_WAITING_MS);

  while ((i++ < 20) && (status != WL_CONNECTED)) {
    status = WiFi.status();

    if (status == WL_CONNECTED)
      break;
    else
      delay(WIFI_MULTI_CONNECT_WAITING_MS);
  }

  if (status == WL_CONNECTED) {
    LOGERROR1(F("WiFi connected after time: "), i);
    LOGERROR3(F("SSID:"), WiFi.SSID(), F(",RSSI="), WiFi.RSSI());
    LOGERROR3(F("Channel:"), WiFi.channel(), F(",IP address:"), WiFi.localIP());
  } else {
    LOGERROR(F("WiFi not connected"));

    ESP.restart();
  }

  return status;
}

// -------------------------------
// ------     Check Wifi    ------
// -------------------------------
void printLocalTime() {
  struct tm timeinfo;

  getLocalTime(&timeinfo);

  // Valid only if year > 2000.
  // You can get from timeinfo : tm_year, tm_mon, tm_mday, tm_hour, tm_min, tm_sec
  if (timeinfo.tm_year > 100) {
    Serial.print("Local Date/Time: ");
    Serial.print(asctime(&timeinfo));
  }
}
void heartBeatPrint() {
  printLocalTime();
}
void check_WiFi() {
  if ((WiFi.status() != WL_CONNECTED)) {
    Serial.println(F("\nWiFi lost. Call connectMultiWiFi in loop"));
    connectMultiWiFi();
  }
}

/*********************************
 * External : Setup the wifi
 *********************************/
void wifi_setup() {
  // initialize the LED digital pin as an output.
  pinMode(WIFIMGR_PIN_LED, OUTPUT);
  pinMode(WIFIMGR_TRIGGER_PIN, INPUT_PULLUP);

  Serial.print(F("\nStarting WifiConfig on "));
  Serial.println(ARDUINO_BOARD);
  // Serial.println(ESP_WIFIMANAGER_VERSION);

  Serial.setDebugOutput(false);

  localFS_setup();

  digitalWrite(WIFIMGR_PIN_LED, WIFIMGR_LED_ON);  // turn the LED on by making the voltage LOW to tell us we are in configuration mode.

  unsigned long startedAt = millis();

  initAPIPConfigStruct(WM_AP_IPconfig);
  initSTAIPConfigStruct(WM_STA_IPconfig);

  ESP_WiFiManager ESP_wifiManager("Garland1");

  ESP_wifiManager.setMinimumSignalQuality(-1);
  ESP_wifiManager.setConfigPortalChannel(0);
  ESP_wifiManager.setCORSHeader("Your Access-Control-Allow-Origin");

  Router_SSID = ESP_wifiManager.WiFi_SSID();
  Router_Pass = ESP_wifiManager.WiFi_Pass();

  Serial.println("ESP Self-Stored: SSID = " + Router_SSID + ", Pass = " + "*****");
  // Serial.println("ESP Self-Stored: SSID = " + Router_SSID + ", Pass = " + Router_Pass);

  bool configDataLoaded = false;

  // Try to connect directly if we have stored credentials (skip config portal)
  if ((Router_SSID != "") && (Router_Pass != "")) {
    Serial.println(F("Got ESP Self-Stored Credentials. Trying direct connection..."));

    // Initialize WiFi and try to connect
    WiFi.mode(WIFI_STA);
    WiFi.begin(Router_SSID.c_str(), Router_Pass.c_str());

    Serial.print(F("Connecting to WiFi"));
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 120) {  // 60 seconds max
      delay(500);
      Serial.print(".");
      attempts++;
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
      Serial.print(F("WiFi connected directly! IP: "));
      Serial.println(WiFi.localIP());
      // Load config data for timezone etc.
      if (loadConfigData()) {
        if (strlen(WM_config.TZ_Name) > 0) {
          configTzTime(WM_config.TZ, "time.nist.gov", "0.pool.ntp.org", "1.pool.ntp.org");
        }
      }
      digitalWrite(WIFIMGR_PIN_LED, WIFIMGR_LED_OFF);
      return;  // Skip config portal entirely
    } else {
      Serial.println(F("Direct connection failed. Will open config portal."));
      WiFi.disconnect();
    }
  }

  Serial.println(F("Opening configuration portal."));

  if ((Router_SSID != "") && (Router_Pass != "")) {
    ESP_wifiManager.setConfigPortalTimeout(120);
    Serial.println(F("Got ESP Self-Stored Credentials. Timeout 120s for Config Portal"));
  }

  if (loadConfigData()) {
    configDataLoaded = true;

    ESP_wifiManager.setConfigPortalTimeout(120);  // If no access point name has been previously entered disable timeout.
    Serial.println(F("Got stored Credentials. Timeout 120s for Config Portal"));

    if (strlen(WM_config.TZ_Name) > 0) {
      LOGERROR3(F("Current TZ_Name ="), WM_config.TZ_Name, F(", TZ = "), WM_config.TZ);

      // configTzTime(WM_config.TZ, "pool.ntp.org" );
      configTzTime(WM_config.TZ, "time.nist.gov", "0.pool.ntp.org", "1.pool.ntp.org");
    } else {
      Serial.println(F("Current Timezone is not set. Enter Config Portal to set."));
    }
  } else {
    // Enter CP only if no stored SSID on flash and file
    Serial.println(F("Open Config Portal without Timeout: No stored Credentials."));
    initialConfig = true;
  }

  if (initialConfig) {
    // SSID to uppercase
    ssid.toUpperCase();
    password = "My" + ssid;

    Serial.print(F("Starting configuration portal @ "));
    Serial.print(APStaticIP);
    Serial.print(F(", SSID = "));
    Serial.print(ssid);
    Serial.print(F(", PWD = "));
    Serial.println(password);

    digitalWrite(WIFIMGR_PIN_LED, WIFIMGR_LED_ON);  // turn the LED on by making the voltage LOW to tell us we are in configuration mode.

    ESP_wifiManager.setCredentials(WM_config.WiFi_Creds[0].wifi_ssid, WM_config.WiFi_Creds[0].wifi_pw, 
                                        WM_config.WiFi_Creds[1].wifi_ssid, WM_config.WiFi_Creds[1].wifi_pw);

    // Starts an access point
    if (!ESP_wifiManager.startConfigPortal((const char *)ssid.c_str(), password.c_str()))
      Serial.println(F("Not connected to WiFi but continuing anyway."));
    else {
      Serial.println(F("WiFi connected...yeey :)"));
    }

    // Stored  for later usage
    memset(&WM_config, 0, sizeof(WM_config));
    for (uint8_t i = 0; i < NUM_WIFI_CREDENTIALS; i++) {
      String tempSSID = ESP_wifiManager.getSSID(i);
      String tempPW = ESP_wifiManager.getPW(i);

      if (strlen(tempSSID.c_str()) < sizeof(WM_config.WiFi_Creds[i].wifi_ssid) - 1)
        strcpy(WM_config.WiFi_Creds[i].wifi_ssid, tempSSID.c_str());
      else
        strncpy(WM_config.WiFi_Creds[i].wifi_ssid, tempSSID.c_str(), sizeof(WM_config.WiFi_Creds[i].wifi_ssid) - 1);

      if (strlen(tempPW.c_str()) < sizeof(WM_config.WiFi_Creds[i].wifi_pw) - 1)
        strcpy(WM_config.WiFi_Creds[i].wifi_pw, tempPW.c_str());
      else
        strncpy(WM_config.WiFi_Creds[i].wifi_pw, tempPW.c_str(), sizeof(WM_config.WiFi_Creds[i].wifi_pw) - 1);

      // Don't permit NULL SSID and password len < MIN_AP_PASSWORD_SIZE (8)
      if ((String(WM_config.WiFi_Creds[i].wifi_ssid) != "") && (strlen(WM_config.WiFi_Creds[i].wifi_pw) >= MIN_AP_PASSWORD_SIZE)) {
        LOGERROR3(F("* Add SSID = "), WM_config.WiFi_Creds[i].wifi_ssid, F(", PW = "), WM_config.WiFi_Creds[i].wifi_pw);
        wifiMulti.addAP(WM_config.WiFi_Creds[i].wifi_ssid, WM_config.WiFi_Creds[i].wifi_pw);
      }
    }

    String tempTZ = ESP_wifiManager.getTimezoneName();

    if (strlen(tempTZ.c_str()) < sizeof(WM_config.TZ_Name) - 1)
      strcpy(WM_config.TZ_Name, tempTZ.c_str());
    else
      strncpy(WM_config.TZ_Name, tempTZ.c_str(), sizeof(WM_config.TZ_Name) - 1);

    const char *TZ_Result = ESP_wifiManager.getTZ(WM_config.TZ_Name);

    if (strlen(TZ_Result) < sizeof(WM_config.TZ) - 1)
      strcpy(WM_config.TZ, TZ_Result);
    else
      strncpy(WM_config.TZ, TZ_Result, sizeof(WM_config.TZ_Name) - 1);

    if (strlen(WM_config.TZ_Name) > 0) {
      LOGERROR3(F("Saving current TZ_Name ="), WM_config.TZ_Name, F(", TZ = "), WM_config.TZ);
      configTzTime(WM_config.TZ, "time.nist.gov", "0.pool.ntp.org", "1.pool.ntp.org");
    } else {
      LOGERROR(F("Current Timezone Name is not set. Enter Config Portal to set."));
    }

    ESP_wifiManager.getSTAStaticIPConfig(WM_STA_IPconfig);

    saveConfigData();

    initialConfig = true;
  }

  digitalWrite(WIFIMGR_PIN_LED, WIFIMGR_LED_OFF);  // Turn led off as we are not in configuration mode.

  startedAt = millis();

  if (!initialConfig) {
    // Load stored data, the addAP ready for MultiWiFi reconnection
    if (!configDataLoaded)
      loadConfigData();

    for (uint8_t i = 0; i < NUM_WIFI_CREDENTIALS; i++) {
      // Don't permit NULL SSID and password len < MIN_AP_PASSWORD_SIZE (8)
      if ((String(WM_config.WiFi_Creds[i].wifi_ssid) != "") && (strlen(WM_config.WiFi_Creds[i].wifi_pw) >= MIN_AP_PASSWORD_SIZE)) {
        LOGERROR3(F("* Add SSID = "), WM_config.WiFi_Creds[i].wifi_ssid, F(", PW = "), WM_config.WiFi_Creds[i].wifi_pw);
        wifiMulti.addAP(WM_config.WiFi_Creds[i].wifi_ssid, WM_config.WiFi_Creds[i].wifi_pw);
      }
    }

    if (WiFi.status() != WL_CONNECTED) {
      Serial.println(F("ConnectMultiWiFi in setup"));

      connectMultiWiFi();
    }
  }

  Serial.print(F("After waiting "));
  Serial.print((float)(millis() - startedAt) / 1000L);
  Serial.print(F(" secs more in setup(), connection result is "));

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print(F("connected. Local IP: "));
    Serial.println(WiFi.localIP());
  } else
    Serial.println(ESP_wifiManager.getStatus(WiFi.status()));
}

/*********************************
 * Check status of the wifi
 *********************************/
void wifi_check_status() {
  static ulong checkstatus_timeout = 0;
  static ulong checkwifi_timeout = 0;

  static ulong current_millis;

  if (digitalRead(WIFIMGR_TRIGGER_PIN) == LOW) {
    Serial.println(F("\nConfiguration portal requested."));
    initialConfig = true;
    wifi_setup();
  }

  current_millis = millis();

  // Check WiFi every WIFICHECK_INTERVAL (1) seconds.
  if ((current_millis > checkwifi_timeout) || (checkwifi_timeout == 0)) {
    check_WiFi();
    checkwifi_timeout = current_millis + WIFICHECK_INTERVAL;
  }

  // Print hearbeat every HEARTBEAT_INTERVAL (10) seconds.
  if ((current_millis > checkstatus_timeout) || (checkstatus_timeout == 0)) {
    heartBeatPrint();
    checkstatus_timeout = current_millis + HEARTBEAT_INTERVAL;
  }
}