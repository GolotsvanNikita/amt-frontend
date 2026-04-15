import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Carousel from "react-bootstrap/Carousel";
import "./MainPage.css";
import { Link, useNavigate } from "react-router-dom";

const mockSections = [
    {
        id: "top-week",
        title: "Top 10 on this week",
        videos: [
            {
                id: 1,
                thumbnail: "/1v.png",
                title: "Вакуумная упаковка cloth simulation с лого в Cinema 4D",
                channelName: "SKYQТ",
                meta: "1.2K views • 1 year ago",
            },
            {
                id: 2,
                thumbnail: "/2v.png",
                title: "Daði Freyr (Daði & Gagnamagnið) - Think About Things (Official Video)",
                channelName: "Daði Freyr",
                meta: "45M views • 3 years ago",
            },
            {
                id: 3,
                thumbnail: "/3v.png",
                title: "Before Your Very Eyes...Atoms for Peace - MAMA JAMMA (Live cover)",
                channelName: "Skinway",
                meta: "6M views • 1 day ago",
            },
            {
                id: 4,
                thumbnail: "/4v.png",
                title: "Rush E",
                channelName: "Skinway",
                meta: "6M views • 1 month ago",
            },
        ],
    },
    {
        id: "popular",
        title: "Popular",
        videos: [
            {
                id: 9,
                thumbnail: "/9v.png",
                title: "Take Care",
                channelName: "Boisvert",
                meta: "4.6M views • 3 years ago",
            },
            {
                id: 10,
                thumbnail: "/10v.png",
                title: "Five Nights At Freddy's | Official Teaser",
                channelName: "Universal Pictures",
                meta: "21M views • 2 weeks ago",
            },
            {
                id: 11,
                thumbnail: "/11v.png",
                title: 'I used "deep fakes" to fix the Lion King',
                channelName: "onlyj",
                meta: "44M views • 3 years ago",
            },
            {
                id: 12,
                thumbnail: "/12v.png",
                title: "BABYMETAL // CATCH ME IF YOU CAN",
                channelName: "KuroKitsuneSama",
                meta: "6M views • 1 year ago",
            },
        ],
    },
];

const mockAllVideos = [
    {
        id: 13,
        thumbnail: "/13v.png",
        title: "If Arctic Monkeys wrote Sweater Weather",
        channelName: "Bored Ramone",
        meta: "1.6M views • 1 year ago",
    },
    {
        id: 14,
        thumbnail: "/14v.png",
        title: "Joji - SMITHEREENS Full Album (Pacific Coast Highway)",
        channelName: "Joji",
        meta: "645M views • 6 months ago",
    },
    {
        id: 15,
        thumbnail: "/15v.png",
        title: "Daft Punk - Something About Us (Official Video)",
        channelName: "Daft Punk",
        meta: "81M views • 14 years ago",
    },
    {
        id: 16,
        thumbnail: "/16v.png",
        title: "in NEO TOKYO ⚫ ELECTRONICS FANTASTICOS!",
        channelName: "ELECTRONICS FANTASTICOS!",
        meta: "12M views • 2 years ago",
    },
    {
        id: 17,
        thumbnail: "/17v.png",
        title: "Sinematik Video Estetik | Cinematic Video Aesthetic | Beautiful Sunset",
        channelName: "Damai Yakuza",
        meta: "2.8K views • 2 months ago",
    },
    {
        id: 18,
        thumbnail: "/18v.png",
        title: "Blockhead - The Music Scene",
        channelName: "Ninja Tune",
        meta: "16M views • 13 years ago",
    },
    {
        id: 19,
        thumbnail: "/19v.png",
        title: "Takashi Ito - Thunder",
        channelName: "neu skyin",
        meta: "35K views • 3 years ago",
    },
    {
        id: 20,
        thumbnail: "/20v.png",
        title: "Crumb - Locket [Official Video]",
        channelName: "Crumb The Band",
        meta: "4M views • 5 years ago",
    },
];

const categoryButtons = [
    "All",
    "Music",
    "Jams",
    "Podcast",
    "Comedy",
    "Live",
    "Selena Gomez",
    "Manga",
    "Games shows",
    "Spiderman",
];

function getAuthToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt") ||
        ""
    );
}

function normalizeVideo(video, index = 0) {
    return {
        id: video.videoId || video.id || `video-${index}-${Date.now()}`,
        title: video.title || "Untitled video",
        thumbnail: video.thumbnail || video.thumbnailUrl || "/1v.png",
        channelName: video.channelName || video.author || "Unknown channel",
        meta: video.meta || video.viewsText || "",
    };
}

