import { useRef, useState, useEffect, useMemo } from "react";
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

function formatViews(views) {
    const numericViews = Number(views) || 0;

    if (numericViews >= 1000000) {
        return `${(numericViews / 1000000).toFixed(1)}M views`;
    }

    if (numericViews >= 1000) {
        return `${(numericViews / 1000).toFixed(1)}K views`;
    }

    return `${numericViews} views`;
}

function getVideoId(video) {
    return String(video?.videoId || video?.id || "");
}

function normalizeVideo(video) {
    return {
        ...video,
        resolvedId: getVideoId(video),
        resolvedThumbnail:
            video?.thumbnail ||
            video?.thumbnailUrl ||
            video?.snippet?.thumbnails?.high?.url ||
            video?.snippet?.thumbnails?.medium?.url ||
            video?.snippet?.thumbnails?.default?.url ||
            "/1v.png",
        resolvedChannelName:
            video?.channelName ||
            video?.author ||
            video?.snippet?.channelTitle ||
            "Unknown channel",
        resolvedTitle:
            video?.title ||
            video?.snippet?.title ||
            "Untitled video",
        resolvedPublishedAt:
            video?.publishedAt ||
            video?.snippet?.publishedAt ||
            "",
        resolvedViews:
            video?.views ||
            video?.viewCount ||
            video?.statistics?.viewCount ||
            0,
    };
}

export function YouTubeCustomPlayer({ initialVideo = null, routeVideoId = "" }) {
    const playerRef = useRef(null);
    const navigate = useNavigate();

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

                setVideos(rawVideos.map(normalizeVideo));
            } catch (err) {
                setError(err.message || "Something went wrong");
                setVideos([]);
            } finally {
                setLoading(false);
            }
        };

        loadVideos();
    }, []);

    const normalizedInitialVideo = useMemo(() => {
        return initialVideo ? normalizeVideo(initialVideo) : null;
    }, [initialVideo]);

    const currentVideo = useMemo(() => {
        if (!Array.isArray(videos) || videos.length === 0) {
            return normalizedInitialVideo;
        }

        const foundByRoute = videos.find(
            (video) => String(video.resolvedId) === String(routeVideoId)
        );

        if (foundByRoute) {
            return foundByRoute;
        }

        if (
            normalizedInitialVideo &&
            String(normalizedInitialVideo.resolvedId) === String(routeVideoId)
        ) {
            return normalizedInitialVideo;
        }

        return normalizedInitialVideo || videos[0] || null;
    }, [videos, routeVideoId, normalizedInitialVideo]);

    const recommendedVideos = useMemo(() => {
        if (!Array.isArray(videos) || videos.length === 0 || !currentVideo) return [];

        return videos
            .filter(
                (video) => String(video.resolvedId) !== String(currentVideo.resolvedId)
            )
            .slice(0, 8);
    }, [videos, currentVideo]);

    const opts = {
        height: "525",
        width: "1068",
        playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            fs: 0,
        },
    };

    const onReady = (e) => {
        playerRef.current = e.target;
        setDuration(e.target.getDuration());
    };

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
    }, [currentVideo?.resolvedId]);

    const togglePlay = () => {
        const player = playerRef.current;
        if (!player) return;

        if (!showVideo) setShowVideo(true);

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

    const handleSeek = (e) => {
        const value = Number(e.target.value);
        const newTime = (value / 100) * duration;

        if (playerRef.current) {
            playerRef.current.seekTo(newTime, true);
        }

        setCurrentTime(newTime);
        setProgress(value);
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

    if (loading && !currentVideo) {
        return <div className="yt-page-status">Loading video...</div>;
    }

    if (error && !currentVideo) {
        return <div className="yt-page-status">{error}</div>;
    }

    if (!currentVideo || !currentVideo.resolvedId) {
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
                            <button title="Settings">⚙</button>
                            <button title="Subtitles">🄲</button>
                        </div>
                    </div>

                    <h2 className="yt-main-title">{currentVideo.resolvedTitle}</h2>

                    <div className="video-actions-bar">
                        <div className="channel-info">
                            <img
                                src={currentVideo.resolvedThumbnail}
                                alt={currentVideo.resolvedChannelName}
                                className="channel-avatar"
                            />
                            <div className="channel-text">
                                <p className="channel-name">{currentVideo.resolvedChannelName}</p>
                                <p className="channel-subs">{currentVideo.resolvedPublishedAt}</p>
                            </div>
                            <button className="subscribe-btn">Subscribe</button>
                        </div>

                        <div className="actions">
                            <button className="action-btn">
                                <img src={Like} alt="like" width="34" height="34" />
                                <span>{formatViews(currentVideo.resolvedViews)}</span>
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
                            onClick={() => navigate(`/video/${video.resolvedId}`, { state: { video } })}
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
                    <p>
                        {currentVideo.resolvedTitle}
                        <span>
                            Show more
                            <button className="action-btn1">
                                <img src={ArrowDown} alt="more" width="24" height="14" />
                            </button>
                        </span>
                    </p>
                </div>
            </div>

            <div className="yt-rec-container">
                <h2 className="yt-title">Recommend</h2>

                <div className="yt-cards">
                    {recommendedVideos.map((video) => (
                        <div
                            key={video.resolvedId}
                            className="yt-card"
                            onClick={() => navigate(`/video/${video.resolvedId}`, { state: { video } })}
                        >
                            <img
                                src={video.resolvedThumbnail}
                                alt={video.resolvedTitle}
                                className="yt-thumbnail"
                            />

                            <div className="yt-info">
                                <div className="yt-channel-info">
                                    <img
                                        src={video.resolvedThumbnail}
                                        alt={video.resolvedChannelName}
                                        className="yt-avatar"
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