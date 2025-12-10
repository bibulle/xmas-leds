import {
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  StreamableFile,
  BadRequestException,
  InternalServerErrorException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import { readdir, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import * as archiver from 'archiver';
import * as unzipper from 'unzipper';

@Controller('admin')
export class AdminController {
  private readonly dataPath = join(process.cwd(), 'data');

  @Get('export')
  async exportData(@Res() res: Response) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `xmas-leds-backup-${timestamp}.zip`;

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      archive.on('error', (err) => {
        console.error('Archive error:', err);
        throw new InternalServerErrorException('Error creating archive');
      });

      archive.pipe(res);

      // Add xmas-tree-leds.csv (main LED positions file)
      const ledsFile = join(this.dataPath, 'xmas-tree-leds.csv');
      if (existsSync(ledsFile)) {
        archive.file(ledsFile, { name: 'xmas-tree-leds.csv' });
      }

      // Add program.csv
      const programFile = join(this.dataPath, 'program.csv');
      if (existsSync(programFile)) {
        archive.file(programFile, { name: 'program.csv' });
      }

      // Add animations directory (all .csv files)
      const animationsDir = join(this.dataPath, 'animations');
      if (existsSync(animationsDir)) {
        archive.directory(animationsDir, 'animations');
      }

      // Add images directory (all .json files)
      const imagesDir = join(this.dataPath, 'images');
      if (existsSync(imagesDir)) {
        archive.directory(imagesDir, 'images');
      }

      // Add arbre directory (captured images)
      const arbreDir = join(this.dataPath, 'arbre');
      if (existsSync(arbreDir)) {
        archive.directory(arbreDir, 'arbre');
      }

      await archive.finalize();
    } catch (error) {
      console.error('Export error:', error);
      if (!res.headersSent) {
        throw new InternalServerErrorException('Error exporting data');
      }
    }
  }

  @Post('upload-file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      let targetPath: string;
      const filename = file.originalname;

      // Determine target path based on file type
      switch (type) {
        case 'led-positions':
          if (!filename.endsWith('.csv')) {
            throw new BadRequestException('LED positions file must be a CSV file');
          }
          targetPath = join(this.dataPath, 'xmas-tree-leds.csv');
          break;

        case 'program':
          if (!filename.endsWith('.csv')) {
            throw new BadRequestException('Program file must be a CSV file');
          }
          targetPath = join(this.dataPath, 'program.csv');
          break;

        case 'animation':
          if (!filename.endsWith('.csv')) {
            throw new BadRequestException('Animation file must be a CSV file');
          }
          targetPath = join(this.dataPath, 'animations', filename);
          await mkdir(join(this.dataPath, 'animations'), { recursive: true });
          break;

        case 'image':
          if (!filename.endsWith('.json')) {
            throw new BadRequestException('Image file must be a JSON file');
          }
          targetPath = join(this.dataPath, 'images', filename);
          await mkdir(join(this.dataPath, 'images'), { recursive: true });
          break;

        case 'tree-image':
          if (!filename.match(/\.(jpg|jpeg|png)$/i)) {
            throw new BadRequestException('Tree image must be JPG or PNG');
          }
          targetPath = join(this.dataPath, 'arbre', filename);
          await mkdir(join(this.dataPath, 'arbre'), { recursive: true });
          break;

        default:
          throw new BadRequestException(`Unknown file type: ${type}`);
      }

      // Copy uploaded file to target location
      await new Promise<void>((resolve, reject) => {
        const readStream = createReadStream(file.path);
        const writeStream = createWriteStream(targetPath);

        readStream.pipe(writeStream);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
        readStream.on('error', (err) => reject(err));
      });

      return {
        success: true,
        message: `File uploaded successfully: ${filename}`,
        path: targetPath.replace(this.dataPath, ''),
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new InternalServerErrorException(
        `Error uploading file: ${error.message}`
      );
    }
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importData(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.originalname.endsWith('.zip')) {
      throw new BadRequestException('File must be a ZIP archive');
    }

    try {
      // Create a temporary directory for extraction
      const tempDir = join(this.dataPath, '.temp-import');
      if (existsSync(tempDir)) {
        await rm(tempDir, { recursive: true, force: true });
      }
      await mkdir(tempDir, { recursive: true });

      // Extract ZIP file
      await new Promise<void>((resolve, reject) => {
        const stream = createReadStream(file.path)
          .pipe(unzipper.Extract({ path: tempDir }));

        stream.on('close', () => resolve());
        stream.on('error', (err) => reject(err));
      });

      // Validate and copy extracted files to data directory
      const extractedFiles = await this.getFilesRecursively(tempDir);

      for (const filePath of extractedFiles) {
        const relativePath = filePath.replace(tempDir + '/', '');
        const targetPath = join(this.dataPath, relativePath);

        // Ensure target directory exists
        const targetDir = join(targetPath, '..');
        await mkdir(targetDir, { recursive: true });

        // Copy file
        await new Promise<void>((resolve, reject) => {
          const readStream = createReadStream(filePath);
          const writeStream = createWriteStream(targetPath);

          readStream.pipe(writeStream);
          writeStream.on('finish', () => resolve());
          writeStream.on('error', (err) => reject(err));
          readStream.on('error', (err) => reject(err));
        });
      }

      // Clean up temp directory
      await rm(tempDir, { recursive: true, force: true });

      return {
        success: true,
        message: 'Data imported successfully',
        filesImported: extractedFiles.length,
      };
    } catch (error) {
      console.error('Import error:', error);
      throw new InternalServerErrorException(
        `Error importing data: ${error.message}`
      );
    }
  }

  private async getFilesRecursively(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await this.getFilesRecursively(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }
}
