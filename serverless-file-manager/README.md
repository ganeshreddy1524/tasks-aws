# Serverless File Manager

A serverless file management application using AWS Lambda, S3, and API Gateway with a web UI. Supports standalone file uploads and task-specific file attachments.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Web UI (S3 Static Website)                          │   │
│  │  - Upload files (drag & drop)                        │   │
│  │  - View uploaded files                               │   │
│  │  - Delete files                                      │   │
│  │  - View Lambda processing logs                       │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────┴──────────────────────────────┐   │
│  │  Task Manager UI (integrated)                        │   │
│  │  - Attach files to tasks                             │   │
│  │  - View/delete task files                            │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         │         API Gateway             │
         │  GET  /files  - List files      │
         │  POST /upload - Get upload URL  │
         │  DELETE /files - Delete file    │
         │  GET  /logs   - Get Lambda logs │
         └────────────────┬────────────────┘
                          │
         ┌────────────────┴────────────────┐
         │      s3-demo-api (Lambda)       │
         │  - Generate presigned URLs      │
         │  - List/delete S3 objects       │
         │  - Fetch CloudWatch logs        │
         │  - Support taskId parameter     │
         └────────────────┬────────────────┘
                          │
    ┌─────────────────────┴─────────────────────┐
    │                                           │
    ▼                                           ▼
┌──────────────┐                    ┌──────────────────────┐
│  S3 Bucket   │───── trigger ─────▶│ s3-file-processor    │
│  uploads/    │                    │ (Lambda)             │
│  tasks/      │                    │  - Log file info     │
│    ├── 1/    │                    │  - Process uploads   │
│    ├── 2/    │                    └──────────────────────┘
│    └── ...   │
└──────────────┘
```

## Project Structure

```
serverless-file-manager/
├── index.js           # S3 trigger Lambda (file processor)
├── package.json       # File processor dependencies
├── api/
│   ├── index.js       # API Lambda (REST endpoints)
│   └── package.json   # API dependencies
├── ui/
│   └── index.html     # Web interface
├── template.yaml      # SAM template
├── deploy.sh          # Deployment script
└── README.md
```

## Deployed Resources

| Resource | Name | URL |
|----------|------|-----|
| **Web UI** | lambda-s3-demo-ui-127246139738 | http://lambda-s3-demo-ui-127246139738.s3-website-us-east-1.amazonaws.com |
| **API** | s3-demo-api | https://hk327mcsu7.execute-api.us-east-1.amazonaws.com/prod |
| **Data Bucket** | lambda-s3-demo-bucket-127246139738 | - |
| **File Processor** | s3-file-processor | Triggered by S3 uploads |

## Features

- **Drag & Drop Upload**: Upload files by dragging them to the upload zone
- **File Listing**: View all uploaded files with size and date
- **File Deletion**: Delete files with one click
- **Real-time Logs**: View Lambda processing logs in real-time
- **Presigned URLs**: Secure direct-to-S3 uploads
- **Task Integration**: Attach files to specific tasks from the Task Manager

## S3 Folder Structure

```
lambda-s3-demo-bucket-127246139738/
├── uploads/           # Standalone file uploads
└── tasks/             # Task-specific files
    ├── 1/
    │   ├── document.pdf
    │   └── image.png
    ├── 2/
    │   └── report.xlsx
    └── ...
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /files | List all files in uploads/ |
| GET | /files?taskId=123 | List files for a specific task |
| POST | /upload | Get presigned URL for upload |
| DELETE | /files | Delete a file |
| GET | /logs | Get recent Lambda logs |

### Request/Response Examples

**List task files:**
```bash
GET /files?taskId=123
```

**Upload to task:**
```json
POST /upload
{
  "fileName": "document.pdf",
  "contentType": "application/pdf",
  "taskId": 123
}
```

**Delete task file:**
```json
DELETE /files
{
  "fileName": "document.pdf",
  "taskId": 123
}
```

## Cleanup

```bash
# Delete S3 objects
aws s3 rm s3://lambda-s3-demo-bucket-127246139738 --recursive
aws s3 rm s3://lambda-s3-demo-ui-127246139738 --recursive

# Delete S3 buckets
aws s3 rb s3://lambda-s3-demo-bucket-127246139738
aws s3 rb s3://lambda-s3-demo-ui-127246139738

# Delete Lambda functions
aws lambda delete-function --function-name s3-file-processor
aws lambda delete-function --function-name s3-demo-api

# Delete API Gateway
aws apigateway delete-rest-api --rest-api-id hk327mcsu7

# Delete IAM role
aws iam detach-role-policy --role-name lambda-s3-execution-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam detach-role-policy --role-name lambda-s3-execution-role --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam detach-role-policy --role-name lambda-s3-execution-role --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsReadOnlyAccess
aws iam delete-role --role-name lambda-s3-execution-role
```
