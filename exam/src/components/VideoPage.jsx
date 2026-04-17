import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import skipPrevious from "../assets/skip_previous.svg";
import playArrow from "../assets/play_arrow.svg";
import skipNext from "../assets/skip_next.svg";
import muteSvg from "../assets/Frame 253.svg";
import Like from "../assets/heart.svg";
import Forward from "../assets/forward.svg";
import Plus from "../assets/Component 170.svg";
import ArrowDown from "../assets/ArrowDown.svg";
import YouTube from "react-youtube";
import "./VideoPage.css";
import { useNavigate } from "react-router-dom";

function parseViewsToNumber(views) {
    if (typeof views === "number" && Number.isFinite(views)) {
        return Math.floor(views);
    }

    if (!views || typeof views !== "string") {
        return 0;
    }

    const cleaned = views.trim();
    const match = cleaned.match(/([\d.,]+)\s*([KMB])?/i);

    if (!match) {
        const plainNumber = Number(cleaned.replace(/[^\d.]/g, ""));
        return Number.isFinite(plainNumber) ? Math.floor(plainNumber) : 0;
    }

    let value = parseFloat(match[1].replace(/,/g, ""));
    const suffix = (match[2] || "").toUpperCase();

    if (!Number.isFinite(value)) {
        return 0;
    }

    if (suffix === "K") value *= 1_000;
    if (suffix === "M") value *= 1_000_000;
    if (suffix === "B") value *= 1_000_000_000;

    return Math.floor(value);
}

function formatViews(views) {
    const numericViews = Number(views) || 0;

    if (numericViews >= 1_000_000) {
        return `${(numericViews / 1_000_000).toFixed(1)}M views`;
    }

    if (numericViews >= 1_000) {
        return `${(numericViews / 1_000).toFixed(1)}K views`;
    }

    return `${numericViews} views`;
}

function formatLikes(value) {
    const numericValue = Number(value) || 0;

    if (numericValue >= 1_000_000) {
        return `${(numericValue / 1_000_000).toFixed(1)}M`;
    }

    if (numericValue >= 1_000) {
        return `${(numericValue / 1_000).toFixed(1)}K`;
    }

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
    if (!value || typeof value !== "string") return false;

    const trimmed = value.trim();

    return (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("/") ||
        trimmed.startsWith("data:image/")
    );
}

function getFirstNonEmptyString(...values) {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return "";
}

function getFirstValidImage(...values) {
    for (const value of values) {
        if (isValidImageSrc(value)) {
            return value.trim();
        }
    }

    return "";
}

function getResolvedId(video) {
    return getFirstNonEmptyString(
        String(video?.videoId ?? ""),
        String(video?.id ?? ""),
        String(video?._id ?? ""),
        String(video?.youtubeId ?? ""),
        String(video?.resolvedId ?? "")
    );
}

