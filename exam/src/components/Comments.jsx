import { useState } from 'react';
import './Comments.css';
import Send from '../assets/Send.svg'
import Emoji from '../assets/emoji.svg'
import Notif from '../assets/notif.svg'

export function Comments({    comments = [],
    setComments,
    videoId,
    reloadInteractions,}){
  const [text,setText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const normalizedComments = comments.map((comment)=>({
    id: comment.id,
    name: comment.name || comment.author || "Unknown user",
    avatar: comment.avatar || comment.authorAvatar || "/ava.png",
    text: comment.text || comment.content || "",
    time: comment.time || comment.createdAt || "just now",
    replies: Array.isArray(comment.replies) ? comment.replies : [],
  }));

  const handleAddComment = async () => {
      if (!text.trim()) return;

      const token = getAuthToken();
      if (!token || !videoId) return;

      try {
          const response = await fetch(
              `${import.meta.env.VITE_API_URL}/api/interactions/comment/${videoId}`,
              {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                      text: text.trim(),
                  }),
              }
          );

          if (!response.ok) {
              throw new Error("Failed to add comment");
          }

          setText("");

          if (typeof reloadInteractions === "function") {
              await reloadInteractions();
          }
      } catch (err) {
          console.error("Add comment error:", err);
      }
  };

  const handleAddReply = async (parentId) => {
      if (!replyText.trim()) return;

      const token = getAuthToken();
      if (!token || !videoId) return;

      try {
          const response = await fetch(
              `${import.meta.env.VITE_API_URL}/api/interactions/comment/${videoId}`,
              {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                      text: replyText.trim(),
                      parentId,
                  }),
              }
          );

          if (!response.ok) {
              throw new Error("Failed to add reply");
          }

          setReplyText("");
          setReplyTo(null);

          if (typeof reloadInteractions === "function") {
              await reloadInteractions();
          }
      } catch (err) {
          console.error("Add reply error:", err);
      }
  };

  return(
    <div className='comments'>
      <h3>Comments</h3>
      <div className='comment-form'>
        <img src="/ava.png" alt='your avatar'/>
        <input type = "text" placeholder='Add a comment' value={text} onChange={(e)=> setText(e.target.value)} onKeyDown={(e)=>e.key === "Enter" &&handleAddComment()}/>
        <div className='form-icons'>
          <span><img src = {Emoji} alt="emoji"/></span>
          <span><img src = {Notif} alt="notif"/></span>
        </div>
        <button className='sendCom' onClick={handleAddComment}><img src={Send} alt = "send"/></button>
      </div>
      <div className='comment-list'>
        {normalizedComments.map((comment)=>(
          <div key={comment.id} className='comment-block'>
            <div className='comment'>
              <img src = {comment.avatar} alt = "avatar"/>
              <div className='comment-body'>
                <div className='comment-meta'>
                  <span className='comment-name'>{comment.name}</span>
                  <span className='comment-time'>{comment.time}</span>
                </div>
                <p>{comment.text}</p>
                <div className='comment-actions'>
                  <span className='reply-bth' onClick={()=>setReplyTo(comment.id)}>Answer</span>
                </div>
              </div>
              {replyTo === comment.id && (
                <div className='reply-form'>
                  <img src="/ava.png" alt = "your avatar"/>
                  <input type='text' placeholder='write a reply' value={replyText} onChange={(e)=> setReplyText(e.target.value)} onKeyDown={(e)=>e.key === "Enter" && handleAddReply(comment.id)}/>
                  <button onClick={()=>handleAddReply(comment.id)}>➤</button>
                </div>
              )}
              {comment.replies?.length > 0 && (
                <div className='replies'>
                  {comment.replies.map((reply)=>(
                    <div key = {reply.id} className='comment reply'>
                      <img src = {reply.avatar || "/ava.png"} alt='avatar'/>
                      <div className='comment-body'>
                        <div className='comment-meta'>
                          <span className='comment-name'> {reply.name || reply.author || "Unknown User"}</span>
                          <span className='comment-time'>{reply.time || reply.createdAt || "just now"}</span>
                        </div>
                        <p>{reply.text || reply.content || " "}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

}
