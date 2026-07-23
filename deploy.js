import Client from 'ssh2-sftp-client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sftp = new Client();

const config = {
  host: '145.79.14.197',
  port: 65002,
  username: 'u399751503',
  password: '58XHJ/5jk}=Z'
};

async function deploy() {
  try {
    console.log('Connecting to Hostinger...');
    await sftp.connect(config);
    console.log('Connected!');
    
    let baseHtmlPath = '';
    
    // Try to find the correct public_html path
    try {
        const domains = await sftp.list('/home/u399751503/domains');
        const mainDomain = domains.find(d => d.name === 'workwithtrisha.com');
        if (mainDomain) {
            baseHtmlPath = '/home/u399751503/domains/workwithtrisha.com/public_html';
        } else {
            baseHtmlPath = '/home/u399751503/public_html';
        }
    } catch (e) {
        baseHtmlPath = '/home/u399751503/public_html';
    }
    
    const remotePath = `${baseHtmlPath}/budget-tracker`;
    const localPath = path.join(__dirname, 'dist');
    
    console.log(`Uploading ${localPath} to ${remotePath}...`);
    
    const exists = await sftp.exists(remotePath);
    if (!exists) {
       await sftp.mkdir(remotePath, true);
    }
    
    await sftp.uploadDir(localPath, remotePath);
    console.log('Successfully deployed!');

  } catch (err) {
    console.error('Deployment error:', err);
  } finally {
    await sftp.end();
  }
}

deploy();
