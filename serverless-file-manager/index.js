const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({});

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  // Get the S3 event details
  const record = event.Records[0];
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  const size = record.s3.object.size;
  const eventName = record.eventName;

  console.log(`Event: ${eventName}`);
  console.log(`Bucket: ${bucket}`);
  console.log(`Key: ${key}`);
  console.log(`Size: ${size} bytes`);

  try {
    // Example: Read the uploaded file
    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    const response = await s3Client.send(getCommand);
    const contentType = response.ContentType;
    console.log(`Content-Type: ${contentType}`);

    // Example: If it's a text file, read and log content
    if (contentType && contentType.startsWith('text/')) {
      const body = await response.Body.transformToString();
      console.log(`File content (first 500 chars): ${body.substring(0, 500)}`);
    }

    // Example: Copy file to a processed folder
    const processedKey = `processed/${key}`;
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: processedKey,
      Body: response.Body,
      ContentType: contentType,
      Metadata: {
        'processed-at': new Date().toISOString(),
        'original-key': key
      }
    });

    // Uncomment to enable copy:
    // await s3Client.send(putCommand);
    // console.log(`File copied to: ${processedKey}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'File processed successfully',
        bucket: bucket,
        key: key,
        size: size
      })
    };

  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
};
