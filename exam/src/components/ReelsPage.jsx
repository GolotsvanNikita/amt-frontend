import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ReelsPage.css';

const USE_MOCK = false;

const mockCategories = [
    { id: 'all', title: 'All', slug: 'all' },
    { id: 'music', title: 'Music', slug: 'music' },
    { id: 'jams', title: 'Jams', slug: 'jams' },
    { id: 'podcasts', title: 'Podcasts', slug: 'podcasts' },
    { id: 'live', title: 'Live', slug: 'live' },
    { id: 'manga', title: 'Manga', slug: 'manga' },
    { id: 'news', title: 'News', slug: 'news' },
    { id: 'animated-films', title: 'Animated Films', slug: 'animated-films' },
    { id: 'new', title: 'New', slug: 'new' },
];

const mockReels = [
    {
        id: '1',
        title: 'Scene',
        imageUrl: '/1.jpg',
        videoUrl: '/videos/reel1.mp4',
        avatarUrl: '/ava.png',
        categorySlug: 'music',
        layoutType: 'small',
        views: '1.2M views',
        time: '2 weeks ago',
        author: 'LIA Hmel',
        username: '@lhmel',
        description: 'Learning to play the guitar',
        audioTitle: 'original soundtrack',
        likes: '295K',
        shares: '2K',
        remix: '1.1K',
        comments: [
            {
                id: '1',
                user: 'Anna',
                avatar: '/ava.png',
                text: 'This band is in my playlist with Royal Blood, Highly Suspect, and Cleopatrick.',
                time: '3 weeks ago',
                likes: 8,
            },
            {
                id: '2',
                user: 'Ryan Williams',
                avatar: '/ava.png',
                text: "I've got the same playlist.",
                time: '3 weeks ago',
                likes: 3,
            },
        ],
    },
    {
        id: '2',
        title: 'Portrait',
        imageUrl: '/2.jpg',
        videoUrl: '/videos/reel2.mp4',
        avatarUrl: '/ava.png',
        categorySlug: 'all',
        layoutType: 'wide',
        views: '820K views',
        time: '5 days ago',
        author: 'Mila Rose',
        username: '@milarose',
        description: 'Soft portrait lighting test',
        audioTitle: 'dreamy ambient',
        likes: '124K',
        shares: '940',
        remix: '510',
        comments: [],
    },
    {
        id: '3',
        title: 'City',
        imageUrl: '/3.jpg',
        videoUrl: '/videos/reel3.mp4',
        avatarUrl: '/ava.png',
        categorySlug: 'all',
        layoutType: 'tall',
        views: '1M views',
        time: '1 month ago',
        author: 'Urban Eye',
        username: '@urbaneye',
        description: 'Aerial city footage',
        audioTitle: 'city atmosphere',
        likes: '301K',
        shares: '4K',
        remix: '2K',
        comments: [],
    },
    {
        id: '4',
        title: 'Concert',
        imageUrl: '/4.jpg',
        videoUrl: '/videos/reel4.mp4',
        avatarUrl: '/ava.png',
        categorySlug: 'music',
        layoutType: 'middleWide',
        views: '2.4M views',
        time: '4 days ago',
        author: 'Noise Room',
        username: '@noiseroom',
        description: 'Live crowd energy',
        audioTitle: 'live concert audio',
        likes: '500K',
        shares: '7K',
        remix: '2.4K',
        comments: [],
    },
    {
        id: '5',
        title: 'Mountain',
        imageUrl: '/5.jpg',
        videoUrl: '/videos/reel5.mp4',
        avatarUrl: '/ava.png',
        categorySlug: 'all',
        layoutType: 'quote',
        views: '610K views',
        time: '1 week ago',
        author: 'Snow Peak',
        username: '@snowpeak',
        description: 'Cold mountain landscape',
        audioTitle: 'wind fx',
        likes: '66K',
        shares: '620',
        remix: '90',
        comments: [],
    },
    {
        id: '6',
        title: 'Skyscraper',
        imageUrl: '/6.jpg',
        videoUrl: '/videos/reel6.mp4',
        avatarUrl: '/ava.png',
        categorySlug: 'all',
        layoutType: 'mediumTall',
        views: '510K views',
        time: '2 weeks ago',
        author: 'Skyline',
        username: '@skyline',
        description: 'Minimal city vertical',
        audioTitle: 'dark pulse',
        likes: '77K',
        shares: '510',
        remix: '130',
        comments: [],
    },
    {
        id: '7',
        title: 'Door',
        imageUrl: '/7.jpg',
        videoUrl: '/videos/reel7.mp4',
        avatarUrl: '/ava.png',
        categorySlug: 'all',
        layoutType: 'smallTall',
        views: '98K views',
        time: '6 days ago',
        author: 'Home Mood',
        username: '@homemood',
        description: 'Warm cinematic entry',
        audioTitle: 'lofi keys',
        likes: '12K',
        shares: '101',
        remix: '24',
        comments: [],
    },
    {
        id: '8',
        title: 'Abstract',
        imageUrl: '/8.jpg',
        videoUrl: '/videos/reel8.mp4',
        avatarUrl: '/ava.png',
        categorySlug: 'all',
        layoutType: 'bottomWide',
        views: '2M views',
        time: '1 day ago',
        author: 'Color Wave',
        username: '@colorwave',
        description: 'Color motion background',
        audioTitle: 'electro motion',
        likes: '190K',
        shares: '2.1K',
        remix: '410',
        comments: [],
    },
];

