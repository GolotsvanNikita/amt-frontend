import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import YouTube from "react-youtube";
import "./ReelDetailsPage.css";

function formatCount(value) {
    const numericValue = Number(value) || 0;

    if (numericValue >= 1000000) return `${(numericValue / 1000000).toFixed(1)}M`;
    if (numericValue >= 1000) return `${(numericValue / 1000).toFixed(1)}K`;
    return String(numericValue);
}

function getAuthToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("authToken") ||
        sessionStorage.getItem("jwt") ||
        sessionStorage.getItem("accessToken") ||
        ""
    );
}

function isValidImageSrc(value) {
    return (
        typeof value === "string" &&
        (
            value.startsWith("http://") ||
            value.startsWith("https://") ||
            value.startsWith("/") ||
            value.startsWith("data:image/")
        )
    );
}

function isDirectVideoUrl(value) {
    if (typeof value !== "string" || !value.trim()) return false;

    const lower = value.toLowerCase();

    return (
        lower.startsWith("http://") ||
        lower.startsWith("https://") ||
        lower.startsWith("/") ||
        lower.endsWith(".mp4") ||
        lower.endsWith(".webm") ||
        lower.endsWith(".ogg") ||
        lower.includes(".mp4?") ||
        lower.includes(".webm?") ||
        lower.includes(".ogg?")
    );
}

function extractYoutubeId(value) {
    if (typeof value !== "string" || !value.trim()) return "";

    const trimmed = value.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed;
    }

    try {
        const url = new URL(trimmed);

        if (url.hostname.includes("youtube.com")) {
            const v = url.searchParams.get("v");
            if (v) return v;

            const parts = url.pathname.split("/").filter(Boolean);
            const maybeId = parts[parts.length - 1];
            if (maybeId && /^[a-zA-Z0-9_-]{11}$/.test(maybeId)) {
                return maybeId;
            }
        }

        if (url.hostname.includes("youtu.be")) {
            const maybeId = url.pathname.replace("/", "");
            if (/^[a-zA-Z0-9_-]{11}$/.test(maybeId)) {
                return maybeId;
            }
        }
    } catch {
        return "";
    }

    return "";
}

function normalizeReply(reply) {
    return {
        id: String(reply?.id || reply?._id || Math.random().toString(36).slice(2)),
        user: reply?.user || reply?.name || reply?.author || reply?.username || "Unknown user",
        avatar: isValidImageSrc(reply?.avatar)
            ? reply.avatar
            : isValidImageSrc(reply?.authorAvatar)
            ? reply.authorAvatar
            : "/ava.png",
        text: reply?.text || reply?.content || "",
        time: reply?.time || reply?.createdAt || "just now",
    };
}

function normalizeComment(comment) {
    return {
        id: String(comment?.id || comment?._id || Math.random().toString(36).slice(2)),
        user: comment?.user || comment?.name || comment?.author || comment?.username || "Unknown user",
        avatar: isValidImageSrc(comment?.avatar)
            ? comment.avatar
            : isValidImageSrc(comment?.authorAvatar)
            ? comment.authorAvatar
            : "/ava.png",
        text: comment?.text || comment?.content || "",
        time: comment?.time || comment?.createdAt || "just now",
        replies: Array.isArray(comment?.replies)
            ? comment.replies.map(normalizeReply)
            : [],
    };
}

function normalizeReel(item) {
    const rawVideoValue =
        item?.videoUrl ||
        item?.videoSrc ||
        item?.url ||
        item?.src ||
        item?.youtubeId ||
        item?.videoId ||
        "";

    const directVideoUrl = isDirectVideoUrl(rawVideoValue) ? rawVideoValue : "";
    const youtubeId = directVideoUrl ? "" : extractYoutubeId(rawVideoValue);

    const rawComments = Array.isArray(item?.comments)
        ? item.comments
        : Array.isArray(item?.comments?.items)
        ? item.comments.items
        : Array.isArray(item?.comments?.data)
        ? item.comments.data
        : [];

    return {
        id: String(item?.id || item?._id || item?.youtubeId || item?.videoId || ""),
        title: item?.title || "Untitled reel",
        videoUrl: directVideoUrl,
        youtubeId,
        posterUrl: item?.posterUrl || item?.thumbnailUrl || item?.thumbnail || "",
        avatarUrl: isValidImageSrc(item?.avatarUrl)
            ? item.avatarUrl
            : isValidImageSrc(item?.authorAvatar)
            ? item.authorAvatar
            : "/ava.png",
        author: item?.author || item?.channelName || item?.name || "Unknown author",
        username: item?.username || item?.handle || "@unknown",
        description: item?.description || "",
        audioTitle: item?.audioTitle || item?.audio || "original audio",
        likes: Number(item?.likes ?? item?.likesCount) || 0,
        shares: Number(item?.shares ?? item?.sharesCount) || 0,
        remix: Number(item?.remix ?? item?.remixCount) || 0,
        isSubscribed: Boolean(item?.isSubscribed),
        isLiked: Boolean(item?.isLiked),
        isShared: Boolean(item?.isShared),
        isRemixed: Boolean(item?.isRemixed),
        isMuted: item?.isMuted ?? false,
        comments: rawComments.map(normalizeComment),
    };
}

