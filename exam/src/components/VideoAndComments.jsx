import {useEffect, useState} from "react";
import { useLocation, useParams} from "react-router-dom";
import { YouTubeCustomPlayer } from "./VideoPage";
import { Comments } from "./Comments";

function getAuthToken(){
    return(
        localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("jwt") || ""
    );
}

export function VideoAndComments() {
    const { id } = useParams();
    const location = useLocation();

    const [comments, setComments] = useState([]);
    const [likes, setLikes] = useState(0);
    const [loadingInteractions, setLoadingInteractions] = useState(true);
    const [interactionsError, setInteractionsError] = useState("");

    useEffect(() => {
        if (!id) {
            setComments([]);
            setLikes(0);
            setLoadingInteractions(false);
            return;
        }

        const loadInteractions = async () => {
            try {
                setLoadingInteractions(true);
                setInteractionsError("");

                const token = getAuthToken();

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/interactions/video/${id}`,
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

                setComments(Array.isArray(data?.comments) ? data.comments : []);
                setLikes(Number(data?.likesCount) || 0);
            } catch (err) {
                console.error("Failed to load interactions:", err);
                setInteractionsError(err.message || "Failed to load interactions");
                setComments([]);
                setLikes(0);
            } finally {
                setLoadingInteractions(false);
            }
        };

        loadInteractions();
    }, [id]);

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
                <div style={{ marginTop: "20px" }}>{interactionsError}</div>
            ) : (
                <Comments comments={comments} setComments={setComments} />
            )}
        </div>
    );
}