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

    const normalized = {
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
        avatarUrl: isValidImageSrc(sub?.avatarUrl)
            ? sub.avatarUrl
            : "/ava.png",
    };

    console.log("NORMALIZED SUB:", {
        raw: sub,
        normalized,
    });

    return normalized;
}

export function SideMenu() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

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
            window.removeEventListener(
                "subscriptionsUpdated",
                handleSubscriptionsUpdated
            );
        };
    }, [loadSubscriptions]);

    return (
        <aside className="sidebar">
            <div className="sidebarSection">
                <h4>Subscriptions</h4>

                <ul className="subscriptions">
                    {loadingSubscriptions && subscriptions.length === 0 ? (
                        <li>
                            <span>Loading...</span>
                        </li>
                    ) : subscriptions.length > 0 ? (
                        subscriptions.map((sub) => {
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

                                    {sub.routeValue ? (
                                        <Link
                                            to={`/channel/${encodeURIComponent(
                                                sub.routeValue
                                            )}`}
                                            onClick={() => {
                                                console.log("CLICK CHANNEL:", {
                                                    routeValue: sub.routeValue,
                                                    fullUrl: `/channel/${sub.routeValue}`,
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
                        })
                    ) : (
                        <li>
                            <span>No subscriptions yet</span>
                        </li>
                    )}
                </ul>
            </div>
        </aside>
    );
}