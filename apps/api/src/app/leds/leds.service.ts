import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Led, LedsStatus } from '@xmas-leds/api-interfaces';
import { existsSync, readFileSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';

// import FormData = require('form-data');

@Injectable()
export class LedsService {
  readonly logger = new Logger(LedsService.name);

  // private readonly LEDS_IP = '192.168.0.129:86';
  //private readonly LEDS_IP = '192.168.0.129:85';
  // private readonly LEDS_IP = 'localhost:85';

  constructor(private httpService: HttpService, private _configService: ConfigService) {}

  async getStatus(): Promise<LedsStatus> {
    const url = `http://${this._configService.get('LEDS_IP')}/getStatus`;
    return await lastValueFrom(
      this.httpService.get<LedsStatus>(url, { timeout: 4000 }).pipe(
        map((response) => {
          response.data.animOn = !!response.data.animOn;
          return response.data;
        })
      )
    );
  }

  async clearStrip(): Promise<string> {
    const url = `http://${this._configService.get('LEDS_IP')}/strip/clear`;
    return await lastValueFrom(
      this.httpService.get<LedsStatus>(url, { timeout: 4000 }).pipe(
        map(() => {
          return 'Led off';
        })
      )
    );
  }

  async changeStrip(leds: Led[]): Promise<string> {
    const url = `http://${this._configService.get('LEDS_IP')}/strip/change`;

    let body = `leds=`;
    this.logger.log(leds);
    if (typeof leds === 'string') {
      body += leds;
    } else {
      leds.forEach((l, index) => {
        body += `${index == 0 ? '' : ', '}${l.index} ${l.r} ${l.g} ${l.b}`;
      });
    }
    console.log(body);

    return await lastValueFrom(
      this.httpService.post<string>(url, body, { timeout: 4000 }).pipe(
        map(() => {
          return 'Led changed';
        })
      )
    );
  }

  async renameAnim(path1: string, path2: string): Promise<string> {
    const url = `http://${this._configService.get('LEDS_IP')}/anim/rename?name1=${encodeURIComponent(path1)}&name2=${encodeURIComponent(path2)}`;
    return await lastValueFrom(
      this.httpService.get<string>(url, { timeout: 4000 }).pipe(
        map(() => {
          return 'anim renamed';
        })
      )
    );
  }

  async uploadToStrip(name: string, path: string): Promise<string> {
    if (!existsSync(path)) {
      throw new HttpException('Animation not found', HttpStatus.NOT_FOUND);
    }
    this.logger.log(path);

    //--------------------------------------------

    const file: string = readFileSync(path).toString();

    let content = `-----011000010111000001101001\r\n`;
    content += `Content-Disposition: form-data; name="file"; filename="${name}.csv"\r\n`;
    content += `Content-Type: text/csv\r\n`;
    content += `\r\n`;
    content += `${file}\r\n`;
    content += `-----011000010111000001101001--\r\n\r\n`;

    const options = {
      method: 'POST',
      url: `http://${this._configService.get('LEDS_IP')}/upload`,
      headers: {
        Accept: '*/*',
        'User-Agent': 'Thunder Client (https://www.thunderclient.com)',
        'content-type': 'multipart/form-data; boundary=---011000010111000001101001',
        'Keep-Alive': 'timeout=10 , max=1000',
      },
      data: content,
      timeout: 12000,
    };

    return await lastValueFrom(
      this.httpService.request(options).pipe(
        map(() => {
          return 'File saved';
        })
      )
    );

    //--------------------------------------------
    // const formdata = new FormData();
    // formdata.append('file', createReadStream('/Users/m341772/Developer/xmas-leds/data/animations/Vertical.csv'));

    // const bodyContent = formdata;

    // const reqOptions = {
    //   url: 'http://192.168.1.31/upload',
    //   method: 'POST',
    //   headers: headersList,
    //   data: bodyContent,
    // };

    // this.httpService.request(reqOptions).subscribe({
    //   next: (response) => {
    //     console.log(response);
    //   },
    //   error: (error) => {
    //     console.error(error);
    //   },
    // });

    //--------------------------------------------
    // const file = readFileSync(fileName);
    // console.log(file.toString());

    // const formData = new FormData();
    // formData.append('file', new Blob([file.toString()], { type: "text/xml"}));
    // // formData.append("file", Buffer.from([file.toString()], { type: "text/csv"}), { filename: fileName });

    // console.log(formData);

    // const request_config = {
    //   headers: {
    //     'Content-Type': 'multipart/form-data',
    //   },
    //   data: formData,
    // };

    // this.httpService.post<string>(`http://${this._configService.get('LEDS_IP')}/upload`, request_config).subscribe({
    //   next: () => {
    //     resolve('File saved to Strip');
    //   },
    //   error: (error) => {
    //     console.error(error);
    //     this.logger.error(`${error.message} : ${error.response?.data} (${error.request.path})`);
    //     reject(new HttpException(`Cannot connect to Strip (${error})`, HttpStatus.INTERNAL_SERVER_ERROR));
    //   },
    // });
  }

  async deleteFromStrip(name: string): Promise<string> {
    const url = `http://${this._configService.get('LEDS_IP')}/anim?name=${encodeURIComponent(name)}`;
    return await lastValueFrom(
      this.httpService.delete<string>(url, { timeout: 4000 }).pipe(
        map(() => {
          return 'Anim deleted';
        })
      )
    );
  }

  async deleteFromStripAll(): Promise<string> {
    const url = `http://${this._configService.get('LEDS_IP')}/anim/all`;
    return await lastValueFrom(
      this.httpService.delete<string>(url, { timeout: 4000 }).pipe(
        map(() => {
          return 'All anims deleted';
        })
      )
    );
  }

  async execOnStrip(name: string): Promise<string> {
    const url = `http://${this._configService.get('LEDS_IP')}/anim/exec?name=${encodeURIComponent(name)}`;
    return await lastValueFrom(
      this.httpService.get<string>(url, { timeout: 4000 }).pipe(
        map(() => {
          return 'Anim executed';
        })
      )
    );
  }

  async getAnimsFromStrip(): Promise<{ animations: string[]; files: AnimationFile[] }> {
    return new Promise<{ animations: string[]; files: AnimationFile[] }>((resolve, reject) => {
      this.httpService.get<AnimationFile[]>(`http://${this._configService.get('LEDS_IP')}/list?dir=/animations`, { timeout: 4000 }).subscribe({
        next: (response) => {
          const anims = response.data
            .filter((af) => af.name.endsWith('.csv'))
            .map((af) => {
              return af.name.replace(/^animations\//, '').replace(/[.]csv$/, '');
            });
          resolve({ animations: anims, files: response.data });
        },
        error: (error) => {
          this.logger.error(`${error.message} : ${error.response?.data} (${error.request.path})`);
          reject(new HttpException(`Cannot connect to Strip (${error})`, HttpStatus.INTERNAL_SERVER_ERROR));
        },
      });
    });
  }

  stopAnims(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.httpService.get<string>(`http://${this._configService.get('LEDS_IP')}/anim/stop`, { timeout: 4000 }).subscribe({
        next: () => {
          resolve('Animations stopped');
        },
        error: (error) => {
          this.logger.error(`${error.message} : ${error.response?.data} (${error.request.path})`);
          reject(new HttpException(`Cannot connect to Strip (${error})`, HttpStatus.INTERNAL_SERVER_ERROR));
        },
      });
    });
  }
  startAnims(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.httpService.get<string>(`http://${this._configService.get('LEDS_IP')}/anim/start`, { timeout: 4000 }).subscribe({
        next: () => {
          resolve('Animations started');
        },
        error: (error) => {
          this.logger.error(`${error.message} : ${error.response?.data} (${error.request.path})`);
          reject(new HttpException(`Cannot connect to Strip (${error})`, HttpStatus.INTERNAL_SERVER_ERROR));
        },
      });
    });
  }
}

interface AnimationFile {
  type: string;
  name: string;
  size: string;
}
