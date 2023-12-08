
#include <LittleFS.h>
#include <NeoPixelBus.h>

const uint16_t PixelCount = 200;
const uint8_t PixelPin = GPIO_NUM_15;

#define colorSaturation 32

void initStrip(void);
uint16_t getPixelCount();
void showStrip(void);
RgbColor getPixel(uint16_t indexPixel);
void setPixel(uint16_t indexPixel, RgbColor color);
void setAllPixel(RgbColor color);

void updateAnim();
String startAnim(String path);
void startRandomAnim();

void toggleStopAnimation(boolean val);
boolean isStopAnimation();