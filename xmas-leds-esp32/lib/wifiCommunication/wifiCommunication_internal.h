
#include <WiFi.h>
#include <WiFiClient.h>
#include <esp_wifi.h>

#include "wifiCommunication.h"

// -------------------------------
// -------    WifiMulti    -------
// -------------------------------
#include <WiFiMulti.h>
WiFiMulti wifiMulti;

#include <sdkconfig.h>
// For ESP32, this better be 0 to shorten the connect time.
// For ESP32-S2/C3/S3, must be > 500
#if (USING_ESP32_S2 || USING_ESP32_C3 || USING_ESP32_S3)
#define WIFI_MULTI_1ST_CONNECT_WAITING_MS 500L
#else
// For ESP32 core v1.0.6, must be >= 500
#define WIFI_MULTI_1ST_CONNECT_WAITING_MS 800L
#endif
#define WIFI_MULTI_CONNECT_WAITING_MS 500L

#define MIN_AP_PASSWORD_SIZE 8

#define SSID_MAX_LEN 32
#define PASS_MAX_LEN 64

// -------------------------------
// -------   wifi status  --------
// -------------------------------
#define WIFICHECK_INTERVAL 1000L
#define HEARTBEAT_INTERVAL 60000L

// -------------------------------
// ------ wifi creddentials ------
// -------------------------------
typedef struct
{
  char wifi_ssid[SSID_MAX_LEN];
  char wifi_pw[PASS_MAX_LEN];
} WiFi_Credentials;

typedef struct
{
  String wifi_ssid;
  String wifi_pw;
} WiFi_Credentials_String;

#define NUM_WIFI_CREDENTIALS 2

// Assuming max 491 chars
#define TZNAME_MAX_LEN 50
#define TIMEZONE_MAX_LEN 50

// -------------------------------
// ------       config      ------
// -------------------------------
typedef struct
{
  WiFi_Credentials WiFi_Creds[NUM_WIFI_CREDENTIALS];
  char TZ_Name[TZNAME_MAX_LEN]; // "America/Toronto"
  char TZ[TIMEZONE_MAX_LEN];    // "EST5EDT,M3.2.0,M11.1.0"
  uint16_t checksum;
} WM_Config;

WM_Config WM_config;

#define CONFIG_FILENAME F("/.wifi_cred.dat")

// Indicates whether ESP has WiFi credentials saved from previous session, or double reset detected
bool initialConfig = false;

// Use false if you don't like to display Available Pages in Information Page of Config Portal
// Comment out or use true to display Available Pages in Information Page of Config Portal
// Must be placed before #include <ESP_WiFiManager.h>
#define USE_AVAILABLE_PAGES false

// -------------------------------
// ------        NTP        ------
// -------------------------------
// Just use enough to save memory. On ESP8266, can cause blank ConfigPortal screen
// if using too much memory
#define USING_AFRICA false
#define USING_AMERICA false
#define USING_ANTARCTICA false
#define USING_ASIA false
#define USING_ATLANTIC false
#define USING_AUSTRALIA false
#define USING_EUROPE true
#define USING_INDIAN false
#define USING_PACIFIC false
#define USING_ETC_GMT false

// Use true to enable CloudFlare NTP service. System can hang if you don't have Internet access while accessing CloudFlare
// See Issue #21: CloudFlare link in the default portal (https://github.com/khoih-prog/ESP_WiFiManager/issues/21)
#define USE_CLOUDFLARE_NTP false

// -------------------------------
// ------     IP config     ------
// -------------------------------
// New in v1.0.11
#define USING_CORS_FEATURE true

#define USE_DHCP_IP true
IPAddress stationIP = IPAddress(0, 0, 0, 0);
IPAddress gatewayIP = IPAddress(192, 168, 2, 1);
IPAddress netMask = IPAddress(255, 255, 255, 0);

#define USE_CONFIGURABLE_DNS true
IPAddress dns1IP = gatewayIP;
IPAddress dns2IP = IPAddress(8, 8, 8, 8);

// #define USE_CUSTOM_AP_IP false
IPAddress APStaticIP = IPAddress(192, 168, 100, 1);
IPAddress APStaticGW = IPAddress(192, 168, 100, 1);
IPAddress APStaticSN = IPAddress(255, 255, 255, 0);

#include <ESP_WiFiManager.h> //https://github.com/khoih-prog/ESP_WiFiManager

// SSID and PW for Config Portal
String ssid = "XMASLEDS_" + String(ESP_getChipId(), HEX);
String password;

// SSID and PW for your Router
String Router_SSID;
String Router_Pass;

// Function Prototypes
uint8_t connectMultiWiFi();
