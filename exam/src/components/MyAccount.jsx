import React , {useEffect,useState} from "react";
import "./MyAccount.css"
import { Link } from "react-router-dom";

export function MyAccount(){

    //  ЕЩЁ ЗАГЛУШКА
        const [profile, setProfile] = useState({
        name: "User",
        username: "user",
        subscribers: 0,
        avatar: "/ava.png",
        bannerUrl: "/backimage.jpg"
     });
        const [popularVideos,setPopularVideos] = useState([]);
        const [allVideos,setAllVideos] = useState([]);
        const [playlists,setPlaylists] = useState([]);
        // ЗАГЛУШКА, УБЕРИ ПОТОМ ПОД БЕК
        const [channel, setChannel] = useState({
        name: "LiliA Hmel",
        username: "kltrons",
        subscribers: 300
    });

    //ещё одна заглушка, хихи-хаха
    const mixes = [
        {
            id: 1,
            title: "kltron Mr Kitty After Dark",
            thumbnail: "../public/15v.png",
            views: "12K",
            time: "1 year ago"
        },
        {
            id: 2,
            title: "kltron rain, window and hand",
            thumbnail: "../public/16v.png",
            views: "12K",
            time: "1 year ago"
        }
        ];
        useEffect(()=>{
            async function loadAccount(){
                const profileRes = await fetch("/api/my-account/profile");
                const profileData = await profileRes.json();

                const popularRes = await fetch("/api/my-account/videos/popular");
                const popularData = await popularRes.json();
                
                const videoRes = await fetch("/api/my-account/videos");
                const videoData = await videoRes.json();

                const playlistsRes = await fetch("/api/my-account/playlists");
                const playlistsData = await playlistsRes.json();

                setProfile(profileData);
                setPopularVideos(popularData);
                setAllVideos(videoData);
                setPlaylists(playlistsData);
            }
            loadAccount();
        }, [])


        if(!channel) return <div className="loading">Loading...</div>;

        return(
            <div className="account-page">
            <header
                className="account-banner"
                style={{ backgroundImage: `url(${profile.bannerUrl})` }}
            >
                <div className="banner-overlay">
                <img src={profile.avatar} alt="" className="account-avatar" />

                <div className="account-info">
                    <h1>{profile.name}</h1>
                    <p>@{profile.username} · {profile.subscribers} subscribers</p>
                <div className="profile-actions">
                    <button className="control-btn">
                    Video control
                    </button>
                    <button className="profile-icon-btn" title="Statistics">
                        <svg viewBox="0 0 24 24">
                            <path d = "M5 19V10"/>
                            <path d = "M12 19V5"/>
                            <path d = "M19 19V13"/>
                            <path d = "M3 19H21"/>
                        </svg>
                    </button>
                    <Link to="/edit-profile" className="profile-icon-btn" title="Edit profile">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                    </Link>
                </div>
                </div>
                </div>
            </header>

            <nav className="account-nav">
                <button className="active">Home</button>
                <button>Videos</button>
                <button>Playme</button>
                <button>Subscriptions</button>
                <button>Playlists</button>
                <button>Community</button>
                <button>About</button>
            </nav>
                <section className="section">
                    <h2>Popular</h2>
                    <div className="video-grid">
                        {popularVideos.map((video)=>(
                            <videoCard key ={video.id} video ={video} avatar={profile.avatar} username ={profile.username}/>
                        ))}
                    </div>
                </section>
                <section className="section">
                    <h2>All videos</h2>
                    <div className="video-grid">
                        {allVideos.map((video)=>(
                            <VideoCard key ={video.id} video ={video} avatar={profile.avatar} username ={profile.username}/>
                        ))}
                    </div>
                </section>
                <section className="section">
                    <h2>Playme</h2>
                    <div className="playlist-grid">
                        {playlists.map((playlist)=>(
                            <div key={playlist.id} className="playlist-card">
                                <img src={playlist.thumbnail} />
                                <p>{playlist.title}</p>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="section">
                    <h2>Mixes</h2>
                    <div className="mixes-grid">
                        {mixes.map((video) => (
                        <VideoCard
                            key={video.id}
                            video={video}
                            avatar={profile.avatar}
                            username={profile.username}
                        />
                        ))}
                    </div>
                    </section>
            </div>
        );
        function VideoCard({video,avatar,username}){
            return(
                <div className="video-card">
                <img src={video.thumbnail} className="video-thumb" alt="" />

                <div className="video-meta">
                    <img src={avatar} className="meta-avatar" alt="" />

                    <div className="video-info">
                    <div className="video-title">{video.title}</div>
                    <div className="video-channel">@{username}</div>
                    <div className="video-sub">
                        {video.views} views &nbsp;&nbsp; {video.time}
                    </div>
                    </div>

                    <div className="video-more">⋮</div>
                </div>
                </div>
            );
        }
}