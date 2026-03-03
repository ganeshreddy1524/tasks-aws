import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TaskFile {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  taskId: number | null;
}

export interface FilesResponse {
  files: TaskFile[];
  taskId: number | null;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
  taskId: number | null;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = environment.fileApiUrl;

  constructor(private http: HttpClient) {}

  getTaskFiles(taskId: number): Observable<FilesResponse> {
    return this.http.get<FilesResponse>(`${this.apiUrl}/files?taskId=${taskId}`);
  }

  uploadTaskFile(taskId: number, file: File): Observable<any> {
    return this.http.post<UploadUrlResponse>(`${this.apiUrl}/upload`, {
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      taskId: taskId
    }).pipe(
      switchMap(response => {
        return from(fetch(response.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/octet-stream'
          }
        }));
      })
    );
  }

  deleteTaskFile(taskId: number, fileName: string): Observable<any> {
    return this.http.request('DELETE', `${this.apiUrl}/files`, {
      body: { fileName, taskId }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
