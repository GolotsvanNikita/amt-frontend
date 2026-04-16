import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { YouTubeCustomPlayer } from "./VideoPage";
import { Comments } from "./Comments";
import "./VideoAndComments.css";

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

function mergeUniqueComments(prev, next) {
    const map = new Map();

    [...prev, ...next].forEach((comment) => {
        const key = String(comment?.id || comment?._id || Math.random().toString(36));
        map.set(key, comment);
    });

    return Array.from(map.values());
}

export function VideoAndComments() {
    const { id } = useParams();
    const location = useLocation();

    const [comments, setComments] = useState([]);
    const [likes, setLikes] = useState(0);
    const [loadingInteractions, setLoadingInteractions] = useState(true);
    const [loadingMoreComments, setLoadingMoreComments] = useState(false);
    const [interactionsError, setInteractionsError] = useState("");
    const [commentsPage, setCommentsPage] = useState(1);
    const [hasMoreComments, setHasMoreComments] = useState(true);

    const loadInteractions = useCallback(
        async (pageToLoad = 1, append = false) => {
            if (!id) {
                setComments([]);
                setLikes(0);
                setLoadingInteractions(false);
                setLoadingMoreComments(false);
                return;
            }

            try {
                if (pageToLoad === 1 && !append) {
                    setLoadingInteractions(true);
                } else {
                    setLoadingMoreComments(true);
                }

                if (pageToLoad === 1) {
                    setInteractionsError("");
                }

                const token = getAuthToken();

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/interactions/video/${id}?page=${pageToLoad}&limit=10`,
                    {
                        method: "GET",
                        headers: {
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to load interactions");
                }

                const data = await response.json();
                const incomingComments = Array.isArray(data?.comments) ? data.comments : [];

                setComments((prev) =>
                    append ? mergeUniqueComments(prev, incomingComments) : incomingComments
                );

                setLikes(Number(data?.likesCount) || 0);
                setCommentsPage(pageToLoad);

                if (typeof data?.hasMoreComments === "boolean") {
                    setHasMoreComments(data.hasMoreComments);
                } else if (typeof data?.hasMore === "boolean") {
                    setHasMoreComments(data.hasMore);
                } else {
                    setHasMoreComments(incomingComments.length === 10);
                }
            } catch (err) {
                console.error("Failed to load interactions:", err);
                setInteractionsError(err.message || "Failed to load interactions");

                if (!append) {
                    setComments([]);
                    setLikes(0);
                }
            } finally {
                setLoadingInteractions(false);
                setLoadingMoreComments(false);
            }
        },
        [id]
    );

    const reloadInteractions = useCallback(async () => {
        await loadInteractions(1, false);
    }, [loadInteractions]);

    const loadMoreComments = useCallback(async () => {
        if (loadingMoreComments || loadingInteractions || !hasMoreComments) return;
        await loadInteractions(commentsPage + 1, true);
    }, [
        commentsPage,
        hasMoreComments,
        loadInteractions,
        loadingInteractions,
        loadingMoreComments,
    ]);

    useEffect(() => {
        loadInteractions(1, false);
    }, [loadInteractions]);

    return (
        <div className="videoPage">
            <YouTubeCustomPlayer
                routeVideoId={id}
                initialVideo={location.state?.video || null}
                likes={likes}
                setLikes={setLikes}
            />

            {loadingInteractions ? (
                <div style={{ marginTop: "20px" }}>Loading comments...</div>
            ) : interactionsError ? (
                <div style={{ marginTop: "20px" }}>
                    Comments are temporarily unavailable
                </div>
            ) : (
                <Comments
                    comments={comments}
                    videoId={id}
                    reloadInteractions={reloadInteractions}
                    hasMoreComments={hasMoreComments}
                    loadingMoreComments={loadingMoreComments}
                    onLoadMoreComments={loadMoreComments}
                />
            )}
        </div>
    );
}