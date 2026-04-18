import { Link } from 'react-router-dom';
import { useEffect, useState, useCallback, useMemo } from 'react';
import './SideMenu.css';

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

function detectSubscriptionSourceType(sub) {
    const explicitType = getFirstNonEmptyString(
        sub?.sourceType,
        sub?.subscriptionType,
        sub?.contentType,
        sub?.targetType,
        sub?.type,
        sub?.originType
    ).toLowerCase();

    if (
        explicitType === "reel" ||
        explicitType === "reels" ||
        explicitType === "short" ||
        explicitType === "shorts"
    ) {
        return "reel";
    }

    if (
        explicitType === "video" ||
        explicitType === "channel" ||
        explicitType === "youtube"
    ) {
        return "video";
    }

    if (sub?.isReelAuthor === true || sub?.fromReel === true || sub?.reel === true) {
        return "reel";
    }

    if (sub?.isVideoAuthor === true || sub?.fromVideo === true || sub?.video === true) {
        return "video";
    }

    const reelHint = getFirstNonEmptyString(
        sub?.reelAuthorId,
        sub?.reelChannelId,
        sub?.reelId,
        sub?.authorId
    );

    if (reelHint) {
        return "reel";
    }

    return "video";
}

/*
    Поставь здесь свой реальный роут для автора рилсов.
    Если у тебя в App.jsx путь другой, просто поменяй.
*/
const VIDEO_CHANNEL_ROUTE_BASE = "/channel";
const REELS_CHANNEL_ROUTE_BASE = "/author-reels";

function buildSubscriptionPath(sub) {
    const sourceType = detectSubscriptionSourceType(sub);

    const routeValue = getFirstNonEmptyString(
        sub?.channelId,
        sub?.customUrl,
        sub?.routeValue,
        sub?.authorId,
        sub?.reelAuthorId,
        sub?.reelChannelId,
        sub?.channelName,
        sub?.name,
        sub?.title,
        sub?.author
    );

    if (!routeValue) {
        return "";
    }

    const baseRoute =
        sourceType === "reel"
            ? REELS_CHANNEL_ROUTE_BASE
            : VIDEO_CHANNEL_ROUTE_BASE;

    return `${baseRoute}/${encodeURIComponent(routeValue)}`;
}

function normalizeSubscription(sub, index) {
    const sourceType = detectSubscriptionSourceType(sub);

    const routeValue = getFirstNonEmptyString(
        sub?.channelId,
        sub?.customUrl,
        sub?.routeValue,
        sub?.authorId,
        sub?.reelAuthorId,
        sub?.reelChannelId,
        sub?.channelName,
        sub?.name,
        sub?.title,
        sub?.author
    );

    const normalized = {
        id:
            sub?.id ||
            sub?._id ||
            sub?.subscriptionId ||
            sub?.channelId ||
            sub?.authorId ||
            routeValue ||
            `sub-${index}`,

        channelId: getFirstNonEmptyString(sub?.channelId, sub?.authorId),
        customUrl: getFirstNonEmptyString(sub?.customUrl, sub?.authorCustomUrl),
        routeValue,
        sourceType,

        channelName:
            sub?.channelName ||
            sub?.name ||
            sub?.title ||
            sub?.author ||
            "Unknown channel",

        avatarUrl: isValidImageSrc(sub?.avatarUrl)
            ? sub.avatarUrl
            : isValidImageSrc(sub?.authorAvatar)
            ? sub.authorAvatar
            : isValidImageSrc(sub?.channelAvatar)
            ? sub.channelAvatar
            : isValidImageSrc(sub?.avatar)
            ? sub.avatar
            : "/ava.png",
    };

    normalized.path = buildSubscriptionPath({
        ...sub,
        ...normalized,
    });

    console.log("NORMALIZED SUB:", {
        raw: sub,
        normalized,
    });

    return normalized;
}

