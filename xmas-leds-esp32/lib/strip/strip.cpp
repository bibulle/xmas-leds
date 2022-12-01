#include "strip.h"

NeoPixelBus<NeoRgbFeature, Neo800KbpsMethod> strip(PixelCount, PixelPin);

void initStrip(void){
  // this resets all the neopixels to an off state
  delay(50);
  strip.Begin();
  // delay(50);
  strip.SetPixelColor(0, RgbColor(0));
  delay(50);
  strip.ClearTo(RgbColor(0));
  // delay(50);
  strip.Show();
  delay(200);
  strip.Show();  
}
void showStrip(void){
  strip.Show();
}

uint16_t getPixelCount() {
  return PixelCount;
}

RgbColor getPixel(uint16_t indexPixel) {
  return strip.GetPixelColor(indexPixel);
}
void setPixel(uint16_t indexPixel, RgbColor color) {
  strip.SetPixelColor(indexPixel, color);
}
void setAllPixel(RgbColor color){
    strip.ClearTo(color);
}
