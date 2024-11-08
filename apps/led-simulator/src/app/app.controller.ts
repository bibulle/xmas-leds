/* eslint-disable @typescript-eslint/no-explicit-any */
// leds.controller.ts
import { Controller, Get, Post, Delete, Query, Body, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { LedsStatus } from '@xmas-leds/api-interfaces';

@Controller()
export class LedsController {
  // Pour simuler les états des animations, des LEDs, etc.
  private animations = [
    { type: 'file', name: 'animations/Sparkle_0010.bin', size: '229060' },
    { type: 'file', name: 'animations/program.csv', size: '214' },
  ];
  private ledStatus: LedsStatus = {
    defined: true,
    up: 772556,
    heapSize: 323424,
    heapFree: 227432,
    heapMin: 223224,
    heapMax: 110580,
    totalBytes: 1441792,
    usedBytes: 249856,
    animOn: true,
  };

  // Route /list pour lister les fichiers d'animations
  @Get('/list')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleFileList(@Query('dir') dir: string): any[] {
    return this.animations;
  }

  // Route /strip/clear pour effacer la bande de LEDs
  @Get('/strip/clear')
  handleStripClear(): string {
    return ;
  }

  // Route /strip/set pour configurer une couleur spécifique
  @Get('/strip/set')
  handleStripSet(): string {
    return ;
  }

  // Route /strip/change pour changer l'état de la bande de LEDs
  @Get('/strip/change')
  handleStripChange(): string {
    return ;
  }

  // Route /getStatus pour obtenir l'état actuel de la bande de LEDs
  @Get('/getStatus')
  handleGetStatus() {
    return this.ledStatus;
  }

  // Route /anim/stop pour arrêter une animation
  @Get('/anim/stop')
  handleAnimStop(): string {
    this.ledStatus.animOn = false;
    return ;
  }

  // Route /anim/start pour démarrer une animation
  @Get('/anim/start')
  handleAnimStart(): string {
    this.ledStatus.animOn = true;
    return ;
  }

  // Route /upload pour télécharger un fichier d'animation (POST)
  @Post('/upload')
  handleFileUpload(): string {
    return ;
  }

  // Route /anim pour supprimer un fichier d'animation (DELETE)
  @Delete('/anim')
  handleFileDelete(@Body('filename') filename: string): string {
    // const index = this.animations.indexOf(filename);
    // if (index > -1) {
    //   this.animations.splice(index, 1);
    //   return `File ${filename} deleted`;
    // }
    throw new HttpException('File not found', HttpStatus.NOT_FOUND);
  }

  // Route /anim/all pour supprimer tous les fichiers d'animation (DELETE)
  @Delete('/anim/all')
  handleDeleteAllFiles(): string {
    this.animations = [];
    return 'All animation files deleted';
  }

  // Route /anim/exec pour exécuter une animation spécifique
  @Get('/anim/exec')
  handleExecAnim(@Query('name') name: string): string {
    return `Executing animation ${name}`;
  }

  // Route /anim/rename pour renommer un fichier d'animation
  @Get('/anim/rename')
  handleRenameAnim(@Query('oldName') oldName: string, @Query('newName') newName: string): string {
    // const index = this.animations.indexOf(oldName);
    // if (index > -1) {
    //   this.animations[index] = newName;
    //   return `Animation ${oldName} renamed to ${newName}`;
    // }
    throw new HttpException('File not found', HttpStatus.NOT_FOUND);
  }
}

// Ajoute ceci dans le contrôleur, en dessous des autres routes
@Controller('*')
export class FallbackController {
  handleUnknownRoute() {
    throw new NotFoundException('File not found');
  }
}