function normalizeCategory(item, index) {
    const fallbackId = String(item?.id ?? item?._id ?? item?.slug ?? `category-${index}`);
    const slug = String(item?.slug ?? item?.name ?? item?.title ?? 'all')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');

    return {
        id: fallbackId,
        title: item?.title || item?.name || slug || 'Category',
        slug,
    };
}

function normalizeReel(item, index) {
    const fallbackId = String(
        item?.id ??
        item?._id ??
        item?.reelId ??
        item?.videoId ??
        item?.youtubeId ??
        item?.slug ??
        `reel-${index}`
    );

    return {
        id: fallbackId,
        title: item?.title || 'Untitled reel',
        imageUrl:
            item?.imageUrl ||
            item?.thumbnailUrl ||
            item?.thumbnail ||
            item?.posterUrl ||
            item?.preview ||
            '/1.jpg',
        videoUrl: item?.videoUrl || item?.youtubeId || item?.youtubeUrl || '',
        avatarUrl: item?.avatarUrl || item?.authorAvatar || '/ava.png',
        categorySlug: String(item?.categorySlug || item?.category || 'all').toLowerCase(),
        layoutType: item?.layoutType || 'small',
        views: item?.views || '0 views',
        time: item?.time || 'Recently',
        author: item?.author || item?.channelName || item?.name || 'Unknown author',
        username: item?.username || item?.handle || '@unknown',
        description: item?.description || item?.caption || '',
        audioTitle: item?.audioTitle || item?.audio || 'original audio',
        likes: item?.likes ?? item?.likesCount ?? '0',
        shares: item?.shares ?? item?.sharesCount ?? '0',
        remix: item?.remix ?? item?.remixCount ?? '0',
        comments: Array.isArray(item?.comments) ? item.comments : [],
    };
}

