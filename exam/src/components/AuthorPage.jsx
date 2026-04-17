import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AuthorPage.css';

function getAuthToken() {
    return (
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('authToken') ||
        sessionStorage.getItem('jwt') ||
        sessionStorage.getItem('accessToken') ||
        ''
    );
}

function isValidImageSrc(value) {
    return (
        typeof value === 'string' &&
        value.trim() &&
        (
            value.startsWith('http://') ||
            value.startsWith('https://') ||
            value.startsWith('/') ||
            value.startsWith('data:image/')
        )
    );
}

function normalizeVideo(item, index = 0) {
    return {
        id: String(
            item?.id ??
            item?._id ??
            item?.videoId ??
            item?.youtubeId ??
            `video-${index}`
        ),
        title: item?.title || 'Untitled video',
        thumbnailUrl:
            item?.thumbnailUrl ||
            item?.imageUrl ||
            item?.thumbnail ||
            item?.preview ||
            '/1.jpg',
        views: item?.views || item?.viewCount || '',
        publishedAt: item?.publishedAt || item?.time || item?.published || '',
        description: item?.description || '',
    };
}

function normalizePlaylist(item, index = 0) {
    return {
        id: String(item?.id ?? item?._id ?? `playlist-${index}`),
        title: item?.title || 'Untitled playlist',
        thumbnailUrl:
            item?.thumbnailUrl ||
            item?.imageUrl ||
            item?.thumbnail ||
            '/1.jpg',
        videoCount: item?.videoCount ?? 0,
    };
}