export function SideMenu() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
    const [visibleSubscriptions, setVisibleSubscriptions] = useState(5);

    const displayedSubscriptions = useMemo(() => {
        return subscriptions.slice(0, visibleSubscriptions);
    }, [subscriptions, visibleSubscriptions]);

    const handleToggleSubscriptions = () => {
        setVisibleSubscriptions((prev) =>
            prev >= subscriptions.length ? 5 : subscriptions.length
        );
    };

    const loadSubscriptions = useCallback(async () => {
        const token = getAuthToken();

        console.log("LOAD SUBSCRIPTIONS TOKEN:", token);

        if (!token) {
            console.log("NO TOKEN → CLEAR SUBSCRIPTIONS");
            setSubscriptions([]);
            return;
        }

        try {
            setLoadingSubscriptions(true);

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/account/subscriptions`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            console.log("SUBSCRIPTIONS RESPONSE:", {
                ok: response.ok,
                status: response.status,
                data,
            });

            if (!response.ok) {
                throw new Error(data?.message || "Failed to load subscriptions");
            }

            const rawSubscriptions = Array.isArray(data?.subscriptions)
                ? data.subscriptions
                : Array.isArray(data)
                ? data
                : [];

            console.log("RAW SUBSCRIPTIONS ARRAY:", rawSubscriptions);

            const normalized = rawSubscriptions.map(normalizeSubscription);

            console.log("FINAL NORMALIZED SUBSCRIPTIONS:", normalized);

            setSubscriptions(normalized);
            setVisibleSubscriptions((prev) => Math.max(5, prev));
        } catch (error) {
            console.error("Failed to load subscriptions:", error);
            setSubscriptions([]);
        } finally {
            setLoadingSubscriptions(false);
        }
    }, []);

    useEffect(() => {
        loadSubscriptions();
    }, [loadSubscriptions]);

    useEffect(() => {
        const handleSubscriptionsUpdated = () => {
            console.log("EVENT: subscriptionsUpdated");
            loadSubscriptions();
        };

        window.addEventListener("subscriptionsUpdated", handleSubscriptionsUpdated);

        return () => {
            window.removeEventListener("subscriptionsUpdated", handleSubscriptionsUpdated);
        };
    }, [loadSubscriptions]);

    return (
        <aside className="sidebar">
            <nav className="sidebarSection">
                <ul className="firstSection">
                    <li>
                        <img src="/home.png" alt="home" />
                        <Link to="/"><span>Home</span></Link>
                    </li>

                    <li>
                        <img src="/shorts.png" alt="shorts" />
                        <Link to="/reels-page"><span>Playme</span></Link>
                    </li>

                    <li>
                        <img src="/Group 185.png" alt="group" />
                        <span>Subscriptions</span>
                    </li>

                    <li>
                        <img src="/Path.png" alt="path" />
                        <span>Streamers</span>
                    </li>
                </ul>
                <hr />
            </nav>

            <nav className="sidebarSection">
                <ul className="secondSection">
                    <li><img src="/libra.png" alt="libra" /><span>Library</span></li>
                    <li><img src="/history.png" alt="history" /><span>History</span></li>
                    <li><img src="/playlists.png" alt="playlists" /><span>Playlists</span></li>
                    <li><img src="/heart.png" alt="heart" /><span>Favorite</span></li>
                </ul>
                <hr />
            </nav>

            <div className="sidebarSection">
                <h4>Subscriptions</h4>

                <ul className="subscriptions">
                    {loadingSubscriptions && subscriptions.length === 0 ? (
                        <li>
                            <span>Loading...</span>
                        </li>
                    ) : subscriptions.length > 0 ? (
                        <>
                            {displayedSubscriptions.map((sub) => {
                                console.log("RENDER SUB ITEM:", sub);

                                return (
                                    <li key={sub.id}>
                                        <img
                                            src={sub.avatarUrl || "/ava.png"}
                                            alt={sub.channelName}
                                            className="imgS"
                                            onError={(e) => {
                                                console.log("AVATAR ERROR → fallback");
                                                e.currentTarget.src = "/ava.png";
                                            }}
                                        />

                                        {sub.path ? (
                                            <Link
                                                to={sub.path}
                                                onClick={() => {
                                                    console.log("CLICK CHANNEL:", {
                                                        sourceType: sub.sourceType,
                                                        routeValue: sub.routeValue,
                                                        path: sub.path,
                                                        sub,
                                                    });
                                                }}
                                            >
                                                <span>{sub.channelName}</span>
                                            </Link>
                                        ) : (
                                            <span
                                                onClick={() => {
                                                    console.warn("NO ROUTE VALUE:", sub);
                                                }}
                                            >
                                                {sub.channelName}
                                            </span>
                                        )}
                                    </li>
                                );
                            })}

                            {subscriptions.length > 5 && (
                                <li
                                    className="showMore"
                                    onClick={handleToggleSubscriptions}
                                    style={{ cursor: "pointer" }}
                                >
                                    <span>
                                        {visibleSubscriptions >= subscriptions.length
                                            ? "Show less"
                                            : "Show more"}
                                    </span>
                                    <img src="/more.png" alt="more" className="more" />
                                </li>
                            )}

                            <hr />
                        </>
                    ) : (
                        <li>
                            <span>No subscriptions yet</span>
                        </li>
                    )}
                </ul>
            </div>

            <div className="sidebarSection">
                <h4>Categories</h4>
                <ul className="categories">
                    <li><img src="/Shape.png" alt="shape" /><span>Games</span></li>
                    <li><img src="/Shape.png" alt="shape" /><span>Podcast</span></li>
                    <li><img src="/Shape.png" alt="shape" /><span>Education</span></li>
                    <li><img src="/Shape.png" alt="shape" /><span>Music</span></li>
                    <li><img src="/Shape.png" alt="shape" /><span>Films</span></li>
                    <li><img src="/Shape.png" alt="shape" /><span>Mixed</span></li>
                    <li><img src="/Shape.png" alt="shape" /><span>Cybersport</span></li>
                    <hr />
                </ul>
            </div>

            <div className="sidebarSection">
                <ul className="thirdSection">
                    <li><img src="/settings.png" alt="settings" /><span>Settings</span></li>
                    <li><img src="/report.png" alt="report" /><span>Help</span></li>
                    <li><img src="/help.png" alt="help" /><span>Report history</span></li>
                    <li><img src="/feedback.png" alt="feedback" /><span>Send feedback</span></li>
                </ul>
            </div>
        </aside>
    );
}