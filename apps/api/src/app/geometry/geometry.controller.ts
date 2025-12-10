import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post, Res, StreamableFile } from '@nestjs/common';
import { ApiReturn, Point } from '@xmas-leds/api-interfaces';
import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs';

@Controller('')
export class GeometryController {
  readonly logger = new Logger(GeometryController.name);

  // ====================================
  // route for saving captured image
  // ====================================
  @Post('/savePoints')
  async savePoints(
    @Body('points') points: Point[],
    @Body('useBaseFile') useBaseFile?: boolean
  ): Promise<ApiReturn> {
    // this.logger.debug(points);

    return new Promise<ApiReturn>((resolve) => {
      // Check if base file should be used (only if explicitly requested AND file exists)
      const baseFileExists = existsSync('data/xmas-tree-leds_base.csv');
      const shouldUseBase = useBaseFile && baseFileExists;

      // Clean and normalize points
      this.cleanPoints(points, shouldUseBase);

      // create the csv target content
      let csv = 'id,x,y,z\r\n';
      points.forEach((p, index) => {
        p.x = (p.x == null || Number.isNaN(p.x)) ? NaN : +p.x.toFixed(3);
        p.y = (p.y == null || Number.isNaN(p.y)) ? NaN : +p.y.toFixed(3);
        p.z = (p.z == null || Number.isNaN(p.z)) ? NaN : +p.z.toFixed(3);
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

      // Always save when using base file (to apply cleaning phases)
      if (currentCSV === csv && !shouldUseBase) {
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

  @Get('/getPoints')
  async getPoints(@Res({ passthrough: true }) res): Promise<StreamableFile> {
    return new Promise<StreamableFile>((resolve) => {
      if (!existsSync(this.getFileName())) {
        throw new HttpException('Capture not found', HttpStatus.NOT_FOUND);
      }

      const file = createReadStream(this.getFileName());
      res.set({
        'Content-Type': 'image/jpg',
      });
      resolve(new StreamableFile(file));
    });
  }

  @Get('/getPointsJson')
  async getPointsJson(): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      if (!existsSync(this.getFileName())) {
        throw new HttpException('Capture not found', HttpStatus.NOT_FOUND);
      }

      const points: Point[] = [];
      const content = readFileSync(this.getFileName()).toString();
      content.split(/\r?\n/).forEach((line, index) => {
        if (index > 0) {
          // console.log(line);
          const values = line.split(/,/);
          if (values.length != 4) {
            throw new HttpException(`File format not correct (line ${index})`, HttpStatus.INTERNAL_SERVER_ERROR);
          }
          points.push(new Point(+values[1], +values[2], +values[3]));
        }
      });

      resolve({ points: points });
    });
  }

  getFileName(id: number = undefined): string {
    if (!id) {
      return `data/xmas-tree-leds.csv`;
    } else {
      return `data/xmas-tree-leds_${('' + id).padStart(4, '0')}.csv`;
    }
  }

  /**
   * Clean LED positions by:
   * 1. Optionally loading from base file (if useBaseFile is true)
   * 2. Detecting false positives (consecutive LEDs abnormally far apart)
   * 3. Interpolating missing coordinates (NaN) from adjacent LEDs
   */
  private cleanPoints(points: Point[], useBaseFile: boolean = false): void {
    this.logger.log('=== Phase de nettoyage des positions ===');

    // Phase 0: Load from base file if requested
    if (useBaseFile) {
      this.logger.log('Phase 0: Chargement des positions depuis le fichier de référence');
      const basePositions = this.loadBasePositions();

      if (basePositions && basePositions.length === points.length) {
        // Replace detected positions with base positions (keeping NaN for failed detections)
        for (let i = 0; i < points.length; i++) {
          if (basePositions[i].x != null && !Number.isNaN(basePositions[i].x)) {
            points[i].x = basePositions[i].x;
          }
          if (basePositions[i].y != null && !Number.isNaN(basePositions[i].y)) {
            points[i].y = basePositions[i].y;
          }
          if (basePositions[i].z != null && !Number.isNaN(basePositions[i].z)) {
            points[i].z = basePositions[i].z;
          }
        }
        this.logger.log(`  ✅ ${points.length} positions chargées depuis le fichier de référence`);
      } else if (!basePositions) {
        this.logger.warn('  ⚠️  Fichier de référence introuvable');
      } else {
        this.logger.warn(`  ⚠️  Nombre de LEDs incompatible (base: ${basePositions.length}, actuel: ${points.length})`);
      }
    }

    // Phase 1: Detect false positives
    this.logger.log('Phase 1: Détection des faux positifs');
    this.detectFalsePositives(points);

    // Phase 2: Interpolation
    this.logger.log('Phase 2: Interpolation des coordonnées manquantes');
    this.interpolateMissingCoordinates(points);

    this.logger.log('=== Fin du nettoyage ===');
  }

  /**
   * Load base positions from reference file
   */
  private loadBasePositions(): Point[] | null {
    const baseFile = 'data/xmas-tree-leds_base.csv';

    if (!existsSync(baseFile)) {
      return null;
    }

    try {
      const points: Point[] = [];
      const content = readFileSync(baseFile).toString();
      content.split(/\r?\n/).forEach((line, index) => {
        if (index > 0 && line.trim()) {
          const values = line.split(/,/);
          if (values.length === 4) {
            const x = values[1] === 'NaN' ? NaN : parseFloat(values[1]);
            const y = values[2] === 'NaN' ? NaN : parseFloat(values[2]);
            const z = values[3] === 'NaN' ? NaN : parseFloat(values[3]);
            points.push(new Point(x, y, z));
          }
        }
      });
      return points;
    } catch (error) {
      this.logger.error(`Erreur lors du chargement du fichier de référence: ${error.message}`);
      return null;
    }
  }

  /**
   * Detect false positives based on distance analysis and mark them as NaN for interpolation
   */
  private detectFalsePositives(points: Point[]): void {

    const distances: { from: number; to: number; distance: number }[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const d = this.distance(points[i], points[i + 1]);
      if (!Number.isNaN(d)) {
        distances.push({ from: i, to: i + 1, distance: d });
      }
    }

    if (distances.length === 0) {
      this.logger.warn('  Aucune distance calculable');
      return;
    }

    // Calculate statistics
    const validDistances = distances.map(d => d.distance);
    const mean = validDistances.reduce((a, b) => a + b, 0) / validDistances.length;
    const variance = validDistances.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / validDistances.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + 2 * stdDev;

    this.logger.log(`  Distance moyenne: ${mean.toFixed(3)}, écart-type: ${stdDev.toFixed(3)}`);
    this.logger.log(`  Seuil de détection (moyenne + 2σ): ${threshold.toFixed(3)}`);

    // Find outliers
    const outliers = distances.filter(d => d.distance > threshold);
    outliers.sort((a, b) => b.distance - a.distance);

    if (outliers.length === 0) {
      this.logger.log('  ✅ Aucun faux positif détecté');
    } else {
      this.logger.warn(`  ⚠️  ${outliers.length} paire(s) de LEDs anormalement éloignées détectée(s):`);

      // Track which LEDs to invalidate
      const ledsToInvalidate = new Set<number>();

      for (const outlier of outliers) {
        const led1 = points[outlier.from];
        const led2 = points[outlier.to];
        this.logger.warn(`    LED ${outlier.from} -> LED ${outlier.to}: distance = ${outlier.distance.toFixed(3)}`);
        this.logger.warn(`      LED ${outlier.from}: (${this.formatCoord(led1.x)}, ${this.formatCoord(led1.y)}, ${this.formatCoord(led1.z)})`);
        this.logger.warn(`      LED ${outlier.to}: (${this.formatCoord(led2.x)}, ${this.formatCoord(led2.y)}, ${this.formatCoord(led2.z)})`);

        // Determine which LED(s) is/are likely false positive(s)
        // Check for extreme values (close to -1 or 1) which suggest false positives
        const led1HasExtremeX = Math.abs(led1.x) > 0.9;
        const led1HasExtremeY = Math.abs(led1.y) > 0.9;
        const led2HasExtremeX = Math.abs(led2.x) > 0.9;
        const led2HasExtremeY = Math.abs(led2.y) > 0.9;

        const led1Suspicious = led1HasExtremeX || led1HasExtremeY;
        const led2Suspicious = led2HasExtremeX || led2HasExtremeY;

        if (led1HasExtremeX) {
          this.logger.warn(`      🚨 LED ${outlier.from} a une valeur X extrême (${led1.x.toFixed(3)}) - marqué comme faux positif`);
        }
        if (led1HasExtremeY) {
          this.logger.warn(`      🚨 LED ${outlier.from} a une valeur Y extrême (${led1.y.toFixed(3)}) - marqué comme faux positif`);
        }
        if (led2HasExtremeX) {
          this.logger.warn(`      🚨 LED ${outlier.to} a une valeur X extrême (${led2.x.toFixed(3)}) - marqué comme faux positif`);
        }
        if (led2HasExtremeY) {
          this.logger.warn(`      🚨 LED ${outlier.to} a une valeur Y extrême (${led2.y.toFixed(3)}) - marqué comme faux positif`);
        }

        // Decision logic:
        // 1. If only LED1 is suspicious -> invalidate LED1
        // 2. If only LED2 is suspicious -> invalidate LED2
        // 3. If both are suspicious -> invalidate both
        // 4. If neither is suspicious -> use context analysis
        if (led1Suspicious && !led2Suspicious) {
          ledsToInvalidate.add(outlier.from);
        } else if (led2Suspicious && !led1Suspicious) {
          ledsToInvalidate.add(outlier.to);
        } else if (led1Suspicious && led2Suspicious) {
          ledsToInvalidate.add(outlier.from);
          ledsToInvalidate.add(outlier.to);
        } else {
          // Neither has extreme values, use context analysis
          // Check distances with previous and next LEDs to find which one breaks the pattern
          const prevDist = outlier.from > 0 ? this.distance(points[outlier.from - 1], points[outlier.from]) : NaN;
          const nextDist = outlier.to < points.length - 1 ? this.distance(points[outlier.to], points[outlier.to + 1]) : NaN;

          const prevIsNormal = !Number.isNaN(prevDist) && prevDist <= threshold;
          const nextIsNormal = !Number.isNaN(nextDist) && nextDist <= threshold;

          if (prevIsNormal && !nextIsNormal) {
            // Previous distance is OK, next is abnormal -> LED2 (to) is likely the problem
            this.logger.warn(`      🔍 Analyse contextuelle: LED ${outlier.to} casse le pattern (distance suivante anormale)`);
            ledsToInvalidate.add(outlier.to);
          } else if (!prevIsNormal && nextIsNormal) {
            // Previous distance is abnormal, next is OK -> LED1 (from) is likely the problem
            this.logger.warn(`      🔍 Analyse contextuelle: LED ${outlier.from} casse le pattern (distance précédente anormale)`);
            ledsToInvalidate.add(outlier.from);
          } else {
            // Can't determine from context, invalidate both by safety
            this.logger.warn(`      ⚠️  Analyse contextuelle non conclusive - invalidation des DEUX LEDs par sécurité`);
            ledsToInvalidate.add(outlier.from);
            ledsToInvalidate.add(outlier.to);
          }
        }
      }

      // Invalidate detected false positives by setting all coordinates to NaN
      if (ledsToInvalidate.size > 0) {
        this.logger.warn(`  ⚠️  ${ledsToInvalidate.size} LED(s) marquée(s) comme faux positifs et invalidée(s):`);
        for (const ledIndex of ledsToInvalidate) {
          this.logger.warn(`    LED ${ledIndex}: toutes les coordonnées remplacées par NaN`);
          points[ledIndex].x = NaN;
          points[ledIndex].y = NaN;
          points[ledIndex].z = NaN;
        }
      } else {
        this.logger.log('  ℹ️  Aucune LED invalidée (pas de valeurs extrêmes détectées)');
      }
    }
  }

  /**
   * Interpolate missing coordinates from adjacent LEDs using extended neighbor search
   * This method performs multiple passes until no more interpolations are possible
   */
  private interpolateMissingCoordinates(points: Point[]): void {
    let totalInterpolated = 0;
    let passCount = 0;
    const maxPasses = 10; // Prevent infinite loops
    const maxSearchDistance = 5; // Maximum distance to search for valid neighbors

    let interpolatedInPass = 0;
    do {
      passCount++;
      interpolatedInPass = 0;

      for (let i = 0; i < points.length; i++) {
        const point = points[i];

        // Try to interpolate X
        if (point.x == null || Number.isNaN(point.x)) {
          const result = this.findValidNeighbors(points, i, 'x', maxSearchDistance);
          if (result) {
            point.x = result.value;
            interpolatedInPass++;
          }
        }

        // Try to interpolate Y
        if (point.y == null || Number.isNaN(point.y)) {
          const result = this.findValidNeighbors(points, i, 'y', maxSearchDistance);
          if (result) {
            point.y = result.value;
            interpolatedInPass++;
          }
        }

        // Try to interpolate Z
        if (point.z == null || Number.isNaN(point.z)) {
          const result = this.findValidNeighbors(points, i, 'z', maxSearchDistance);
          if (result) {
            point.z = result.value;
            interpolatedInPass++;
          }
        }
      }

      totalInterpolated += interpolatedInPass;
    } while (interpolatedInPass > 0 && passCount < maxPasses);

    if (totalInterpolated === 0) {
      this.logger.log('  ✅ Aucune coordonnée à interpoler');
    } else {
      this.logger.log(`  ✅ ${totalInterpolated} coordonnée(s) interpolée(s) en ${passCount} pass(es)`);
    }
  }

  /**
   * Find valid neighbors for interpolation, searching up to maxDistance away
   * Returns interpolated value and neighbor indices, or null if not found
   */
  private findValidNeighbors(
    points: Point[],
    index: number,
    coord: 'x' | 'y' | 'z',
    maxDistance: number
  ): { value: number; prevIdx: number; nextIdx: number } | null {
    // Search for previous valid neighbor
    let prevIdx = -1;
    let prevValue = NaN;
    for (let d = 1; d <= maxDistance && index - d >= 0; d++) {
      const val = points[index - d][coord];
      if (val != null && !Number.isNaN(val)) {
        prevIdx = index - d;
        prevValue = val;
        break;
      }
    }

    // Search for next valid neighbor
    let nextIdx = -1;
    let nextValue = NaN;
    for (let d = 1; d <= maxDistance && index + d < points.length; d++) {
      const val = points[index + d][coord];
      if (val != null && !Number.isNaN(val)) {
        nextIdx = index + d;
        nextValue = val;
        break;
      }
    }

    // If both neighbors found, interpolate
    if (prevIdx !== -1 && nextIdx !== -1) {
      // Linear interpolation based on distance
      const totalDist = nextIdx - prevIdx;
      const relativePos = (index - prevIdx) / totalDist;
      const value = prevValue + (nextValue - prevValue) * relativePos;
      return { value, prevIdx, nextIdx };
    }

    return null;
  }

  /**
   * Calculate 3D Euclidean distance between two points
   */
  private distance(p1: Point, p2: Point): number {
    if (!p1 || !p2) return NaN;

    let dx = 0, dy = 0, dz = 0;
    let count = 0;

    if (p1.x != null && !Number.isNaN(p1.x) && p2.x != null && !Number.isNaN(p2.x)) {
      dx = Math.pow(p1.x - p2.x, 2);
      count++;
    }
    if (p1.y != null && !Number.isNaN(p1.y) && p2.y != null && !Number.isNaN(p2.y)) {
      dy = Math.pow(p1.y - p2.y, 2);
      count++;
    }
    if (p1.z != null && !Number.isNaN(p1.z) && p2.z != null && !Number.isNaN(p2.z)) {
      dz = Math.pow(p1.z - p2.z, 2);
      count++;
    }

    if (count === 0) return NaN;
    return Math.sqrt(dx + dy + dz);
  }

  /**
   * Format coordinate for logging
   */
  private formatCoord(value: number): string {
    if (value == null || Number.isNaN(value)) return 'NaN';
    return value.toFixed(3);
  }
}