export function AuthorPage() {
    const { channelId } = useParams();
    const navigate = useNavigate();

    const [channel, setChannel] = useState(null);
    const [videos, setVideos] = useState([]);
    const [featuredVideo, setFeaturedVideo] = useState(null);
    const [playlists, setPlaylists] = useState([]);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [subscribeLoading, setSubscribeLoading] = useState(false);
    const [error, setError] = useState('');

    const loadChannelPage = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const apiUrl = import.meta.env.VITE_API_URL;
            if (!apiUrl) {
                throw new Error('VITE_API_URL is not defined');
            }

            const token = getAuthToken();

            const response = await fetch(`${apiUrl}/api/channel/${channelId}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            const text = await response.text();
            let data = {};

            try {
                data = text ? JSON.parse(text) : {};
            } catch (parseError) {
                console.error('Failed to parse channel JSON:', parseError);
                data = {};
            }

            if (!response.ok) {
                throw new Error(data?.message || 'Failed to load channel');
            }

            const normalizedChannel = {
                id: String(
                    data?.channel?.id ??
                    data?.channel?._id ??
                    channelId
                ),
                title: data?.channel?.title || 'Unknown channel',
                description: data?.channel?.description || '',
                avatarUrl: isValidImageSrc(data?.channel?.avatarUrl)
                    ? data.channel.avatarUrl
                    : '/ava.png',
                subscriberCount: data?.channel?.subscriberCount || '0',
                customUrl: data?.channel?.customUrl || '@unknown',
                bannerUrl: isValidImageSrc(data?.channel?.bannerUrl)
                    ? data.channel.bannerUrl
                    : '/7.jpg',
            };

            const normalizedVideos = Array.isArray(data?.videos)
                ? data.videos.map((item, index) => normalizeVideo(item, index))
                : [];

            const normalizedFeaturedVideo = data?.featuredVideo
                ? normalizeVideo(data.featuredVideo, 0)
                : null;

            const normalizedPlaylists = Array.isArray(data?.playlists)
                ? data.playlists.map((item, index) => normalizePlaylist(item, index))
                : [];

            setChannel(normalizedChannel);
            setVideos(normalizedVideos);
            setFeaturedVideo(normalizedFeaturedVideo);
            setPlaylists(normalizedPlaylists);
            setIsSubscribed(Boolean(data?.isSubscribed));
        } catch (err) {
            console.error('CHANNEL PAGE ERROR:', err);
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }, [channelId]);

    useEffect(() => {
        loadChannelPage();
    }, [loadChannelPage]);

    const handleSubscribe = async () => {
        const token = getAuthToken();

        if (!token) {
            navigate('/login');
            return;
        }

        if (!channel?.title || subscribeLoading) return;

        try {
            setSubscribeLoading(true);

            const nextSubscribed = !isSubscribed;
            setIsSubscribed(nextSubscribed);

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/interactions/subscribe`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        channelName: channel.title,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update subscription');
            }
        } catch (err) {
            console.error('Subscribe error:', err);
            setIsSubscribed((prev) => !prev);
        } finally {
            setSubscribeLoading(false);
        }
    };

    const latestVideos = useMemo(() => {
        return Array.isArray(videos) ? videos : [];
    }, [videos]);

    const channelPlaylists = useMemo(() => {
        return Array.isArray(playlists) ? playlists : [];
    }, [playlists]);

    if (loading) {
        return <div className="author-loading">Loading channel...</div>;
    }

    if (error) {
        return (
            <div className="author-error-wrap">
                <div className="author-error">{error}</div>
                <button
                    className="author-retry-btn"
                    type="button"
                    onClick={loadChannelPage}
                >
                    Retry
                </button>
            </div>
        );
    }
    if(!channel){
        return <div className='author-loading'>Channel not found</div>
    }
    return (
        <div className='author-page'>
            <div className='author-banner-wrap'>
                <img src = {channel.bannerUrl}
                alt={channel.title}
                className='author-banner'
                onError={(e)=>{e.currentTarget.src='/7.jpg'}} />
                <div className='author-banner-overlay'/>
            </div>
            <div className='author-content'>
                <section className='author-header-card'>
                    <img src={channel.avatarUrl}
                    alt = {channel.title}
                    className='author-avatar'
                    onError={(e)=>{e.currentTarget.src = '/ava.png';}} />
                    <div className='author-main-info'>
                        <h1 className='author-name'>{channel.title}</h1>
                        <p className='author-username'>{channel.customUrl}</p>
                        <p className='author-subscribers'>{channel.subscriberCount} subscribers</p>
                        {channel.description && (
                            <p className='author-description'>{channel.description}</p>
                        )}
                    </div>
                    <button type='button' className={`author-subscribe-btn ${isSubscribed ? 'is-subscribed' : ''}`}
                    onClick={handleSubscribe}
                    disabled = {subscribeLoading}>
                             {subscribeLoading
                            ? 'Loading...'
                            : isSubscribed
                            ? 'Subscribed'
                            : 'Subscribe'}
                    </button>
                </section>
                {featuredVideo && (
                    <section className='author-section'>
                        <div className='author-section-head'>
                            <h2>Featured video</h2>
                        </div>
                        <article className='author-featured-card' onClick={()=> navigate(`/video/${featuredVideo.id}`)}>
                            <img src = {featuredVideo.thumbnailUrl} alt = {featuredVideo.title}
                            className='author-featured-thumb' onError={(e)=>{
                                e.currentTarget.src = '/1.jpg';
                            }}
                            />
                            <div className='author-featured-info'>
                                <h3>{featuredVideo.title}</h3>
                                {!!(featuredVideo.views || featuredVideo.publishedAt) && (
                                    <p>
                                        {featuredVideo.views}
                                        {featuredVideo.views && featuredVideo . publishedAt ? ' · ' : ''}
                                        {featuredVideo.publishedAt}
                                    </p>
                                )}
                                {featuredVideo.description && (
                                    <span>{featuredVideo.description}</span>
                                )}
                            </div>
                        </article>
                    </section>
                )}
                <section className='author-section'>
                    <div className='author-section-head'>
                        <h2>Latest Videos</h2>
                    </div>
                    <div className = "author-videos-grid">
                        {latestVideos.map((video) =>(
                            <article
                                key = {video.id}
                                className='author-video-card'
                                onClick={()=> navigate(`/video/${video.id}`)}>

                                    <img src={video.thumbnailUrl} alt = {video.title} className='author-video-thumb' onError={(e)=>{
                                        e.currentTarget.src = '/1.jpg'; 
                                    }}
                                    />
                                    <div className='author-video-info'>
                                        <h3>{video.title}</h3>
                                        <p>
                                            {video.views}
                                            {video.views && video.publishedAt ? ' · ' : ''}
                                            {video.publishedAt}
                                        </p>
                                    </div>
                                </article>
                        ))}
                    </div>
                    {!latestVideos.length && (
                        <div className='author-empty-block'>No videos yet</div>
                    )}
                </section>
                <section className='author-section'>
                    <div className='author-section-head'>
                        <h2>PlayLists</h2>
                    </div>
                    <div className='author-playlists-grid'>
                        {channelPlaylists.map((playlist)=>(
                            <article key = {playlist.id}
                            className='author-playlist-card'>
                                <img src = {playlist.thumbnailUrl}
                                alt = {playlist.title}
                                className='author-playlist-thumb'
                                onError={(e)=>{
                                    e.currentTarget.src = '/1.jpg';
                                }}
                                />
                                <div className='author-playlist-info'>
                                    <h3>{playlists.title}</h3>
                                    <p>{playlist.videoCount}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                    {!channelPlaylists.length && (
                        <div className='author-empty-block'>No playlist yet</div>
                    )}
                </section>
            </div>
        </div>
    )
}