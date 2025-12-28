// test-r2-connection.js
// Cloudflare R2'ye bağlantı test etmek için

require('dotenv').config();
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

async function testR2Connection() {
    console.log('🔄 Cloudflare R2 ye bağlantı test ediliyor...\n');

    // Ortam değişkenlerini kontrol et
    const requiredEnvVars = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            console.error(`❌ ${envVar} env değişkeni tanımlanmamış!`);
            process.exit(1);
        }
        console.log(`✅ ${envVar} tanımlanmış`);
    }

    // S3 istemcisini oluştur
    const s3Client = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        }
    });

    try {
        console.log('\n🔌 Bucket listesi çekiliyor...');
        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);

        console.log('\n✅ Cloudflare R2 ye başarıyla bağlandı!\n');
        console.log('📦 Mevcut Bucketler:');
        response.Buckets?.forEach(bucket => {
            console.log(`   - ${bucket.Name}`);
        });

        // Hedef bucket'ın mevcut olup olmadığını kontrol et
        const targetBucket = process.env.R2_BUCKET_NAME;
        const bucketExists = response.Buckets?.some(b => b.Name === targetBucket);

        if (bucketExists) {
            console.log(`\n✅ "${targetBucket}" bucket'ı bulundu!`);
        } else {
            console.warn(`\n⚠️  "${targetBucket}" bucket'ı bulunamadı!`);
            console.log(`   Lütfen Cloudflare R2 dashboard'dan "${targetBucket}" bucket'ını oluşturun.`);
        }

        // Endpoint'i göster
        console.log(`\n📍 Endpoint: ${process.env.R2_ENDPOINT}`);
        console.log(`🪣 Bucket: ${targetBucket}`);

        // Custom domain varsa göster
        if (process.env.R2_PUBLIC_URL) {
            console.log(`🔗 Public URL: ${process.env.R2_PUBLIC_URL}`);
        } else {
            const defaultUrl = `https://${targetBucket}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
            console.log(`🔗 Varsayılan Public URL: ${defaultUrl}`);
        }

    } catch (error) {
        console.error('\n❌ Bağlantı hatası:', error.message);
        console.log('\n🔧 Kontrol etme listesi:');
        console.log('   1. R2_ACCOUNT_ID doğru mu?');
        console.log('   2. R2_ACCESS_KEY_ID ve R2_SECRET_ACCESS_KEY doğru mu?');
        console.log('   3. İnternet bağlantısı var mı?');
        console.log('   4. Cloudflare API token\'ı revoke edilmedi mi?');
        process.exit(1);
    }
}

testR2Connection();
