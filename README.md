# Task Management Application - AWS Deployment

A full-stack Task Management application deployed on AWS infrastructure with serverless file attachments.

## Architecture

- **Frontend**: Angular 17 hosted on Amazon S3
- **Backend**: Spring Boot 3.2 REST API on Amazon EC2
- **Database**: MySQL 8.0 on Amazon RDS
- **File Storage**: Serverless file management using AWS Lambda, S3, and API Gateway

## Project Structure

```
tasks-aws/
├── task-api/                    # Spring Boot REST API
│   ├── src/main/java/
│   │   └── com/example/taskapi/
│   │       ├── controller/      # REST Controllers
│   │       ├── entity/          # JPA Entities
│   │       ├── repository/      # Data Repositories
│   │       ├── service/         # Business Logic
│   │       └── config/          # CORS Configuration
│   └── pom.xml
├── task-ui/                     # Angular Frontend
│   ├── src/app/
│   │   ├── components/          # UI Components
│   │   ├── models/              # TypeScript Models
│   │   └── services/            # HTTP Services (TaskService, FileService)
│   └── package.json
├── serverless-file-manager/     # Serverless File Management
│   ├── api/                     # API Lambda (REST endpoints)
│   ├── ui/                      # Standalone File Manager UI
│   └── index.js                 # S3 Trigger Lambda
├── AWS_SETUP_DOCUMENTATION.md   # Complete AWS setup guide
├── userdata.sh                  # EC2 bootstrap script
└── README.md
```

## Live URLs

| Component | URL |
|-----------|-----|
| Task Manager UI | http://task-ui-app-127246139738.s3-website-us-east-1.amazonaws.com |
| Task API | http://44.195.1.174:8080/api/tasks |
| File API | https://hk327mcsu7.execute-api.us-east-1.amazonaws.com/prod |
| File Manager UI | http://lambda-s3-demo-ui-127246139738.s3-website-us-east-1.amazonaws.com |

## API Endpoints

### Task API (Spring Boot - EC2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/tasks/{id}` | Get task by ID |
| GET | `/api/tasks?status={status}` | Filter by status |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |

### File API (Lambda - Serverless)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/files?taskId={id}` | List files for a task |
| POST | `/upload` | Get presigned URL for upload |
| DELETE | `/files` | Delete a file |
| GET | `/logs` | Get Lambda processing logs |

## Features

- **Task Management**: Create, update, delete, and filter tasks by status
- **File Attachments**: Attach files to individual tasks
  - Files stored in S3 under `tasks/{taskId}/` folder structure
  - Presigned URLs for secure direct-to-S3 uploads
  - Expandable file section in each task card

## Local Development

### Backend (Spring Boot)

```bash
cd task-api
mvn clean package
java -jar target/task-api-1.0.0.jar
```

### Frontend (Angular)

```bash
cd task-ui
npm install
ng serve
```

## Deployment

### Deploy Backend to EC2

```bash
cd task-api
mvn clean package -DskipTests
scp -i springboot-key.pem target/task-api-1.0.0.jar ec2-user@44.195.1.174:~/
```

### Deploy Frontend to S3

```bash
cd task-ui
npm run build
aws s3 sync dist/task-ui/browser s3://task-ui-app-127246139738 --delete
```

## AWS Resources

See [AWS_SETUP_DOCUMENTATION.md](./AWS_SETUP_DOCUMENTATION.md) for complete infrastructure details.

## Technologies

- Java 17
- Spring Boot 3.2
- Angular 17
- MySQL 8.0
- Node.js 20.x (Lambda)
- AWS EC2, RDS, S3, Lambda, API Gateway, CloudWatch
