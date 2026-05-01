import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Carousel from "react-bootstrap/Carousel";
import "./MainPage.css";
import { useNavigate } from "react-router-dom";

const categoryButtons = [
    "All",
    "Music",
    "Jams",
    "Podcast",
    "Comedy",
    "Live",
    "Selena Gomez",
    "Games Shows",
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

function parseViewsCount(meta = "") {
    const match = meta.match(/([\d.,]+)\s*([KMB])?\s*views/i);

    if (!match) return 0;

    let value = parseFloat(match[1].replace(/,/g, ""));
    const suffix = (match[2] || "").toUpperCase();

    if (suffix === "K") value *= 1_000;
    if (suffix === "M") value *= 1_000_000;
    if (suffix === "B") value *= 1_000_000_000;

    return Math.floor(value);
}

function normalizeVideo(video, index = 0) {
    const metaString =
        video.views && video.publishedAt
            ? `${video.views} • ${video.publishedAt}`
            : video.meta || video.viewsText || "";

    const channelName = video.channelName || video.author || "Unknown channel";

    const dynamicAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(channelName)}&background=random&color=fff&size=100`;

    return {
        id: video.videoId || video.id || `video-${index}`,
        channelId: String(
            video.channelId ||
            video.authorId ||
            video.channel?.id ||
            video.channel?._id ||
            ""
        ),
        title: video.title || "Untitled video",
        thumbnail: video.thumbnail || video.thumbnailUrl || "/1v.png",
        channelName: channelName,

        avatar: video.channelAvatarUrl || video.channelAvatar || video.avatarUrl || video.avatar || video.authorAvatar || dynamicAvatar,

        meta: metaString,
        viewsCount: parseViewsCount(metaString),
        category:
            video.category ||
            video.genre ||
            video.type ||
            video.tags?.[0] ||
            "All",
    };
}

function sortVideosByViews(videos = []) {
    return [...videos].sort(
        (a, b) => (b.viewsCount || 0) - (a.viewsCount || 0)
    );
}

function videoMatchesCategory(video, category) {
    if (category === "All") return true;

    const categoryLower = category.toLowerCase();
    const title = (video.title || "").toLowerCase();
    const channelName = (video.channelName || "").toLowerCase();
    const meta = (video.meta || "").toLowerCase();
    const videoCategory = (video.category || "").toLowerCase();

    return (
        videoCategory.includes(categoryLower) ||
        title.includes(categoryLower) ||
        channelName.includes(categoryLower) ||
        meta.includes(categoryLower)
    );
}

export function MainPage() {
    const navigate = useNavigate();
    const loaderRef = useRef(null);

    const [selectedCategory, setSelectedCategory] = useState("All");

    const [history, setHistory] = useState([]);
    const [videoSections, setVideoSections] = useState([]);
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

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/main-page/videos`
                );

                if (!response.ok) {
                    throw new Error("Failed to load videos");
                }

                const data = await response.json();

                const normalizedSections = Array.isArray(data)
                    ? data.map((section) => ({
                          ...section,
                          videos: sortVideosByViews(
                              (section.videos || []).map((video, index) =>
                                  normalizeVideo(video, index)
                              )
                          ),
                      }))
                    : [];

                setVideoSections(normalizedSections);
            } catch (err) {
                console.error(err);
                setSectionsError(err.message || "Something went wrong");
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

                const normalizedHistory = Array.isArray(data)
                    ? data.map((video, index) =>
                          normalizeVideo(
                              {
                                  id: video.videoId || video.id,
                                  title: video.title,
                                  thumbnail: video.thumbnail || video.thumbnailUrl,
                                  channelName: video.channelName || video.author,
                                  meta: video.meta || video.viewsText || "",
                                  category: video.category,
                              },
                              index
                          )
                      )
                    : [];

                setHistory(normalizedHistory);
            } catch (err) {
                console.error(err);
                setHistoryError(err.message || "Failed to load watch history");
            } finally {
                setLoadingHistory(false);
            }
        };

        loadRecentHistory();
    }, []);

    const loadAllVideos = useCallback(async (pageToken = "", append = false) => {
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
                setAllVideos((prev) => {
                    const merged = [...prev, ...newVideos];

                    const uniqueVideos = merged.filter(
                        (video, index, arr) =>
                            index === arr.findIndex((item) => item.id === video.id)
                    );

                    return sortVideosByViews(uniqueVideos);
                });
            } else {
                setAllVideos(sortVideosByViews(newVideos));
            }

            setNextPageToken(data?.nextPageToken || null);
            setHasMoreAllVideos(Boolean(data?.nextPageToken));
        } catch (err) {
            console.error(err);
            setAllVideosError(err.message || "Failed to load all videos");

            if (!append) {
                setHasMoreAllVideos(false);
                setNextPageToken(null);
            }
        } finally {
            setLoadingAllVideos(false);
            setLoadingMoreAllVideos(false);
        }
    }, []);

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
                    meta: video.meta,
                    category: video.category,
                }),
            });

            setHistory((prev) => {
                const filtered = prev.filter((item) => item.id !== video.id);
                return [video, ...filtered].slice(0, 20);
            });
        } catch (err) {
            console.error("Failed to record history:", err);
        }

        navigate(`/video/${video.id}`, {
            state: { video },
        });
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
                    className="videoThumb"
                    alt={normalizedVideo.title || "Video thumbnail"}
                />

                <div className="videoMeta">
                    <img
                        src={normalizedVideo.avatar}
                        className="metaAvatar"
                        alt={normalizedVideo.channelName}
                        onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedVideo.channelName)}&background=222&color=fff`;
                        }}
                    />

                    <div className="videoInfo">
                        <h4>{normalizedVideo.title}</h4>
                        <p
                            onClick={(e) => {
                                e.stopPropagation();
                                if (normalizedVideo.channelId) {
                                    navigate(`/channel/${normalizedVideo.channelId}`);
                                }
                            }}
                            style={{ cursor: normalizedVideo.channelId ? "pointer" : "default" }}
                        >
                            {normalizedVideo.channelName}
                        </p>
                        <span>{normalizedVideo.meta}</span>
                    </div>

                    <div className="videoMore">⋮</div>
                </div>
            </button>
        );
    };

    const filteredSections = useMemo(() => {
        return videoSections.map((section) => ({
            ...section,
            videos: (section.videos || []).filter((video) =>
                videoMatchesCategory(video, selectedCategory)
            ),
        }));
    }, [videoSections, selectedCategory]);

    const filteredHistory = useMemo(() => {
        return history.filter((video) =>
            videoMatchesCategory(video, selectedCategory)
        );
    }, [history, selectedCategory]);

    const filteredAllVideos = useMemo(() => {
        return allVideos.filter((video) =>
            videoMatchesCategory(video, selectedCategory)
        );
    }, [allVideos, selectedCategory]);

    const featuredVideo = useMemo(() => {
        return allVideos.length > 0 ? allVideos[0] : null;
    }, [allVideos]);

    const [carouselVideos, setCarouselVideos] = useState([]);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [carouselKey, setCarouselKey] = useState(0);

    const getRandomVideos = useCallback((excludeIds = []) => {
        if (!allVideos.length) return [];

        const filtered = allVideos.filter((video) => !excludeIds.includes(video.id));
        const source = filtered.length >= 5 ? filtered : allVideos;

        const shuffled = [...source].sort(() => Math.random() - 0.5);

        return shuffled.slice(0, 5);
    }, [allVideos]);

    useEffect(() => {
        if (!allVideos.length) return;

        const firstPack = getRandomVideos();
        setCarouselVideos(firstPack);
        setCarouselIndex(0);
        setCarouselKey((prev) => prev + 1);
    }, [allVideos, getRandomVideos]);

    const handleCarouselSelect = (selectedIndex) => {
        setCarouselIndex(selectedIndex);

        if (
            carouselVideos.length === 5 &&
            selectedIndex === carouselVideos.length - 1
        ) {
            const currentIds = carouselVideos.map((video) => video.id);

            setTimeout(() => {
                const nextPack = getRandomVideos(currentIds);

                console.log("OLD CAROUSEL IDS:", currentIds);
                console.log("NEW CAROUSEL PACK:", nextPack);

                setCarouselVideos(nextPack);
                setCarouselIndex(0);
                setCarouselKey((prev) => prev + 1);
            }, 250);
        }
    };

    return (
        <div className="mainPage">
            <div
                className="ads"
                style={{
                    backgroundImage: `url(${
                        featuredVideo?.thumbnail ||
                        (featuredVideo?.id
                            ? `https://i.ytimg.com/vi/${featuredVideo.id}/hqdefault.jpg`
                            : "/backimage2.jpg")
                    })`,
                }}
            >
                <div className="topContent">
                    <h2>{featuredVideo?.title || "Featured video"}</h2>
                    <p>{featuredVideo?.channelName || "Channel"}</p>
                </div>

                <div className="bottomContent">
                    <button
                        type="button"
                        onClick={() => featuredVideo && handleVideoClick(featuredVideo)}
                    >
                        WATCH
                    </button>

                    <p>{featuredVideo?.meta || "No featured video yet"}</p>

                    <div className="carousel" style={{ flex: 1 }}>
                        <Carousel
                            key={carouselKey}
                            activeIndex={carouselIndex}
                            onSelect={handleCarouselSelect}
                            interval={2500}
                            data-bs-theme="dark"
                            indicators={true}
                        >
                            {carouselVideos.map((video, index) => (
                                <Carousel.Item key={`${video.id}-${index}`}>
                                    <img
                                        className="d-block w-100"
                                        src={
                                            video.thumbnail ||
                                            `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
                                        }
                                        alt={video.title}
                                        style={{
                                            width: "100%",
                                            objectFit: "cover",
                                            height: "170px",
                                            borderRadius: "22px",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => handleVideoClick(video)}
                                        onError={(e) => {
                                            e.currentTarget.src = "/1v.png";
                                        }}
                                    />

                                    <Carousel.Caption>
                                        <h5>{video.title}</h5>
                                        <p>{video.channelName}</p>
                                    </Carousel.Caption>
                                </Carousel.Item>
                            ))}
                        </Carousel>
                    </div>
                </div>
            </div>

            <div className="categoryBtns">
                {categoryButtons.map((category) => (
                    <button
                        key={category}
                        className={selectedCategory === category ? "frts" : "another"}
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {loadingSections && (
                <div className="mainPageStatus">Loading videos...</div>
            )}

            {!loadingSections && sectionsError && (
                <div className="mainPageStatus">{sectionsError}</div>
            )}

            {!loadingSections &&
                filteredSections.map((section, index) => (
                    <React.Fragment key={section.id || section.title || index}>
                        <div className="videoSection">
                            <h3>{section.title}</h3>

                            {section.videos.length === 0 ? (
                                <div className="mainPageStatus">
                                    No videos in this category
                                </div>
                            ) : (
                                <div className="videoGrid">
                                    {section.videos.map((video) =>
                                        renderVideoCard(video)
                                    )}
                                </div>
                            )}
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
                                    ) : filteredHistory.length === 0 ? (
                                        <div className="mainPageStatus">
                                            No recently watched videos
                                        </div>
                                    ) : (
                                        <div className="videoGrid">
                                            {filteredHistory.map((video) =>
                                                renderVideoCard(video)
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
                <h3>Recommended videos</h3>

                {loadingAllVideos ? (
                    <div className="mainPageStatus">Loading all videos...</div>
                ) : allVideosError && filteredAllVideos.length === 0 ? (
                    <div className="mainPageStatus">{allVideosError}</div>
                ) : filteredAllVideos.length === 0 ? (
                    <div className="mainPageStatus">No videos found</div>
                ) : (
                    <>
                        <div className="videoGrid">
                            {filteredAllVideos.map((video) =>
                                renderVideoCard(video)
                            )}
                        </div>

                        <div ref={loaderRef} style={{ height: "1px" }} />

                        {loadingMoreAllVideos && (
                            <div className="mainPageStatus">
                                Loading more videos...
                            </div>
                        )}

                        {!hasMoreAllVideos && filteredAllVideos.length > 0 && (
                            <div className="mainPageStatus">No more videos</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}