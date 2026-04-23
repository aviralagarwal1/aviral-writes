import { getPosts } from '../lib/getPosts';

export const revalidate = 3600; // re-fetch from Substack

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function Home() {
  const posts = await getPosts();

  return (
    <main className="container">
      <header className="header">
        <div className="header-left">
          <h1>Aviral&apos;s Notes</h1>
          <p>Long-form essays on technology, media, and culture</p>
        </div>
        <div className="header-right">
          <a href="https://aviralwrites.substack.com" target="_blank" rel="noopener noreferrer">
            Substack →
          </a>
        </div>
      </header>

      <hr className="divider" />

      {posts.length === 0 ? (
        <div className="empty">no posts found. check back soon.</div>
      ) : (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.link} className="post-item">
              <div className="post-title">
                <a href={post.link} target="_blank" rel="noopener noreferrer">
                  {post.title}
                </a>
              </div>
              <div className="post-meta">
                {post.author && <span>{post.author}</span>}
                {post.author && post.date && <span className="dot">•</span>}
                {post.date && <span>{formatDate(post.date)}</span>}
                {post.categories.length > 0 && (
                  <>
                    <span className="dot">•</span>
                    <span className="tag">{post.categories.join(', ')}</span>
                  </>
                )}
              </div>
              {post.excerpt && (
                <p className="post-excerpt">{post.excerpt}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}