function normalizeVideo(video = {}) {
    const resolvedId = getResolvedId(video);

    const resolvedChannelId = getFirstNonEmptyString(
        video?.channelId,
        video?.authorId,
        video?.channel?.id,
        video?.channel?._id,
        video?.snippet?.channelId,
        video?.authorChannelId,
        video?.uploaderId,
        video?.ownerId
    );

    const resolvedCustomUrl = getFirstNonEmptyString(
        video?.customUrl,
        video?.resolvedCustomUrl,
        video?.channel?.customUrl,
        video?.channelCustomUrl,
        video?.authorCustomUrl
    );

    const resolvedChannelName = getFirstNonEmptyString(
        video?.channelName,
        video?.author,
        video?.channel?.title,
        video?.channel?.name,
        video?.ownerName,
        video?.snippet?.channelTitle,
        "Unknown channel"
    );

    const resolvedTitle = getFirstNonEmptyString(
        video?.title,
        video?.snippet?.title,
        video?.name,
        "Untitled video"
    );

    const resolvedThumbnail = getFirstValidImage(
        video?.thumbnailUrl,
        video?.thumbnail,
        video?.preview,
        video?.imageUrl,
        video?.snippet?.thumbnails?.high?.url,
        video?.snippet?.thumbnails?.medium?.url,
        video?.snippet?.thumbnails?.default?.url,
        "/1v.png"
    ) || "/1v.png";

    const resolvedChannelAvatar = getFirstValidImage(
        video?.channel?.avatarUrl,
        video?.channelAvatar,
        video?.authorAvatar,
        video?.ownerAvatar,
        video?.channel?.thumbnailUrl,
        "/ava.png"
    ) || "/ava.png";

    const resolvedPublishedAt = getFirstNonEmptyString(
        video?.publishedAt,
        video?.time,
        video?.published,
        video?.createdAt,
        video?.snippet?.publishedAt
    );

    const resolvedDescription = getFirstNonEmptyString(
        video?.description,
        video?.snippet?.description,
        " "
    );

    const resolvedSubscriberCount = getFirstNonEmptyString(
        typeof video?.channel?.subscriberCount === "number"
            ? String(video.channel.subscriberCount)
            : video?.channel?.subscriberCount,
        typeof video?.subscriberCount === "number"
            ? String(video.subscriberCount)
            : video?.subscriberCount,
        typeof video?.channelSubscribers === "number"
            ? String(video.channelSubscribers)
            : video?.channelSubscribers
    );

    const resolvedViewsRaw =
        video?.viewsCount ??
        video?.viewCount ??
        video?.views ??
        video?.snippet?.viewCount ??
        0;

    const resolvedViews =
        typeof resolvedViewsRaw === "number"
            ? Math.floor(resolvedViewsRaw)
            : parseViewsToNumber(resolvedViewsRaw);

    const channelRouteValue = getFirstNonEmptyString(
        resolvedChannelId,
        resolvedCustomUrl
    );

    return {
        ...video,

        channelId: resolvedChannelId,
        resolvedChannelId,
        resolvedCustomUrl,
        resolvedChannelName,
        resolvedChannelAvatar,
        resolvedChannelRouteValue: channelRouteValue,

        resolvedId,
        resolvedTitle,
        resolvedThumbnail,
        resolvedPublishedAt,
        resolvedViews,
        resolvedDescription,
        resolvedSubscriberCount,

        isSubscribed:
            typeof video?.isSubscribed === "boolean"
                ? video.isSubscribed
                : false,

        category: getFirstNonEmptyString(
            video?.category,
            video?.genre,
            video?.type
        ),
    };
}

function shuffleArray(arr) {
    const copy = [...arr];

    for (let i = copy.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
    }

    return copy;
}