export function MainPage() {
    const navigate = useNavigate();
    const loaderRef = useRef(null);

    const [videoSections, setVideoSections] = useState([]);
    const [history, setHistory] = useState([]);
    const [allVideos, setAllVideos] = useState([]);

    const [loadingSections, setLoadingSections] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [loadingAllVideos, setLoadingAllVideos] = useState(true);
    const [loadingMoreAllVideos, setLoadingMoreAllVideos] = useState(false);

    const [sectionsError, setSectionsError] = useState("");
    const [historyError, setHistoryError] = useState("");
    const [allVideosError, setAllVideosError] = useState("");

    const [nextPageToken, setNextPageToken] = useState(null);
    const [hasMoreAllVideos, setHasMoreAllVideos] = useState(true);

    useEffect(() => {
        const loadMainPageSections = async () => {
            try {
                setLoadingSections(true);
                setSectionsError("");

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/main-page/videos`);

                if (!response.ok) {
                    throw new Error("Failed to load videos");
                }

                const data = await response.json();
                setVideoSections(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                setSectionsError(err.message || "Something went wrong");
                setVideoSections(mockSections);
            } finally {
                setLoadingSections(false);
            }
        };

        loadMainPageSections();
    }, []);

    useEffect(() => {
        const loadRecentHistory = async () => {
            try {
                setLoadingHistory(true);
                setHistoryError("");

                const token = getAuthToken();

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/history/recent`,
                    {
                        method: "GET",
                        headers: {
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to load watch history");
                }

                const data = await response.json();
                setHistory(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                setHistoryError(err.message || "Failed to load watch history");
                setHistory([]);
            } finally {
                setLoadingHistory(false);
            }
        };

        loadRecentHistory();
    }, []);

    const loadAllVideos = useCallback(
        async (pageToken = "", append = false) => {
            try {
                if (append) {
                    setLoadingMoreAllVideos(true);
                } else {
                    setLoadingAllVideos(true);
                    setAllVideosError("");
                }

                const query = pageToken
                    ? `?pageToken=${encodeURIComponent(pageToken)}`
                    : "";

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/video/all${query}`
                );

                if (!response.ok) {
                    throw new Error("Failed to load all videos");
                }

                const data = await response.json();

                const newVideos = Array.isArray(data?.videos)
                    ? data.videos.map((video, index) => normalizeVideo(video, index))
                    : [];

                if (append) {
                    setAllVideos((prev) => [...prev, ...newVideos]);
                } else {
                    setAllVideos(newVideos);
                }

                setNextPageToken(data?.nextPageToken || null);
                setHasMoreAllVideos(Boolean(data?.nextPageToken));
            } catch (err) {
                console.error(err);
                setAllVideosError(err.message || "Failed to load all videos");

                if (!append && !allVideos.length) {
                    setAllVideos(mockAllVideos);
                    setHasMoreAllVideos(false);
                    setNextPageToken(null);
                }
            } finally {
                setLoadingAllVideos(false);
                setLoadingMoreAllVideos(false);
            }
        },
        []
    );

    useEffect(() => {
        loadAllVideos("", false);
    }, [loadAllVideos]);

    useEffect(() => {
        const node = loaderRef.current;
        if (!node || !hasMoreAllVideos || loadingMoreAllVideos || loadingAllVideos) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];

                if (
                    firstEntry.isIntersecting &&
                    hasMoreAllVideos &&
                    nextPageToken &&
                    !loadingMoreAllVideos
                ) {
                    loadAllVideos(nextPageToken, true);
                }
            },
            {
                root: null,
                rootMargin: "300px",
                threshold: 0,
            }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [
        nextPageToken,
        hasMoreAllVideos,
        loadingMoreAllVideos,
        loadingAllVideos,
        loadAllVideos,
    ]);

    const handleVideoClick = async (video) => {
        const token = getAuthToken();

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/history/record`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    videoId: video.id,
                    title: video.title,
                    thumbnailUrl: video.thumbnail,
                    channelName: video.channelName,
                }),
            });

            setHistory((prev) => {
                const newItem = {
                    videoId: video.id,
                    title: video.title,
                    thumbnailUrl: video.thumbnail,
                    channelName: video.channelName,
                    meta: video.meta || "",
                };

                const filtered = prev.filter(
                    (item) => (item.videoId || item.id) !== video.id
                );

                return [newItem, ...filtered].slice(0, 20);
            });
        } catch (err) {
            console.error("Failed to record history:", err);
        }

        navigate("/video");
    };

    const renderVideoCard = (video) => {
        const normalizedVideo = normalizeVideo(video);

        return (
            <button
                type="button"
                className="videoCard"
                key={normalizedVideo.id}
                onClick={() => handleVideoClick(normalizedVideo)}
            >
                <img
                    src={normalizedVideo.thumbnail}
                    alt={normalizedVideo.title || "Video thumbnail"}
                />

                <div className="videoInfo">
                    <h4>{normalizedVideo.title}</h4>
                    <p>{normalizedVideo.channelName}</p>
                    <span>{normalizedVideo.meta}</span>
                </div>
            </button>
        );
    };

    const regularSections = useMemo(() => videoSections || [], [videoSections]);

    return (
        <div className="mainPage">
            <div className="ads">
                <div className="topContent">
                    <h2>ВЕДИ МЕНЕ В ХРАМ</h2>
                    <p>(TAKE ME TO CHURCH УКРАЇНСЬКОЮ)</p>
                </div>

                <div className="bottomContent">
                    <Link to="/video">
                        <button>WATCH</button>
                    </Link>

                    <p>Enleo • 5M views • 6 day ago</p>

                    <div className="carousel" style={{ flex: 1 }}>
                        <Carousel data-bs-theme="dark">
                            <Carousel.Item>
                                <img
                                    className="d-block w-100"
                                    src="/s1.jpg"
                                    alt="First slide"
                                    style={{
                                        width: "100%",
                                        objectFit: "cover",
                                        height: "140px",
                                        borderRadius: "20px",
                                    }}
                                />
                            </Carousel.Item>

                            <Carousel.Item>
                                <img
                                    className="d-block w-100"
                                    src="/s2.jpg"
                                    alt="Second slide"
                                    style={{
                                        width: "100%",
                                        objectFit: "cover",
                                        position: "relative",
                                        height: "140px",
                                        borderRadius: "20px",
                                    }}
                                />
                            </Carousel.Item>

                            <Carousel.Item>
                                <img
                                    className="d-block w-100"
                                    src="/s3.jpg"
                                    alt="Third slide"
                                    style={{
                                        width: "100%",
                                        objectFit: "cover",
                                        position: "relative",
                                        height: "140px",
                                        borderRadius: "20px",
                                    }}
                                />
                            </Carousel.Item>
                        </Carousel>
                    </div>
                </div>
            </div>

            <div className="categoryBtns">
                {categoryButtons.map((category, index) => (
                    <button
                        key={category}
                        className={index === 0 ? "frts" : "another"}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {loadingSections && (
                <div className="mainPageStatus">Loading videos...</div>
            )}

            {!loadingSections && sectionsError && (
                <div className="mainPageStatus">
                    {sectionsError}. Showing fallback data.
                </div>
            )}

            {regularSections.map((section, index) => (
                <React.Fragment key={section.id || section.title || index}>
                    <div className="videoSection">
                        <h3>{section.title}</h3>

                        <div className="videoGrid">
                            {(section.videos || []).map((video, videoIndex) =>
                                renderVideoCard(normalizeVideo(video, videoIndex))
                            )}
                        </div>
                    </div>

                    <hr className="sectionDivider" />

                    {index === 0 && (
                        <>
                            <div className="videoSection">
                                <h3>Continue Watching</h3>

                                {loadingHistory ? (
                                    <div className="mainPageStatus">
                                        Loading history...
                                    </div>
                                ) : historyError ? (
                                    <div className="mainPageStatus">
                                        {historyError}
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="mainPageStatus">
                                        No recently watched videos
                                    </div>
                                ) : (
                                    <div className="videoGrid">
                                        {history.map((video, historyIndex) =>
                                            renderVideoCard(
                                                normalizeVideo(
                                                    {
                                                        id: video.videoId || video.id,
                                                        title: video.title,
                                                        thumbnail:
                                                            video.thumbnail ||
                                                            video.thumbnailUrl,
                                                        channelName:
                                                            video.channelName ||
                                                            video.author,
                                                        meta:
                                                            video.meta ||
                                                            video.viewsText ||
                                                            "",
                                                    },
                                                    historyIndex
                                                )
                                            )
                                        )}
                                    </div>
                                )}
                            </div>

                            <hr className="sectionDivider" />
                        </>
                    )}
                </React.Fragment>
            ))}

            <div className="videoSection">
                <h3>All Video</h3>

                {loadingAllVideos ? (
                    <div className="mainPageStatus">Loading all videos...</div>
                ) : allVideosError && allVideos.length === 0 ? (
                    <div className="mainPageStatus">{allVideosError}</div>
                ) : (
                    <>
                        <div className="videoGrid">
                            {allVideos.map((video, index) =>
                                renderVideoCard(normalizeVideo(video, index))
                            )}
                        </div>

                        <div ref={loaderRef} style={{ height: "1px" }} />

                        {loadingMoreAllVideos && (
                            <div className="mainPageStatus">
                                Loading more videos...
                            </div>
                        )}

                        {!hasMoreAllVideos && allVideos.length > 0 && (
                            <div className="mainPageStatus">
                                No more videos
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}