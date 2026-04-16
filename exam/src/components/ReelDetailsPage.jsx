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

function normalizeReel(item) {
    const rawVideoValue =
        item?.videoUrl ||
        item?.videoSrc ||
        item?.url ||
        item?.src ||
        item?.youtubeUrl ||
        item?.youtubeId ||
        item?.videoId ||
        "";

    const directVideoUrl = isDirectVideoUrl(rawVideoValue) ? rawVideoValue : "";
    const youtubeId = directVideoUrl ? "" : extractYoutubeId(rawVideoValue);

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
        commentsCount: Number(item?.commentsCount ?? item?.comments?.length) || 0,
        isSubscribed: Boolean(item?.isSubscribed),
        isLiked: Boolean(item?.isLiked),
        isShared: Boolean(item?.isShared),
        isRemixed: Boolean(item?.isRemixed),
        isMuted: item?.isMuted ?? false,
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
                preload="metadata"
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
    const [activeIndex, setActiveIndex] = useState(0);

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

                const text = await response.text();
                let data = {};

                try {
                    data = text ? JSON.parse(text) : {};
                } catch (error) {
                    console.error("Failed to parse reels JSON:", error);
                    data = {};
                }

                if (!response.ok) {
                    throw new Error(data?.message || text || "Failed to load reels");
                }

                const rawReels = Array.isArray(data?.reels)
                    ? data.reels
                    : Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data?.items)
                    ? data.items
                    : [];

                const normalized = rawReels
                    .map(normalizeReel)
                    .filter((item) => item.id);

                setReels((prev) =>
                    append ? mergeUniqueById(prev, normalized) : normalized
                );

                if (typeof data?.hasMore === "boolean") {
                    setHasMore(data.hasMore);
                } else if (typeof data?.pagination?.hasMore === "boolean") {
                    setHasMore(data.pagination.hasMore);
                } else {
                    setHasMore(normalized.length === 5);
                }

                setPage(pageToLoad);
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
        []
    );

    const loadMoreReels = useCallback(async () => {
        if (loading || isFetchingMore || !hasMore) return;
        await loadReels(page + 1, true);
    }, [hasMore, isFetchingMore, loadReels, loading, page]);

    useEffect(() => {
        loadReels(1, false);
    }, [loadReels]);

    useEffect(() => {
        if (!reels.length) return;

        let nextIndex = 0;

        if (id) {
            const foundIndex = reels.findIndex((item) => String(item.id) === String(id));
            if (foundIndex !== -1) {
                nextIndex = foundIndex;
            }
        }

        setActiveIndex(nextIndex);
    }, [id, reels]);

    const activeReel = useMemo(() => {
        if (!reels.length) return null;
        return reels[activeIndex] || reels[0] || null;
    }, [reels, activeIndex]);

    useEffect(() => {
        if (!activeReel) return;

        navigate(`/reels-page/${activeReel.id}`, { replace: true });

        Object.entries(videoRefs.current).forEach(([reelId, video]) => {
            if (!video || typeof video.play !== "function") return;

            if (String(reelId) === String(activeReel.id)) {
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });

        Object.entries(youtubePlayerRefs.current).forEach(([reelId, player]) => {
            if (!player) return;

            try {
                if (String(reelId) === String(activeReel.id)) {
                    player.playVideo?.();
                } else {
                    player.pauseVideo?.();
                }
            } catch {}
        });

        if (activeIndex >= reels.length - 2) {
            loadMoreReels();
        }
    }, [activeReel, activeIndex, reels.length, navigate, loadMoreReels]);

    const goToPrev = () => {
        if (!reels.length) return;
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    };

    const goToNext = () => {
        if (!reels.length) return;

        setActiveIndex((prev) => {
            const nextIndex = prev < reels.length - 1 ? prev + 1 : prev;
            return nextIndex;
        });
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

    if (loading) {
        return <div className="reel-details-loading">Loading reels...</div>;
    }

    if (!reels.length || !activeReel) {
        return <div className="reel-details-loading">No reels found</div>;
    }

    return (
        <div className="reel-feed-page reel-feed-page--buttons-only">
            <section className="reel-feed-section reel-feed-section--single">
                <div className="reel-details-layout">
                    <div className="reel-details-video-wrap">
                        <div
                            className="reel-player-shell"
                            ref={(node) => {
                                playerShellRefs.current[activeReel.id] = node;
                            }}
                        >
                            <ReelMedia
                                reel={activeReel}
                                isActive={true}
                                setVideoNode={(node) => {
                                    videoRefs.current[activeReel.id] = node;
                                }}
                                setYoutubePlayer={(player) => {
                                    youtubePlayerRefs.current[activeReel.id] = player;
                                }}
                                onMediaClick={() => togglePlay(activeReel.id)}
                            />

                            <div className="reel-player-controls">
                                <button
                                    type="button"
                                    className="reel-player-btn"
                                    onClick={() => togglePlay(activeReel.id)}
                                >
                                    Play / Pause
                                </button>

                                <button
                                    type="button"
                                    className="reel-player-btn"
                                    onClick={() => toggleMute(activeReel.id)}
                                >
                                    {activeReel.isMuted ? "Unmute" : "Mute"}
                                </button>

                                <button
                                    type="button"
                                    className="reel-player-btn"
                                    onClick={() => toggleFullscreen(activeReel.id)}
                                >
                                    Fullscreen
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="reel-details-actions">
                        <button
                            type="button"
                            className="reel-side-action"
                            onClick={goToPrev}
                            disabled={activeIndex === 0}
                        >
                            <span>↑</span>
                            <small>Prev</small>
                        </button>

                        <button
                            type="button"
                            className="reel-side-action"
                            onClick={goToNext}
                            disabled={activeIndex === reels.length - 1 && !hasMore}
                        >
                            <span>↓</span>
                            <small>Next</small>
                        </button>

                        <button
                            type="button"
                            className={`reel-side-action ${activeReel.isLiked ? "is-active" : ""}`}
                            onClick={() => handleLike(activeReel.id)}
                        >
                            <span>♡</span>
                            <small>{formatCount(activeReel.likes)}</small>
                        </button>

                        <button
                            type="button"
                            className="reel-side-action"
                            onClick={() => navigate(`/reels-page/${activeReel.id}/comments`)}
                        >
                            <span>💬</span>
                            <small>{formatCount(activeReel.commentsCount)}</small>
                        </button>

                        <button
                            type="button"
                            className={`reel-side-action ${activeReel.isShared ? "is-active" : ""}`}
                            onClick={() => handleShare(activeReel.id)}
                        >
                            <span>↗</span>
                            <small>{formatCount(activeReel.shares)}</small>
                        </button>

                        <button
                            type="button"
                            className={`reel-side-action ${activeReel.isRemixed ? "is-active" : ""}`}
                            onClick={() => handleRemix(activeReel.id)}
                        >
                            <span>⤴</span>
                            <small>{formatCount(activeReel.remix)}</small>
                        </button>
                    </div>

                    <aside className="reel-details-info">
                        <div className="reel-author-row">
                            <img
                                src={activeReel.avatarUrl}
                                alt={activeReel.author}
                                className="reel-author-avatar"
                                onError={(e) => {
                                    e.currentTarget.src = "/ava.png";
                                }}
                            />

                            <div className="reel-author-text">
                                <h2>{activeReel.author}</h2>
                                <p>{activeReel.username}</p>
                            </div>

                            <button
                                type="button"
                                className={`reel-subscribe-btn ${activeReel.isSubscribed ? "is-subscribed" : ""}`}
                                onClick={() => handleSubscribe(activeReel.id)}
                            >
                                {activeReel.isSubscribed ? "Subscribed" : "Subscribe"}
                            </button>
                        </div>

                        <div className="reel-description-box">
                            <h3>{activeReel.description}</h3>

                            <div className="reel-audio-row">
                                <span className="reel-audio-icon">♫</span>
                                <span>{activeReel.audioTitle}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="open-comments-page-btn"
                            onClick={() => navigate(`/reels-page/${activeReel.id}/comments`)}
                        >
                            Open comments
                        </button>

                        <div className="reel-index-indicator">
                            {activeIndex + 1} / {reels.length}
                        </div>

                        {isFetchingMore && (
                            <div className="reel-details-loading" style={{ marginTop: "12px" }}>
                                Loading more reels...
                            </div>
                        )}
                    </aside>
                </div>
            </section>
        </div>
    );
}