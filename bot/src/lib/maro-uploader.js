import axios from 'axios'
import FormData from 'form-data'

const termaiKey = 'AIzaBj7z2z3xBjsk'
const termaiDomain = 'https://c.termai.cc'

async function uploadToTermai(buffer, filename = 'image.jpg') {
  const form = new FormData()
  form.append('file', buffer, { filename })

  const response = await axios.post(`${termaiDomain}/api/upload?key=${termaiKey}`, form, {
    headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' },
    timeout: 60000
  })

  if (response.data?.status && response.data?.path) {
    return response.data.path
  }

  throw new Error('Termai upload failed')
}

async function uploadToPixhost(buffer, filename = 'image.jpg') {
  const form = new FormData()
  form.append('img', buffer, filename)
  form.append('content_type', '0')
  
  const res = await axios.post('https://api.pixhost.to/images', form, {
    headers: { ...form.getHeaders() },
    timeout: 30000
  })
  
  if (res.data?.show_url) {
    return res.data.show_url
  }
  
  throw new Error('Pixhost upload failed')
}

async function uploadToCatboxReal(buffer, filename = 'image.jpg') {
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('fileToUpload', buffer, filename)

  const res = await axios.post('https://catbox.moe/user/api.php', form, {
    headers: { ...form.getHeaders() },
    timeout: 30000
  })

  if (res.data && res.data.startsWith('http')) {
    return res.data.trim()
  }

  throw new Error('Catbox upload failed')
}

async function uploadToUguuReal(buffer, filename = 'image.jpg') {
  const form = new FormData()
  form.append('files[]', buffer, filename)

  const res = await axios.post('https://uguu.se/upload.php', form, {
    headers: { ...form.getHeaders(), 'accept': '*/*' },
    timeout: 30000
  })

  if (res.data?.files?.[0]?.url) {
    return res.data.files[0].url
  }

  throw new Error('Uguu upload failed')
}

async function uploadToTmpFilesReal(buffer, filename = 'image.jpg') {
  const form = new FormData()
  form.append('file', buffer, filename)

  const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
    headers: { ...form.getHeaders() },
    timeout: 30000
  })

  if (res.data?.data?.url) {
    return res.data.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/')
  }

  throw new Error('TmpFiles upload failed')
}

// الدوال الأساسية - تستخدم Pixhost (الأسرع والأسهل)
export const uploadImage = uploadToPixhost
export const uploadToTelegraph = uploadToPixhost

// دوال منفصلة لكل خدمة
export { 
  uploadToPixhost, 
  uploadToCatboxReal as uploadToCatbox, 
  uploadToUguuReal as uploadToUguu, 
  uploadToTmpFilesReal as uploadToTmpfiles,
  uploadToTermai as uploadToTermai,
  uploadToTermai as uploadTo0x0
}

import fs from 'fs';
import path from 'path';
import { ImageUploadService } from 'node-upload-images';
import config from '../../config.js';

import { updateAssetAndSave } from './maro-asset-manager.js';

export async function updateAssetUrl(assetKey, buffer, filename = 'image.jpg') {
  let localPath = config.assets?.[assetKey];

  if (!localPath || localPath.startsWith('http')) {
    let folder = 'image';
    if (filename.endsWith('.mp4')) folder = 'video';
    else if (filename.endsWith('.mp3')) folder = 'audio';

    localPath = `./assets/${folder}/${filename}`;

    if (!config.assets) config.assets = {};
    config.assets[assetKey] = localPath;

    const configPath = path.join(process.cwd(), 'config.js');
    let configContent = fs.readFileSync(configPath, 'utf8');

    const regex = new RegExp(`("${assetKey}"\\s*:\\s*)"([^"]+)"`);
    if (regex.test(configContent)) {
      configContent = configContent.replace(regex, `$1"${localPath}"`);
    } else {
      const assetsBlockRegex = /(assets\s*:\s*\{)([^}]*)(\})/;
      if (assetsBlockRegex.test(configContent)) {
        configContent = configContent.replace(assetsBlockRegex, (match, p1, p2, p3) => {
          let inner = p2.trim();
          if (inner.endsWith(',')) inner = inner.slice(0, -1);
          if (inner.length > 0) return `${p1}\n    ${inner},\n    "${assetKey}": "${localPath}"\n  ${p3}`;
          return `${p1}\n    "${assetKey}": "${localPath}"\n  ${p3}`;
        });
      }
    }
    fs.writeFileSync(configPath, configContent, 'utf8');
  }

  const fullPath = path.resolve(process.cwd(), localPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  updateAssetAndSave(assetKey, buffer, localPath);

  return localPath;
}