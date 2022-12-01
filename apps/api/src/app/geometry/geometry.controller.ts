import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiReturn, Point } from '@xmas-leds/api-interfaces';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs';

@Controller('')
export class GeometryController {
  readonly logger = new Logger(GeometryController.name);

  // ====================================
  // route for saving captured image
  // ====================================
  @Post('/savePoints')
  async savePoints(@Body('points') points: Point[]): Promise<ApiReturn> {
    // this.logger.debug(points);

    return new Promise<ApiReturn>((resolve) => {
      // create the csv target content
      let csv = 'id,x,y,z\r\n';
      points.forEach((p, index) => {
        p.x = p.x ? +p.x.toFixed(3) : 0;
        p.y = p.y ? +p.y.toFixed(3) : 0;
        p.z = p.z ? +p.z.toFixed(3) : 0;
        csv += `${index !== 0 ? '\r\n' : ''}${index},${p.x},${p.y},${p.z}`;
      });
      // console.log(csv);

      mkdirSync('data', { recursive: true });

      let currentCSV = '';
      let fileAlreadyExists = false;
      if (existsSync(this.getFileName())) {
        currentCSV = readFileSync(this.getFileName()).toString();
        fileAlreadyExists = true;
      }

      if (currentCSV === csv) {
        return resolve({ ok: 'No need to save' });
      }

      this.logger.debug('trying to save points');

      // save previous file
      if (fileAlreadyExists) {
        let cpt = 1;
        while (existsSync(this.getFileName(cpt))) {
          cpt++;
        }
        renameSync(this.getFileName(), this.getFileName(cpt));
      }

      writeFileSync(this.getFileName(), Buffer.from(csv));

      resolve({ ok: 'OK' });
    });
  }

  getFileName(id: number = undefined): string {
    if (!id) {
      return `data/xmas-tree-leds.csv`;
    } else {
      return `data/xmas-tree-leds_${('' + id).padStart(4, '0')}.csv`;
    }
  }
}
