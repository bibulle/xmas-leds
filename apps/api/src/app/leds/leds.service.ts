import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Led, LedsStatus } from '@xmas-leds/api-interfaces';
import { existsSync, readFileSync } from 'fs';
// import FormData = require('form-data');

@Injectable()
export class LedsService {
  readonly logger = new Logger(LedsService.name);

  private readonly LEDS_IP = '192.168.0.129:85';

  constructor(private httpService: HttpService) {}

  getStatus(): Promise<LedsStatus> {
    return new Promise<LedsStatus>((resolve, reject) => {
      this.httpService.get(`http://${this.LEDS_IP}/getStatus`, { timeout: 4000 }).subscribe({
        next: (response) => {
          response.data.animOn = response.data.animOn ? true : false;
          resolve(response.data);
        },
        error: (error) => {
          this.logger.error(`${error.message} : ${error.response?.data} (${error.request.path})`);
          reject(new HttpException(`Cannot connect to Strip (${error})`, HttpStatus.INTERNAL_SERVER_ERROR));
        },
      });
    });
  }

  clearStrip(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.httpService.get<string>(`http://${this.LEDS_IP}/strip/clear`, { timeout: 4000 }).subscribe({
        next: () => {
          resolve('Led off');
        },
        error: (error) => {
          this.logger.error(`${error.message} : ${error.response?.data} (${error.request.path})`);
          reject(new HttpException(`Cannot connect to Strip (${error})`, HttpStatus.INTERNAL_SERVER_ERROR));
        },
      });
    });
  }

  changeStrip(leds: Led[]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
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

      this.httpService.post<string>(`http://${this.LEDS_IP}/strip/change`, body, { timeout: 4000 }).subscribe({
        next: () => {
          resolve('Led changed');
        },
        error: (error) => {
          this.logger.error(`${error.message} : ${error.response?.data} (${error.request.path})`);
          reject(new HttpException(`Cannot connect to Strip (${error})`, HttpStatus.INTERNAL_SERVER_ERROR));
        },
      });
    });
  }

  renameAnim(path1: string, path2: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {

    this.logger.debug(`renale ${path1} -> ${path2}`);

    this.httpService.get<string>(`http://${this.LEDS_IP}/anim/rename?name1=${encodeURIComponent(path1)}&name2=${encodeURIComponent(path2)}`, { timeout: 4000 }).subscribe({
      next: () => {
        resolve('anim renamed');
      },
      error: (error) => {
        this.logger.error(`${error.message} : ${error.response?.data} (${error.request.path})`);
        reject(new HttpException(`Cannot connect to Strip (${error})`, HttpStatus.INTERNAL_SERVER_ERROR));
      },
    });
  });

}

  uploadToStrip(name: string, path: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
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
        url: `http://${this.LEDS_IP}/upload`,
        headers: {
          Accept: '*/*',
          'User-Agent': 'Thunder Client (https://www.thunderclient.com)',
          'content-type': 'multipart/form-data; boundary=---011000010111000001101001',
          'Keep-Alive': 'timeout=10 , max=1000',
        },
        data: content,
        timeout: 12000,
      };

      this.httpService.request(options).subscribe({
        next: () => {
          resolve('File saved');
        },
        error: (error) => {
          this.logger.error(`${error.message} : ${error.response?.data} (${error.request.path})`);
          reject(new HttpException(`Cannot connect to Strip (${error})`, HttpStatus.INTERNAL_SERVER_ERROR));
        },
      });

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

      // this.httpService.post<string>(`http://${this.LEDS_IP}/upload`, request_config).subscribe({
      //   next: () => {
      //     resolve('File saved to Strip');
      //   },
      //   error: (error) => {
      //     console.error(error);
      //     this.logger.error(`${error.message} : ${error.response?.data} (${error.request.path})`);
      //     reject(new HttpException(`Cannot connect to Strip (${error})`, HttpStatus.INTERNAL_SERVER_ERROR));
      //   },
      // });
    });
  }

  deleteFromStrip(name: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.logger.log(name);

      this.httpService.delete<string>(`http://${this.LEDS_IP}/anim?name=${encodeURIComponent(name)}`, { timeout: 4000 }).subscribe({
        next: () => {
          resolve('Anim deleted');
        },
        error: (error) => {
          this.logger.error(`${error.message} : ${error.response?.data} (${error.request.path})`);
          reject(new HttpException(`Cannot connect to Strip (${error})`, HttpStatus.INTERNAL_SERVER_ERROR));
        },
      });
    });
  }

  execOnStrip(name: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.logger.log(name);

      this.httpService.get<string>(`http://${this.LEDS_IP}/anim/exec?name=${encodeURIComponent(name)}`, { timeout: 4000 }).subscribe({
        next: () => {
          resolve('Anim executed');
        },
        error: (error) => {
          this.logger.error(`${error.message} : ${error.response?.data} (${error.request.path})`);
          reject(new HttpException(`Cannot connect to Strip (${error})`, HttpStatus.INTERNAL_SERVER_ERROR));
        },
      });
    });
  }

  getAnimsFromStrip(): Promise<{animations: string[], files: AnimationFile[]}> {
    return new Promise<{animations: string[], files: AnimationFile[]}>((resolve, reject) => {
      this.httpService.get<AnimationFile[]>(`http://${this.LEDS_IP}/list?dir=/animations`, { timeout: 4000 }).subscribe({
        next: (response) => {
          const anims = response.data
          .filter((af) => af.name.endsWith('.csv'))
          .map((af) => {
            return af.name.replace(/^animations\//, '').replace(/[.]csv$/, '');
          });
          resolve({animations: anims, files: response.data}
            
          );
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
      this.httpService.get<string>(`http://${this.LEDS_IP}/anim/stop`, { timeout: 4000 }).subscribe({
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
      this.httpService.get<string>(`http://${this.LEDS_IP}/anim/start`, { timeout: 4000 }).subscribe({
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
