import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

/**
 * 画像をFirebase Storageにアップロード
 * @param file - アップロードする画像ファイル
 * @param path - Storageのパス (例: 'blog/images/thumbnail.jpg')
 * @returns アップロードされた画像のURL
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  try {
    // ファイルサイズチェック (5MB以下)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error('画像サイズは5MB以下にしてください')
    }

    // ファイルタイプチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('対応している画像形式: JPEG, PNG, GIF, WebP')
    }

    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    return downloadURL
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

/**
 * ブログ記事のサムネイル画像をアップロード
 * @param file - アップロードする画像ファイル
 * @param postId - ブログ記事のID (オプション、新規作成時は自動生成)
 * @returns アップロードされた画像のURL
 */
export async function uploadBlogThumbnail(file: File, postId?: string): Promise<string> {
  const timestamp = Date.now()
  const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
  const path = postId 
    ? `blog/thumbnails/${postId}/${fileName}`
    : `blog/thumbnails/temp/${fileName}`
  
  return await uploadImage(file, path)
}

/**
 * ブログ記事の本文画像をアップロード
 * @param file - アップロードする画像ファイル
 * @param postId - ブログ記事のID
 * @returns アップロードされた画像のURL
 */
export async function uploadBlogContentImage(file: File, postId?: string): Promise<string> {
  const timestamp = Date.now()
  const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
  const path = postId 
    ? `blog/content/${postId}/${fileName}`
    : `blog/content/temp/${fileName}`
  
  return await uploadImage(file, path)
}

/**
 * 画像をFirebase Storageから削除
 * @param imageUrl - 削除する画像のURL
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Firebase StorageのURLからパスを抽出
    const url = new URL(imageUrl)
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/)
    
    if (!pathMatch) {
      throw new Error('Invalid Firebase Storage URL')
    }
    
    const path = decodeURIComponent(pathMatch[1])
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

/**
 * 画像ファイルのプレビューURLを生成
 * @param file - プレビューする画像ファイル
 * @returns プレビュー用のData URL
 */
export function getImagePreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

