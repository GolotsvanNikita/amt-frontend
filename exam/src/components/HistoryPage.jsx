import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HistoryPage.css";

const API_BASE = import.meta.env.VITE_API_URL;


function getToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt") ||
        ""
    );
}

function formatTime(totalSeconds) {
    const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
}

function extractVideoId(item) {
    return (
        item?.videoId ||
        item?.VideoId ||
        item?.youtubeVideoId ||
        item?.YoutubeVideoId ||
        item?.id ||
        item?.Id ||
        item?.video?.id ||
        item?.video?.videoId ||
        ""
    );
}

function extractTitle(item) {
    return (
        item?.title ||
        item?.videoTitle ||
        item?.video?.title ||
        "Untitled video"
    );
}

function extractThumbnail(item) {
    return (
        item?.thumbnailUrl ||
        item?.thumbnail ||
        item?.image ||
        item?.preview ||
        item?.video?.thumbnailUrl ||
        item?.video?.thumbnail ||
        "/1v.png"
    );
}

function extractChannelName(item) {
    return (
        item?.channelName ||
        item?.author ||
        item?.channel ||
        item?.video?.channelName ||
        "Unknown channel"
    );
}

function extractDuration(item) {
    return Number(
        item?.durationSeconds ??
        item?.duration ??
        item?.videoDuration ??
        item?.video?.durationSeconds ??
        0
    );
}

function extractPosition(item) {
    return Number(
        item?.lastPositionSeconds ??
        item?.LastPositionSeconds ??
        item?.currentTimeSeconds ??
        item?.watchTimeSeconds ??
        item?.progressSeconds ??
        item?.stoppedAt ??
        0
    );
}

function extractUpdatedAt(item) {
    return (
        item?.updatedAt ||
        item?.lastWatchedAt ||
        item?.watchedAt ||
        item?.createdAt ||
        ""
    );
}

function normalizeHistoryItem(item, index) {
    const videoId = extractVideoId(item);
    const duration = extractDuration(item);
    const position = Math.min(extractPosition(item), duration || extractPosition(item));
    const progressPercent =
        duration > 0 ? Math.min((position / duration) * 100, 100) : 0;

    return {
        id: item?.historyId || item?._id || `${videoId}-${index}`,
        videoId,
        title: extractTitle(item),
        thumbnailUrl: extractThumbnail(item),
        channelName: extractChannelName(item),
        durationSeconds: duration,
        lastPositionSeconds: position,
        updatedAt: extractUpdatedAt(item),
        progressPercent,
        isFinished: duration > 0 ? position >= duration * 0.95 : false,
    };
}

