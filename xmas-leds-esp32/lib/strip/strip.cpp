#include "strip.h"

#include "util.h"

// NeoPixelBus<NeoRgbFeature, Neo800KbpsMethod> strip(PixelCount, PixelPin);
NeoPixelBus<NeoGrbFeature, Neo800KbpsMethod> strip(PixelCount, PixelPin);

File currentAnimFil;
unsigned long newAnimLineTime = 0;
uint16_t currentAnimDuration;
boolean stopAnimations = false;

void initStrip(void)
{
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
void showStrip(void)
{
  strip.Show();
}

void toggleStopAnimation(boolean val)
{
  stopAnimations = val;
}
boolean isStopAnimation()
{
  return stopAnimations;
}

uint16_t getPixelCount()
{
  return PixelCount;
}

RgbColor getPixel(uint16_t indexPixel)
{
  return strip.GetPixelColor(indexPixel);
}
void setPixel(uint16_t indexPixel, RgbColor color)
{
  strip.SetPixelColor(indexPixel, color);
}
void setAllPixel(RgbColor color)
{
  strip.ClearTo(color);
}

void closeCurrentAnimFile()
{

  if (currentAnimFil)
  {
    Serial.println("close Anim File");

    currentAnimFil.close();
  }
  Serial.flush();
}

void updateAnim()
{
  if (millis() < newAnimLineTime)
  {
    return;
  }

  if (stopAnimations)
  {
    closeCurrentAnimFile();
    return;
  }
  if (!currentAnimFil || !currentAnimFil.available() || currentAnimFil.isDirectory())
  {
    // Serial.println("close Anim File");
    closeCurrentAnimFile();

    startNextAnim();

    return;
  }

  // Serial.printf("New anim Line (retard %d ms)\n", millis() - newAnimLineTime);
  showStrip();
  newAnimLineTime = millis() + currentAnimDuration;

  long timeTrace = millis();

  String l_line = currentAnimFil.readStringUntil('\n');
  while (l_line.startsWith("#"))
  {
    l_line = currentAnimFil.readStringUntil('\n');
  }
  l_line.trim();
  // Serial.println(l_line);

  String durationS;
  if (!get_token(l_line, durationS, 0, ','))
  {
    Serial.println(l_line);
    Serial.println("No duration, in this line");
    return;
  }
  durationS.trim();
  // Serial.println(durationS);
  currentAnimDuration = durationS.toInt();

  String led;
  uint8_t rgb_idx = 1;
  while (get_token(l_line, led, rgb_idx, ','))
  {
    led.trim();
    String idS, rS, gS, bS;
    if (get_token(led, idS, 0, ' ') && get_token(led, rS, 1, ' ') && get_token(led, gS, 2, ' ') && get_token(led, bS, 3, ' '))
    {
      // Serial.printf("led %s : '%s' '%s' '%s'\n", idS, rS, gS, bS);
      setPixel(idS.toInt(), RgbColor(rS.toInt(), gS.toInt(), bS.toInt()));
    }
    else
    {
      Serial.println(l_line);
      Serial.printf("bad format for led %d\n", rgb_idx);
      return;
    }
    rgb_idx++;
  }
  // Serial.printf("New anim Line (analyse %d ms for %d led)\n", millis() - timeTrace, rgb_idx);

  // Serial.printf("\t'%s'\n", l_line.c_str());
  // analyse line, set colors and cureentduration

  return;
}
void startAnim(String path)
{
  Serial.printf("StartAnim '%s'\n", path.c_str());
  closeCurrentAnimFile();
  currentAnimFil = LittleFS.open("/animations/" + path + ".csv", "r");
  if (!currentAnimFil.available() || currentAnimFil.isDirectory())
  {
    closeCurrentAnimFile();
    Serial.println("File not found ='" + path + "'");
    return;
    // return "File not found ='" + path + "'";
  }
  newAnimLineTime = 0;

  updateAnim();

  return;
}

void startRandomAnim()
{
  // get list of anims
  const char *anims[100] = {};
  int cpt = 0;

  File root = LittleFS.open("/animations");
  if (!root.isDirectory())
  {
    Serial.println("'animations' is not a directory");
    Serial.println(root.name());
    return;
  }
  File file = root.openNextFile();
  while (file && cpt < 100)
  {
    if (!file.isDirectory())
    {
      if (cpt == 0)
        Serial.printf("Found file: '%s'\n", file.name());
      anims[cpt] = file.path();
      cpt++;
      file.close();
    }
    file = root.openNextFile();
  }
  root.close();
  if (cpt == 0)
  {
    Serial.println("No animation found");
    return;
  }
  // Serial.printf("Animation found %d\n", cpt);

  int randomNumber = random(0, 100 * cpt);
  // Serial.printf("Anim %d : '%s'\n", randomNumber, anims[randomNumber % cpt]);

  startAnim(anims[randomNumber % cpt]);
}

File currentProgramFile;

char *currentAnimName = NULL;
int currentAnimeCount = -1;

void startNextAnim()
{
  Serial.println("startNextAnim");
  // if needed replay the previous animation
  if (currentAnimName && currentAnimeCount > 1)
  {
    currentAnimeCount--;
    Serial.printf("Start animation %s (%d)\n", currentAnimName, currentAnimeCount);
    startAnim(currentAnimName);
    return;
  }

  // if program not loaded or ended, reload it
  if (!currentProgramFile || !currentProgramFile.available())
  {
    currentProgramFile.close();
    Serial.println("Start program");
    currentProgramFile = LittleFS.open("/animations/program.csv", FILE_READ);
    if (!currentProgramFile || !currentProgramFile.available())
    {
      Serial.printf("No program found !!\n");
      return;
    }
  }

  // read next line of the program
  String line = currentProgramFile.readStringUntil('\n');
  String animName, countS;

  get_token(line, animName, 0, ' ');
  get_token(line, countS, 1, ' ');
  if (animName == "" || countS.toInt() == 0)
  {
    //Serial.printf("Wrong format in program (%s, %s)\n", animName.c_str(), countS.c_str());
    return;
  }

  free(currentAnimName);
  currentAnimName = (char *)malloc(animName.length() + 1);
  strcpy(currentAnimName, animName.c_str());
  currentAnimeCount = countS.toInt();

  Serial.printf("Start animation %s (%d)\n", currentAnimName, currentAnimeCount);
  startAnim(currentAnimName);
}