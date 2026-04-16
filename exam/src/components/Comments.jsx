import { useState } from 'react';
import './Comments.css';
import Send from '../assets/Send.svg';
import Emoji from '../assets/emoji.svg';
import Notif from '../assets/notif.svg';

function getToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('jwt') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('authToken') ||
    sessionStorage.getItem('accessToken') ||
    sessionStorage.getItem('jwt') ||
    ''
  );
}

function isValidImageSrc(value) {
  if (!value || typeof value !== 'string') return false;

  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/') ||
    value.startsWith('data:image/')
  );
}

function getSafeAvatar(comment) {
  const rawAvatar = comment?.avatar || comment?.authorAvatar || '';

  return isValidImageSrc(rawAvatar) ? rawAvatar : '/ava.png';
}

function normalizeReply(reply) {
  return {
    id: reply?.id || reply?._id || Math.random().toString(36),
    name: reply?.name || reply?.author || reply?.username || 'Unknown user',
    avatar: getSafeAvatar(reply),
    text: reply?.text || reply?.content || '',
    time: reply?.time || reply?.createdAt || 'just now',
  };
}

function normalizeComment(comment) {
  return {
    id: comment?.id || comment?._id || Math.random().toString(36),
    name: comment?.name || comment?.author || comment?.username || 'Unknown user',
    avatar: getSafeAvatar(comment),
    text: comment?.text || comment?.content || '',
    time: comment?.time || comment?.createdAt || 'just now',
    replies: Array.isArray(comment?.replies)
      ? comment.replies.map(normalizeReply)
      : [],
  };
}

export function Comments({
  comments = [],
  setComments,
  videoId,
  reloadInteractions,
}) {
  const [text, setText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  const normalizedComments = Array.isArray(comments)
    ? comments.map(normalizeComment)
    : [];

  const handleAddComment = async () => {
    if (!text.trim() || !videoId) return;

    const token = getToken();
    if (!token) {
      console.error('Token not found');
      return;
    }

    try {
      console.log('COMMENT videoId:', videoId);
      console.log(
        'COMMENT URL:',
        `${import.meta.env.VITE_API_URL}/api/interactions/comment/${videoId}`
      );

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/interactions/comment/${videoId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: text.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add comment');
      }

      setText('');

      if (typeof reloadInteractions === 'function') {
        await reloadInteractions();
      }
    } catch (err) {
      console.error('Add comment error:', err);
    }
  };

  const handleAddReply = async (parentId) => {
    if (!replyText.trim() || !videoId || !parentId) return;

    const token = getToken();
    if (!token) {
      console.error('Token not found');
      return;
    }

    try {
      console.log('REPLY videoId:', videoId);
      console.log('REPLY parentId:', parentId);
      console.log(
        'REPLY URL:',
        `${import.meta.env.VITE_API_URL}/api/interactions/comment/${videoId}`
      );

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/interactions/comment/${videoId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: replyText.trim(),
            parentId: parentId,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add reply');
      }

      setReplyText('');
      setReplyTo(null);

      if (typeof reloadInteractions === 'function') {
        await reloadInteractions();
      }
    } catch (err) {
      console.error('Add reply error:', err);
    }
  };

  return (
    <div className="comments">
      <h3>Comments</h3>

      <div className="comment-form">
        <img src="/ava.png" alt="your avatar" />

        <input
          type="text"
          placeholder="Add a comment"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
        />

        <div className="form-icons">
          <span>
            <img src={Emoji} alt="emoji" />
          </span>
          <span>
            <img src={Notif} alt="notif" />
          </span>
        </div>

        <button className="sendCom" onClick={handleAddComment}>
          <img src={Send} alt="send" />
        </button>
      </div>

      <div className="comment-list">
        {normalizedComments.map((comment) => (
          <div key={comment.id} className="comment-block">
            <div className="comment">
              <img
                src={comment.avatar}
                alt="avatar"
                onError={(e) => {
                  e.currentTarget.src = '/ava.png';
                }}
              />

              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-name">{comment.name}</span>
                  <span className="comment-time">{comment.time}</span>
                </div>

                <p>{comment.text}</p>

                <div className="comment-actions">
                  <span
                    className="reply-bth"
                    onClick={() =>
                      setReplyTo(replyTo === comment.id ? null : comment.id)
                    }
                  >
                    Answer
                  </span>
                </div>
              </div>
            </div>

            {replyTo === comment.id && (
              <div className="reply-form">
                <img src="/ava.png" alt="your avatar" />
                <input
                  type="text"
                  placeholder="Write a reply"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleAddReply(comment.id)
                  }
                />
                <button onClick={() => handleAddReply(comment.id)}>➤</button>
              </div>
            )}

            {comment.replies.length > 0 && (
              <div className="replies">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="comment reply">
                    <img
                      src={reply.avatar}
                      alt="avatar"
                      onError={(e) => {
                        e.currentTarget.src = '/ava.png';
                      }}
                    />

                    <div className="comment-body">
                      <div className="comment-meta">
                        <span className="comment-name">{reply.name}</span>
                        <span className="comment-time">{reply.time}</span>
                      </div>

                      <p>{reply.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}