import { useEffect,useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import './SubscriptionsPage.css';

const API_URL = import.meta.env.VITE_API_URL;

function getToken(){
    return(
        localStorage.getItem('token') 
        || localStorage.getItem("authToken")
        || localStorage.getItem('jwt')
        || ""
    );
}

function getAuthHeaders() {
    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}



function getFirstNonEmptyString(...values) {
    for (const value of values) {
        if (typeof value === "string" && value.trim() !== "") {
            return value.trim();
        }
    }
    return "";
}

function isValidImageSrc(value) {
    return typeof value === "string" && value.trim() !== "";
}

function detectSubscriptionSourceType(sub) {
    const explicitType = getFirstNonEmptyString(
        sub?.sourceType,
        sub?.SourceType,
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

const VIDEO_CHANNEL_ROUTE_BASE = "/channel";
const REELS_CHANNEL_ROUTE_BASE = "/author-reels";

function buildSubscriptionPath(sub) {
    const sourceType = detectSubscriptionSourceType(sub);

    const routeValue = getFirstNonEmptyString(
        sub?.channelId,
        sub?.ChannelId,
        sub?.customUrl,
        sub?.CustomUrl,
        sub?.routeValue,
        sub?.authorId,
        sub?.reelAuthorId,
        sub?.reelChannelId,
        sub?.channelName,
        sub?.ChannelName,
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
        sub?.ChannelId,
        sub?.customUrl,
        sub?.CustomUrl,
        sub?.routeValue,
        sub?.authorId,
        sub?.reelAuthorId,
        sub?.reelChannelId,
        sub?.channelName,
        sub?.ChannelName,
        sub?.name,
        sub?.title,
        sub?.author
    );

    const avatarCandidate =
        sub?.avatarUrl ||
        sub?.AvatarUrl ||
        sub?.authorAvatar ||
        sub?.AuthorAvatar ||
        sub?.channelAvatar ||
        sub?.ChannelAvatar ||
        sub?.avatar ||
        sub?.Avatar ||
        "";

    const normalized = {
        id:
            sub?.id ||
            sub?._id ||
            sub?.subscriptionId ||
            sub?.channelId ||
            sub?.ChannelId ||
            sub?.authorId ||
            routeValue ||
            `sub-${index}`,

        channelId: getFirstNonEmptyString(
            sub?.channelId,
            sub?.ChannelId,
            sub?.authorId
        ),

        customUrl: getFirstNonEmptyString(
            sub?.customUrl,
            sub?.CustomUrl,
            sub?.authorCustomUrl
        ),

        routeValue,
        sourceType,

        channelName:
            sub?.channelName ||
            sub?.ChannelName ||
            sub?.name ||
            sub?.title ||
            sub?.author ||
            "Unknown channel",

        avatarUrl: isValidImageSrc(avatarCandidate)
            ? avatarCandidate
            : "/ava.png",
    };

    normalized.path = buildSubscriptionPath({
        ...sub,
        ...normalized,
    });

    return normalized;
}

function extractDateValue(item){
    const raw = item?.createdAt ||
    item?.publishedAt ||
    item?.uploadDate ||
    item?.date ||
    item?.createdDate ||
    item?.updatedAt ||
    "";
    const time = new Date(raw).getTime();
    return Number.isNaN(time) ? 0 : time;
}

function normalizeVideo(item, index) {
    return {
        id: item?.id || item?.videoId || `video-${index}`,
        sourceType: "video",
        title: item?.title || "Untitled video",
        thumbnail:
            item?.thumbnailUrl ||
            item?.thumbnail ||
            item?.previewUrl ||
            item?.imageUrl ||
            "",
        avatarUrl:
            item?.AvatarUrl ||
            item?.avatarUrl ||
            item?.authorAvatar ||
            "/ava.png",
        channelId: item?.channelId || "",
        customUrl: item?.customUrl || "",
        routeValue:
            item?.routeValue ||
            item?.customUrl ||
            item?.channelId ||
            item?.channelName ||
            "",
        channelName:
            item?.channelName ||
            item?.author ||
            item?.authorName ||
            "Unknown channel",
        createdAt:
            item?.createdAt ||
            item?.publishedAt ||
            item?.uploadDate ||
            item?.date ||
            "",
        createdAtValue: extractDateValue(item),
        raw: item,
    };
}

function normalizeReel(item, index) {
    return {
        id: item?.id || item?.reelId || item?.videoId || `reel-${index}`,
        sourceType: "reel",
        title: item?.title || "Untitled reel",
        thumbnail:
            item?.thumbnailUrl ||
            item?.thumbnail ||
            item?.posterUrl ||
            item?.previewUrl ||
            item?.imageUrl ||
            "",
        avatarUrl:
            item?.AvatarUrl ||
            item?.avatarUrl ||
            item?.authorAvatar ||
            "/ava.png",
        channelId: item?.channelId || "",
        customUrl: item?.customUrl || "",
        routeValue:
            item?.routeValue ||
            item?.customUrl ||
            item?.channelId ||
            item?.channelName ||
            "",
        channelName:
            item?.channelName ||
            item?.author ||
            item?.authorName ||
            "Unknown channel",
        createdAt:
            item?.createdAt ||
            item?.publishedAt ||
            item?.uploadDate ||
            item?.date ||
            "",
        createdAtValue: extractDateValue(item),
        raw: item,
    };
}

export function SubscriptionsPage(){
    const navigate = useNavigate();
    const [subscriptions, setSubscriptions] = useState([]);
    const [videos, setVideos] = useState([]);
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(()=>{
        let isMounted = true;
        async function loadSubscriptionsFeed() {
            try {
                setLoading(true);
                setError("");

                const videosRes = await fetch(`${API_URL}/api/video/all`, {
                    method: "GET",
                    headers: getAuthHeaders(),
                });

                const reelsRes = await fetch(`${API_URL}/api/reels`, {
                    method: "GET",
                    headers: getAuthHeaders(),
                });
                const subscriptionsRes = await fetch(`${API_URL}/api/account/subscriptions`, {
                    method: "GET",
                    headers: getAuthHeaders(),
                });

                console.log("VIDEOS RESPONSE:", videosRes);
                console.log("VIDEOS STATUS:", videosRes.status);
                console.log("VIDEOS OK:", videosRes.ok);

                console.log("REELS RESPONSE:", reelsRes);
                console.log("REELS STATUS:", reelsRes.status);
                console.log("REELS OK:", reelsRes.ok);

                if (!videosRes.ok) {
                    throw new Error(`Videos request failed: ${videosRes.status}`);
                }

                if (!reelsRes.ok) {
                    throw new Error(`Reels request failed: ${reelsRes.status}`);
                }
                if (!subscriptionsRes.ok) {
                    throw new Error(`Subscriptions request failed: ${subscriptionsRes.status}`);
                }

                const videosData = await videosRes.json();
                const reelsData = await reelsRes.json();
                const subscriptionsData = await subscriptionsRes.json();
                

                console.log("VIDEOS DATA:", videosData);
                console.log("REELS DATA:", reelsData);

                const rawVideos = Array.isArray(videosData)
                    ? videosData
                    : Array.isArray(videosData?.videos)
                    ? videosData.videos
                    : [];

                const rawReels = Array.isArray(reelsData)
                    ? reelsData
                    : Array.isArray(reelsData?.reels)
                    ? reelsData.reels
                    : [];
                

                const rawSubscriptions = Array.isArray(subscriptionsData)
                    ? subscriptionsData
                    : Array.isArray(subscriptionsData?.subscriptions)
                    ? subscriptionsData.subscriptions
                    : [];

                const normalizedSubscriptions = rawSubscriptions.map(normalizeSubscription);    

                console.log("RAW VIDEOS:", rawVideos);
                console.log("RAW REELS:", rawReels);

                const normalizedVideos = rawVideos.map(normalizeVideo);
                const normalizedReels = rawReels.map(normalizeReel);
                
                setSubscriptions(normalizedSubscriptions)
                setVideos(normalizedVideos);
                setReels(normalizedReels);
            } catch (err) {
                console.error("SUBSCRIPTION LOAD ERROR:", err);
                setError(err.message || "Failed to load subscriptions");
            } finally {
                setLoading(false);
            }
        }
        loadSubscriptionsFeed();
        return () =>{
            isMounted = false;
        };
    }, []);

    console.log("SUBSCRIPTIONS STATE:", subscriptions);
    console.log("VIDEOS STATE:", videos);
    console.log("REELS STATE:", reels);

    const subscriptionsFeed = useMemo(() => {
        const subscribedChannelIds = new Set(
            subscriptions
                .map((item) => String(item?.channelId || "").trim())
                .filter(Boolean)
        );

        const subscribedFallbackKeys = new Set(
            subscriptions
                .map((item) =>
                    String(
                        item?.routeValue ||
                        item?.customUrl ||
                        item?.channelName ||
                        ""
                    )
                        .trim()
                        .toLowerCase()
                )
                .filter(Boolean)
        );

        console.log("SUBSCRIBED CHANNEL IDS:", [...subscribedChannelIds]);
        console.log("SUBSCRIBED FALLBACK KEYS:", [...subscribedFallbackKeys]);

        const merged = [...videos, ...reels]
            .filter((item) => {
                const itemChannelId = String(item?.channelId || "").trim();

                const itemFallbackKey = String(
                    item?.routeValue ||
                    item?.customUrl ||
                    item?.channelName ||
                    ""
                )
                    .trim()
                    .toLowerCase();

                const matchedByChannelId =
                    itemChannelId && subscribedChannelIds.has(itemChannelId);

                const matchedByFallback =
                    !matchedByChannelId &&
                    itemFallbackKey &&
                    subscribedFallbackKeys.has(itemFallbackKey);

                return matchedByChannelId || matchedByFallback;
            })
            .sort((a, b) => b.createdAtValue - a.createdAtValue);

        console.log("VIDEOS NORMALIZED:", videos);
        console.log("REELS NORMALIZED:", reels);
        console.log("FINAL SUBSCRIPTIONS FEED:", merged);

        return merged;
    }, [subscriptions, videos, reels]);

    function openItem(item){
        console.log("OPEN SUB ITEM", item);
        if(item.sourceType === "reel"){
            navigate(`/reels/${item.id}`,{
                state:{
                    reel:item.raw,
                },
            });
            return;
        }
        navigate(`/video/${item.id}`,{
            state:{
                video:item.raw,
            },
        });
    }
    function openAuthor(item) {
        console.log("OPEN AUTHOR FROM SUBSCRIPTIONS", item);

        if (item.path) {
            navigate(item.path, {
                state: {
                    channelName: item.channelName,
                    avatarUrl: item.avatarUrl,
                    sourceType: item.sourceType,
                    sourceData: item.raw,
                },
            });
            return;
        }

        navigate("/channel", {
            state: {
                channelName: item.channelName,
                avatarUrl: item.avatarUrl,
                sourceType: item.sourceType,
                sourceData: item.raw,
            },
        });
    }

    return(
        <div className="subscriptions-page">
            <div className="subscriptions-header">
                <h1>Subscriptions</h1>
                <p>New videos and reels from channels you follow</p>
                {loading && (
                    <div className="subscriptions-state"><span>Loading subscriptions</span></div>
                )}
                {!loading && error && (
                    <div className="subscriptions-state subscriptions-error">
                        <span>{error}</span>
                    </div>
                )}
                {!loading && !error && subscriptionsFeed.length === 0 && (
                    <div className="subscriptions-state">
                        <span>No new content from your subscriptions yet.</span>
                    </div>
                )}
                {!loading && !error && subscriptionsFeed.length > 0 && (
                    <div className="subscriptions-grid">
                        {subscriptionsFeed.map((item)=>(
                            <div key={`${item.sourceType}-${item.id}`} className="subscription-card">
                                <div className="subscription-preview" onClick={()=>openItem(item)}>
                                    <img src = {item.thumbnail || "placeholder-video.jpg"} alt={item.title}/>
                                    <span className={`subscription-badge ${item.sourceType}`}>
                                        {item.sourceType === "reel" ? "Reel" : "Video"}
                                    </span>
                                </div>
                                <div className="subscription-info">
                                    <div className="subscription-avatar" onClick={()=>openAuthor(item)}>
                                        <img src = {item.avatarUrl || "/ava.png"} alt = {item.channelName}/>
                                    </div>
                                    <div className="subscription-meta">
                                        <h3 onClick={()=>openItem(item)}>{item.title}</h3>
                                        <button type="button" className="subscription-channel-btn" onClick={()=>openAuthor(item)}>{item.channelName}</button>
                                        <div className="subscription-extra">
                                            <span>{item.views} views</span>
                                            {item.createdAt && <span>{item.createdAt}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

