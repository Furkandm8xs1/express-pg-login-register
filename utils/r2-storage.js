// utils/r2-storage.js
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// .env kontrolü
if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.warn('⚠️  Cloudflare R2 kimlik bilgileri eksik! .env dosyasını kontrol edin.');
}

// Cloudflare R2 S3 istemcisini oluştur
const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    }
});

/**
 * Dosyayı Cloudflare R2'ye yükle
 * @param {string} key - R2'deki dosya yolu (örn: receipts/user1/123-receipt.jpg)
 * @param {Buffer} body - Dosya içeriği
 * @param {string} contentType - MIME tipi (örn: image/jpeg)
 * @returns {Promise<string>} - Dosyanın public URL'si
 */
async function uploadToR2(key, body, contentType) {
    try {
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: contentType,
        });

        await s3Client.send(command);

        // Public URL'yi oluştur (Custom domain kullanıyorsan bunu güncelle)
        const publicUrl = `${process.env.R2_PUBLIC_URL || `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`}/${key}`;

        return publicUrl;
    } catch (error) {
        console.error('R2 upload hatası:', error);
        throw new Error('Dosya R2\'ye yüklenemedi: ' + error.message);
    }
}

/**
 * R2'den dosyayı sil
 * @param {string} key - Silinecek dosyanın yolu
 */
async function deleteFromR2(key) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        });

        await s3Client.send(command);
        console.log(`✅ Dosya R2'den silindi: ${key}`);
    } catch (error) {
        console.error('R2 delete hatası:', error);
        throw new Error('Dosya R2\'den silinemedi: ' + error.message);
    }
}

/**
 * R2'den dosyayı oku
 * @param {string} key - Okunacak dosyanın yolu
 * @returns {Promise<Buffer>} - Dosya içeriği
 */
async function getFromR2(key) {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        });

        const response = await s3Client.send(command);

        // Stream'i buffer'a çevir
        const chunks = [];
        for await (const chunk of response.Body) {
            chunks.push(chunk);
        }

        return Buffer.concat(chunks);
    } catch (error) {
        console.error('R2 get hatası:', error);
        throw new Error('Dosya R2\'den okunamadı: ' + error.message);
    }
}

/**
 * R2 URL'sinden key'i çıkar
 * @param {string} photoUrl - R2 public URL (örn: https://bucket.account.r2.cloudflarestorage.com/users/123/profile.jpg)
 * @returns {string} - R2 key (örn: users/123/profile.jpg)
 */
function extractR2KeyFromUrl(photoUrl) {
    try {
        // URL'nin son 3 bölümünü al (users/123/profile.jpg)
        const urlParts = photoUrl.split('/');
        if (urlParts.length >= 3) {
            return urlParts.slice(-3).join('/');
        }
        return null;
    } catch (error) {
        console.error('R2 key çıkarma hatası:', error);
        return null;
    }
}

module.exports = {
    uploadToR2,
    deleteFromR2,
    getFromR2,
    extractR2KeyFromUrl,
    s3Client
};