function mergeUniqueById(prev, next) {
    const map = new Map();

    [...prev, ...next].forEach((item) => {
        map.set(String(item.id), item);
    });

    return Array.from(map.values());
}

function ReelMedia({
    reel,
    isActive,
    setVideoNode,
    setYoutubePlayer,
    onMediaClick,
}) {
    const youtubeOpts = {
        width: "100%",
        height: "100%",
        playerVars: {
            autoplay: isActive ? 1 : 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            loop: 1,
            playlist: reel.youtubeId,
            fs: 0,
            playsinline: 1,
            enablejsapi: 1,
        },
    };

    if (reel.youtubeId) {
        return (
            <div className="reel-details-video youtube-reel-player" onClick={onMediaClick}>
                <YouTube
                    videoId={reel.youtubeId}
                    opts={youtubeOpts}
                    className="reel-youtube-frame"
                    onReady={(event) => {
                        const player = event.target;
                        setYoutubePlayer(player);

                        if (isActive) {
                            setTimeout(() => {
                                try {
                                    player.playVideo();
                                } catch {}
                            }, 100);
                        }
                    }}
                />
            </div>
        );
    }

    if (reel.videoUrl) {
        return (
            <video
                ref={setVideoNode}
                className="reel-details-video"
                src={reel.videoUrl}
                poster={reel.posterUrl || ""}
                controls={false}
                playsInline
                autoPlay={isActive}
                muted={Boolean(reel.isMuted)}
                loop
                onClick={onMediaClick}
            />
        );
    }

    return <div className="reel-details-video reel-video-fallback">Video unavailable</div>;
}