export function ReelsPage() {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [reels, setReels] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadReelsPage();
    }, []);

    const loadReelsPage = async () => {
        try {
            setLoading(true);
            setError('');

            if (USE_MOCK) {
                await new Promise((resolve) => setTimeout(resolve, 400));
                setCategories(mockCategories);
                setReels(mockReels);
                return;
            }

            const API_URL = import.meta.env.VITE_API_URL;

            if (!API_URL) {
                throw new Error('VITE_API_URL is not defined');
            }

            const [categoriesRes, reelsRes] = await Promise.all([
                fetch(`${API_URL}/api/reels/categories`),
                fetch(`${API_URL}/api/reels`),
            ]);

            const categoriesText = await categoriesRes.text();
            const reelsText = await reelsRes.text();

            let categoriesData = {};
            let reelsData = {};

            try {
                categoriesData = categoriesText ? JSON.parse(categoriesText) : {};
            } catch (error) {
                console.error('Failed to parse categories JSON:', error);
                categoriesData = {};
            }

            try {
                reelsData = reelsText ? JSON.parse(reelsText) : {};
            } catch (error) {
                console.error('Failed to parse reels JSON:', error);
                reelsData = {};
            }

            console.log('CATEGORIES RESPONSE:', categoriesData);
            console.log('REELS RESPONSE:', reelsData);

            if (!categoriesRes.ok) {
                throw new Error(categoriesData?.message || categoriesText || 'Failed to load categories');
            }

            if (!reelsRes.ok) {
                throw new Error(reelsData?.message || reelsText || 'Failed to load reels');
            }

            const rawCategories = Array.isArray(categoriesData)
                ? categoriesData
                : Array.isArray(categoriesData?.categories)
                ? categoriesData.categories
                : Array.isArray(categoriesData?.data)
                ? categoriesData.data
                : Array.isArray(categoriesData?.items)
                ? categoriesData.items
                : [];

            const rawReels = Array.isArray(reelsData)
                ? reelsData
                : Array.isArray(reelsData?.reels)
                ? reelsData.reels
                : Array.isArray(reelsData?.data)
                ? reelsData.data
                : Array.isArray(reelsData?.items)
                ? reelsData.items
                : [];

            const normalizedCategories = rawCategories.map((item, index) =>
                normalizeCategory(item, index)
            );

            const normalizedReels = rawReels.map((item, index) =>
                normalizeReel(item, index)
            );

            setCategories(
                normalizedCategories.length
                    ? normalizedCategories
                    : [{ id: 'all', title: 'All', slug: 'all' }]
            );

            setReels(normalizedReels);
        } catch (err) {
            console.error('LOAD REELS PAGE ERROR:', err);
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const filteredReels = useMemo(() => {
        if (activeCategory === 'all') return reels;

        return reels.filter(
            (item) => String(item.categorySlug).toLowerCase() === String(activeCategory).toLowerCase()
        );
    }, [activeCategory, reels]);

    if (loading) {
        return <div className="reels-loading">Loading reels...</div>;
    }

    if (error) {
        return (
            <div className="reels-error-wrap">
                <div className="reels-error">{error}</div>
                <button className="reels-retry-btn" onClick={loadReelsPage} type="button">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="reels-page">
            <div className="reels-content">
                <div className="reels-categories">
                    {Array.isArray(categories) &&
                        categories.map((category) => (
                            <button
                                key={category.id}
                                className={`reels-category-item ${activeCategory === category.slug ? 'is-active' : ''}`}
                                onClick={() => setActiveCategory(category.slug)}
                                type="button"
                            >
                                {category.title}
                            </button>
                        ))}
                </div>

                <div className="reels-grid">
                    {Array.isArray(filteredReels) &&
                        filteredReels.map((item) => (
                            <article
                                key={item.id}
                                className={`reel-card reel-card--${item.layoutType}`}
                                onClick={() => navigate(`/reels-page/${String(item.id)}`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        navigate(`/reels-page/${String(item.id)}`);
                                    }
                                }}
                            >
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="reel-card-image"
                                    onError={(e) => {
                                        e.currentTarget.src = '/1.jpg';
                                    }}
                                />

                                <div className="reel-card-overlay" />

                                <div className="reel-card-meta">
                                    <img
                                        src={item.avatarUrl}
                                        alt={item.title}
                                        className="reel-card-avatar"
                                        onError={(e) => {
                                            e.currentTarget.src = '/ava.png';
                                        }}
                                    />
                                    <div className="reel-card-text">
                                        <h3 className="reel-card-title">{item.title}</h3>
                                        <p className="reel-card-sub">
                                            {item.views} · {item.time}
                                        </p>
                                    </div>
                                </div>
                            </article>
                        ))}
                </div>

                {!filteredReels.length && (
                    <div className="reels-loading">No reels found</div>
                )}
            </div>
        </div>
    );
}