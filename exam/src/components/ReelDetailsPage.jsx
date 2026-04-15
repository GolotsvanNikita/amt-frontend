import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ReelDetailsPage.css";

const USE_MOCK = true;

const initialMockReels = [
    {
        id: 1,
        title: "Scene",
        videoUrl: "/videos/reel1.mp4",
        posterUrl: "/1.jpg",
        avatarUrl: "/ava.png",
        author: "LIA Hmel",
        username: "@lhmel",
        description: "Learning to play the guitar",
        audioTitle: "original soundtrack",
        likes: 0,
        shares: 0,
        remix: 0,
        isSubscribed: false,
        comments: [
            {
                id: 1,
                user: "Anna",
                avatar: "/ava.png",
                text: "This band is in my playlist with Royal Blood, Highly Suspect, and Cleopatrick.",
                time: "3 weeks ago",
                likes: 0,
                replies: [],
            },
            {
                id: 2,
                user: "Ryan Williams",
                avatar: "/ava.png",
                text: "I've got the same playlist.",
                time: "3 weeks ago",
                likes: 0,
                replies: [],
            },
            {
                id: 3,
                user: "Matthew Wilson",
                avatar: "/ava.png",
                text: "I randomly found this song on a Spotify playlist and now I'm obsessed.",
                time: "5 months ago",
                likes: 0,
                replies: [],
            },
        ],
    },
    {
        id: 2,
        title: "Portrait",
        videoUrl: "/videos/reel2.mp4",
        posterUrl: "/2.jpg",
        avatarUrl: "/ava.png",
        author: "Mila Rose",
        username: "@milarose",
        description: "Soft portrait lighting test",
        audioTitle: "dreamy ambient",
        likes: 0,
        shares: 0,
        remix: 0,
        isSubscribed: false,
        comments: [],
    },
    {
        id: 3,
        title: "City",
        videoUrl: "/videos/reel3.mp4",
        posterUrl: "/3.jpg",
        avatarUrl: "/ava.png",
        author: "Urban Eye",
        username: "@urbaneye",
        description: "Aerial city footage over downtown.",
        audioTitle: "city atmosphere",
        likes: 0,
        shares: 0,
        remix: 0,
        isSubscribed: false,
        comments: [],
    },
    {
        id: 4,
        title: "Concert",
        videoUrl: "/videos/reel4.mp4",
        posterUrl: "/4.jpg",
        avatarUrl: "/ava.png",
        author: "Noise Room",
        username: "@noiseroom",
        description: "Live crowd energy and stage lights.",
        audioTitle: "live concert audio",
        likes: 0,
        shares: 0,
        remix: 0,
        isSubscribed: false,
        comments: [],
    },
];

function formatCount(value) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return String(value);
}

