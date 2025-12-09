import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatListModule,
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent {
  uploading = false;
  downloading = false;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  downloadAllData() {
    this.downloading = true;
    this.http
      .get('/api/admin/export', {
        responseType: 'blob',
        observe: 'response',
      })
      .subscribe({
        next: (response) => {
          const blob = response.body;
          if (blob) {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from Content-Disposition header if available
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'xmas-leds-data.zip';
            if (contentDisposition) {
              const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
              if (matches?.[1]) {
                filename = matches[1].replace(/['"]/g, '');
              }
            }

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            this.snackBar.open('✓ Données téléchargées avec succès', 'OK', {
              duration: 3000,
            });
          }
          this.downloading = false;
        },
        error: (error) => {
          console.error('Error downloading data:', error);
          this.snackBar.open('✗ Erreur lors du téléchargement', 'OK', {
            duration: 5000,
          });
          this.downloading = false;
        },
      });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    if (!file.name.endsWith('.zip')) {
      this.snackBar.open('✗ Veuillez sélectionner un fichier ZIP', 'OK', {
        duration: 5000,
      });
      return;
    }

    this.uploadData(file);
  }

  uploadData(file: File) {
    this.uploading = true;
    const formData = new FormData();
    formData.append('file', file);

    this.http.post('/api/admin/import', formData).subscribe({
      next: () => {
        this.snackBar.open('✓ Données importées avec succès', 'OK', {
          duration: 3000,
        });
        this.uploading = false;
      },
      error: (error) => {
        console.error('Error uploading data:', error);
        this.snackBar.open(
          `✗ Erreur lors de l'import: ${error.error?.message || error.message}`,
          'OK',
          { duration: 5000 }
        );
        this.uploading = false;
      },
    });
  }
}
