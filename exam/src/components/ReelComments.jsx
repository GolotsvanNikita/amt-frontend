import { useState } from "react";
import "./ReelComments.css";

function getToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("authToken") ||
        sessionStorage.getItem("accessToken") ||
        sessionStorage.getItem("jwt") ||
        ""
    );
}

function isValidImageSrc(value) {
    if (!value || typeof value !== "string") return false;

    const trimmed = value.trim();

    return (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("/") ||
        trimmed.startsWith("data:image/")
    );
}

function getSafeAvatar(entity) {
    const candidates = [
        entity?.avatar,
        entity?.authorAvatar,
        entity?.profileImage,
        entity?.profileImageUrl,
        entity?.image,
    ];

    for (const candidate of candidates) {
        if (isValidImageSrc(candidate)) {
            return candidate.trim();
        }
    }

    return "/ava.png";
}

function normalizeReply(reply, index) {
    return {
        id: String(reply?.id || reply?._id || `reply-${index}`),
        name: reply?.name || reply?.author || reply?.username || "Unknown user",
        avatar: getSafeAvatar(reply),
        text: reply?.text || reply?.content || "",
        time: reply?.time || reply?.createdAt || "just now",
    };
}

function normalizeComment(comment, index) {
    const rawReplies = Array.isArray(comment?.replies)
        ? comment.replies
        : Array.isArray(comment?.replies?.items)
        ? comment.replies.items
        : Array.isArray(comment?.replies?.data)
        ? comment.replies.data
        : [];

    return {
        id: String(comment?.id || comment?._id || `comment-${index}`),
        name: comment?.name || comment?.author || comment?.username || "Unknown user",
        avatar: getSafeAvatar(comment),
        text: comment?.text || comment?.content || "",
        time: comment?.time || comment?.createdAt || "just now",
        replies: rawReplies.map((reply, replyIndex) => normalizeReply(reply, replyIndex)),
    };
}

export function ReelComments({
    comments = [],
    reelId,
    reloadComments,
}) {
    const [text, setText] = useState("");
    const [replyText, setReplyText] = useState("");
    const [replyTo, setReplyTo] = useState(null);

    const normalizedComments = Array.isArray(comments)
        ? comments.map((comment, index) => normalizeComment(comment, index))
        : [];

    const handleAddComment = async () => {
        const trimmedText = text.trim();
        if (!trimmedText || !reelId) return;

        const token = getToken();
        if (!token) {
            console.error("Token not found");
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/interactions/comment/${reelId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        text: trimmedText,
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to add comment");
            }

            setText("");

            if (typeof reloadComments === "function") {
                await reloadComments();
            }
        } catch (error) {
            console.error("Add reel comment error:", error);
        }
    };

    const handleAddReply = async (parentId) => {
        const trimmedReply = replyText.trim();
        if (!trimmedReply || !reelId || !parentId) return;

        const token = getToken();
        if (!token) {
            console.error("Token not found");
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/interactions/comment/${reelId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        text: trimmedReply,
                        parentId,
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to add reply");
            }

            setReplyText("");
            setReplyTo(null);

            if (typeof reloadComments === "function") {
                await reloadComments();
            }
        } catch (error) {
            console.error("Add reel reply error:", error);
        }
    };

    return (
        <div className="reel-comments">
            <div className="reel-comments-list">
                {normalizedComments.length === 0 ? (
                    <p className="reel-no-comments">No comments yet</p>
                ) : (
                    normalizedComments.map((comment) => (
                        <div key={comment.id} className="reel-comment-block">
                            <div className="reel-comment">
                                <img
                                    src={comment.avatar}
                                    alt="avatar"
                                    onError={(e) => {
                                        e.currentTarget.src = "/ava.png";
                                    }}
                                />

                                <div className="reel-comment-body">
                                    <div className="reel-comment-meta">
                                        <span className="reel-comment-name">{comment.name}</span>
                                        <span className="reel-comment-time">{comment.time}</span>
                                    </div>

                                    <p>{comment.text}</p>

                                    <div className="reel-comment-actions">
                                        <span
                                            className="reel-reply-btn"
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
                                <div className="reel-reply-form">
                                    <img
                                        src="/ava.png"
                                        alt="your avatar"
                                        onError={(e) => {
                                            e.currentTarget.src = "/ava.png";
                                        }}
                                    />

                                    <input
                                        type="text"
                                        placeholder="Write a reply"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) =>
                                            e.key === "Enter" && handleAddReply(comment.id)
                                        }
                                    />

                                    <button onClick={() => handleAddReply(comment.id)}>➤</button>
                                </div>
                            )}

                            {comment.replies.length > 0 && (
                                <div className="reel-replies">
                                    {comment.replies.map((reply) => (
                                        <div key={reply.id} className="reel-comment reel-comment-reply-item">
                                            <img
                                                src={reply.avatar}
                                                alt="avatar"
                                                onError={(e) => {
                                                    e.currentTarget.src = "/ava.png";
                                                }}
                                            />

                                            <div className="reel-comment-body">
                                                <div className="reel-comment-meta">
                                                    <span className="reel-comment-name">{reply.name}</span>
                                                    <span className="reel-comment-time">{reply.time}</span>
                                                </div>

                                                <p>{reply.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="reel-comment-form">
                <input
                    type="text"
                    placeholder="Place your comment"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                />

                <button type="button" onClick={handleAddComment}>
                    ➤
                </button>
            </div>
        </div>
    );
}