import { Injectable } from '@angular/core';
import { Config } from '@xmas-leds/api-interfaces';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config: Config = new Config();
  private configSubject: Subject<Config> = new BehaviorSubject(this.config);

  constructor() {
    this.getObservable().subscribe((c) => {
      console.log(`config : ${JSON.stringify(c)}`);
    });
  }

  manage(key: string, value: string) {
    if (!key) {
      return;
    }
    if (key.toLowerCase() === 'loadCaptureFromDisk'.toLowerCase()) {
      this.config.loadCaptureFromDisk = this.getBoolean(value);
    }
    if (key.toLowerCase() === 'dontUseLed'.toLowerCase()) {
      this.config.dontUseLed = this.getBoolean(value);
    }
    if (key.toLowerCase() === 'waitBetweenLeds'.toLowerCase()) {
      this.config.waitBetweenLeds = this.getBoolean(value);
    }
    if (key.toLowerCase() === 'ledCount'.toLowerCase()) {
      this.config.ledCount = this.getInteger(value);
    }
    if (key.toLowerCase() === 'dontSaveCsvToBackend'.toLowerCase()) {
      this.config.dontSaveCsvToBackend = this.getBoolean(value);
    }
    if (key.toLowerCase() === 'useBaseFile'.toLowerCase()) {
      this.config.useBaseFile = this.getBoolean(value);
    }
    this.configSubject.next(this.config);
  }

  isLoadCaptureFromDiskEnabled(): boolean {
    return this.config.loadCaptureFromDisk;
  }
  toogleLoadCaptureFromDisk() {
    this.config.loadCaptureFromDisk = !this.config.loadCaptureFromDisk;
    this.configSubject.next(this.config);
  }
  isDontUseLedEnable(): boolean {
    return this.config.dontUseLed;
  }
  toogleDontUseLed() {
    this.config.dontUseLed = !this.config.dontUseLed;
    this.configSubject.next(this.config);
  }
  isWaitBetweenLedsEnable(): boolean {
    return this.config.waitBetweenLeds;
  }
  toogleWaitBetweenLeds() {
    this.config.waitBetweenLeds = !this.config.waitBetweenLeds;
    this.configSubject.next(this.config);
  }
  getLedCount(): number {
    return this.config.ledCount;
  }
  setLedCount(n: number) {
    this.config.ledCount = +n;
    this.configSubject.next(this.config);
  }
  isDontSaveCsvToBackend(): boolean {
    return this.config.dontSaveCsvToBackend;
  }
  toogleDontSaveCsvToBackend() {
    this.config.dontSaveCsvToBackend = !this.config.dontSaveCsvToBackend;
    this.configSubject.next(this.config);
  }
  isUseBaseFileEnabled(): boolean {
    return this.config.useBaseFile;
  }
  toogleUseBaseFile() {
    this.config.useBaseFile = !this.config.useBaseFile;
    this.configSubject.next(this.config);
  }

  getObservable(): Observable<Config> {
    return this.configSubject.asObservable();
  }

  private getBoolean(param: string): boolean {
    if (!param) {
      return false;
    } else {
      return param.toLowerCase() === 'true';
    }
  }
  private getInteger(param: string): number {
    const ret = parseInt(param);
    return ret ? ret : 0;
  }
}
