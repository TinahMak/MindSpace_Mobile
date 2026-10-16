import { File, UploadType } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { ApiError, getAuthToken } from './api';
import { API_URL } from './config';

const MAX_SIDE = 1280;

// Phone photos are often 3 to 8 MB. Shrinking to at most 1280 px and
// JPEG 70% gives ~150 to 400 KB: faster upload and faster AI reply.
export async function preparePhoto(asset) {
  try {
    const ctx = ImageManipulator.manipulate(asset.uri);
    const w = asset.width || 0;
    const h = asset.height || 0;
    if (w > MAX_SIDE || h > MAX_SIDE) ctx.resize(w >= h ? { width: MAX_SIDE } : { height: MAX_SIDE });
    const img = await ctx.renderAsync();
    const out = await img.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
    return out.uri;
  } catch {
    return asset.uri;
  }
}

/**
 * Authenticated multipart upload using the phone's native uploader
 * (expo-file-system's File.upload, the current API in this Expo version).
 * Resolves with the parsed JSON body; throws ApiError with a readable message.
 */
export async function uploadFile(path, fileUri, { fieldName = 'file', mimeType, parameters = {}, timeout = 120000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  let res;
  try {
    const file = new File(fileUri);
    res = await file.upload(`${API_URL}${path}`, {
      httpMethod: 'POST',
      uploadType: UploadType.MULTIPART,
      fieldName,
      mimeType,
      parameters,
      headers: { Authorization: `Token ${getAuthToken()}`, Accept: 'application/json' },
      sessionType: 'foreground',
      signal: controller.signal,
    });
  } catch (e) {
    if (controller.signal.aborted) {
      throw new ApiError('The upload took too long. Check your connection and try again.', 0);
    }
    // Keep the real reason visible so problems can be diagnosed.
    const why = e?.message ? ` (${String(e.message).slice(0, 140)})` : '';
    throw new ApiError(`Couldn't upload the file${why}.`, 0);
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = JSON.parse(res.body);
  } catch {}
  if (res.status < 200 || res.status >= 300) {
    throw new ApiError(data?.detail || `Upload failed (server said ${res.status}).`, res.status);
  }
  return data;
}

// Chat photos use the same uploader.
export function uploadChatPhoto(conversationId, photoUri, content) {
  return uploadFile(`/chat/conversations/${conversationId}/messages/`, photoUri, {
    fieldName: 'image',
    mimeType: 'image/jpeg',
    parameters: { content },
    timeout: 90000,
  });
}