export function FullReels() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [activeReelId, setActiveReelId] = useState(id ? String(id) : "");
    const [commentText, setCommentText] = useState("");
    const [replyTo, setReplyTo] = useState("");
    const [replyToCommentId, setReplyToCommentId] = useState(null);
    const [expandedReplies, setExpandedReplies] = useState({});

    const feedRef = useRef(null);
    const sectionRefs = useRef({});
    const observerRef = useRef(null);
    const videoRefs = useRef({});
    const youtubePlayerRefs = useRef({});
    const playerShellRefs = useRef({});

    const loadReels = useCallback(
        async (pageToLoad = 1, append = false) => {
            try {
                if (pageToLoad === 1 && !append) {
                    setLoading(true);
                } else {
                    setIsFetchingMore(true);
                }

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/reels?page=${pageToLoad}&limit=5`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.message || "Failed to load reels");
                }

                const rawReels = Array.isArray(data?.reels)
                    ? data.reels
                    : Array.isArray(data)
                    ? data
                    : [];

                console.log("RAW REELS:", rawReels);
                console.log("FIRST REEL COMMENTS:", rawReels?.[0]?.comments);

                const normalized = rawReels
                    .map(normalizeReel)
                    .filter((item) => item.id);

                setReels((prev) =>
                    append ? mergeUniqueById(prev, normalized) : normalized
                );

                if (typeof data?.hasMore === "boolean") {
                    setHasMore(data.hasMore);
                } else {
                    setHasMore(normalized.length === 5);
                }

                setPage(pageToLoad);

                if (pageToLoad === 1 && !id && normalized.length > 0) {
                    setActiveReelId(normalized[0].id);
                    navigate(`/reels-page/${normalized[0].id}`, { replace: true });
                }
            } catch (error) {
                console.error("Failed to load reels:", error);
                if (!append) {
                    setReels([]);
                }
            } finally {
                setLoading(false);
                setIsFetchingMore(false);
            }
        },
        [id, navigate]
    );

    const loadMoreReels = useCallback(async () => {
        if (loading || isFetchingMore || !hasMore) return;
        await loadReels(page + 1, true);
    }, [hasMore, isFetchingMore, loadReels, loading, page]);

    useEffect(() => {
        loadReels(1, false);
    }, [loadReels]);

    useEffect(() => {
        if (id) {
            setActiveReelId(String(id));
        }
    }, [id]);

    useEffect(() => {
        if (!reels.length || !activeReelId) return;

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
                const reelId = String(entry.target.dataset.reelId);
                const htmlVideo = videoRefs.current[reelId];
                const youtubePlayer = youtubePlayerRefs.current[reelId];

                if (entry.isIntersecting) {
                    setActiveReelId(reelId);
                    navigate(`/reels-page/${reelId}`, { replace: true });

                    const currentIndex = reels.findIndex(
                        (item) => String(item.id) === reelId
                    );

                    if (currentIndex >= reels.length - 2) {
                        loadMoreReels();
                    }

                    if (htmlVideo && typeof htmlVideo.play === "function") {
                        htmlVideo.play().catch(() => {});
                    }

                    if (youtubePlayer) {
                        try {
                            youtubePlayer.playVideo?.();
                        } catch {}
                    }
                } else {
                    if (htmlVideo && typeof htmlVideo.pause === "function") {
                        htmlVideo.pause();
                    }

                    if (youtubePlayer) {
                        try {
                            youtubePlayer.pauseVideo?.();
                        } catch {}
                    }
                }
            });
        }, options);

        reels.forEach((reel) => {
            const section = sectionRefs.current[reel.id];
            if (section) {
                observerRef.current.observe(section);
            }
        });

        return () => {
            observerRef.current?.disconnect();
        };
    }, [loadMoreReels, navigate, reels]);

    const activeReel = useMemo(
        () => reels.find((item) => String(item.id) === String(activeReelId)) || null,
        [reels, activeReelId]
    );

    const scrollToReelByIndex = (direction) => {
        if (!reels.length) return;

        const currentIndex = reels.findIndex(
            (item) => String(item.id) === String(activeReelId)
        );

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
        const htmlVideo = videoRefs.current[reelId];
        const youtubePlayer = youtubePlayerRefs.current[reelId];

        if (htmlVideo) {
            if (htmlVideo.paused) {
                htmlVideo.play().catch(() => {});
            } else {
                htmlVideo.pause();
            }
            return;
        }

        if (youtubePlayer) {
            const state = youtubePlayer.getPlayerState?.();

            try {
                if (youtubePlayer.isMuted?.()) {
                    youtubePlayer.unMute?.();
                    youtubePlayer.setVolume?.(100);
                }
            } catch {}

            if (state === 1) {
                youtubePlayer.pauseVideo?.();
            } else {
                youtubePlayer.playVideo?.();
            }
        }
    };

    const toggleMute = (reelId) => {
        const htmlVideo = videoRefs.current[reelId];
        const youtubePlayer = youtubePlayerRefs.current[reelId];

        if (htmlVideo) {
            const nextMuted = !htmlVideo.muted;
            htmlVideo.muted = nextMuted;

            setReels((prev) =>
                prev.map((item) =>
                    item.id === reelId ? { ...item, isMuted: nextMuted } : item
                )
            );
            return;
        }

        if (youtubePlayer) {
            const currentlyMuted = youtubePlayer.isMuted?.() ?? true;

            if (currentlyMuted) {
                youtubePlayer.unMute?.();
                youtubePlayer.setVolume?.(100);
            } else {
                youtubePlayer.mute?.();
            }

            setReels((prev) =>
                prev.map((item) =>
                    item.id === reelId
                        ? { ...item, isMuted: !currentlyMuted }
                        : item
                )
            );
        }
    };

    const toggleFullscreen = (reelId) => {
        const shell = playerShellRefs.current[reelId];
        if (!shell) return;

        if (document.fullscreenElement) {
            document.exitFullscreen?.();
        } else {
            shell.requestFullscreen?.();
        }
    };

    const handleLike = async (reelId) => {
        const token = getAuthToken();

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

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/reels/${reelId}/like`, {
                method: "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
        } catch (error) {
            console.error("Like reel error:", error);
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
            console.error("Copy reel link error:", error);
        }

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/reels/${reelId}/share`, {
                method: "POST",
            });
        } catch (error) {
            console.error("Share reel error:", error);
        }
    };

    const handleRemix = async (reelId) => {
        const token = getAuthToken();

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

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/reels/${reelId}/remix`, {
                method: "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
        } catch (error) {
            console.error("Remix reel error:", error);
        }
    };

    const handleSubscribe = async (reelId) => {
        const token = getAuthToken();

        setReels((prev) =>
            prev.map((item) =>
                item.id === reelId
                    ? { ...item, isSubscribed: !item.isSubscribed }
                    : item
            )
        );

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/reels/${reelId}/subscribe`, {
                method: "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
        } catch (error) {
            console.error("Subscribe reel error:", error);
        }
    };

    const handleReplyClick = (commentId, commentUser) => {
        setReplyTo(commentUser);
        setReplyToCommentId(commentId);
        setCommentText(`@${commentUser} `);
    };

    const toggleReplies = (commentId) => {
        setExpandedReplies((prev) => ({
            ...prev,
            [commentId]: !prev[commentId],
        }));
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();

        if (!activeReel) return;

        const trimmed = commentText.trim();
        if (!trimmed) return;

        const token = getAuthToken();

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/reels/${activeReel.id}/comments`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        text: trimmed,
                        parentCommentId: replyToCommentId,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData?.message || "Failed to add comment");
            }

            await loadReels(1, false);

            setCommentText("");
            setReplyTo("");
            setReplyToCommentId(null);
        } catch (error) {
            console.error("Add reel comment error:", error);
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
                const isActive = String(reel.id) === String(activeReelId);

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
                            <div className="reel-details-video-wrap">
                                <div
                                    className="reel-player-shell"
                                    ref={(node) => {
                                        playerShellRefs.current[reel.id] = node;
                                    }}
                                >
                                    <ReelMedia
                                        reel={reel}
                                        isActive={isActive}
                                        setVideoNode={(node) => {
                                            videoRefs.current[reel.id] = node;
                                        }}
                                        setYoutubePlayer={(player) => {
                                            youtubePlayerRefs.current[reel.id] = player;
                                        }}
                                        onMediaClick={() => togglePlay(reel.id)}
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

                                        <button
                                            type="button"
                                            className="reel-player-btn"
                                            onClick={() => toggleFullscreen(reel.id)}
                                        >
                                            Fullscreen
                                        </button>
                                    </div>
                                </div>
                            </div>

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

                            <aside className="reel-details-info">
                                <div className="reel-author-row">
                                    <img
                                        src={reel.avatarUrl}
                                        alt={reel.author}
                                        className="reel-author-avatar"
                                        onError={(e) => {
                                            e.currentTarget.src = "/ava.png";
                                        }}
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

                                <div className="reel-comments-list">
                                    {reel.comments.length === 0 ? (
                                        <p className="reel-no-comments">No comments yet</p>
                                    ) : (
                                        reel.comments.map((comment) => {
                                            const replies = comment.replies || [];
                                            const isExpanded = !!expandedReplies[comment.id];

                                            return (
                                                <div key={comment.id} className="reel-comment-thread">
                                                    <div className="reel-comment-item">
                                                        <img
                                                            src={comment.avatar}
                                                            alt={comment.user}
                                                            className="reel-comment-avatar"
                                                            onError={(e) => {
                                                                e.currentTarget.src = "/ava.png";
                                                            }}
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
                                                                                onError={(e) => {
                                                                                    e.currentTarget.src = "/ava.png";
                                                                                }}
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

                                {isActive && (
                                    <form
                                        className="reel-comment-form"
                                        onSubmit={handleCommentSubmit}
                                    >
                                        <input
                                            type="text"
                                            placeholder="Place your comment"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                        />

                                        <button type="submit">➤</button>
                                    </form>
                                )}

                                {isFetchingMore && (
                                    <div className="reel-details-loading" style={{ marginTop: "12px" }}>
                                        Loading more reels...
                                    </div>
                                )}
                            </aside>
                        </div>
                    </section>
                );
            })}
        </div>
    );
}