export function HistoryPage() {
    const navigate = useNavigate();

    const [historyItems, setHistoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadHistory() {
            try {
                setLoading(true);
                setError("");

                const token = getToken();

                const response = await fetch(`${API_BASE}/api/history/recent`, {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },

                    
                });
                if (!response.ok) {
                    throw new Error(`History request failed: ${response.status}`);
                }

                const data = await response.json();
                const rawArray = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.items)
                    ? data.items
                    : Array.isArray(data?.history)
                    ? data.history
                    : Array.isArray(data?.videos)
                    ? data.videos
                    : [];

                const normalized = rawArray
                    .map(normalizeHistoryItem)
                    .filter((item) => item.videoId)
                    .sort((a, b) => {
                        const dateA = new Date(a.updatedAt || 0).getTime();
                        const dateB = new Date(b.updatedAt || 0).getTime();
                        return dateB - dateA;
                    });

                if (isMounted) {
                    setHistoryItems(normalized);
                }
            } catch (err) {
                console.error("HISTORY PAGE LOAD ERROR:", err);
                if (isMounted) {
                    setError("Failed to load history.");
                    setHistoryItems([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadHistory();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredItems = useMemo(() => {
        if (activeFilter === "unfinished") {
            return historyItems.filter((item) => !item.isFinished);
        }

        if (activeFilter === "finished") {
            return historyItems.filter((item) => item.isFinished);
        }

        return historyItems;
    }, [historyItems, activeFilter]);

    const totalUnfinished = useMemo(
        () => historyItems.filter((item) => !item.isFinished).length,
        [historyItems]
    );

    const totalFinished = useMemo(
        () => historyItems.filter((item) => item.isFinished).length,
        [historyItems]
    );

function handleOpenVideo(item) {
    console.log("OPEN HISTORY ITEM:", item);

    if (!item.videoId) {
        console.warn("History item has no videoId:", item);
        return;
    }

    navigate(`/video/${encodeURIComponent(item.videoId)}`, {
        state: {
            continueFrom: item.lastPositionSeconds || 0,
            historyItem: item,
            video: {
                id: item.videoId,
                videoId: item.videoId,
                title: item.title,
                thumbnailUrl: item.thumbnailUrl,
                channelName: item.channelName,

                resolvedId: item.videoId,
                resolvedTitle: item.title,
                resolvedThumbnail: item.thumbnailUrl,
                resolvedChannelName: item.channelName,

                channelId: item.channelId || item.ChannelId || "",
                channelAvatar: item.channelAvatar || item.channelAvatarUrl || item.avatarUrl || "",
                channelAvatarUrl: item.channelAvatar || item.channelAvatarUrl || item.avatarUrl || "",

                viewsCount: item.viewsCount || item.viewCount || item.views || 0,
                likeCount: item.likeCount || item.likesCount || item.likes || 0,
                likesCount: item.likesCount || item.likeCount || item.likes || 0,
            },
        },
    });
}

    return (
        <div className="historyPage">
            <div className="historyPage-header">
                <div>
                    <h1 className="historyPage-title">Watch history</h1>
                    <p className="historyPage-subtitle">
                        Continue watching videos from where you stopped.
                    </p>
                </div>

                <div className="historyPage-filters">
                    <button
                        className={`historyPage-filterBtn ${activeFilter === "all" ? "active" : ""}`}
                        onClick={() => setActiveFilter("all")}
                    >
                        All ({historyItems.length})
                    </button>

                    <button
                        className={`historyPage-filterBtn ${activeFilter === "unfinished" ? "active" : ""}`}
                        onClick={() => setActiveFilter("unfinished")}
                    >
                        In progress ({totalUnfinished})
                    </button>

                    <button
                        className={`historyPage-filterBtn ${activeFilter === "finished" ? "active" : ""}`}
                        onClick={() => setActiveFilter("finished")}
                    >
                        Finished ({totalFinished})
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="historyPage-state">Loading history...</div>
            ) : error ? (
                <div className="historyPage-state historyPage-state--error">{error}</div>
            ) : filteredItems.length === 0 ? (
                <div className="historyPage-empty">
                    <div className="historyPage-emptyIcon">🕘</div>
                    <h2>No history yet</h2>
                    <p>Watched videos will appear here.</p>
                </div>
            ) : (
                <div className="historyPage-grid">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className="historyCard"
                            onClick={() => handleOpenVideo(item)}
                        >
                            <div className="historyCard-thumbWrap">
                                <img
                                    src={item.thumbnailUrl}
                                    alt={item.title}
                                    className="historyCard-thumb"
                                />

                                <div className="historyCard-duration">
                                    {formatTime(item.durationSeconds)}
                                </div>

                                <div className="historyCard-progress">
                                    <div
                                        className="historyCard-progressFill"
                                        style={{ width: `${item.progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            <div className="historyCard-body">
                                <h3 className="historyCard-title">{item.title}</h3>

                                <div className="historyCard-meta">
                                    <span>{item.channelName}</span>
                                    {item.updatedAt ? (
                                        <>
                                            <span className="historyCard-dot">•</span>
                                            <span>{formatDate(item.updatedAt)}</span>
                                        </>
                                    ) : null}
                                </div>

                                <div className="historyCard-bottom">
                                    <div className="historyCard-position">
                                        {item.isFinished ? (
                                            <span className="historyCard-finished">Finished</span>
                                        ) : (
                                            <>
                                                <span>
                                                    {formatTime(item.lastPositionSeconds)}
                                                </span>
                                                <span className="historyCard-slash">/</span>
                                                <span>
                                                    {formatTime(item.durationSeconds)}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    <button
                                        className="historyCard-continueBtn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenVideo(item);
                                        }}
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}