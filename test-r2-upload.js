import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './src/config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic imports - will be loaded in the function
let fetch, FormData;

/**
 * Test R2 file upload
 */
const testR2Upload = async () => {
  console.log('📤 Testing R2 File Upload...\n');

  // Load dynamic imports
  try {
    const nodeFetch = await import('node-fetch');
    fetch = nodeFetch.default;
    const formDataModule = await import('form-data');
    FormData = formDataModule.default;
  } catch (e) {
    // Fallback to built-in (Node 18+)
    fetch = globalThis.fetch;
    FormData = globalThis.FormData;
  }

  // Check if server is running
  const baseUrl = process.env.API_URL || `http://localhost:${config.port || 8000}`;
  const uploadUrl = `${baseUrl}/v1/upload`;

  console.log(`📍 Upload endpoint: ${uploadUrl}\n`);

  // Create a test file (markdown)
  const testContent = `# R2 Upload Test

This is a test file uploaded to Cloudflare R2 storage.

**Uploaded at:** ${new Date().toISOString()}
**Purpose:** Testing R2 storage connection and file upload functionality

## Test Details
- File Type: Markdown
- Storage: Cloudflare R2
- Endpoint: ${uploadUrl}
`;

  const testFileName = `test-upload-${Date.now()}.md`;
  const testFilePath = path.join(__dirname, testFileName);

  try {
    // Write test file
    fs.writeFileSync(testFilePath, testContent);
    console.log(`✅ Created test file: ${testFileName}\n`);

    // Read file as buffer
    const fileBuffer = fs.readFileSync(testFilePath);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: testFileName,
      contentType: 'text/markdown',
    });

    console.log('📤 Uploading file to R2...\n');

    // Optional: Add auth token if needed
    const token = process.env.AUTH_TOKEN;
    let headers = {};
    
    // Get headers from FormData if it has getHeaders method
    if (typeof formData.getHeaders === 'function') {
      headers = { ...formData.getHeaders() };
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 Using authentication token\n');
    } else {
      console.log('ℹ️  No auth token provided (upload route may require auth)\n');
    }

    // Upload file
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: formData,
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log('✅ Upload Successful!\n');
      console.log('📋 Response:');
      console.log(JSON.stringify(responseData, null, 2));
      console.log('\n🔗 File URL:', responseData.url);
      console.log('📁 File Name:', responseData.fileName);
      console.log('\n💡 You can access the file at:', responseData.url);
      console.log('\n✅ R2 Storage is working correctly!');
    } else {
      console.error('❌ Upload Failed!\n');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(responseData, null, 2));

      if (response.status === 401) {
        console.error('\n💡 Authentication required. Set AUTH_TOKEN environment variable.');
        console.error('   Example: AUTH_TOKEN=your_token npm run test:r2-upload');
      } else if (response.status === 500) {
        console.error('\n💡 Server error. Check:');
        console.error('   1. R2 configuration in .env');
        console.error('   2. R2 bucket exists');
        console.error('   3. Server logs for detailed error');
      } else if (response.status === 400) {
        console.error('\n💡 Bad request. Check:');
        console.error('   1. File format is correct');
        console.error('   2. File size is under 200MB');
      }
    }

    // Cleanup test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('\n🧹 Cleaned up test file');
    }

  } catch (error) {
    console.error('\n❌ Error during upload test:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Server is not running. Start your server with: npm run dev');
    } else if (error.message.includes('R2') || error.message.includes('S3')) {
      console.error('\n💡 R2 storage error. Check:');
      console.error('   1. R2 credentials in .env');
      console.error('   2. R2 bucket exists');
      console.error('   3. Network connectivity');
      console.error('   4. R2 endpoint URL is correct');
    } else {
      console.error('\n💡 Error details:', error);
    }

    // Cleanup test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }

    process.exit(1);
  }
};

// Run test
testR2Upload()
  .then(() => {
    console.log('\n✨ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
