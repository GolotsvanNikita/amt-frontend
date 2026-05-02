import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "./SearchPage.css";

const API_URL = import.meta.env.VITE_API_URL;

export function SearchPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";

    const [videos, setVideos] = useState([]);
    const [nextPageToken, setNextPageToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loadSearchResults = async (pageToken = "") => {
        if (!query.trim()) return;

        try {
            setLoading(true);
            setError("");

            const url = `${API_URL}/api/video/search?q=${encodeURIComponent(query)}&pageToken=${pageToken}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data = await response.json();

            const newVideos = data.videos || data.items || [];

            if (pageToken) {
                setVideos(prev => [...prev, ...newVideos]);
            } else {
                setVideos(newVideos);
            }

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

            {!loading && videos.length === 0 && !error && (
                <p className="emptySearch">No videos found</p>
            )}

            <div className="searchResults">
                {videos.map((video) => {
                    const videoId = video.id || video.videoId;
                    const title = video.title || video.snippet?.title || "Untitled";
                    const thumbnail =
                        video.thumbnailUrl ||
                        video.thumbnail ||
                        video.snippet?.thumbnails?.medium?.url ||
                        video.snippet?.thumbnails?.high?.url;

                    const channelName =
                        video.channelName ||
                        video.snippet?.channelTitle ||
                        "Unknown channel";

                    return (
                        <Link to={`/video/${videoId}`} className="searchCard" key={videoId}>
                            <img src={thumbnail} alt={title} />

                            <div className="searchInfo">
                                <h3>{title}</h3>
                                <p>{channelName}</p>
                            </div>
                        </Link>
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