// leds.controller.ts
import { Controller, Get, Post, Delete, Query, Body, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';

@Controller()
export class LedsController {
  // Pour simuler les états des animations, des LEDs, etc.
  private animations = [];
  private ledStatus = { on: false, color: '#FFFFFF' };

  // Route /list pour lister les fichiers d'animations
  @Get('/list')
  handleFileList(): string[] {
    return this.animations;
  }

  // Route /strip/clear pour effacer la bande de LEDs
  @Get('/strip/clear')
  handleStripClear(): string {
    this.ledStatus = { on: false, color: '#000000' };
    return 'LED strip cleared';
  }

  // Route /strip/set pour configurer une couleur spécifique
  @Get('/strip/set')
  handleStripSet(@Query('color') color: string): string {
    this.ledStatus.color = color || '#FFFFFF';
    this.ledStatus.on = true;
    return `LED strip set to color ${color}`;
  }

  // Route /strip/change pour changer l'état de la bande de LEDs
  @Get('/strip/change')
  handleStripChange(): string {
    this.ledStatus.on = !this.ledStatus.on;
    return `LED strip turned ${this.ledStatus.on ? 'on' : 'off'}`;
  }

  // Route /getStatus pour obtenir l'état actuel de la bande de LEDs
  @Get('/getStatus')
  handleGetStatus() {
    return {
      status: this.ledStatus.on ? 'on' : 'off',
      color: this.ledStatus.color,
    };
  }

  // Route /anim/stop pour arrêter une animation
  @Get('/anim/stop')
  handleAnimStop(): string {
    return 'Animation stopped';
  }

  // Route /anim/start pour démarrer une animation
  @Get('/anim/start')
  handleAnimStart(): string {
    return 'Animation started';
  }

  // Route /upload pour télécharger un fichier d'animation (POST)
  @Post('/upload')
  handleFileUpload(): string {
    return 'File uploaded';
  }

  // Route /anim pour supprimer un fichier d'animation (DELETE)
  @Delete('/anim')
  handleFileDelete(@Body('filename') filename: string): string {
    const index = this.animations.indexOf(filename);
    if (index > -1) {
      this.animations.splice(index, 1);
      return `File ${filename} deleted`;
    }
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
    const index = this.animations.indexOf(oldName);
    if (index > -1) {
      this.animations[index] = newName;
      return `Animation ${oldName} renamed to ${newName}`;
    }
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