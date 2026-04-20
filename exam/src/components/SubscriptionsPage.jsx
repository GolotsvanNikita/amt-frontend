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

function getAuthHeaders(){
    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
    };

    if(token){
        headers.Authorization = `Bearer ${token};`
    }
}

function isValidImage(value){
    return typeof value === "string" && value.trim() !== "";
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

function normalizeVideo(item, index){
    return{
        id: item?.id || item?.videoId || `video-${index}`,
        sourceType : "video",
        title : item?.title || "Untitled video",
        thumbnail : item?.thumbnailUrl || item?.thumbnail || item?.previewUrl || item?.posterUrl || "",
        avatarUrl : isValidImage(item?.AvatarUrl) ? item?.AvatarUrl : isValidImage(item?.avatarUrl) ? item?.avatarUrl : isValidImage(item?.authorAvatar) ? item?.authorAvatar : "/ava.png",
        channelName: item?.channelName || item?.author || item?.authorName || item?.name || "Unknown author",
        isSubscribed: Boolean(item?.isSubscribed),
        createdAt: item?.createdAt || item?.publishedAt || item?.uploadDate || item?.date || "",
        createdAtValue: extractDateValue(item),
        views: item?.viewsCount || item?.views || item?.viewCount ||  item?.view || 0,
        raw: item,
    };
}

function normalizeReel(item, index){
    return{
        id: item?.id || item?.reelId || item?.videoId || `reel-${index}`,
        sourceType: 'reel',
        title : item?.title || "Untitled reel",
        thumbnail: item?.thumbnail || item?.thumbnailUrl || item?.posterUrl || item?.previewUrl || "",
        avatarUrl: isValidImage(item?.AvatarUrl) ? item?.AvatarUrl : isValidImage(item?.avatarUrl) ? item?.avatarUrl : isValidImage(item?.authorAvatar) ? item?.authorAvatar : "/ava.png",
        channelName: item?.channelName || item?.author || item?.authorName || item?.name || "Unknown avatar",
        isSubscribed: Boolean(item?.isSubscribed),
        createdAt: item?.createdAt || item?.publishedAt || item?.date || item?.uploadDate || " ",
        createdAtValue: extractDateValue(item),
        views: item?.views || item?.view || item?.viewsCount || item?.viewCount || 0,
        raw: item,
    };
}

export function SubscriptionsPage(){
    const navigate = useNavigate();
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

                const videosData = await videosRes.json();
                const reelsData = await reelsRes.json();

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

                console.log("RAW VIDEOS:", rawVideos);
                console.log("RAW REELS:", rawReels);

                const normalizedVideos = rawVideos.map(normalizeVideo);
                const normalizedReels = rawReels.map(normalizeReel);

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

    const subscriptionsFeed = useMemo(()=>{
        const merged = [...videos, ...reels].filter((item)=>item.isSubscribed).sort((a,b)=>b.createdAtValue - a.createdAtValue);
        console.log("SUBSCRIPTIONS FEED:", merged);
        return merged;
    }, [videos,reels])

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
    function openAuthor(item){
        console.log("OPEN AUTHOR FROM SUBSCRIPTIONS", item);

        navigate("/channel", {
            state:{
                channelName: item.channelName,
                avatarUrl: item.avatarUrl,
                isSubscribed : item.isSubscribed,
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

