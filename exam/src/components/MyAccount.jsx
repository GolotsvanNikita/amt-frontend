import React, { useEffect, useMemo, useState, useContext, useCallback } from "react";
import "./MyAccount.css";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";

function getFullUrl(path) {
    if (!path || typeof path !== 'string') return path;
    if (path.startsWith("/uploads")) return `${import.meta.env.VITE_API_URL}${path}`;
    return path;
}

const DEFAULT_PROFILE = {
    Name: "User",
    Username: "user",
    Subscribers: 0,
    AvatarUrl: "/ava.png",
    BannerUrl: "/backimage.jpg",
    Description: ""
};

const DEFAULT_ACHIEVEMENT = null;

export function MyAccount() {
    const navigate = useNavigate();
    const { userData } = useContext(UserContext);

    const token =
        userData?.token ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt") ||
        "";

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
            item?.TimeAgo ||
            item?.timeAgo ||
            item?.PublishedAtText ||
            item?.publishedAtText ||
            item?.PublishedText ||
            item?.publishedText ||
            item?.CreatedAtText ||
            item?.createdAtText ||
            item?.CreatedAgo ||
            item?.createdAgo ||
            item?.UploadedAt ||
            item?.uploadedAt ||
            item?.Time ||
            item?.time ||
            "Recently"
        );
    }

    function extractVideoId(item, fallbackIndex = 0) {
        return (
            item?.ResolvedId ||
            item?.resolvedId ||
            item?.VideoId ||
            item?.videoId ||
            item?.YoutubeId ||
            item?.youtubeId ||
            item?.Id ||
            item?.id ||
            item?._id ||
            `video-${fallbackIndex}`
        );
    }

    function extractThumbnail(item) {
        const thumb = item?.ThumbnailUrl || item?.thumbnailUrl || item?.Thumbnail || item?.thumbnail || item?.PosterUrl || item?.posterUrl || item?.Preview || item?.preview || item?.Image || item?.image || item?.CoverUrl || item?.coverUrl || "/16v.png";
        return getFullUrl(thumb);
    }

    function extractTitle(item, fallback = "Untitled video") {
        return (
            item?.Title ||
            item?.title ||
            item?.Name ||
            item?.name ||
            item?.VideoTitle ||
            item?.videoTitle ||
            fallback
        );
    }

    function extractChannelName(item) {
        return (
            item?.ChannelName ||
            item?.channelName ||
            item?.Author ||
            item?.author ||
            item?.Username ||
            item?.username ||
            item?.OwnerName ||
            item?.ownerName ||
            item?.CreatorName ||
            item?.creatorName ||
            profile?.Username ||
            "unknown"
        );
    }

    function extractChannelAvatar(item) {
        const avatar = item?.channelAvatarUrl || item?.ChannelAvatarUrl || item?.ChannelAvatar || item?.channelAvatar || item?.Avatar || item?.avatar || item?.AuthorAvatar || item?.authorAvatar || item?.OwnerAvatar || item?.ownerAvatar || profile?.AvatarUrl || "/ava.png";
        return getFullUrl(avatar);
    }

    function normalizeVideo(item, index = 0, type = "video") {
        const rawId = extractVideoId(item, index);
        const videoId = String(rawId);

        const channelName = extractChannelName(item);

        let avatar = extractChannelAvatar(item);
        if (!avatar || avatar === "/ava.png" || avatar === "null") {
            avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(channelName)}&background=random&color=fff&size=100`;
        }

        return {
            Id: videoId,
            VideoId: videoId,
            Type: type,
            Title: extractTitle(item),
            Thumbnail: extractThumbnail(item),
            Views: formatViews(
                item?.Views ??
                item?.views ??
                item?.ViewsCount ??
                item?.viewsCount ??
                item?.ViewCount ??
                item?.viewCount ??
                item?.TotalViews ??
                item?.totalViews ??
                0
            ),
            Time: normalizeTimeAgo(item),
            Avatar: avatar,
            Username: channelName,
            Description: item?.Description || item?.description || "",
            Raw: item
        };
    }

    function normalizePlaylist(item, index = 0) {
        return {
            Id: String(item?.Id || item?.id || item?._id || `playlist-${index}`),
            Title: item?.Title || item?.title || item?.Name || item?.name || "Untitled playlist",
            Thumbnail:
                item?.ThumbnailUrl ||
                item?.thumbnailUrl ||
                item?.Thumbnail ||
                item?.thumbnail ||
                item?.CoverUrl ||
                item?.coverUrl ||
                item?.Image ||
                item?.image ||
                "/15v.png",
            VideosCount:
                item?.VideosCount ??
                item?.videosCount ??
                item?.ItemsCount ??
                item?.itemsCount ??
                item?.Count ??
                item?.count ??
                0,
            Raw: item
        };
    }

    function normalizeSubscription(item, index = 0) {
        const name = item?.Name || item?.name || item?.ChannelName || item?.channelName || item?.Username || item?.username || "Unknown channel";

        let avatar =
            item?.AvatarUrl ||
            item?.avatarUrl ||
            item?.Avatar ||
            item?.avatar ||
            item?.ChannelAvatar ||
            item?.channelAvatar ||
            item?.Image ||
            item?.image;

        if (!avatar || avatar === "/ava.png" || avatar === "null") {
            avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=100`;
        }

        return {
            Id: String(item?.Id || item?.id || item?._id || item?.ChannelId || item?.channelId || `sub-${index}`),
            Name: name,
            Username:
                item?.Username ||
                item?.username ||
                item?.ChannelSlug ||
                item?.channelSlug ||
                item?.ChannelName ||
                item?.channelName ||
                "unknown",
            Avatar: avatar,
            Subscribers:
                item?.Subscribers ??
                item?.subscribers ??
                item?.SubscribersCount ??
                item?.subscribersCount ??
                0,
            Raw: item
        };
    }

    function normalizeAchievement(item) {
        if (!item) return null;

        return {
            Id: item?.Id || item?.id || item?._id || "achievement",
            Title: item?.Title || item?.title || "Achievement",
            Description: item?.Description || item?.description || "",
            ThemeSlug: item?.ThemeSlug || item?.themeSlug || item?.Slug || item?.slug || "",
            IsVisible: item?.IsVisible !== false && item?.isVisible !== false
        };
    }

    function normalizeProfile(data) {
        if (!data) return DEFAULT_PROFILE;
        return {
            Name: data?.Name || data?.name || data?.DisplayName || data?.displayName || data?.FullName || data?.fullName || "User",
            Username: data?.Username || data?.username || data?.UserName || data?.userName || data?.Login || data?.login || "user",
            Subscribers: data?.Subscribers ?? data?.subscribers ?? data?.SubscribersCount ?? data?.subscribersCount ?? data?.Followers ?? data?.followers ?? 0,
            AvatarUrl: getFullUrl(data?.AvatarUrl || data?.avatarUrl || data?.Avatar || data?.avatar || data?.ProfileImage || data?.profileImage || "/ava.png"),
            BannerUrl: getFullUrl(data?.BannerUrl || data?.bannerUrl || data?.Banner || data?.banner || data?.BackgroundImage || data?.backgroundImage || "/backimage.jpg"),
            Description: data?.Description || data?.description || data?.Bio || data?.bio || ""
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

            const popularArray = Array.isArray(popularData?.Videos)
                ? popularData.Videos
                : Array.isArray(popularData?.videos)
                ? popularData.videos
                : Array.isArray(popularData)
                ? popularData
                : [];

            const myVideosArray = Array.isArray(myVideosData?.Videos)
                ? myVideosData.Videos
                : Array.isArray(myVideosData?.videos)
                ? myVideosData.videos
                : Array.isArray(myVideosData)
                ? myVideosData
                : [];

            const watchedArray = Array.isArray(watchedData?.Videos)
                ? watchedData.Videos
                : Array.isArray(watchedData?.videos)
                ? watchedData.videos
                : Array.isArray(watchedData)
                ? watchedData
                : [];

            const playlistsArray = Array.isArray(playlistsData?.Playlists)
                ? playlistsData.Playlists
                : Array.isArray(playlistsData?.playlists)
                ? playlistsData.playlists
                : Array.isArray(playlistsData)
                ? playlistsData
                : [];

            const subscriptionsArray = Array.isArray(subscriptionsData?.Subscriptions)
                ? subscriptionsData.Subscriptions
                : Array.isArray(subscriptionsData?.subscriptions)
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
        if (!achievement?.ThemeSlug) {
            navigate("/theme-page");
            return;
        }

        navigate("/theme-page", {
            state: {
                autoOpenTheme: achievement.ThemeSlug
            }
        });
    };

    const handleWatchLater = () => {
        navigate("/theme-page");
    };

    const handleOpenVideo = (video) => {
        const videoId = video?.VideoId || video?.Id;
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
        navigate(`/channel/${profile?.Username}`, {
            state: {
                channelName: profile?.Name,
                username: profile?.Username,
                avatar: profile?.AvatarUrl,
                subscribers: profile?.Subscribers,
                bannerUrl: profile?.BannerUrl,
                description: profile?.Description
            }
        });
    };

    const handleOpenSubscription = (sub) => {
        const targetId = sub?.Id && !sub.Id.startsWith("sub-") ? sub.Id : sub?.Username;

        navigate(`/channel/${targetId}`, {
            state: {
                channelName: sub?.Name,
                username: sub?.Username,
                avatar: sub?.Avatar,
                subscribers: sub?.Subscribers
            }
        });
    };

    const handleOpenPlaylist = (playlist) => {
        navigate(`/playlist/${playlist.Id}`, {
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
                style={{ backgroundImage: `url(${profile.BannerUrl})` }}
            >
                <div className="banner-overlay">
                    <img
                        src={profile.AvatarUrl}
                        alt={profile.Username}
                        className="account-avatar"
                        onClick={handleOpenChannel}
                        style={{ cursor: "pointer" }}
                    />

                    <div className="account-info">
                        <h1>{profile.Name}</h1>
                        <p>@{profile.Username} · {profile.Subscribers} subscribers</p>

                        {profile.Description ? (
                            <div className="account-description">{profile.Description}</div>
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
                                key={video.Id}
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
                                key={video.Id}
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
                                key={video.Id}
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
                                key={playlist.Id}
                                className="playlist-card"
                                onClick={() => handleOpenPlaylist(playlist)}
                                style={{ cursor: "pointer" }}
                            >
                                <img src={playlist.Thumbnail} alt={playlist.Title} />
                                <p>{playlist.Title}</p>
                                <span>{playlist.VideosCount} videos</span>
                            </div>
                        ))
                    ) : (
                        <EmptyState text="No playlists yet" />
                    )}
                </div>
            </section>

            <section className="section" id="subscriptions-section">
                <h2>Subscriptions</h2>
                <div className="subscriptions-grid">
                    {subscriptions.length > 0 ? (
                        subscriptions.map((sub) => (
                            <div
                                key={sub.Id}
                                className="subscription-card"
                                onClick={() => handleOpenSubscription(sub)}
                            >
                                <img src={sub.Avatar} alt={sub.Name} />
                                <p>{sub.Name}</p>
                                <span>@{sub.Username}</span>
                            </div>
                        ))
                    ) : (
                        <EmptyState text="No subscriptions yet" />
                    )}
                </div>
            </section>

            {achievement?.IsVisible && (
                <div className="achievement-bar">
                    <div className="achievement-text">
                        {achievement.Description || achievement.Title}
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
                <img src={video.Thumbnail} className="video-thumb" alt={video.Title} />

                <div className="video-meta">
                    <img src={video.Avatar} className="meta-avatar" alt={video.Username} />

                    <div className="video-info">
                        <div className="video-title">{video.Title}</div>
                        <div className="video-channel">@{video.Username}</div>
                        <div className="video-sub">
                            {video.Views} views &nbsp;&nbsp; {video.Time}
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