# Xmas-leds

## Concepts

Tous les geeks ont reve un jour de pouvoir faire es propres animations dans le sapin...
Donc, cette annes, je me suis lancé...

Voici donc le projet **Xmas-leds**

J'ai mis la guirlande dans le sapin, puis grace a la caméra, j'ai calculé la position de chacune des leds.
On obtiens donc un fichier CSV avec l'ensemble des positions de celle-ci.

Ensuite, on peut generer un fichier permettant d'animer ces leds comme on le souhaite.

Le truc fun, c'est que le code est là et donc, vous pouvez ajouter vos propres animations :

- soit en faisant une pull request
- soit en uploadant votre propre fichier que vous avez fait de votre coté

## Exemple de fichier

### Fichier de positions de led

```csv
id,x,y,z
0,-0.54,-0.971,0.156
1,-0.37,-0.846,0.067
2,-0.123,0,0.161
3,0.17,-0.578,0.351
4,0.23,-0.751,0.644
5,0.421,-0.801,0.687
6,0.559,-0.338,0.652
7,0.555,0.005,0.536
```

- Id : le nuero de la led (de 0 à 99) pour l'instant
- x, y et z : Les coordonné dans l'espace de la led (x et y sont normalisé entre -1 et 1 et z en 0 et la hauteur)

### Fichier d'animation

```
200, 0 0 255 0, 1 0 255 0, 2 0 255 0, ...
200, 3 0 255 0, 13 0 255 0, 14 0 255 0, ...
200, 7 0 255 0, 8 0 255 0, 10 0 255 0, ...
200, 4 0 255 0, 5 0 255 0, 6 0 255 0, ...
200, 11 0 255 0, 19 0 255 0, 21 0 255 0, ...
200, 20 0 255 0, 28 0 255 0, 88 0 255 0, 11 ...
```

- durée : oendant combien de temps cette ligne sera "affiché"
- liste de led a modifier (index r g b)

La premier ligne se lit :
Pendant 200 milisecondes, mettre la led 0 plein vert, la led 1 pareil, ...