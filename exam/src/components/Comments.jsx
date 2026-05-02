import { useEffect, useMemo, useRef, useState } from "react";
import "./Comments.css";
import Send from "../assets/Send.svg";
import Emoji from "../assets/emoji.svg";
import Notif from "../assets/notif.svg";

export function Comments({
    comments = [],
    videoId,
    reloadInteractions,
    hasMoreComments = false,
    loadingMoreComments = false,
    onLoadMoreComments,
}) {
    const [text, setText] = useState("");
    const [replyText, setReplyText] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const loadMoreRef = useRef(null);
    const [myAvatar, setMyAvatar] = useState("/ava.png");

    const normalizedComments = useMemo(() => {
        return Array.isArray(comments) ? comments : [];
    }, [comments]);

    useEffect(() => {
        const elements = document.querySelectorAll(
            ".comments .reveal-on-scroll:not(.visible)"
        );

        if (!elements.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.15,
                rootMargin: "0px 0px -40px 0px",
            }
        );

        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [normalizedComments.length]);

    useEffect(() => {
        if (
            !hasMoreComments ||
            loadingMoreComments ||
            typeof onLoadMoreComments !== "function"
        ) {
            return;
        }

        const node = loadMoreRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];

                if (
                    firstEntry.isIntersecting &&
                    hasMoreComments &&
                    !loadingMoreComments
                ) {
                    onLoadMoreComments();
                }
            },
            {
                root: null,
                threshold: 0.1,
                rootMargin: "250px",
            }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [
        hasMoreComments,
        loadingMoreComments,
        onLoadMoreComments,
        normalizedComments.length,
    ]);

    return (
        <div className="comments">
            <h3>Comments</h3>

            <div className="comment-form">
                <img src={myAvatar} alt="ava" />

                <input
                    type="text"
                    placeholder="Add a comment"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />

                <button className="sendCom">
                    <img src={Send} alt="send" />
                </button>
            </div>

            <div className="comment-list">
                {normalizedComments.map((comment, index) => (
                    <div
                        key={comment.id || index}
                        className="comment-block reveal-on-scroll"
                    >
                        <div className="comment">
                            <img
                                src={comment.avatar || "/ava.png"}
                                alt="avatar"
                                onError={(e) => {
                                    e.currentTarget.src = "/ava.png";
                                }}
                            />

                            <div className="comment-body">
                                <div className="comment-meta">
                                    <span>{comment.name || "User"}</span>
                                    <span className="comment-time">
                                        {comment.time || "now"}
                                    </span>
                                </div>

                                <p>{comment.text}</p>

                                <div className="comment-actions">
                                    <span
                                        className="reply-btn"
                                        onClick={() =>
                                            setReplyTo(
                                                replyTo === index ? null : index
                                            )
                                        }
                                    >
                                        Reply
                                    </span>
                                </div>
                            </div>
                        </div>

                        {replyTo === index && (
                            <div className="reply-form">
                                <img src="/ava.png" alt="ava" />

                                <input
                                    type="text"
                                    placeholder="Reply..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />

                                <button>➤</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {hasMoreComments && (
                <div ref={loadMoreRef} className="commentsLoadTrigger" />
            )}

            {loadingMoreComments && (
                <div className="commentsLoading">Loading more comments...</div>
            )}
        </div>
    );
}