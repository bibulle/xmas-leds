/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { Advancement, Config } from '@xmas-leds/api-interfaces';
import { Image } from 'image-js';
import { ConfigService } from '../config.service';
import { AnalyseService } from './analyse.service';

@Component({
  selector: 'xmas-leds-analyse',
  templateUrl: './analyse.component.html',
  styleUrls: ['./analyse.component.scss'],
})
export class AnalyzeComponent implements OnInit {
  showConf = false;
  config: Config = new Config();

  image: Image | undefined;
  public roiImg: Image[] = [];

  advancement: Advancement = new Advancement();

  // public grey: Image | undefined;
  // public mask: Image | undefined;

  constructor(private analyseService: AnalyseService, private configService: ConfigService) {}

  ngOnInit() {
    this.analyseService.imageObservable().subscribe((img) => {
      this.image = img;
    });
    this.analyseService.imageRoisObservable().subscribe((img) => {
      this.roiImg = img;
    });
    this.analyseService.avancementObservable().subscribe((a) => {
      this.advancement = a;
    });
    this.configService.getObservable().subscribe((a) => {
      this.config = a;
      console.log(this.config);
    });
  }

  public nextStepAnalyse() {
    this.analyseService.nextStepAnalyse();
  }
  public resetAnalyse() {
    this.analyseService.resetAnalyse();
  }

  toogleLoadCaptureFromDisk() {
    this.configService.toogleLoadCaptureFromDisk();
  }
  toogleWaitBetweenLeds() {
    this.configService.toogleWaitBetweenLeds();
  }
  toogleDontUseLed() {
    this.configService.toogleDontUseLed();
  }
  setLedCount(ev:any) {
    this.configService.setLedCount(ev.target.value);
  }
  toogleDontSaveCsvToBackend() {
    this.configService.toogleDontSaveCsvToBackend();
  }
  toogleUseBaseFile() {
    this.configService.toogleUseBaseFile();
  }

}
