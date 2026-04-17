import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import YouTube from "react-youtube";
import "./ReelDetailsPage.css";

function formatCount(value) {
    if (typeof value === "string" && /[a-zA-Z]/.test(value)) {
        return value;
    }

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
        value.trim() &&
        (
            value.startsWith("http://") ||
            value.startsWith("https://") ||
            value.startsWith("/") ||
            value.startsWith("data:image/")
        )
    );
}

function getFirstNonEmptyString(...values) {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }

        if (typeof value === "number" && Number.isFinite(value)) {
            return String(value);
        }
    }

    return "";
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

function createFallbackId(item, index) {
    return String(
        item?.id ||
        item?._id ||
        item?.reelId ||
        item?.videoId ||
        item?.youtubeId ||
        item?.slug ||
        `reel-${index}`
    );
}

function normalizeReel(item, index) {
    const rawVideoValue =
        item?.videoUrl ||
        item?.videoSrc ||
        item?.url ||
        item?.src ||
        item?.file ||
        item?.mediaUrl ||
        item?.youtubeUrl ||
        item?.youtubeId ||
        item?.videoId ||
        "";

    const youtubeId = extractYoutubeId(rawVideoValue) || String(rawVideoValue || "").trim();

    const resolvedChannelId = getFirstNonEmptyString(
        item?.channelId,
        item?.authorId,
        item?.channel?.id,
        item?.channel?._id,
        item?.ownerId,
        item?.uploaderId
    );

    const resolvedCustomUrl = getFirstNonEmptyString(
        item?.customUrl,
        item?.channel?.customUrl,
        item?.authorCustomUrl,
        item?.username,
        item?.handle
    );

    const resolvedChannelRouteValue = getFirstNonEmptyString(
        resolvedChannelId,
        resolvedCustomUrl
    );

    const resolvedAvatar = isValidImageSrc(item?.avatarUrl)
        ? item.avatarUrl
        : isValidImageSrc(item?.authorAvatar)
        ? item.authorAvatar
        : isValidImageSrc(item?.channel?.avatarUrl)
        ? item.channel.avatarUrl
        : isValidImageSrc(item?.channel?.avatar)
        ? item.channel.avatar
        : "/ava.png";

    return {
        id: createFallbackId(item, index),
        channelId: resolvedChannelId,
        customUrl: resolvedCustomUrl,
        channelRouteValue: resolvedChannelRouteValue,
        title: item?.title || "Untitled reel",
        videoUrl: youtubeId,
        posterUrl: item?.posterUrl || item?.thumbnailUrl || item?.thumbnail || item?.preview || "",
        avatarUrl: resolvedAvatar,
        author: item?.author || item?.channelName || item?.channel?.title || item?.name || "Unknown author",
        username: item?.username || item?.handle || item?.channel?.customUrl || "@unknown",
        description: item?.description || item?.caption || "",
        audioTitle: item?.audioTitle || item?.audio || "original audio",
        likes: item?.likes ?? item?.likesCount ?? 0,
        shares: item?.shares ?? item?.sharesCount ?? 0,
        remix: item?.remix ?? item?.remixCount ?? 0,
        commentsCount:
            item?.commentsCount ??
            item?.commentCount ??
            item?.comments_count ??
            item?.totalComments ??
            item?.interactions?.commentsCount ??
            item?.comments?.length ??
            0,
        isSubscribed: Boolean(item?.isSubscribed),
        isLiked: Boolean(item?.isLiked),
        isShared: Boolean(item?.isShared),
        isRemixed: Boolean(item?.isRemixed),
        isMuted: item?.isMuted ?? false,
        rawItem: item,
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
            playlist: reel.videoUrl,
            fs: 0,
            playsinline: 1,
            enablejsapi: 1,
        },
    };

    return (
        <div className="reel-details-video youtube-reel-player" onClick={onMediaClick}>
            <YouTube
                videoId={reel.videoUrl}
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

                    if (reel.isMuted) {
                        try {
                            player.mute();
                        } catch {}
                    }
                }}
            />
        </div>
    );
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
    const [activeReelId, setActiveReelId] = useState(id || "");
    const [activeChannelDetails, setActiveChannelDetails] = useState(null);

    const youtubePlayerRefs = useRef({});
    const playerShellRefs = useRef({});
    const observerRef = useRef(null);

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

                const normalized = rawReels.map((item, index) => normalizeReel(item, index));

                console.log("REELS RAW:", rawReels);
                console.log("REELS NORMALIZED:", normalized);

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
        setActiveReelId(id || "");
    }, [id]);

    useEffect(() => {
        if (!id || !reels.length) return;

        const foundIndex = reels.findIndex(
            (item) => String(item.id) === String(id)
        );

        if (foundIndex !== -1) {
            setActiveIndex(foundIndex);
            return;
        }

        if (hasMore && !isFetchingMore) {
            loadMoreReels();
        }
    }, [id, reels, hasMore, isFetchingMore, loadMoreReels]);

    const activeReel = useMemo(() => {
        if (!reels.length) return null;
        return reels[activeIndex] || reels[0] || null;
    }, [reels, activeIndex]);

    useEffect(() => {
        if (!activeReel) return;

        if (String(activeReelId) !== String(activeReel.id)) {
            setActiveReelId(String(activeReel.id));
            navigate(`/reels-page/${activeReel.id}`, { replace: true });
        }

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
    }, [activeReel, activeIndex, reels.length, navigate, loadMoreReels, activeReelId]);

    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    const reelId = entry.target.dataset.reelId;
                    if (!reelId) return;

                    const foundIndex = reels.findIndex((item) => String(item.id) === String(reelId));
                    if (foundIndex !== -1) {
                        setActiveIndex(foundIndex);
                        setActiveReelId(reelId);
                    }
                });
            },
            {
                threshold: 0.6,
            }
        );

        return () => {
            observerRef.current?.disconnect();
        };
    }, [reels]);

    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl || !activeReel) {
            setActiveChannelDetails(null);
            return;
        }

        let cancelled = false;

        const loadChannelDetails = async () => {
            const candidates = [
                activeReel.channelRouteValue,
                activeReel.channelId,
                activeReel.customUrl,
                activeReel.username,
                activeReel.author,
            ]
                .map((item) => String(item || "").trim())
                .filter(Boolean);

            for (const candidate of candidates) {
                try {
                    const response = await fetch(
                        `${apiUrl}/api/channel/${encodeURIComponent(candidate)}`
                    );

                    const text = await response.text();
                    let data = null;

                    try {
                        data = text ? JSON.parse(text) : null;
                    } catch {
                        data = null;
                    }

                    console.log("REEL CHANNEL RESPONSE:", {
                        candidate,
                        status: response.status,
                        ok: response.ok,
                        data,
                        text,
                    });

                    if (response.ok && data?.channel) {
                        if (!cancelled) {
                            setActiveChannelDetails(data.channel);
                        }
                        return;
                    }
                } catch (error) {
                    console.error("Failed to load reel channel:", candidate, error);
                }
            }

            if (!cancelled) {
                setActiveChannelDetails(null);
            }
        };

        loadChannelDetails();

        return () => {
            cancelled = true;
        };
    }, [activeReel?.id, activeReel?.channelRouteValue, activeReel?.channelId, activeReel?.customUrl, activeReel?.username, activeReel?.author]);

    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl || !activeReel?.id) return;

        let cancelled = false;

        const updateActiveReelMeta = async () => {
            const candidates = [
                `${apiUrl}/api/reels/${encodeURIComponent(activeReel.id)}/comments`,
                `${apiUrl}/api/reels/${encodeURIComponent(activeReel.id)}`,
                `${apiUrl}/api/interactions/video/${encodeURIComponent(activeReel.id)}`,
                activeReel.videoUrl
                    ? `${apiUrl}/api/interactions/video/${encodeURIComponent(activeReel.videoUrl)}`
                    : "",
            ].filter(Boolean);

            for (const url of candidates) {
                try {
                    const response = await fetch(url);
                    const text = await response.text();

                    let data = null;
                    try {
                        data = text ? JSON.parse(text) : null;
                    } catch {
                        data = null;
                    }

                    if (!response.ok || !data) {
                        continue;
                    }

                    const resolvedCommentsCount =
                        data?.commentsCount ??
                        data?.commentCount ??
                        data?.totalComments ??
                        data?.interactions?.commentsCount ??
                        data?.data?.commentsCount ??
                        (Array.isArray(data?.comments) ? data.comments.length : null) ??
                        (Array.isArray(data) ? data.length : null);

                    if (resolvedCommentsCount !== null && resolvedCommentsCount !== undefined) {
                        if (!cancelled) {
                            setReels((prev) =>
                                prev.map((item) =>
                                    String(item.id) === String(activeReel.id)
                                        ? { ...item, commentsCount: resolvedCommentsCount }
                                        : item
                                )
                            );
                        }
                        break;
                    }
                } catch (error) {
                    console.error("Failed to load reel comments count:", url, error);
                }
            }
        };

        updateActiveReelMeta();

        return () => {
            cancelled = true;
        };
    }, [activeReel?.id, activeReel?.videoUrl]);

    const goToPrev = () => {
        if (!reels.length) return;
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    };

    const goToNext = () => {
        if (!reels.length) return;

        if (activeIndex >= reels.length - 2 && hasMore) {
            loadMoreReels();
        }

        setActiveIndex((prev) => {
            if (prev < reels.length - 1) return prev + 1;
            return prev;
        });
    };

    const togglePlay = (reelId) => {
        const youtubePlayer = youtubePlayerRefs.current[reelId];
        if (!youtubePlayer) return;

        try {
            const state = youtubePlayer.getPlayerState?.();

            if (state === 1) {
                youtubePlayer.pauseVideo?.();
            } else {
                youtubePlayer.playVideo?.();
            }
        } catch (error) {
            console.error("Toggle play error:", error);
        }
    };

    const toggleMute = (reelId) => {
        const youtubePlayer = youtubePlayerRefs.current[reelId];
        if (!youtubePlayer) return;

        try {
            const currentlyMuted = youtubePlayer.isMuted?.() ?? true;

            if (currentlyMuted) {
                youtubePlayer.unMute?.();
                youtubePlayer.setVolume?.(100);
            } else {
                youtubePlayer.mute?.();
            }

            setReels((prev) =>
                prev.map((item) =>
                    String(item.id) === String(reelId)
                        ? { ...item, isMuted: !currentlyMuted }
                        : item
                )
            );
        } catch (error) {
            console.error("Toggle mute error:", error);
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
                if (String(item.id) !== String(reelId)) return item;

                const nextLiked = !item.isLiked;
                const nextLikes =
                    typeof item.likes === "number"
                        ? nextLiked
                            ? item.likes + 1
                            : Math.max(item.likes - 1, 0)
                        : item.likes;

                return {
                    ...item,
                    isLiked: nextLiked,
                    likes: nextLikes,
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
                if (String(item.id) !== String(reelId)) return item;

                return {
                    ...item,
                    isShared: true,
                    shares: typeof item.shares === "number"
                        ? (item.isShared ? item.shares : item.shares + 1)
                        : item.shares,
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
                if (String(item.id) !== String(reelId)) return item;

                const nextRemixed = !item.isRemixed;
                const nextRemix =
                    typeof item.remix === "number"
                        ? nextRemixed
                            ? item.remix + 1
                            : Math.max(item.remix - 1, 0)
                        : item.remix;

                return {
                    ...item,
                    isRemixed: nextRemixed,
                    remix: nextRemix,
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

    const handleSubscribe = async () => {
        const token = getAuthToken();

        if (!token) {
            navigate("/login");
            return;
        }

        const channelName =
            activeChannelDetails?.title ||
            activeReel?.author ||
            activeReel?.username;

        if (!channelName) return;

        const previousValue = Boolean(activeReel?.isSubscribed);
        const nextValue = !previousValue;

        setReels((prev) =>
            prev.map((item) =>
                String(item.id) === String(activeReel.id)
                    ? { ...item, isSubscribed: nextValue }
                    : item
            )
        );

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/interactions/subscribe`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        channelName,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to subscribe");
            }
        } catch (error) {
            console.error("Subscribe reel error:", error);
            setReels((prev) =>
                prev.map((item) =>
                    String(item.id) === String(activeReel.id)
                        ? { ...item, isSubscribed: previousValue }
                        : item
                )
            );
        }
    };

    const openReelAuthorPage = () => {
        const routeValue = String(
            activeChannelDetails?.id ||
            activeChannelDetails?.customUrl ||
            activeReel?.channelRouteValue ||
            activeReel?.channelId ||
            activeReel?.customUrl ||
            activeReel?.username ||
            ""
        ).trim();

        console.log("OPEN REEL AUTHOR PAGE:", {
            routeValue,
            activeReel,
            activeChannelDetails,
        });

        if (!routeValue) return;

        navigate(`/reels-author/${encodeURIComponent(routeValue)}`);
    };

    const displayAuthorAvatar =
        (isValidImageSrc(activeChannelDetails?.avatarUrl) && activeChannelDetails.avatarUrl) ||
        activeReel?.avatarUrl ||
        "/ava.png";

    const displayAuthorName =
        activeChannelDetails?.title ||
        activeReel?.author ||
        "Unknown author";

    const displayAuthorUsername =
        activeChannelDetails?.customUrl ||
        activeReel?.username ||
        "@unknown";

    const canOpenAuthorPage = Boolean(
        activeChannelDetails?.id ||
        activeChannelDetails?.customUrl ||
        activeReel?.channelRouteValue ||
        activeReel?.channelId ||
        activeReel?.customUrl ||
        activeReel?.username
    );

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
                            data-reel-id={activeReel.id}
                            ref={(node) => {
                                playerShellRefs.current[activeReel.id] = node;
                                if (node && observerRef.current) {
                                    observerRef.current.observe(node);
                                }
                            }}
                        >
                            <ReelMedia
                                reel={activeReel}
                                isActive={String(activeReelId) === String(activeReel.id)}
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
                                src={displayAuthorAvatar}
                                alt={displayAuthorName}
                                className="reel-author-avatar"
                                onClick={canOpenAuthorPage ? openReelAuthorPage : undefined}
                                style={{ cursor: canOpenAuthorPage ? "pointer" : "default" }}
                                onError={(e) => {
                                    e.currentTarget.src = "/ava.png";
                                }}
                            />
                            <div
                                className="reel-author-text"
                                onClick={canOpenAuthorPage ? openReelAuthorPage : undefined}
                                style={{ cursor: canOpenAuthorPage ? "pointer" : "default" }}
                            >
                                <h2>{displayAuthorName}</h2>
                                <p>{displayAuthorUsername}</p>
                            </div>
                            <button
                                type="button"
                                className={`reel-subscribe-btn ${activeReel.isSubscribed ? "is-subscribed" : ""}`}
                                onClick={handleSubscribe}
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
                            <div className="reel-details-loading" style={{ marginTop: "12px", minHeight: "auto" }}>
                                Loading more reels...
                            </div>
                        )}
                    </aside>
                </div>
            </section>
        </div>
    );
}