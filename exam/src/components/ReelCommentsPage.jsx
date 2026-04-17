import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReelComments } from "./ReelComments";
import "./ReelCommentsPage.css";

function getToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("authToken") ||
        sessionStorage.getItem("accessToken") ||
        sessionStorage.getItem("jwt") ||
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

function normalizeAuthor(reelInfo) {
    return {
        id: String(
            reelInfo?.channelId ||
            reelInfo?.authorId ||
            reelInfo?.channel?.id ||
            reelInfo?.channel?._id ||
            reelInfo?.customUrl ||
            reelInfo?.channel?.customUrl ||
            ""
        ).trim(),
        title:
            reelInfo?.author ||
            reelInfo?.channelName ||
            reelInfo?.channel?.title ||
            reelInfo?.name ||
            "Unknown author",
        username:
            reelInfo?.username ||
            reelInfo?.channel?.customUrl ||
            reelInfo?.customUrl ||
            "@unknown",
        avatarUrl: isValidImageSrc(
            reelInfo?.authorAvatar ||
            reelInfo?.channel?.avatarUrl ||
            reelInfo?.avatarUrl ||
            reelInfo?.avatar
        )
            ? (
                reelInfo?.authorAvatar ||
                reelInfo?.channel?.avatarUrl ||
                reelInfo?.avatarUrl ||
                reelInfo?.avatar
            )
            : "/ava.png",
    };
}

export function ReelCommentsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [comments, setComments] = useState([]);
    const [reelInfo, setReelInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const author = useMemo(() => normalizeAuthor(reelInfo || {}), [reelInfo]);

    const handleSubscribe = async () => {
        const token = getToken();

        if (!token) {
            navigate("/login");
            return;
        }

        const previousValue = isSubscribed;
        const nextValue = !previousValue;

        setIsSubscribed(nextValue);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/interactions/subscribe`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    channelName: author?.title || "",
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to subscribe");
            }
        } catch (e) {
            console.error("Subscribe error:", e);
            setIsSubscribed(previousValue);
        }
    };

    const openAuthorPage = () => {
        if (!author?.id) {
            console.warn("Author id not found:", author, reelInfo);
            return;
        }

        navigate(`/channel/${encodeURIComponent(author.id)}`);
    };

    const loadComments = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/interactions/video/${id}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || "Failed to load reel comments");
            }

            const incomingComments = Array.isArray(data?.comments)
                ? data.comments
                : Array.isArray(data?.interactions?.comments)
                ? data.interactions.comments
                : Array.isArray(data?.data?.comments)
                ? data.data.comments
                : [];

            const resolvedReelInfo =
                data?.video ||
                data?.reel ||
                data?.data ||
                null;

            setComments(incomingComments);
            setReelInfo(resolvedReelInfo);

            if (typeof data?.isSubscribed === "boolean") {
                setIsSubscribed(data.isSubscribed);
            } else if (typeof resolvedReelInfo?.isSubscribed === "boolean") {
                setIsSubscribed(resolvedReelInfo.isSubscribed);
            } else {
                setIsSubscribed(false);
            }
        } catch (error) {
            console.error("Failed to load reel comments:", error);
            setComments([]);
            setReelInfo(null);
            setIsSubscribed(false);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadComments();
    }, [loadComments]);

    if (loading) {
        return <div className="reel-comments-page">Loading comments...</div>;
    }

    return (
        <div className="reel-comments-page">
            <div className="reel-comments-page-inner">
                <div className="reel-comments-page-header">
                    <button
                        type="button"
                        className="reel-comments-back"
                        onClick={() => navigate(`/reels-page/${id}`)}
                    >
                        ← Back
                    </button>

                    <div
                        className="reel-comments-page-title"
                        onClick={openAuthorPage}
                        style={{ cursor: author?.id ? "pointer" : "default" }}
                    >
                        <h2>{author?.title || "Comments"}</h2>
                        <p>{author?.username || "Reel comments"}</p>
                    </div>

                    <button
                        type="button"
                        className={`reel-comments-subscribe ${isSubscribed ? "is-subscribed" : ""}`}
                        onClick={handleSubscribe}
                    >
                        {isSubscribed ? "Subscribed" : "Subscribe"}
                    </button>
                </div>

                <div
                    className="reel-comments-page-audio"
                    onClick={openAuthorPage}
                    style={{ cursor: author?.id ? "pointer" : "default" }}
                >
                    ♪ {author?.title || "Original Audio"}
                </div>

                <div className="reel-comments-divider" />

                <ReelComments
                    comments={comments}
                    reelId={id}
                    reloadComments={loadComments}
                />
            </div>
        </div>
    );
}