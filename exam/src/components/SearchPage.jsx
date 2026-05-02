import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./SearchPage.css";

const API_URL = import.meta.env.VITE_API_URL;

export function SearchPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const query = searchParams.get("q") || "";

    const [videos, setVideos] = useState([]);
    const [nextPageToken, setNextPageToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const getVideoId = (video) => {
        if (!video) return "";

        if (typeof video.id === "string") return video.id;
        if (typeof video.videoId === "string") return video.videoId;
        if (typeof video.youtubeId === "string") return video.youtubeId;

        if (video.id && typeof video.id === "object") {
            return video.id.videoId || "";
        }

        return "";
    };

    const openVideo = (video) => {
        const videoId = getVideoId(video);

        if (!videoId) {
            console.warn("NO VIDEO ID:", video);
            return;
        }

        navigate(`/video/${videoId}`, {
            state: {
                video
            }
        });
    };

    const loadSearchResults = async (pageToken = "") => {
        if (!query.trim()) return;

        try {
            setLoading(true);
            setError("");

            const url = `${API_URL}/api/video/search?q=${encodeURIComponent(query)}&pageToken=${encodeURIComponent(pageToken)}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data = await response.json();

            const newVideos = data.videos || data.items || [];

            setVideos(prev => pageToken ? [...prev, ...newVideos] : newVideos);
            setNextPageToken(data.nextPageToken || "");
        } catch (err) {
            console.error("SEARCH PAGE ERROR:", err);
            setError("Failed to load search results");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setVideos([]);
        setNextPageToken("");
        loadSearchResults();
    }, [query]);

    return (
        <div className="searchPage">
            <h2>Search results for: <span>{query}</span></h2>

            {error && <p className="searchError">{error}</p>}

            <div className="searchResults">
                {videos.map((video, index) => {
                    const title = video.title || video.snippet?.title || "Untitled";

                    const thumbnail =
                        video.thumbnailUrl ||
                        video.thumbnail ||
                        video.snippet?.thumbnails?.high?.url ||
                        video.snippet?.thumbnails?.medium?.url ||
                        video.snippet?.thumbnails?.default?.url ||
                        "/default-thumbnail.png";

                    const channelName =
                        video.channelName ||
                        video.channelTitle ||
                        video.snippet?.channelTitle ||
                        "Unknown channel";

                    return (
                        <div
                            className="searchCard reveal-on-scroll"
                            key={index}
                            onClick={() => openVideo(video)}
                        >
                            <img src={thumbnail} alt={title} />

                            <div className="searchInfo">
                                <h3>{title}</h3>
                                <p>{channelName}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {loading && <p className="loadingSearch">Loading...</p>}

            {nextPageToken && !loading && (
                <button
                    className="loadMoreSearch"
                    onClick={() => loadSearchResults(nextPageToken)}
                >
                    Load more
                </button>
            )}
        </div>
    );
}