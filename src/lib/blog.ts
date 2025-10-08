import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  limit,
  startAfter
} from 'firebase/firestore'
import { db } from './firebase'
import { BlogPost, BlogCategory, BlogTag, BlogStats } from '@/types'

// コレクション名
const COLLECTIONS = {
  BLOG_POSTS: 'blogPosts',
  BLOG_CATEGORIES: 'blogCategories',
  BLOG_TAGS: 'blogTags'
}

// スラッグ生成関数
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 特殊文字を除去
    .replace(/[\s_-]+/g, '-') // スペースとアンダースコアをハイフンに
    .replace(/^-+|-+$/g, '') // 先頭と末尾のハイフンを除去
}

// 読了時間計算関数
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200 // 日本語の平均読書速度
  const words = content.length
  return Math.ceil(words / wordsPerMinute)
}

// ブログ記事一覧の取得
export async function getBlogPosts(
  status?: 'draft' | 'published' | 'archived',
  category?: string,
  tag?: string,
  search?: string
): Promise<BlogPost[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.BLOG_POSTS),
      orderBy('createdAt', 'desc'),
      limit(100)
    )

    // ステータスでフィルタ
    if (status) {
      q = query(q, where('status', '==', status))
    }

    // カテゴリでフィルタ
    if (category) {
      q = query(q, where('category', '==', category))
    }

    // タグでフィルタ（配列内の値）
    if (tag) {
      q = query(q, where('tags', 'array-contains', tag))
    }

    const querySnapshot = await getDocs(q)
    
    let posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      publishedAt: doc.data().publishedAt?.toDate?.()?.toISOString() || doc.data().publishedAt,
    })) as BlogPost[]

    // クライアントサイドで検索（Firestoreの全文検索は制限があるため）
    if (search) {
      const searchLower = search.toLowerCase()
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower)
      )
    }

    return posts
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    throw error
  }
}

// 公開済みブログ記事の取得（ユーザー向け）
export async function getPublishedBlogPosts(
  category?: string,
  tag?: string,
  limitCount: number = 20
): Promise<BlogPost[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.BLOG_POSTS),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(limitCount)
    )

    if (category) {
      q = query(q, where('category', '==', category))
    }

    if (tag) {
      q = query(q, where('tags', 'array-contains', tag))
    }

    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      publishedAt: doc.data().publishedAt?.toDate?.()?.toISOString() || doc.data().publishedAt,
    })) as BlogPost[]
  } catch (error) {
    console.error('Error fetching published blog posts:', error)
    throw error
  }
}

// 単一ブログ記事の取得
export async function getBlogPost(id: string): Promise<BlogPost | null> {
  try {
    const docRef = doc(db, COLLECTIONS.BLOG_POSTS, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() || data.publishedAt,
      } as BlogPost
    }
    
    return null
  } catch (error) {
    console.error('Error fetching blog post:', error)
    throw error
  }
}

// スラッグでブログ記事を取得
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const q = query(
      collection(db, COLLECTIONS.BLOG_POSTS),
      where('slug', '==', slug),
      where('status', '==', 'published'),
      limit(1)
    )
    
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() || data.publishedAt,
      } as BlogPost
    }
    
    return null
  } catch (error) {
    console.error('Error fetching blog post by slug:', error)
    throw error
  }
}

// ブログ記事の作成
export async function createBlogPost(postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>): Promise<string> {
  try {
    const now = new Date()
    const slug = generateSlug(postData.title)
    const readingTime = calculateReadingTime(postData.content)
    
    const data = {
      ...postData,
      slug,
      readingTime,
      viewCount: 0,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      publishedAt: postData.status === 'published' ? Timestamp.fromDate(now) : null
    }
    
    const docRef = await addDoc(collection(db, COLLECTIONS.BLOG_POSTS), data)
    return docRef.id
  } catch (error) {
    console.error('Error creating blog post:', error)
    throw error
  }
}

// ブログ記事の更新
export async function updateBlogPost(id: string, postData: Partial<BlogPost>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.BLOG_POSTS, id)
    const updateData: any = {
      ...postData,
      updatedAt: Timestamp.fromDate(new Date())
    }
    
    // タイトルが変更された場合はスラッグも更新
    if (postData.title) {
      updateData.slug = generateSlug(postData.title)
    }
    
    // コンテンツが変更された場合は読了時間も更新
    if (postData.content) {
      updateData.readingTime = calculateReadingTime(postData.content)
    }
    
    // ステータスがpublishedに変更された場合、publishedAtを設定
    if (postData.status === 'published' && !postData.publishedAt) {
      updateData.publishedAt = Timestamp.fromDate(new Date())
    }
    
    await updateDoc(docRef, updateData)
  } catch (error) {
    console.error('Error updating blog post:', error)
    throw error
  }
}

// ブログ記事の削除
export async function deleteBlogPost(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.BLOG_POSTS, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting blog post:', error)
    throw error
  }
}

