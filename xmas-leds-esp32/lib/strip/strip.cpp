#include "strip.h"

#include "util.h"

NeoPixelBus<NeoRgbFeature, Neo800KbpsMethod> strip(PixelCount, PixelPin);
//NeoPixelBus<NeoGrbFeature, Neo800KbpsMethod> strip(PixelCount, PixelPin);

File currentProgramFile;

char *currentAnimName = NULL;
int currentAnimeCount = -1;

File currentAnimFil;
unsigned long newAnimLineTime = 0;
uint16_t currentAnimDuration;

boolean stopAnimations = false;
boolean alreadyStoped = false;

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
  if (stopAnimations == false) {
    alreadyStoped = false;
  }
  Serial.printf("toggleStopAnimation stopAnimations: %d\n", stopAnimations);
  Serial.printf("toggleStopAnimation alreadyStoped: %d\n", alreadyStoped);
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
  // Serial.printf("setPixel(%d/n",indexPixel);
  strip.SetPixelColor(indexPixel, color);
}
void setAllPixel(RgbColor color)
{
  Serial.println("setAllPixel");
  strip.ClearTo(color);
}

void closeCurrentProgramFile()
{
  if (currentProgramFile)
  {
    //Serial.println("close Program File");
    currentProgramFile.close();
  }
}

void closeCurrentAnimFile()
{
  if (currentAnimFil)
  {
    //Serial.println("close Anim File");
    currentAnimFil.close();
  }
}

void updateAnim()
{
  if (millis() < newAnimLineTime)
  {
    return;
  }

  if (stopAnimations)
  {
    if (!alreadyStoped) {
      setAllPixel(RgbColor(0));
      showStrip();
      closeCurrentAnimFile();
    }
    alreadyStoped = true;

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

  // Lire la durée de l'animation (2 octets)
  uint16_t duration;
  if (currentAnimFil.read((uint8_t *)&duration, sizeof(duration)) != sizeof(duration))
  {
    Serial.println("Erreur lors de la lecture de la durée dans le fichier binaire");
    return;
  }
  currentAnimDuration = duration;

  // Lire le nombre de LEDs dans cette animation (2 octets)
  uint16_t numLeds;
  if (currentAnimFil.read((uint8_t *)&numLeds, sizeof(numLeds)) != sizeof(numLeds))
  {
    Serial.println("Erreur lors de la lecture du nombre de LEDs dans le fichier binaire");
    return;
  }

  // Serial.printf("updateAnim '%s' : %d, %d\n", currentAnimFil.name(), duration, numLeds);

  // Lire les données de chaque LED (1 octet pour l'ID, 3 octets pour les couleurs)
  for (uint16_t i = 0; i < numLeds; i++)
  {
    uint8_t id, r, g, b;

    // Lire l'ID de la LED (1 octet)
    if (currentAnimFil.read(&id, sizeof(id)) != sizeof(id))
    {
      Serial.println("Erreur lors de la lecture de l'ID de la LED");
      return;
    }
    // Serial.printf("           '%s' : %d\n", currentAnimFil.name(), id);

    // Lire les couleurs R, G, B (1 octet chacune)
    if (currentAnimFil.read(&r, sizeof(r)) != sizeof(r) ||
        currentAnimFil.read(&g, sizeof(g)) != sizeof(g) ||
        currentAnimFil.read(&b, sizeof(b)) != sizeof(b))
    {
      Serial.println("Erreur lors de la lecture des couleurs de la LED");
      return;
    }

    // Mettre à jour la couleur de la LED
    // Serial.printf("updateAnim '%s' : %d, %d - %d, %d, %d, %d\n", currentAnimFil.name(), duration, numLeds, id, r, g, b);
    setPixel(id, RgbColor(r, g, b));
  }

  // Serial.printf("\t'%s'\n", l_line.c_str());
  // analyse line, set colors and cureentduration

  return;
}
void startAnim(String path)
{
  //Serial.printf("StartAnim '%s'\n", path.c_str());
  closeCurrentAnimFile();
  currentAnimFil = LittleFS.open("/animations/" + path + ".bin", "r");
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

void startNextAnim()
{
  //Serial.println("startNextAnim");
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
    // Serial.printf("Wrong format in program (%s, %s)\n", animName.c_str(), countS.c_str());
    return;
  }

  free(currentAnimName);
  currentAnimName = (char *)malloc(animName.length() + 1);
  strcpy(currentAnimName, animName.c_str());
  currentAnimeCount = countS.toInt();

  Serial.printf("Start animation %s (%d)\n", currentAnimName, currentAnimeCount);
  startAnim(currentAnimName);
}