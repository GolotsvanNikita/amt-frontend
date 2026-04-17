import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './ReelsPage.css';

const USE_MOCK = false;
const MIN_REELS_TO_FILL_PAGE = 15;
const PAGE_LIMIT = 5;

const mockCategories = [
    { id: 'all', title: 'All', slug: 'all' },
    { id: 'music', title: 'Music', slug: 'music' },
    { id: 'gaming', title: 'Gaming', slug: 'gaming' },
    { id: 'comedy', title: 'Comedy', slug: 'comedy' },
];

const mockReels = [];

function normalizeCategory(item, index) {
    const fallbackId = String(item?.id ?? item?._id ?? item?.slug ?? `category-${index}`);
    const rawSlug = String(item?.slug ?? item?.name ?? item?.title ?? 'all').trim();

    return {
        id: fallbackId,
        title: item?.title || item?.name || rawSlug || 'Category',
        slug: rawSlug.toLowerCase().replace(/\s+/g, '-'),
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

    const rawCategory =
        item?.categorySlug ||
        item?.category?.slug ||
        item?.category?.name ||
        item?.category ||
        'all';

    return {
        id: fallbackId,
        channelId: String(
            item?.channelId ||
            item?.authorId ||
            item?.channel?.id ||
            item?.channel?._id ||
            ""
        ),
        title: item?.title || 'Untitled reel',
        imageUrl:
            item?.imageUrl ||
            item?.thumbnailUrl ||
            item?.thumbnail ||
            item?.posterUrl ||
            item?.preview ||
            '/1.jpg',
        avatarUrl: item?.avatarUrl || item?.authorAvatar || '/ava.png',
        categorySlug: String(rawCategory).trim().toLowerCase().replace(/\s+/g, '-'),
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

function extractArray(data, keys = []) {
    if (Array.isArray(data)) return data;

    for (const key of keys) {
        if (Array.isArray(data?.[key])) {
            return data[key];
        }
    }

    return [];
}

function mergeUniqueById(items) {
    const map = new Map();

    items.forEach((item) => {
        map.set(String(item.id), item);
    });

    return Array.from(map.values());
}

export function ReelsPage() {
    const navigate = useNavigate();

    const [serverCategories, setServerCategories] = useState([]);
    const [reels, setReels] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadReelsPage = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            if (USE_MOCK) {
                setServerCategories(mockCategories);
                setReels(mockReels);
                return;
            }

            const API_URL = import.meta.env.VITE_API_URL;

            if (!API_URL) {
                throw new Error('VITE_API_URL is not defined');
            }

            const categoriesRes = await fetch(`${API_URL}/api/reels/categories`);
            const categoriesText = await categoriesRes.text();

            let categoriesData = {};
            try {
                categoriesData = categoriesText ? JSON.parse(categoriesText) : {};
            } catch (error) {
                console.error('Failed to parse categories JSON:', error);
                categoriesData = {};
            }

            if (!categoriesRes.ok) {
                throw new Error(categoriesData?.message || categoriesText || 'Failed to load categories');
            }

            const rawCategories = extractArray(categoriesData, ['categories', 'data', 'items']);
            const normalizedCategories = rawCategories.map((item, index) => normalizeCategory(item, index));

            const loadedReels = [];
            let page = 1;
            let hasMore = true;

            while (loadedReels.length < MIN_REELS_TO_FILL_PAGE && hasMore) {
                const reelsRes = await fetch(`${API_URL}/api/reels?page=${page}&limit=${PAGE_LIMIT}`);
                const reelsText = await reelsRes.text();

                let reelsData = {};
                try {
                    reelsData = reelsText ? JSON.parse(reelsText) : {};
                } catch (error) {
                    console.error(`Failed to parse reels JSON on page ${page}:`, error);
                    reelsData = {};
                }

                if (!reelsRes.ok) {
                    throw new Error(reelsData?.message || reelsText || 'Failed to load reels');
                }

                const rawReels = extractArray(reelsData, ['reels', 'data', 'items']);
                const normalizedPage = rawReels.map((item, index) =>
                    normalizeReel(item, index + (page - 1) * PAGE_LIMIT)
                );

                loadedReels.push(...normalizedPage);

                if (typeof reelsData?.hasMore === 'boolean') {
                    hasMore = reelsData.hasMore;
                } else if (typeof reelsData?.pagination?.hasMore === 'boolean') {
                    hasMore = reelsData.pagination.hasMore;
                } else {
                    hasMore = rawReels.length === PAGE_LIMIT;
                }

                if (rawReels.length === 0) {
                    hasMore = false;
                }

                page += 1;
            }

            setServerCategories(normalizedCategories);
            setReels(mergeUniqueById(loadedReels));
        } catch (err) {
            console.error('LOAD REELS PAGE ERROR:', err);
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadReelsPage();
    }, [loadReelsPage]);

    const categories = useMemo(() => {
        const map = new Map();

        map.set('all', { id: 'all', title: 'All', slug: 'all' });

        serverCategories.forEach((category) => {
            const slug = String(category.slug || '').toLowerCase();
            if (!slug || slug === 'all') return;
            map.set(slug, category);
        });

        reels.forEach((item, index) => {
            const slug = String(item.categorySlug || '').toLowerCase();
            if (!slug || slug === 'all' || map.has(slug)) return;

            map.set(slug, {
                id: `generated-${slug}-${index}`,
                title: slug
                    .split('-')
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(' '),
                slug,
            });
        });

        return Array.from(map.values());
    }, [serverCategories, reels]);

    const filteredReels = useMemo(() => {
        if (activeCategory === 'all') return reels;

        return reels.filter(
            (item) => String(item.categorySlug).toLowerCase() === String(activeCategory).toLowerCase()
        );
    }, [activeCategory, reels]);

    useEffect(() => {
        const hasActiveCategory = categories.some(
            (category) => String(category.slug) === String(activeCategory)
        );

        if (!hasActiveCategory) {
            setActiveCategory('all');
        }
    }, [categories, activeCategory]);

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
                {!!categories.length && (
                    <div className="reels-categories">
                        {categories.map((category) => (
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
                )}

                {!!filteredReels.length ? (
                    <div className="reels-grid">
                        {filteredReels.map((item) => (
                            <article
                                key={item.id}
                                className="reel-card reel-card--uniform"
                                onClick={() => navigate(`/reels-page/${String(item.id)}`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
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
                                        alt={item.author}
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
                ) : (
                    <div className="reels-empty">
                        <div>No reels found</div>
                        {activeCategory !== 'all' && (
                            <button
                                className="reels-retry-btn"
                                type="button"
                                onClick={() => setActiveCategory('all')}
                            >
                                Show all
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}