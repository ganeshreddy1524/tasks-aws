# Task Manager UI

Angular 17 frontend for the Task Management application with file attachment support.

## Features

- **Task Management**: Create, edit, delete, and filter tasks
- **Status Filtering**: Filter tasks by PENDING, IN_PROGRESS, COMPLETED
- **Search**: Search tasks by title or description
- **File Attachments**: Attach files to individual tasks
  - Expandable file section in each task card
  - Upload files directly to tasks
  - View and delete attached files

## Project Structure

```
task-ui/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── task-list/       # Main task list with file attachments
│   │   │   └── task-form/       # Create/edit task form
│   │   ├── models/
│   │   │   └── task.model.ts    # Task interface
│   │   └── services/
│   │       ├── task.service.ts  # Task API service
│   │       └── file.service.ts  # File API service
│   └── environments/
│       ├── environment.ts       # Development config
│       └── environment.prod.ts  # Production config
└── package.json
```

## Configuration

Environment variables in `src/environments/`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://44.195.1.174:8080',           // Task API (EC2)
  fileApiUrl: 'https://hk327mcsu7.execute-api.us-east-1.amazonaws.com/prod'  // File API (Lambda)
};
```

## Development

```bash
# Install dependencies
npm install

# Start development server
ng serve

# Navigate to http://localhost:4200/
```

## Build & Deploy

```bash
# Build for production
npm run build

# Deploy to S3
aws s3 sync dist/task-ui/browser s3://task-ui-app-127246139738 --delete
```

## Live URL

http://task-ui-app-127246139738.s3-website-us-east-1.amazonaws.com

## Services

### TaskService

Communicates with the Spring Boot Task API on EC2.

| Method | Description |
|--------|-------------|
| `getAllTasks()` | Get all tasks |
| `getTaskById(id)` | Get task by ID |
| `getTasksByStatus(status)` | Filter by status |
| `searchTasks(query)` | Search tasks |
| `createTask(task)` | Create new task |
| `updateTask(id, task)` | Update task |
| `deleteTask(id)` | Delete task |

### FileService

Communicates with the Lambda File API for file attachments.

| Method | Description |
|--------|-------------|
| `getTaskFiles(taskId)` | Get files for a task |
| `uploadTaskFile(taskId, file)` | Upload file to task |
| `deleteTaskFile(taskId, fileName)` | Delete task file |
| `formatFileSize(bytes)` | Format bytes to human readable |

## Technologies

- Angular 17
- TypeScript
- RxJS
- AWS S3 (hosting)
