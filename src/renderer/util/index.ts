import Compressor from 'compressorjs'

export const isImageFile = (file: File) => {
    return file.type.startsWith('image/')
}

interface CompressOptions {
    maxSizeMB?: number;        // 目标文件大小（MB）
    maxWidthOrHeight?: number; // 最大宽度或高度
    initialQuality?: number;   // 初始压缩质量
    minQuality?: number;       // 最小压缩质量
}

export const compressImage = async (
    file: File, 
    options: CompressOptions = {}
): Promise<Blob> => {
    const {
        maxSizeMB = 3,           // 默认最大3MB
        maxWidthOrHeight = 1920,  // 默认最大1920px
        initialQuality = 0.8,     // 默认初始质量0.8
        minQuality = 0.5,         // 最低压缩质量0.5
    } = options;

    // 如果文件小于目标大小，直接返回
    if (file.size / 1024 / 1024 < maxSizeMB) {
        return file;
    }

    // 尝试不同的质量级别进行压缩
    let quality = initialQuality;
    let result: Blob;
    
    while (quality >= minQuality) {
        result = await new Promise((resolve, reject) => {
            new Compressor(file, {
                quality,
                maxWidth: maxWidthOrHeight,
                maxHeight: maxWidthOrHeight,
                success(compressedResult) {
                    resolve(compressedResult);
                },
                error(err) {
                    reject(err);
                }
            });
        });

        // 如果压缩后的大小符合要求，返回结果
        if (result.size / 1024 / 1024 < maxSizeMB) {
            return result;
        }

        // 否则降低质量继续尝试
        quality -= 0.1;
    }

    // 如果所有尝试都失败，返回最后一次压缩的结果
    return result!;
}

export const convertToBase64 = async (file: File): Promise<string> => {
    const compressedBlob = await compressImage(file)
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const base64 = reader.result as string
            resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(compressedBlob)
    })
}