// ブログ記事の公開
export async function publishBlogPost(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.BLOG_POSTS, id)
    await updateDoc(docRef, {
      status: 'published',
      publishedAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date())
    })
  } catch (error) {
    console.error('Error publishing blog post:', error)
    throw error
  }
}

// ブログ記事のアーカイブ
export async function archiveBlogPost(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.BLOG_POSTS, id)
    await updateDoc(docRef, {
      status: 'archived',
      updatedAt: Timestamp.fromDate(new Date())
    })
  } catch (error) {
    console.error('Error archiving blog post:', error)
    throw error
  }
}

// 閲覧数を増加
export async function incrementViewCount(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.BLOG_POSTS, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const currentCount = docSnap.data().viewCount || 0
      await updateDoc(docRef, {
        viewCount: currentCount + 1,
        updatedAt: Timestamp.fromDate(new Date())
      })
    }
  } catch (error) {
    console.error('Error incrementing view count:', error)
    throw error
  }
}

// カテゴリ一覧の取得
export async function getBlogCategories(): Promise<BlogCategory[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.BLOG_CATEGORIES),
      orderBy('name', 'asc')
    )
    
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as BlogCategory[]
  } catch (error) {
    console.error('Error fetching blog categories:', error)
    throw error
  }
}

// カテゴリの作成
export async function createBlogCategory(categoryData: Omit<BlogCategory, 'id' | 'createdAt' | 'updatedAt' | 'postCount'>): Promise<string> {
  try {
    const now = new Date()
    const slug = generateSlug(categoryData.name)
    
    const data = {
      ...categoryData,
      slug,
      postCount: 0,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    }
    
    const docRef = await addDoc(collection(db, COLLECTIONS.BLOG_CATEGORIES), data)
    return docRef.id
  } catch (error) {
    console.error('Error creating blog category:', error)
    throw error
  }
}

// タグ一覧の取得
export async function getBlogTags(): Promise<BlogTag[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.BLOG_TAGS),
      orderBy('name', 'asc')
    )
    
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    })) as BlogTag[]
  } catch (error) {
    console.error('Error fetching blog tags:', error)
    throw error
  }
}

// タグの作成
export async function createBlogTag(tagData: Omit<BlogTag, 'id' | 'createdAt' | 'postCount'>): Promise<string> {
  try {
    const now = new Date()
    const slug = generateSlug(tagData.name)
    
    const data = {
      ...tagData,
      slug,
      postCount: 0,
      createdAt: Timestamp.fromDate(now)
    }
    
    const docRef = await addDoc(collection(db, COLLECTIONS.BLOG_TAGS), data)
    return docRef.id
  } catch (error) {
    console.error('Error creating blog tag:', error)
    throw error
  }
}

// ブログ統計の取得
export async function getBlogStats(): Promise<BlogStats> {
  try {
    const posts = await getBlogPosts()
    const categories = await getBlogCategories()
    const tags = await getBlogTags()
    
    const publishedPosts = posts.filter(post => post.status === 'published')
    const draftPosts = posts.filter(post => post.status === 'draft')
    const totalViews = posts.reduce((sum, post) => sum + post.viewCount, 0)
    
    // 最も人気の記事
    const mostPopularPost = publishedPosts.length > 0 
      ? publishedPosts.reduce((prev, current) => 
          (prev.viewCount > current.viewCount) ? prev : current
        )
      : undefined
    
    // カテゴリ別投稿数
    const postsByCategory: Record<string, number> = {}
    publishedPosts.forEach(post => {
      postsByCategory[post.category] = (postsByCategory[post.category] || 0) + 1
    })
    
    // 月別投稿数
    const postsByMonth: Record<string, number> = {}
    publishedPosts.forEach(post => {
      if (post.publishedAt) {
        const month = post.publishedAt.substring(0, 7) // YYYY-MM
        postsByMonth[month] = (postsByMonth[month] || 0) + 1
      }
    })
    
    return {
      totalPosts: posts.length,
      publishedPosts: publishedPosts.length,
      draftPosts: draftPosts.length,
      totalViews,
      totalCategories: categories.length,
      totalTags: tags.length,
      averageViewsPerPost: publishedPosts.length > 0 ? Math.round(totalViews / publishedPosts.length) : 0,
      mostPopularPost,
      postsByCategory,
      postsByMonth
    }
  } catch (error) {
    console.error('Error fetching blog stats:', error)
    throw error
  }
}

// リアルタイム更新の購読
export function subscribeToBlogPosts(callback: (posts: BlogPost[]) => void) {
  const q = query(
    collection(db, COLLECTIONS.BLOG_POSTS),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(q, (querySnapshot) => {
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      publishedAt: doc.data().publishedAt?.toDate?.()?.toISOString() || doc.data().publishedAt,
    })) as BlogPost[]
    
    callback(posts)
  })
}
