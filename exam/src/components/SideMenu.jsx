import { Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import "./SideMenu.css";

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
        (value.startsWith("http://") ||
            value.startsWith("https://") ||
            value.startsWith("/") ||
            value.startsWith("data:image/"))
    );
}

function normalizeSubscription(sub, index) {
    const routeValue =
        (typeof sub?.channelId === "string" && sub.channelId.trim()) ||
        (typeof sub?.customUrl === "string" && sub.customUrl.trim()) ||
        "";

    return {
        id:
            sub?.id ||
            sub?.channelId ||
            sub?._id ||
            `sub-${index}`,
        channelId: sub?.channelId || "",
        customUrl: sub?.customUrl || "",
        routeValue,
        channelName:
            sub?.channelName ||
            sub?.name ||
            sub?.title ||
            "Unknown channel",
        avatarUrl: isValidImageSrc(sub?.avatarUrl) ? sub.avatarUrl : "/ava.png",
    };
}

export function SideMenu() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

    const loadSubscriptions = useCallback(async () => {
        const token = getAuthToken();

        if (!token) {
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

            if (!response.ok) {
                throw new Error(data?.message || "Failed to load subscriptions");
            }

            const rawSubscriptions = Array.isArray(data?.subscriptions)
                ? data.subscriptions
                : Array.isArray(data)
                ? data
                : [];

            const normalized = rawSubscriptions.map(normalizeSubscription);

            console.log("SIDEMENU SUBSCRIPTIONS RAW:", rawSubscriptions);
            console.log("SIDEMENU SUBSCRIPTIONS NORMALIZED:", normalized);

            setSubscriptions(normalized);
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
                        subscriptions.map((sub) => (
                            <li key={sub.id}>
                                <img
                                    src={sub.avatarUrl || "/ava.png"}
                                    alt={sub.channelName}
                                    className="imgS"
                                    onError={(e) => {
                                        e.currentTarget.src = "/ava.png";
                                    }}
                                />

                                {sub.routeValue ? (
                                    <Link to={`/channel/${encodeURIComponent(sub.routeValue)}`}>
                                        <span>{sub.channelName}</span>
                                    </Link>
                                ) : (
                                    <span>{sub.channelName}</span>
                                )}
                            </li>
                        ))
                    ) : (
                        <li>
                            <span>No subscriptions yet</span>
                        </li>
                    )}

                    <li className="showMore">
                        <span>Show more</span>
                        <img src="/more.png" alt="more" className="more" />
                    </li>
                    <hr />
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