export function FullReels() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeReelId, setActiveReelId] = useState(Number(id));
    const [commentText, setCommentText] = useState("");
    const [replyTo, setReplyTo] = useState("");
    const [replyToCommentId, setReplyToCommentId] = useState(null);
    const [expandedReplies, setExpandedReplies] = useState({});

    const feedRef = useRef(null);
    const sectionRefs = useRef({});
    const observerRef = useRef(null);
    const videoRefs = useRef({});

    useEffect(() => {
        loadReels();
    }, []);

    useEffect(() => {
        const numericId = Number(id);
        if (!Number.isNaN(numericId)) {
            setActiveReelId(numericId);
        }
    }, [id]);

    useEffect(() => {
        if (!reels.length) return;

        const currentSection = sectionRefs.current[activeReelId];
        if (currentSection) {
            currentSection.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }, [reels.length, activeReelId]);

    useEffect(() => {
        if (!reels.length) return;

        const options = {
            root: feedRef.current,
            threshold: 0.65,
        };

        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const reelId = Number(entry.target.dataset.reelId);
                const video = videoRefs.current[reelId];

                if (entry.isIntersecting) {
                    setActiveReelId(reelId);
                    navigate(`/reels-page/${reelId}`, { replace: true });

                    if (video) {
                        video.play().catch(() => {});
                    }
                } else {
                    if (video) {
                        video.pause();
                    }
                }
            });
        }, options);

        reels.forEach((reel) => {
            const section = sectionRefs.current[reel.id];
            if (section) observerRef.current.observe(section);
        });

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [reels, navigate]);

    const loadReels = async () => {
        try {
            setLoading(true);

            if (USE_MOCK) {
                await new Promise((resolve) => setTimeout(resolve, 250));
                setReels(initialMockReels);
                return;
            }

            const res = await fetch("http://localhost:5000/api/reels");
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to load reels");
            }

            const normalized = data.map((item) => ({
                ...item,
                likes: item.likes ?? 0,
                shares: item.shares ?? 0,
                remix: item.remix ?? 0,
                isSubscribed: item.isSubscribed ?? false,
                comments: item.comments ?? [],
            }));

            setReels(normalized);
        } catch (error) {
            console.error(error);
            setReels([]);
        } finally {
            setLoading(false);
        }
    };

    const activeReel = useMemo(
        () => reels.find((item) => item.id === activeReelId) || null,
        [reels, activeReelId]
    );

    const scrollToReelByIndex = (direction) => {
        if (!reels.length) return;

        const currentIndex = reels.findIndex((item) => item.id === activeReelId);
        if (currentIndex === -1) return;

        let nextIndex = currentIndex + direction;

        if (nextIndex < 0) nextIndex = 0;
        if (nextIndex > reels.length - 1) nextIndex = reels.length - 1;

        const nextReel = reels[nextIndex];
        if (!nextReel) return;

        sectionRefs.current[nextReel.id]?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    const handleFeedKeyDown = (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            scrollToReelByIndex(1);
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            scrollToReelByIndex(-1);
        }
    };

    const togglePlay = (reelId) => {
        const video = videoRefs.current[reelId];
        if (!video) return;

        if (video.paused) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    };

    const toggleMute = (reelId) => {
        const video = videoRefs.current[reelId];
        if (!video) return;

        video.muted = !video.muted;

        setReels((prev) =>
            prev.map((item) =>
                item.id === reelId ? { ...item, isMuted: video.muted } : item
            )
        );
    };

    const handleLike = async (reelId) => {
        setReels((prev) =>
            prev.map((item) => {
                if (item.id !== reelId) return item;

                const nextLiked = !item.isLiked;
                return {
                    ...item,
                    isLiked: nextLiked,
                    likes: nextLiked ? item.likes + 1 : Math.max(item.likes - 1, 0),
                };
            })
        );

        if (!USE_MOCK) {
            try {
                await fetch(`http://localhost:5000/api/reels/${reelId}/like`, {
                    method: "POST",
                });
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleShare = async (reelId) => {
        setReels((prev) =>
            prev.map((item) => {
                if (item.id !== reelId) return item;
                return {
                    ...item,
                    isShared: true,
                    shares: item.isShared ? item.shares : item.shares + 1,
                };
            })
        );

        try {
            await navigator.clipboard.writeText(
                `${window.location.origin}/reels-page/${reelId}`
            );
        } catch (error) {
            console.error(error);
        }

        if (!USE_MOCK) {
            try {
                await fetch(`http://localhost:5000/api/reels/${reelId}/share`, {
                    method: "POST",
                });
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleRemix = async (reelId) => {
        setReels((prev) =>
            prev.map((item) => {
                if (item.id !== reelId) return item;

                const nextRemixed = !item.isRemixed;
                return {
                    ...item,
                    isRemixed: nextRemixed,
                    remix: nextRemixed ? item.remix + 1 : Math.max(item.remix - 1, 0),
                };
            })
        );

        if (!USE_MOCK) {
            try {
                await fetch(`http://localhost:5000/api/reels/${reelId}/remix`, {
                    method: "POST",
                });
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleSubscribe = async (reelId) => {
        setReels((prev) =>
            prev.map((item) =>
                item.id === reelId
                    ? { ...item, isSubscribed: !item.isSubscribed }
                    : item
            )
        );

        if (!USE_MOCK) {
            try {
                await fetch(`http://localhost:5000/api/reels/${reelId}/subscribe`, {
                    method: "POST",
                });
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleReplyClick = (commentId, commentUser) => {
        setReplyTo(commentUser);
        setReplyToCommentId(commentId);
        setCommentText(`@${commentUser} `);
    };


    const toogleReplies = (commentId) =>{
        setExpandedReplies((prev)=>({
            ...prev,[commentId]:!prev[commentId],
        }))
    }

    const handleCommentSubmit = async (e) => {
        e.preventDefault();

        if (!activeReel) return;

        const trimmed = commentText.trim();
        if (!trimmed) return;

        const newComment = {
            id: Date.now(),
            user: "You",
            avatar: "/ava.png",
            text: trimmed,
            time: "now",
            likes: 0,
            replies: [],
        };

        setReels((prev) =>
            prev.map((item) => {
                if (item.id !== activeReel.id) return item;

                if (replyToCommentId) {
                    return {
                        ...item,
                        comments: item.comments.map((comment) => {
                            if (comment.id !== replyToCommentId) return comment;

                            return {
                                ...comment,
                                replies: [
                                    ...(comment.replies || []),
                                    {
                                        id: Date.now() + 1,
                                        user: "You",
                                        avatar: "/ava.png",
                                        text: trimmed,
                                        time: "now",
                                        likes: 0,
                                    },
                                ],
                            };
                        }),
                    };
                }

                return {
                    ...item,
                    comments: [...item.comments, newComment],
                };
            })
        );

        if (replyToCommentId) {
            setExpandedReplies((prev) => ({
                ...prev,
                [replyToCommentId]: true,
            }));
        }

        setCommentText("");
        setReplyTo("");
        setReplyToCommentId(null);

        if (!USE_MOCK) {
            try {
                await fetch(`http://localhost:5000/api/reels/${activeReel.id}/comments`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text: trimmed,
                        parentCommentId: replyToCommentId,
                    }),
                });
            } catch (error) {
                console.error(error);
            }
        }
    };

    if (loading) {
        return <div className="reel-details-loading">Loading reels...</div>;
    }

    if (!reels.length) {
        return <div className="reel-details-loading">No reels found</div>;
    }

    return (
        <div
            className="reel-feed-page"
            ref={feedRef}
            tabIndex={0}
            onKeyDown={handleFeedKeyDown}
        >
            {reels.map((reel) => {
                const isActive = reel.id === activeReelId;

                return (
                    <section
                        key={reel.id}
                        data-reel-id={reel.id}
                        ref={(node) => {
                            sectionRefs.current[reel.id] = node;
                        }}
                        className="reel-feed-section"
                    >
                        <div className="reel-details-layout">

                            {/* VIDEO */}
                            <div className="reel-details-video-wrap">
                                <div className="reel-player-shell">
                                    <video
                                        ref={(node) => {
                                            videoRefs.current[reel.id] = node;
                                        }}
                                        className="reel-details-video"
                                        src={reel.videoUrl}
                                        poster={reel.posterUrl}
                                        controls
                                        playsInline
                                        autoPlay={isActive}
                                        muted={Boolean(reel.isMuted)}
                                        loop
                                        onClick={() => togglePlay(reel.id)}
                                    />

                                    <div className="reel-player-controls">
                                        <button
                                            type="button"
                                            className="reel-player-btn"
                                            onClick={() => togglePlay(reel.id)}
                                        >
                                            Play / Pause
                                        </button>

                                        <button
                                            type="button"
                                            className="reel-player-btn"
                                            onClick={() => toggleMute(reel.id)}
                                        >
                                            {reel.isMuted ? "Unmute" : "Mute"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ACTIONS */}
                            <div className="reel-details-actions">
                                <button
                                    type="button"
                                    className={`reel-side-action ${reel.isLiked ? "is-active" : ""}`}
                                    onClick={() => handleLike(reel.id)}
                                >
                                    <span>♡</span>
                                    <small>{formatCount(reel.likes)}</small>
                                </button>

                                <button
                                    type="button"
                                    className={`reel-side-action ${reel.isShared ? "is-active" : ""}`}
                                    onClick={() => handleShare(reel.id)}
                                >
                                    <span>↗</span>
                                    <small>{formatCount(reel.shares)}</small>
                                </button>

                                <button
                                    type="button"
                                    className={`reel-side-action ${reel.isRemixed ? "is-active" : ""}`}
                                    onClick={() => handleRemix(reel.id)}
                                >
                                    <span>⤴</span>
                                    <small>{formatCount(reel.remix)}</small>
                                </button>
                            </div>

                            {/* RIGHT PANEL */}
                            <aside className="reel-details-info">
                                <div className="reel-author-row">
                                    <img
                                        src={reel.avatarUrl}
                                        alt={reel.author}
                                        className="reel-author-avatar"
                                    />

                                    <div className="reel-author-text">
                                        <h2>{reel.author}</h2>
                                        <p>{reel.username}</p>
                                    </div>

                                    <button
                                        type="button"
                                        className={`reel-subscribe-btn ${reel.isSubscribed ? "is-subscribed" : ""}`}
                                        onClick={() => handleSubscribe(reel.id)}
                                    >
                                        {reel.isSubscribed ? "Subscribed" : "Subscribe"}
                                    </button>
                                </div>

                                <div className="reel-description-box">
                                    <h3>{reel.description}</h3>

                                    <div className="reel-audio-row">
                                        <span className="reel-audio-icon">♫</span>
                                        <span>{reel.audioTitle}</span>
                                    </div>
                                </div>

                                {/* COMMENTS */}
                                <div className="reel-comments-list">
                                    {reel.comments.length === 0 ? (
                                        <p className="reel-no-comments">No comments yet</p>
                                    ) : (
                                        reel.comments.map((comment) => {
                                            const replies = comment.replies || [];
                                            const isExpanded = !!expandedReplies[comment.id];

                                            return (
                                                <div key={comment.id} className="reel-comment-thread">

                                                    {/* MAIN COMMENT */}
                                                    <div className="reel-comment-item">
                                                        <img
                                                            src={comment.avatar}
                                                            alt={comment.user}
                                                            className="reel-comment-avatar"
                                                        />

                                                        <div className="reel-comment-body">
                                                            <div className="reel-comment-head">
                                                                <strong>{comment.user}</strong>
                                                                <span>{comment.time}</span>
                                                            </div>

                                                            <p>{comment.text}</p>

                                                            <div className="reel-comment-actions-row">
                                                                <button
                                                                    type="button"
                                                                    className="reel-comment-reply"
                                                                    onClick={() =>
                                                                        handleReplyClick(comment.id, comment.user)
                                                                    }
                                                                >
                                                                    Answer
                                                                </button>

                                                                {replies.length > 0 && (
                                                                    <button
                                                                        type="button"
                                                                        className="reel-comment-toggle"
                                                                        onClick={() => toggleReplies(comment.id)}
                                                                    >
                                                                        {isExpanded
                                                                            ? "Hide replies"
                                                                            : `Show replies (${replies.length})`}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* REPLIES */}
                                                            {replies.length > 0 && isExpanded && (
                                                                <div className="reel-comment-replies">
                                                                    {replies.map((reply) => (
                                                                        <div
                                                                            key={reply.id}
                                                                            className="reel-comment-item reel-comment-item--reply"
                                                                        >
                                                                            <img
                                                                                src={reply.avatar}
                                                                                alt={reply.user}
                                                                                className="reel-comment-avatar reel-comment-avatar--reply"
                                                                            />

                                                                            <div className="reel-comment-body">
                                                                                <div className="reel-comment-head">
                                                                                    <strong>{reply.user}</strong>
                                                                                    <span>{reply.time}</span>
                                                                                </div>

                                                                                <p>{reply.text}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* REPLYING TO */}
                                {replyTo && (
                                    <div className="reel-replying-to">
                                        Replying to <strong>{replyTo}</strong>

                                        <button
                                            type="button"
                                            className="reel-reply-cancel"
                                            onClick={() => {
                                                setReplyTo("");
                                                setReplyToCommentId(null);
                                                setCommentText("");
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                {/* INPUT */}
                                {isActive && (
                                    <form
                                        className="reel-comment-form"
                                        onSubmit={handleCommentSubmit}
                                    >
                                        <input
                                            type="text"
                                            placeholder="Place your comment"
                                            value={commentText}
                                            onChange={(e) =>
                                                setCommentText(e.target.value)
                                            }
                                        />

                                        <button type="submit">➤</button>
                                    </form>
                                )}
                            </aside>
                        </div>
                    </section>
                );
            })}
        </div>
    );
}