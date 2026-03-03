import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { FileService, TaskFile } from '../../services/file.service';
import { Task, TaskStatus } from '../../models/task.model';
import { TaskFormComponent } from '../task-form/task-form.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskFormComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css'
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  selectedTask: Task | null = null;
  showForm = false;
  isEditing = false;
  searchQuery = '';
  statusFilter: TaskStatus | '' = '';
  loading = false;
  error = '';

  // File management
  taskFiles: Map<number, TaskFile[]> = new Map();
  expandedTasks: Set<number> = new Set();
  uploadingFiles: Set<number> = new Set();

  constructor(
    private taskService: TaskService,
    private fileService: FileService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.error = '';
    this.taskService.getAllTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load tasks. Please try again.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    let result = [...this.tasks];

    if (this.statusFilter) {
      result = result.filter(task => task.status === this.statusFilter);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(task =>
        task.title.toLowerCase().includes(query) ||
        (task.description?.toLowerCase().includes(query))
      );
    }

    this.filteredTasks = result;
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  openCreateForm(): void {
    this.selectedTask = null;
    this.isEditing = false;
    this.showForm = true;
  }

  openEditForm(task: Task): void {
    this.selectedTask = { ...task };
    this.isEditing = true;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.selectedTask = null;
    this.isEditing = false;
  }

  onTaskSaved(task: Task): void {
    if (this.isEditing && task.id) {
      const index = this.tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        this.tasks[index] = task;
      }
    } else {
      this.tasks.unshift(task);
    }
    this.applyFilters();
    this.closeForm();
  }

  deleteTask(task: Task): void {
    if (!task.id) return;

    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      this.taskService.deleteTask(task.id).subscribe({
        next: () => {
          this.tasks = this.tasks.filter(t => t.id !== task.id);
          this.applyFilters();
        },
        error: (err) => {
          this.error = 'Failed to delete task.';
          console.error(err);
        }
      });
    }
  }

  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'IN_PROGRESS': return 'status-progress';
      case 'COMPLETED': return 'status-completed';
      default: return '';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  }

  // File management methods
  toggleFiles(task: Task): void {
    if (!task.id) return;

    if (this.expandedTasks.has(task.id)) {
      this.expandedTasks.delete(task.id);
    } else {
      this.expandedTasks.add(task.id);
      this.loadTaskFiles(task.id);
    }
  }

  isExpanded(task: Task): boolean {
    return task.id ? this.expandedTasks.has(task.id) : false;
  }

  loadTaskFiles(taskId: number): void {
    this.fileService.getTaskFiles(taskId).subscribe({
      next: (response) => {
        this.taskFiles.set(taskId, response.files);
      },
      error: (err) => {
        console.error('Failed to load files for task', taskId, err);
        this.taskFiles.set(taskId, []);
      }
    });
  }

  getTaskFiles(task: Task): TaskFile[] {
    return task.id ? (this.taskFiles.get(task.id) || []) : [];
  }

  getFileCount(task: Task): number {
    return this.getTaskFiles(task).length;
  }

  onFileSelected(event: Event, task: Task): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || !task.id) return;

    const file = input.files[0];
    this.uploadFile(task.id, file);
    input.value = '';
  }

  uploadFile(taskId: number, file: File): void {
    this.uploadingFiles.add(taskId);

    this.fileService.uploadTaskFile(taskId, file).subscribe({
      next: () => {
        this.uploadingFiles.delete(taskId);
        this.loadTaskFiles(taskId);
      },
      error: (err) => {
        console.error('Failed to upload file', err);
        this.uploadingFiles.delete(taskId);
        this.error = 'Failed to upload file. Please try again.';
      }
    });
  }

  isUploading(task: Task): boolean {
    return task.id ? this.uploadingFiles.has(task.id) : false;
  }

  deleteFile(task: Task, file: TaskFile): void {
    if (!task.id) return;

    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      this.fileService.deleteTaskFile(task.id, file.name).subscribe({
        next: () => {
          this.loadTaskFiles(task.id!);
        },
        error: (err) => {
          console.error('Failed to delete file', err);
          this.error = 'Failed to delete file. Please try again.';
        }
      });
    }
  }

  formatFileSize(bytes: number): string {
    return this.fileService.formatFileSize(bytes);
  }
}