export function YouTubeCustomPlayer({
    routeVideoId = "",
    initialVideo = null,
    likes = 0,
    setLikes = null,
}) {
    const playerRef = useRef(null);
    const navigate = useNavigate();

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [volume, setVolume] = useState(100);
    const [showSettings, setShowSettings] = useState(false);
    const [availableRates, setAvailableRates] = useState([1]);
    const [playbackRate, setPlayBackRate] = useState(1);
    const [captionsAvailable, setCaptionsAbailable] = useState(false);

    const [expandedDescription, setExpandedDescription] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [localLikes, setLocalLikes] = useState(Number(likes) || 0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [muted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showVideo, setShowVideo] = useState(true);

    useEffect(() => {
        const loadVideos = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/video/all`);

                if (!response.ok) {
                    throw new Error("Failed to load videos");
                }

                const data = await response.json();

                const rawVideos = Array.isArray(data?.videos)
                    ? data.videos
                    : Array.isArray(data)
                    ? data
                    : [];

                const normalized = rawVideos.map(normalizeVideo);

                console.log("ROUTE VIDEO ID:", routeVideoId);
                console.log("VIDEOS:", normalized.slice(0, 5));

                setVideos(normalized);
            } catch (err) {
                console.error(err);
                setError(err.message || "Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        loadVideos();
    }, [routeVideoId]);

    const normalizedInitialVideo = useMemo(() => {
        return initialVideo ? normalizeVideo(initialVideo) : null;
    }, [initialVideo]);

    const currentVideo = useMemo(() => {
        if (videos.length > 0) {
            const found = videos.find(
                (video) => String(video.resolvedId) === String(routeVideoId)
            );

            if (found) {
                return found;
            }
        }

        if (
            normalizedInitialVideo &&
            String(normalizedInitialVideo.resolvedId) === String(routeVideoId)
        ) {
            return normalizedInitialVideo;
        }

        return normalizedInitialVideo || null;
    }, [videos, routeVideoId, normalizedInitialVideo]);

    useEffect(() => {
        setIsSubscribed(Boolean(currentVideo?.isSubscribed));
    }, [currentVideo?.resolvedId, currentVideo?.isSubscribed]);

    useEffect(() => {
        setLocalLikes(Number(likes) || 0);
    }, [likes, currentVideo?.resolvedId]);

    useEffect(() => {
        const loadInteractions = async () => {
            if (!currentVideo?.resolvedId) return;

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/interactions/video/${currentVideo.resolvedId}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.message || "Failed to load interactions");
                }

                console.log("VIDEO INTERACTIONS:", data);
                console.log("OPEN CHANNEL FULL VIDEO:", JSON.stringify(currentVideo, null, 2));

                const likesCount =
                    data?.likesCount ??
                    data?.interactions?.likesCount ??
                    data?.data?.likesCount ??
                    0;

                setLocalLikes(Number(likesCount) || 0);

                if (typeof setLikes === "function") {
                    setLikes(Number(likesCount) || 0);
                }

                if (typeof data?.isSubscribed === "boolean") {
                    setIsSubscribed(data.isSubscribed);
                } else if (typeof data?.video?.isSubscribed === "boolean") {
                    setIsSubscribed(data.video.isSubscribed);
                }
            } catch (err) {
                console.error("Failed to load video interactions:", err);
            }
        };

        loadInteractions();
    }, [currentVideo?.resolvedId, setLikes]);

    const recommendedVideos = useMemo(() => {
        if (!currentVideo || !Array.isArray(videos)) return [];

        const filtered = videos.filter(
            (video) =>
                video &&
                video.resolvedId &&
                String(video.resolvedId) !== String(currentVideo.resolvedId)
        );

        const sameChannel = filtered.filter(
            (video) =>
                video.resolvedChannelName &&
                currentVideo.resolvedChannelName &&
                video.resolvedChannelName === currentVideo.resolvedChannelName
        );

        const sameCategory = filtered.filter(
            (video) =>
                video.category &&
                currentVideo.category &&
                video.category === currentVideo.category &&
                video.resolvedChannelName !== currentVideo.resolvedChannelName
        );

        const others = filtered.filter(
            (video) =>
                !sameChannel.some((item) => item.resolvedId === video.resolvedId) &&
                !sameCategory.some((item) => item.resolvedId === video.resolvedId)
        );

        return [
            ...shuffleArray(sameChannel),
            ...shuffleArray(sameCategory),
            ...shuffleArray(others),
        ];
    }, [
        videos,
        currentVideo?.resolvedId,
        currentVideo?.resolvedChannelName,
        currentVideo?.category,
    ]);

    const opts = {
        height: "525",
        width: "1068",
        playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            fs: 0,
            enablejsapi: 1,
            origin: typeof window !== "undefined" ? window.location.origin : "",
            cc_load_policy: 0,
        },
    };

    const onReady = (e) => {
        playerRef.current = e.target;
        setDuration(e.target.getDuration());

        if (e.target.getAvailablePlaybackRates) {
            const rates = e.target.getAvailablePlaybackRates();
            if (Array.isArray(rates) && rates.length > 0) {
                setAvailableRates(rates);
            }
        }

        if (e.target.getVolume) {
            setVolume(e.target.getVolume());
        }
    };

    const checkCaptionsAbailability = useCallback(() => {
        const player = playerRef.current;
        if (!player || !player.getOptions) return;

        try {
            const options = player.getOptions();
            setCaptionsAbailable(Array.isArray(options) && options.includes("captions"));
        } catch {
            setCaptionsAbailable(false);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                const time = playerRef.current.getCurrentTime();
                const dur = playerRef.current.getDuration();

                setCurrentTime(time);
                setDuration(dur || 0);
                setProgress(dur ? (time / dur) * 100 : 0);
            }
        }, 500);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setIsPlaying(false);
        setIsMuted(false);
        setProgress(0);
        setCurrentTime(0);
        setDuration(0);
        setShowVideo(true);
        setShowSettings(false);

        const timer = setTimeout(() => {
            checkCaptionsAbailability();
        }, 700);

        return () => clearTimeout(timer);
    }, [currentVideo?.resolvedId, checkCaptionsAbailability]);

    const openChannelPage = () => {
        const rawChannelId = String(
            currentVideo?.resolvedChannelRouteValue || ""
        ).trim();

        console.log("OPEN CHANNEL:", {
            rawChannelId,
            currentVideo,
        });

        if (!rawChannelId) {
            console.warn("No real channel id/customUrl from backend");
            return;
        }

        navigate(`/channel/${encodeURIComponent(rawChannelId)}`);
    };

    const togglePlay = () => {
        const player = playerRef.current;
        if (!player) return;

        if (isPlaying) {
            player.pauseVideo();
            setIsPlaying(false);
        } else {
            player.playVideo();
            setIsPlaying(true);
        }
    };

    const toggleMute = () => {
        const player = playerRef.current;
        if (!player) return;

        if (muted) {
            player.unMute();
            setIsMuted(false);
        } else {
            player.mute();
            setIsMuted(true);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = Number(e.target.value);
        setVolume(newVolume);

        const player = playerRef.current;
        if (!player || !player.setVolume) return;

        player.setVolume(newVolume);

        if (newVolume === 0) {
            player.mute();
            setIsMuted(true);
        } else {
            player.unMute();
            setIsMuted(false);
        }
    };

    const handleSeek = (e) => {
        const value = Number(e.target.value);
        const newTime = (value / 100) * duration;

        if (playerRef.current) {
            playerRef.current.seekTo(newTime, true);
        }

        setCurrentTime(newTime);
        setProgress(value);
    };

    const handlePlaybackRateChange = (rate) => {
        const player = playerRef.current;
        if (!player || !player.setPlaybackRate) return;

        player.setPlaybackRate(rate);
        setPlayBackRate(rate);
        setShowSettings(false);
    };

    const handleLike = async () => {
        const token = getAuthToken();
        if (!token || !currentVideo?.resolvedId) return;

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/interactions/like/${currentVideo.resolvedId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to like video");
            }

            setLocalLikes((prev) => prev + 1);

            if (typeof setLikes === "function") {
                setLikes((prev) => Number(prev || 0) + 1);
            }
        } catch (err) {
            console.error("Like error:", err);
        }
    };

    const handleSubscribe = async () => {
        const token = getAuthToken();

        if (!token) {
            navigate("/login");
            return;
        }

        if (!currentVideo?.resolvedChannelName) return;

        const previousValue = isSubscribed;
        const nextValue = !previousValue;

        try {
            setIsSubscribed(nextValue);

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/interactions/subscribe`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        channelName: currentVideo.resolvedChannelName,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to subscribe");
            }
        } catch (err) {
            console.error("Subscribe error", err);
            setIsSubscribed(previousValue);
        }
    };

    const rewind = () => {
        if (!playerRef.current) return;
        const time = playerRef.current.getCurrentTime();
        playerRef.current.seekTo(Math.max(time - 10, 0));
    };

    const forward = () => {
        if (!playerRef.current) return;
        const time = playerRef.current.getCurrentTime();
        playerRef.current.seekTo(Math.min(time + 10, duration));
    };

    const toggleFullscreen = () => {
        const iframe = document.querySelector("iframe");
        if (iframe?.requestFullscreen) {
            iframe.requestFullscreen();
        }
    };

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60)
            .toString()
            .padStart(2, "0");
        return `${minutes}:${seconds}`;
    };

    const canOpenChannel = Boolean(currentVideo?.resolvedChannelRouteValue);

    if (loading && !currentVideo) {
        return <div className="yt-page-status">Loading video...</div>;
    }

    if (error && !currentVideo) {
        return <div className="yt-page-status">{error}</div>;
    }

    if (!currentVideo?.resolvedId) {
        return <div className="yt-page-status">Video not found</div>;
    }

    return (
        <div className="yt-page-root">
            <div className="yt-page">
                <div className="yt-left">
                    <div className="yt-wrapper">
                        <div className="video-section">
                            {showVideo ? (
                                <YouTube
                                    videoId={currentVideo.resolvedId}
                                    opts={opts}
                                    onReady={onReady}
                                />
                            ) : (
                                <div className="preview" onClick={togglePlay}>
                                    <img
                                        src={currentVideo.resolvedThumbnail}
                                        alt={currentVideo.resolvedTitle}
                                        className="preview-image"
                                    />
                                    <div className="overlay-text">
                                        <h1>{currentVideo.resolvedChannelName}</h1>
                                        <p>{currentVideo.resolvedTitle}</p>
                                    </div>
                                </div>
                            )}

                            {showSettings && (
                                <div className="settings-menu">
                                    <div className="settings-section">
                                        <p className="settings-title">Playback speed</p>

                                        {availableRates.map((rate) => (
                                            <button
                                                key={rate}
                                                type="button"
                                                className={`settings-option ${
                                                    playbackRate === rate ? "active" : ""
                                                }`}
                                                onClick={() => handlePlaybackRateChange(rate)}
                                            >
                                                {rate}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="settings-section">
                                        <p className="settings-title">Subtitles</p>
                                        <p className="settings-info">
                                            {captionsAvailable
                                                ? "Available on this video"
                                                : "Not available"}
                                        </p>
                                    </div>

                                    <div className="settings-section">
                                        <p className="settings-title">Quality</p>
                                        <p className="settings-info">Auto by YouTube</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="controls">
                            <button onClick={rewind}>
                                <img src={skipPrevious} alt="rewind" width="34" height="34" />
                            </button>

                            <button onClick={togglePlay}>
                                <img src={playArrow} alt="play" width="34" height="34" />
                            </button>

                            <button onClick={forward}>
                                <img src={skipNext} alt="forward" width="34" height="34" />
                            </button>

                            <button onClick={toggleMute}>
                                <img src={muteSvg} alt="mute" width="34" height="34" />
                            </button>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="volume-slider"
                            />

                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress}
                                onChange={handleSeek}
                                className="timeline"
                            />

                            <span className="time-display">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>

                            <button onClick={toggleFullscreen} title="Fullscreen">
                                ⛶
                            </button>

                            <button
                                title="Settings"
                                onClick={() => setShowSettings((prev) => !prev)}
                            >
                                ⚙
                            </button>

                            <button title="Subtitles">🄲</button>
                        </div>
                    </div>

                    <h2 className="yt-main-title">{currentVideo.resolvedTitle}</h2>

                    <div className="video-actions-bar">
                        <div className="channel-info">
                            <img
                                src={currentVideo.resolvedChannelAvatar}
                                alt={currentVideo.resolvedChannelName}
                                className="channel-avatar"
                                onClick={canOpenChannel ? openChannelPage : undefined}
                                onError={(e) => {
                                    e.currentTarget.src = "/ava.png";
                                }}
                                style={{
                                    cursor: canOpenChannel ? "pointer" : "default",
                                    opacity: canOpenChannel ? 1 : 0.85,
                                }}
                            />

                            <div
                                className="channel-text"
                                onClick={canOpenChannel ? openChannelPage : undefined}
                                style={{ cursor: canOpenChannel ? "pointer" : "default" }}
                            >
                                <p className="channel-name">{currentVideo.resolvedChannelName}</p>
                                <p className="channel-subs">
                                    {currentVideo.resolvedSubscriberCount ||
                                        currentVideo.resolvedPublishedAt ||
                                        currentVideo.resolvedCustomUrl}
                                </p>
                            </div>

                            <button className="subscribe-btn" onClick={handleSubscribe}>
                                {isSubscribed ? "Subscribed" : "Subscribe"}
                            </button>
                        </div>

                        <div className="actions">
                            <button className="action-btn" onClick={handleLike}>
                                <img src={Like} alt="like" width="34" height="34" />
                                <span>{formatLikes(localLikes)}</span>
                            </button>

                            <button className="action-btn">
                                <img src={Forward} alt="forward" width="34" height="34" />
                                Forward
                            </button>

                            <button className="action-btn">
                                <img src={Plus} alt="add to playlist" width="34" height="34" />
                                Add to Playlist
                            </button>

                            <button className="action-btn">
                                More <img src={ArrowDown} alt="more" width="34" height="34" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="VideoFromThisChannel">
                    {recommendedVideos.slice(0, 5).map((video) => (
                        <div
                            key={video.resolvedId}
                            className="RecomendVideo"
                            onClick={() =>
                                navigate(`/video/${video.resolvedId}`, {
                                    state: { video },
                                })
                            }
                        >
                            <img src={video.resolvedThumbnail} alt={video.resolvedTitle} />
                            <div className="RecomendVideo-text">
                                <p>{video.resolvedTitle}</p>
                                <p>{video.resolvedChannelName}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="AboutAvtor">
                <div className="firstInfo">
                    <p>
                        {formatViews(currentVideo.resolvedViews)} • {currentVideo.resolvedPublishedAt}
                    </p>

                    <div className="video-description-block">
                        <p className={expandedDescription ? "video-description expanded" : "video-description"}>
                            {currentVideo.resolvedDescription || currentVideo.resolvedTitle}
                        </p>

                        <button
                            className="action-btn1"
                            onClick={() => setExpandedDescription((prev) => !prev)}
                        >
                            {expandedDescription ? "Show less" : "Show more"}
                            <img src={ArrowDown} alt="more" width="24" height="14" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="yt-rec-container">
                <h2 className="yt-title">Recommend</h2>

                <div className="yt-cards">
                    {recommendedVideos.map((video) => (
                        <div
                            key={video.resolvedId}
                            className="yt-card"
                            onClick={() =>
                                navigate(`/video/${video.resolvedId}`, {
                                    state: { video },
                                })
                            }
                        >
                            <img
                                src={video.resolvedThumbnail}
                                alt={video.resolvedTitle}
                                className="yt-thumbnail"
                            />

                            <div className="yt-info">
                                <div className="yt-channel-info">
                                    <img
                                        src={video.resolvedChannelAvatar}
                                        alt={video.resolvedChannelName}
                                        className="yt-avatar"
                                        onError={(e) => {
                                            e.currentTarget.src = "/ava.png";
                                        }}
                                    />
                                    <div>
                                        <p className="yt-video-title">{video.resolvedTitle}</p>
                                        <p className="yt-channel">{video.resolvedChannelName}</p>
                                    </div>
                                </div>

                                <p className="yt-meta">
                                    {formatViews(video.resolvedViews)} • {video.resolvedPublishedAt}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}