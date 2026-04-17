import React, { useEffect, useMemo, useState, useContext, useCallback } from "react";
import "./MyAccount.css";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";

const DEFAULT_PROFILE = {
    name: "User",
    username: "user",
    subscribers: 0,
    avatar: "/ava.png",
    bannerUrl: "/backimage.jpg",
    description: ""
};

const DEFAULT_ACHIEVEMENT = null;

export function MyAccount() {
    const navigate = useNavigate();
    const { userData } = useContext(UserContext);

    const token = userData?.token || localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("jwt") || "";

    const [profile, setProfile] = useState(DEFAULT_PROFILE);
    const [popularVideos, setPopularVideos] = useState([]);
    const [myVideos, setMyVideos] = useState([]);
    const [watchedVideos, setWatchedVideos] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [achievement, setAchievement] = useState(DEFAULT_ACHIEVEMENT);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const apiBaseUrl = import.meta.env.VITE_API_URL;

    const authHeaders = useMemo(() => {
        const headers = {
            "Content-Type": "application/json"
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return headers;
    }, [token]);

    const fetchJson = useCallback(
        async (url, options = {}) => {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...authHeaders,
                    ...(options.headers || {})
                }
            });

            let data = null;

            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                const message =
                    data?.message ||
                    data?.error ||
                    `Request failed: ${response.status}`;
                throw new Error(message);
            }

            return data;
        },
        [authHeaders]
    );

    function formatViews(value) {
        if (value === null || value === undefined || value === "") return "0";

        if (typeof value === "string") return value;

        const num = Number(value);
        if (Number.isNaN(num)) return "0";

        if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(".0", "")}B`;
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(".0", "")}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(".0", "")}K`;

        return String(num);
    }

    function normalizeTimeAgo(item) {
        return (
            item?.timeAgo ||
            item?.publishedAtText ||
            item?.publishedText ||
            item?.createdAtText ||
            item?.createdAgo ||
            item?.uploadedAt ||
            item?.time ||
            "Recently"
        );
    }

    function extractVideoId(item, fallbackIndex = 0) {
        return (
            item?.resolvedId ||
            item?.videoId ||
            item?.youtubeId ||
            item?.id ||
            item?._id ||
            `video-${fallbackIndex}`
        );
    }

    function extractThumbnail(item) {
        return (
            item?.thumbnailUrl ||
            item?.thumbnail ||
            item?.posterUrl ||
            item?.preview ||
            item?.image ||
            item?.coverUrl ||
            "/16v.png"
        );
    }

    function extractTitle(item, fallback = "Untitled video") {
        return (
            item?.title ||
            item?.name ||
            item?.videoTitle ||
            fallback
        );
    }

    function extractChannelName(item) {
        return (
            item?.channelName ||
            item?.author ||
            item?.username ||
            item?.ownerName ||
            item?.creatorName ||
            profile?.username ||
            "unknown"
        );
    }

    function extractChannelAvatar(item) {
        return (
            item?.channelAvatar ||
            item?.avatar ||
            item?.authorAvatar ||
            item?.ownerAvatar ||
            profile?.avatar ||
            "/ava.png"
        );
    }

    function normalizeVideo(item, index = 0, type = "video") {
        const rawId = extractVideoId(item, index);
        const videoId = String(rawId);

        return {
            id: videoId,
            videoId,
            type,
            title: extractTitle(item),
            thumbnail: extractThumbnail(item),
            views: formatViews(
                item?.views ??
                item?.viewsCount ??
                item?.viewCount ??
                item?.totalViews ??
                0
            ),
            time: normalizeTimeAgo(item),
            avatar: extractChannelAvatar(item),
            username: extractChannelName(item),
            description: item?.description || "",
            raw: item
        };
    }

    function normalizePlaylist(item, index = 0) {
        return {
            id: String(item?.id || item?._id || `playlist-${index}`),
            title: item?.title || item?.name || "Untitled playlist",
            thumbnail:
                item?.thumbnailUrl ||
                item?.thumbnail ||
                item?.coverUrl ||
                item?.image ||
                "/15v.png",
            videosCount:
                item?.videosCount ??
                item?.itemsCount ??
                item?.count ??
                0,
            raw: item
        };
    }

    function normalizeSubscription(item, index = 0) {
        return {
            id: String(item?.id || item?._id || item?.channelId || `sub-${index}`),
            name:
                item?.name ||
                item?.channelName ||
                item?.username ||
                "Unknown channel",
            username:
                item?.username ||
                item?.channelSlug ||
                item?.channelName ||
                "unknown",
            avatar:
                item?.avatar ||
                item?.channelAvatar ||
                item?.image ||
                "/ava.png",
            subscribers:
                item?.subscribers ??
                item?.subscribersCount ??
                0,
            raw: item
        };
    }

    function normalizeAchievement(item) {
        if (!item) return null;

        return {
            id: item?.id || item?._id || "achievement",
            title: item?.title || "Achievement",
            description: item?.description || "",
            themeSlug: item?.themeSlug || item?.slug || "",
            isVisible: item?.isVisible !== false
        };
    }

    function normalizeProfile(data) {
        if (!data) return DEFAULT_PROFILE;

        return {
            name:
                data?.name ||
                data?.displayName ||
                data?.fullName ||
                "User",
            username:
                data?.username ||
                data?.userName ||
                data?.login ||
                "user",
            subscribers:
                data?.subscribers ??
                data?.subscribersCount ??
                data?.followers ??
                0,
            avatar:
                data?.avatar ||
                data?.avatarUrl ||
                data?.profileImage ||
                "/ava.png",
            bannerUrl:
                data?.bannerUrl ||
                data?.banner ||
                data?.backgroundImage ||
                "/backimage.jpg",
            description:
                data?.description ||
                data?.bio ||
                ""
        };
    }

    const loadAccount = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            if (!token) {
                throw new Error("No auth token found");
            }

            const requests = [
                fetchJson(`${apiBaseUrl}/api/account/profile`),

                fetchJson(`${apiBaseUrl}/api/account/videos/popular`).catch(() => []),
                fetchJson(`${apiBaseUrl}/api/account/videos`).catch(() => []),
                fetchJson(`${apiBaseUrl}/api/history/recent`).catch(() => []),
                fetchJson(`${apiBaseUrl}/api/account/playlists`).catch(() => []),
                fetchJson(`${apiBaseUrl}/api/account/subscriptions`).catch(() => []),
                fetchJson(`${apiBaseUrl}/api/account/achievement`).catch(() => null)
            ];

            const [
                profileData,
                popularData,
                myVideosData,
                watchedData,
                playlistsData,
                subscriptionsData,
                achievementData
            ] = await Promise.all(requests);

            const normalizedProfile = normalizeProfile(profileData);

            const popularArray = Array.isArray(popularData?.videos)
                ? popularData.videos
                : Array.isArray(popularData)
                ? popularData
                : [];

            const myVideosArray = Array.isArray(myVideosData?.videos)
                ? myVideosData.videos
                : Array.isArray(myVideosData)
                ? myVideosData
                : [];

            const watchedArray = Array.isArray(watchedData?.videos)
                ? watchedData.videos
                : Array.isArray(watchedData)
                ? watchedData
                : [];

            const playlistsArray = Array.isArray(playlistsData?.playlists)
                ? playlistsData.playlists
                : Array.isArray(playlistsData)
                ? playlistsData
                : [];

            const subscriptionsArray = Array.isArray(subscriptionsData?.subscriptions)
                ? subscriptionsData.subscriptions
                : Array.isArray(subscriptionsData)
                ? subscriptionsData
                : [];

            setProfile(normalizedProfile);
            setPopularVideos(popularArray.map((item, index) => normalizeVideo(item, index, "popular")));
            setMyVideos(myVideosArray.map((item, index) => normalizeVideo(item, index, "my")));
            setWatchedVideos(watchedArray.map((item, index) => normalizeVideo(item, index, "watched")));
            setPlaylists(playlistsArray.map((item, index) => normalizePlaylist(item, index)));
            setSubscriptions(subscriptionsArray.map((item, index) => normalizeSubscription(item, index)));
            setAchievement(normalizeAchievement(achievementData));
        } catch (err) {
            console.error("Failed to load MyAccount:", err);
            setError(err?.message || "Failed to load account data");
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl, fetchJson, token]);

    useEffect(() => {
        loadAccount();
    }, [loadAccount]);

    const handleApplyTheme = () => {
        if (!achievement?.themeSlug) {
            navigate("/theme-page");
            return;
        }

        navigate("/theme-page", {
            state: {
                autoOpenTheme: achievement.themeSlug
            }
        });
    };

    const handleWatchLater = () => {
        navigate("/theme-page");
    };

    const handleOpenVideo = (video) => {
        const videoId = video?.videoId || video?.id;
        if (!videoId) return;

        navigate(`/video/${videoId}`, {
            state: {
                video
            }
        });
    };

    const handleOpenProfileEdit = () => {
        navigate("/edit-profile");
    };

    const handleOpenChannel = () => {
        navigate(`/author/${profile?.username}`, {
            state: {
                channelName: profile?.name,
                username: profile?.username,
                avatar: profile?.avatar,
                subscribers: profile?.subscribers,
                bannerUrl: profile?.bannerUrl,
                description: profile?.description
            }
        });
    };

    const handleOpenSubscription = (sub) => {
        navigate(`/author/${sub?.username || sub?.id}`, {
            state: {
                channelName: sub?.name,
                username: sub?.username,
                avatar: sub?.avatar,
                subscribers: sub?.subscribers
            }
        });
    };

    const handleOpenPlaylist = (playlist) => {
        navigate(`/playlist/${playlist.id}`, {
            state: {
                playlist
            }
        });
    };

    if (loading) {
        return <div className="loading">Loading account...</div>;
    }

    if (error) {
        return (
            <div className="account-page">
                <div className="loading" style={{ padding: "40px 20px" }}>
                    <p>{error}</p>
                    <button className="control-btn" onClick={loadAccount}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="account-page">
            <header
                className="account-banner"
                style={{ backgroundImage: `url(${profile.bannerUrl})` }}
            >
                <div className="banner-overlay">
                    <img
                        src={profile.avatar}
                        alt={profile.username}
                        className="account-avatar"
                        onClick={handleOpenChannel}
                        style={{ cursor: "pointer" }}
                    />

                    <div className="account-info">
                        <h1>{profile.name}</h1>
                        <p>@{profile.username} · {profile.subscribers} subscribers</p>

                        {profile.description ? (
                            <div className="account-description">{profile.description}</div>
                        ) : null}

                        <div className="profile-actions">
                            <button className="control-btn" onClick={handleOpenChannel}>
                                View channel
                            </button>

                            <button className="profile-icon-btn" title="Statistics">
                                <svg viewBox="0 0 24 24">
                                    <path d="M5 19V10" />
                                    <path d="M12 19V5" />
                                    <path d="M19 19V13" />
                                    <path d="M3 19H21" />
                                </svg>
                            </button>

                            <button
                                className="profile-icon-btn"
                                title="Edit profile"
                                onClick={handleOpenProfileEdit}
                            >
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <nav className="account-nav">
                <button className="active">Home</button>
                <button onClick={() => document.getElementById("my-videos-section")?.scrollIntoView({ behavior: "smooth" })}>
                    My videos
                </button>
                <button onClick={() => document.getElementById("watched-section")?.scrollIntoView({ behavior: "smooth" })}>
                    Watched
                </button>
                <button onClick={() => document.getElementById("subscriptions-section")?.scrollIntoView({ behavior: "smooth" })}>
                    Subscriptions
                </button>
                <button onClick={() => document.getElementById("playlists-section")?.scrollIntoView({ behavior: "smooth" })}>
                    Playlists
                </button>
            </nav>

            <section className="section">
                <h2>Popular</h2>
                <div className="video-grid">
                    {popularVideos.length > 0 ? (
                        popularVideos.map((video) => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                onClick={() => handleOpenVideo(video)}
                            />
                        ))
                    ) : (
                        <EmptyState text="No popular videos yet" />
                    )}
                </div>
            </section>

            <section className="section" id="my-videos-section">
                <h2>My videos</h2>
                <div className="video-grid">
                    {myVideos.length > 0 ? (
                        myVideos.map((video) => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                onClick={() => handleOpenVideo(video)}
                            />
                        ))
                    ) : (
                        <EmptyState text="You don't have uploaded videos yet" />
                    )}
                </div>
            </section>

            <section className="section" id="watched-section">
                <h2>Watched</h2>
                <div className="video-grid">
                    {watchedVideos.length > 0 ? (
                        watchedVideos.map((video) => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                onClick={() => handleOpenVideo(video)}
                            />
                        ))
                    ) : (
                        <EmptyState text="No watched videos yet" />
                    )}
                </div>
            </section>

            <section className="section" id="playlists-section">
                <h2>Playlists</h2>
                <div className="playlist-grid">
                    {playlists.length > 0 ? (
                        playlists.map((playlist) => (
                            <div
                                key={playlist.id}
                                className="playlist-card"
                                onClick={() => handleOpenPlaylist(playlist)}
                                style={{ cursor: "pointer" }}
                            >
                                <img src={playlist.thumbnail} alt={playlist.title} />
                                <p>{playlist.title}</p>
                                <span>{playlist.videosCount} videos</span>
                            </div>
                        ))
                    ) : (
                        <EmptyState text="No playlists yet" />
                    )}
                </div>
            </section>

            <section className="section" id="subscriptions-section">
                <h2>Subscriptions</h2>
                <div className="playlist-grid">
                    {subscriptions.length > 0 ? (
                        subscriptions.map((sub) => (
                            <div
                                key={sub.id}
                                className="playlist-card"
                                onClick={() => handleOpenSubscription(sub)}
                                style={{ cursor: "pointer" }}
                            >
                                <img src={sub.avatar} alt={sub.name} />
                                <p>{sub.name}</p>
                                <span>@{sub.username}</span>
                            </div>
                        ))
                    ) : (
                        <EmptyState text="No subscriptions yet" />
                    )}
                </div>
            </section>

            {achievement?.isVisible && (
                <div className="achievement-bar">
                    <div className="achievement-text">
                        {achievement.description || achievement.title}
                    </div>

                    <div className="achievement-actions">
                        <button
                            className="achievement-apply-btn"
                            onClick={handleApplyTheme}
                        >
                            Apply
                        </button>
                        <button
                            className="achievement-watch-btn"
                            onClick={handleWatchLater}
                        >
                            Watch Later
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    function VideoCard({ video, onClick }) {
        return (
            <div className="video-card" onClick={onClick} style={{ cursor: "pointer" }}>
                <img src={video.thumbnail} className="video-thumb" alt={video.title} />

                <div className="video-meta">
                    <img src={video.avatar} className="meta-avatar" alt={video.username} />

                    <div className="video-info">
                        <div className="video-title">{video.title}</div>
                        <div className="video-channel">@{video.username}</div>
                        <div className="video-sub">
                            {video.views} views &nbsp;&nbsp; {video.time}
                        </div>
                    </div>

                    <div className="video-more">⋮</div>
                </div>
            </div>
        );
    }

    function EmptyState({ text }) {
        return <div className="loading">{text}</div>;
    }
}