import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AuthorPageForReels.css";

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

function safeParseJson(text) {
    if (!text || typeof text !== "string") {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        console.warn("Failed to parse JSON:", error, text);
        return null;
    }
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

function formatCount(value) {
    const numericValue = Number(value) || 0;

    if (numericValue >= 1000000) return `${(numericValue / 1000000).toFixed(1)}M`;
    if (numericValue >= 1000) return `${(numericValue / 1000).toFixed(1)}K`;
    return String(numericValue);
}

function normalizeReel(item, index = 0) {
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

    return {
        id: String(
            item?.id ??
            item?._id ??
            item?.reelId ??
            item?.videoId ??
            item?.youtubeId ??
            `reel-${index}`
        ),
        title: item?.title || "Untitled reel",
        thumbnailUrl:
            item?.posterUrl ||
            item?.thumbnailUrl ||
            item?.thumbnail ||
            item?.preview ||
            "/1.jpg",
        videoUrl: youtubeId,
        description: item?.description || item?.caption || "",
        likes: item?.likes ?? item?.likesCount ?? 0,
        commentsCount:
            item?.commentsCount ??
            item?.commentCount ??
            item?.comments_count ??
            item?.totalComments ??
            item?.interactions?.commentsCount ??
            item?.comments?.length ??
            0,
        shares: item?.shares ?? item?.sharesCount ?? 0,
        publishedAt: item?.publishedAt || item?.createdAt || item?.time || "",
        channelId: getFirstNonEmptyString(
            item?.channelId,
            item?.authorId,
            item?.channel?.id,
            item?.channel?._id,
            item?.ownerId,
            item?.uploaderId
        ),
        customUrl: getFirstNonEmptyString(
            item?.customUrl,
            item?.channel?.customUrl,
            item?.authorCustomUrl
        ),
        username: getFirstNonEmptyString(
            item?.username,
            item?.handle
        ),
        author: item?.author || item?.channelName || item?.channel?.title || "Unknown author",
    };
}

async function fetchChannelCandidate(apiUrl, candidate, token) {
    const normalizedCandidate = String(candidate || "").trim();
    if (!normalizedCandidate) return null;

    try {
        const response = await fetch(
            `${apiUrl}/api/channel/${encodeURIComponent(normalizedCandidate)}`,
            {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            }
        );

        const text = await response.text();
        const parsed = safeParseJson(text);

        console.log("REELS AUTHOR CHANNEL RESPONSE:", {
            candidate: normalizedCandidate,
            status: response.status,
            ok: response.ok,
            text,
            parsed,
        });

        return {
            candidate: normalizedCandidate,
            ok: response.ok,
            status: response.status,
            text,
            parsed,
        };
    } catch (error) {
        console.error("fetchChannelCandidate error:", normalizedCandidate, error);
        return null;
    }
}

export function AuthorPageForReels() {
    const { channelId } = useParams();
    const navigate = useNavigate();

    const [channel, setChannel] = useState(null);
    const [reels, setReels] = useState([]);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [subscribeLoading, setSubscribeLoading] = useState(false);
    const [error, setError] = useState("");

    const loadAuthorPage = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const apiUrl = import.meta.env.VITE_API_URL;
            if (!apiUrl) {
                throw new Error("VITE_API_URL is not defined");
            }

            const token = getAuthToken();
            const decodedChannelId = decodeURIComponent(String(channelId || "").trim());

            if (!decodedChannelId) {
                throw new Error("Channel id is missing");
            }

            const response = await fetch(
                `${apiUrl}/api/channel/${encodeURIComponent(decodedChannelId)}`,
                {
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            const text = await response.text();
            let data = null;

            try {
                data = text ? JSON.parse(text) : null;
            } catch {
                data = null;
            }

            console.log("REELS AUTHOR CHANNEL RESPONSE:", {
                candidate: decodedChannelId,
                status: response.status,
                ok: response.ok,
                text,
                data,
            });

            if (!response.ok || !data?.channel) {
                throw new Error(text || data?.message || "Channel not found");
            }

            const normalizedChannel = {
                id: String(
                    data?.channel?.id ??
                    data?.channel?._id ??
                    decodedChannelId
                ),
                title: data?.channel?.title || "Unknown channel",
                description: data?.channel?.description || "",
                avatarUrl: isValidImageSrc(data?.channel?.avatarUrl)
                    ? data.channel.avatarUrl
                    : "/ava.png",
                subscriberCount: data?.channel?.subscriberCount || "0",
                customUrl: data?.channel?.customUrl || "@unknown",
                bannerUrl: isValidImageSrc(data?.channel?.bannerUrl)
                    ? data.channel.bannerUrl
                    : "/7.jpg",
            };

            let reelsPayload = [];

            try {
                const reelsResponse = await fetch(`${apiUrl}/api/reels?page=1&limit=100`);
                const reelsText = await reelsResponse.text();
                let reelsData = null;

                try {
                    reelsData = reelsText ? JSON.parse(reelsText) : null;
                } catch {
                    reelsData = null;
                }

                const rawReels = Array.isArray(reelsData?.reels)
                    ? reelsData.reels
                    : Array.isArray(reelsData)
                    ? reelsData
                    : Array.isArray(reelsData?.data)
                    ? reelsData.data
                    : Array.isArray(reelsData?.items)
                    ? reelsData.items
                    : [];

                reelsPayload = rawReels;
            } catch (error) {
                console.error("Failed to load reels for author page:", error);
            }

            const normalizedReels = reelsPayload
                .map((item, index) => normalizeReel(item, index))
                .filter((item) => String(item.channelId || "").trim() === String(normalizedChannel.id || "").trim());

            setChannel(normalizedChannel);
            setReels(normalizedReels);
            setIsSubscribed(Boolean(data?.isSubscribed));
        } catch (err) {
            console.error("REELS AUTHOR PAGE ERROR:", err);
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [channelId]);

    useEffect(() => {
        loadAuthorPage();
    }, [loadAuthorPage]);

    const handleSubscribe = async () => {
        const token = getAuthToken();

        if (!token) {
            navigate("/login");
            return;
        }

        if (!channel?.title || subscribeLoading) return;

        const previousValue = isSubscribed;
        const nextSubscribed = !previousValue;

        try {
            setSubscribeLoading(true);
            setIsSubscribed(nextSubscribed);

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/interactions/subscribe`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        channelName: channel.title,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to update subscription");
            }
        } catch (err) {
            console.error("Subscribe error:", err);
            setIsSubscribed(previousValue);
        } finally {
            setSubscribeLoading(false);
        }
    };

    const creatorReels = useMemo(() => {
        return Array.isArray(reels) ? reels : [];
    }, [reels]);

    if (loading) {
        return <div className="author-reels-loading">Loading creator...</div>;
    }

    if (error) {
        return (
            <div className="author-reels-error-wrap">
                <div className="author-reels-error">{error}</div>
                <button
                    className="author-reels-retry-btn"
                    type="button"
                    onClick={loadAuthorPage}
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!channel) {
        return <div className="author-reels-loading">Creator not found</div>;
    }

    return (
        <div className="author-reels-page">
            <div className="author-reels-banner-wrap">
                <img
                    src={channel.bannerUrl}
                    alt={channel.title}
                    className="author-reels-banner"
                    onError={(e) => {
                        e.currentTarget.src = "/7.jpg";
                    }}
                />
                <div className="author-reels-banner-overlay" />
            </div>

            <div className="author-reels-content">
                <section className="author-reels-header-card">
                    <img
                        src={channel.avatarUrl}
                        alt={channel.title}
                        className="author-reels-avatar"
                        onError={(e) => {
                            e.currentTarget.src = "/ava.png";
                        }}
                    />

                    <div className="author-reels-main-info">
                        <h1 className="author-reels-name">{channel.title}</h1>
                        <p className="author-reels-username">{channel.customUrl}</p>
                        <p className="author-reels-subscribers">
                            {channel.subscriberCount} subscribers
                        </p>

                        {channel.description && (
                            <p className="author-reels-description">{channel.description}</p>
                        )}
                    </div>

                    <button
                        type="button"
                        className={`author-reels-subscribe-btn ${isSubscribed ? "is-subscribed" : ""}`}
                        onClick={handleSubscribe}
                        disabled={subscribeLoading}
                    >
                        {subscribeLoading
                            ? "Loading..."
                            : isSubscribed
                            ? "Subscribed"
                            : "Subscribe"}
                    </button>
                </section>

                <section className="author-reels-section">
                    <div className="author-reels-section-head">
                        <h2>Reels</h2>
                        <span>{creatorReels.length} items</span>
                    </div>

                    <div className="author-reels-grid">
                        {creatorReels.map((reel) => (
                            <article
                                key={reel.id}
                                className="author-reel-card"
                                onClick={() => navigate(`/reels-page/${reel.id}`)}
                            >
                                <img
                                    src={reel.thumbnailUrl}
                                    alt={reel.title}
                                    className="author-reel-thumb"
                                    onError={(e) => {
                                        e.currentTarget.src = "/1.jpg";
                                    }}
                                />

                                <div className="author-reel-info">
                                    <h3>{reel.title}</h3>

                                    <p className="author-reel-meta">
                                        <span>{formatCount(reel.likes)} likes</span>
                                        <span>{formatCount(reel.commentsCount)} comments</span>
                                    </p>

                                    {!!reel.description && (
                                        <span className="author-reel-description-preview">
                                            {reel.description}
                                        </span>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>

                    {!creatorReels.length && (
                        <div className="author-reels-empty-block">No reels yet</div>
                    )}
                </section>
            </div>
        </div>
    );
}