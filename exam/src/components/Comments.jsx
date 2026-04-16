import { useState } from 'react';
import './Comments.css';
import Send from '../assets/Send.svg';
import Emoji from '../assets/emoji.svg';
import Notif from '../assets/notif.svg';

export function Comments({
  comments = [],
  setComments,
  videoId,
  reloadInteractions,
}) {
  const [text, setText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  const getToken = () => {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('accessToken') ||
      ''
    );
  };

  const formatComment = (comment) => ({
    id: comment.id,
    name: comment.name || comment.author || comment.username || 'Unknown user',
    avatar: comment.avatar || comment.authorAvatar || '/ava.png',
    text: comment.text || comment.content || '',
    time: comment.time || comment.createdAt || 'just now',
    replies: Array.isArray(comment.replies)
      ? comment.replies.map((reply) => ({
          id: reply.id,
          name: reply.name || reply.author || reply.username || 'Unknown user',
          avatar: reply.avatar || reply.authorAvatar || '/ava.png',
          text: reply.text || reply.content || '',
          time: reply.time || reply.createdAt || 'just now',
        }))
      : [],
  });

  const normalizedComments = Array.isArray(comments)
    ? comments.map(formatComment)
    : [];

  const handleAddComment = async () => {
    if (!text.trim() || !videoId) return;

    const token = getToken();
    if (!token) {
      console.error('Token not found');
      return;
    }

    try {
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
      console.log("COMMENT videoId:", videoId);
      console.log("COMMENT URL:", `${import.meta.env.VITE_API_URL}/api/interactions/comment/${videoId}`);
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
              <img src={comment.avatar} alt="avatar" />

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
                    <img src={reply.avatar} alt="avatar" />

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