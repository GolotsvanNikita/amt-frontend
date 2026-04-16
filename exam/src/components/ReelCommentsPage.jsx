import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReelComments } from "./ReelComments";
import "./ReelCommentsPage.css";

export function ReelCommentsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [comments, setComments] = useState([]);
    const [reelInfo, setReelInfo] = useState(null);
    const [loading, setLoading] = useState(true);

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

            setComments(incomingComments);
            setReelInfo(data?.video || data?.reel || data?.data || null);
        } catch (error) {
            console.error("Failed to load reel comments:", error);
            setComments([]);
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

                    <div className="reel-comments-page-title">
                        <h2>{reelInfo?.author || "Comments"}</h2>
                        <p>{reelInfo?.username || "Reel comments"}</p>
                    </div>

                    <button type="button" className="reel-comments-subscribe">
                        Subscribe
                    </button>
                </div>

                <div className="reel-comments-page-audio">
                    ♪ Original Audio
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