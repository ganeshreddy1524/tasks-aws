#!/bin/bash

# Lambda S3 Example - Manual Deployment Script
# This script deploys without SAM CLI

set -e

FUNCTION_NAME="s3-file-processor"
ROLE_NAME="lambda-s3-execution-role"
BUCKET_NAME="lambda-s3-demo-bucket-127246139738"
REGION="us-east-1"

echo "=========================================="
echo "  Lambda S3 Example Deployment"
echo "=========================================="

# Step 1: Install dependencies
echo ""
echo "Step 1: Installing dependencies..."
npm install --production

# Step 2: Create deployment package
echo ""
echo "Step 2: Creating deployment package..."
zip -r function.zip index.js node_modules/

# Step 3: Create IAM Role
echo ""
echo "Step 3: Creating IAM role..."
aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' 2>/dev/null || echo "Role may already exist, continuing..."

# Attach policies
echo "Attaching policies..."
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole 2>/dev/null || true

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess 2>/dev/null || true

# Wait for role to propagate
echo "Waiting for role to propagate..."
sleep 10

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
echo "Role ARN: $ROLE_ARN"

# Step 4: Create S3 Bucket
echo ""
echo "Step 4: Creating S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "Bucket may already exist, continuing..."

# Step 5: Create Lambda Function
echo ""
echo "Step 5: Creating Lambda function..."
aws lambda create-function \
  --function-name $FUNCTION_NAME \
  --runtime nodejs20.x \
  --handler index.handler \
  --role $ROLE_ARN \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 256 \
  --region $REGION 2>/dev/null || \
aws lambda update-function-code \
  --function-name $FUNCTION_NAME \
  --zip-file fileb://function.zip \
  --region $REGION

# Step 6: Add S3 trigger permission
echo ""
echo "Step 6: Adding S3 trigger permission..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

aws lambda add-permission \
  --function-name $FUNCTION_NAME \
  --statement-id s3-trigger \
  --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn arn:aws:s3:::$BUCKET_NAME \
  --source-account $ACCOUNT_ID \
  --region $REGION 2>/dev/null || echo "Permission may already exist, continuing..."

# Step 7: Configure S3 bucket notification
echo ""
echo "Step 7: Configuring S3 bucket notification..."
LAMBDA_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --query 'Configuration.FunctionArn' --output text --region $REGION)

cat > /tmp/notification.json << EOF
{
  "LambdaFunctionConfigurations": [
    {
      "LambdaFunctionArn": "$LAMBDA_ARN",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {
        "Key": {
          "FilterRules": [
            {
              "Name": "prefix",
              "Value": "uploads/"
            }
          ]
        }
      }
    }
  ]
}
EOF

aws s3api put-bucket-notification-configuration \
  --bucket $BUCKET_NAME \
  --notification-configuration file:///tmp/notification.json

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Bucket: $BUCKET_NAME"
echo "Lambda: $FUNCTION_NAME"
echo ""
echo "Test by uploading a file:"
echo "  aws s3 cp test.txt s3://$BUCKET_NAME/uploads/test.txt"
echo ""
echo "Check logs:"
echo "  aws logs tail /aws/lambda/$FUNCTION_NAME --follow"
echo ""
