
#include <LittleFS.h>
#include <NeoPixelBus.h>

const uint16_t PixelCount = 400;
const uint8_t PixelPin = GPIO_NUM_15;

#define colorSaturation 32

void initStrip(void);
uint16_t getPixelCount();
void showStrip(void);
RgbColor getPixel(uint16_t indexPixel);
void setPixel(uint16_t indexPixel, RgbColor color);
void setAllPixel(RgbColor color);

void closeCurrentProgramFile();
void closeCurrentAnimFile();
void updateAnim();
void startAnim(String path);
void startRandomAnim();
void startNextAnim();

void toggleStopAnimation(boolean val);
boolean isStopAnimation();