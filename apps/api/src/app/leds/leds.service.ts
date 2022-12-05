import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Led, LedsStatus } from '@xmas-leds/api-interfaces';
import { existsSync, readFileSync } from 'fs';
// import FormData = require('form-data');

@Injectable()
export class LedsService {
  readonly logger = new Logger(LedsService.name);

  private readonly LEDS_IP = '192.168.1.31';

  constructor(private httpService: HttpService) {}

  getStatus(): Promise<LedsStatus> {
    return new Promise<LedsStatus>((resolve, reject) => {
      this.httpService.get(`http://${this.LEDS_IP}/getStatus`, { timeout: 4000 }).subscribe({
        next: (response) => {
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
      leds.forEach((l, index) => {
        body += `${index == 0 ? '' : ', '}${l.index} ${l.r} ${l.g} ${l.b}`;
      });
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
        url: 'http://192.168.1.31/upload',
        headers: {
          Accept: '*/*',
          'User-Agent': 'Thunder Client (https://www.thunderclient.com)',
          'content-type': 'multipart/form-data; boundary=---011000010111000001101001',
          'Keep-Alive': 'timeout=10 , max=1000'

        },
        data: content,
        timeout: 12000
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
}
