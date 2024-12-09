export const isImageFile = (file: File) => {
    return file.type.startsWith('image/')
}



export const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const base64 = reader.result as string
            resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}