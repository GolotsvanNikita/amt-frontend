import { useRef, useState, useEffect, useMemo } from "react";
import skipPrevious from '../assets/skip_previous.svg';
import playArrow from '../assets/play_arrow.svg';
import skipNext from '../assets/skip_next.svg';
import muteSvg from '../assets/Frame 253.svg'
import Like from '../assets/heart.svg'
import Forward from '../assets/forward.svg'
import Plus from '../assets/Component 170.svg'
import ArrowDown from '../assets/ArrowDown.svg'
import YouTube from "react-youtube";
import "./VideoPage.css";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "bootstrap";

function formatViews(views){
  const numericViews = Number(views) || 0;

  if(numericViews >= 1000000) {
    return `${(numericViews / 1000000).toFixed(1)}M Views`;
  }

  if(numericViews >= 100000){
    return `${(numericViews/100000).toFixed(1)}K Views`
  }

  return `${numericViews} views`
}

export function YouTubeCustomPlayer()
{
    const playerRef = useRef(null);
    const navigate = useNavigate();
    const {id} = useParams;

    const {videos, setVideos} = useState([]);
    const {loading, setLoading} = useState(true);
    const {error, setError} = useState(" ");

    const [isPlaying, setIsPlaying] = useState(false);
    const [muted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showVideo, setShowVideo] = useState(true);

    useEffect(()=>{
        const loadVideos = async () =>{
            try{
                setLoading(true);
                setError("")
                const response = fetch(`${import.meta.env.VITE_API_URL}/api/video/all`);

                if(!response.ok){
                    throw new Error('failed to load videos');
                }

                const data = await response.json();

                const normalizedVideo = Array.isArray(data?.videos) ? data.videos : Array.isArray(data) ? data : [];
                setVideos(normalizedVideo);
            }catch(err){
                setError(err.message || "Something went wrong");
                setVideos([]);
            }finally{
                setLoading(false);
            }
        };
        loadVideos();
    }, []);

    const currentVideo = useMemo(()=>{
        if(!videos.length) return null;
        return videos.find((video)=>String(video.id) === String(id)) || videos[0];
    }, [videos,id]);

    const recommendedVideos = useMemo(()=>{
        if(!videos.length || !currentVideo) return [];
        return videos.filter((video)=>String(video.id) !== String(currentVideo.id)).slice(0,8) 
    }, [videos,currentVideo])

    const opts = {
        height: "525",
        width: "1068",
        playerVars:{
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            fs: 0,
        }
    }

    const onReady = (e) =>{
        playerRef.current = e.target;
        setDuration(e.target.getDuration());
    };

    useEffect(()=>{
        const interval = setInterval(()=>{
            if(playerRef.current && playerRef.current.getCurrentTime){
                const time = playerRef.current.getCurrentTime();
                const dur = playerRef.current.getDuration();

                setCurrentTime(time);
                setDuration(dur || 0);
                setProgress(dur ? (time / dur) * 100 : 0);
            }
        }, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(()=>{
        setIsPlaying(false);
        setIsMuted(false);
        setProgress(0);
        setCurrentTime(0);
    }, [currentVideo?.id]);

    const tooglePlay = () =>{
        const player = playerRef.current;
        if(!player) return;
        if(!showVideo) setShowVideo(true);
        if(isPlaying){
            player.pauseVideo();
            setIsPlaying(false);
        }else{
            player.playVideo();
            setIsPlaying(true);
        }
    };
    const toogleMute = () =>{
        const player = playerRef.current;
        if(!player) return;
        if(!muted){
            player.unMute();
            setIsMuted(false);
        }else{
            player.mute();
            setIsMuted(true);
        };
    };
    const handleSeek = (e) =>{
        const value = Number(e.target.value);
        const newTime = (value / 100) * duration;
        if(playerRef.current){
            playerRef.current.seekTo(newTime, true);
        }
        setCurrentTime(newTime);
        setProgress(value);
    };
    const rewind = () =>{
        if(!playerRef.current) return;
        const time = playerRef.current.getCurrentTime();
        playerRef.current.seekTo(Math.max(time - 10,0));
    };
    const forward = () =>{
        if(playerRef.current)return;
        const time = playerRef.current.getCurrentTime();
        playerRef.current.seekTo(Math.min(time + 10, duration));
    }
    const toogleFullscreen = () => {
        const iframe = document.querySelector("iframe");
        if(iframe?.requestFullscreen){
            iframe.requestFullscreen();
        }
    };
    const formatTime = (timeInSeconds) =>{
        const minutes = Math.floor(timeInSeconds/60);
        const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2,"0");
        return `${minutes}: ${seconds}`;
    };

    if(loading){
        return <div className="yt-page-status">Loading video...</div>
    }
    if(error){
        return <div className="yt-page-status">{error}</div>
    }
    if(!currentVideo){
        return <div className="yt-page-status">VideoNotFound</div>;
    }

    return(
        <div>
            <div className="yt-page">
                <div className="yt-left">
                    <div className="yt-wrapper">
                        <div className="video-section">
                            {showVideo ? (<YouTube videoId={currentVideo.id} opts = {opts} onReady={onReady}/>):
                            (
                                <div className="preview" onClick={tooglePlay}>
                                    <img src = {currentVideo.thumbnailUrl} alt={currentVideo.title} className="preview-image"/>
                                    <div className="overlay-text">
                                        <h1>{currentVideo.channelName}</h1>
                                        <p>{currentVideo.title}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="controls">
                            <button onClick={rewind}><img src={skipPrevious} alt="rewing" width="34" height="34"/></button>
                            <button onClick={tooglePlay}><img src={playArrow} alt="play" width="34" height="34"/></button>
                            <button onClick={forward}><img src={skipNext} alt="forward" width="34" height="34"/></button>
                            <button onClick={toogleMute}><img src={muteSvg} alt="mute" width="34" height="34"/></button>
                            <input type = "range" min = "0" max = "100" value={progress} onChange={handleSeek} className="timeline"/>
                            <span className="time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
                            <button onClick = {toogleFullscreen} title="Fullscreen">⛶</button>
                            <button title = "Settings">⚙</button>
                            <button title = "Subtitries">🄲</button>
                        </div>
                    </div>
                    <h2>{currentVideo.title}</h2>
                    <div className="video-actions-bar">
                        <div className="channel-info">
                            <img src={currentVideo.thumbnailUrl} alt={currentVideo.channelName} className="channel-avatar"/>
                            <div className="channel-text">
                                <p className="channel-name">{currentVideo.channelName}</p>
                                <p className="channel-subs">{currentVideo.publishedAt}</p>
                                <button className="subscribe-btn">Subscribe</button>
                            </div>
                        </div>
                        <div className="actions">
                            <button className="action-btn">
                                <img src = {Like} alt = "like" width="34" height="34"/>
                                <span>{formatTime(currentVideo.views)}</span>
                            </button>
                            <button className="action-btn">
                                <img src = {Forward} alt="forward" width="34" height="34"/> Forward
                            </button>
                            <button className="action-btn">
                                <img src={Plus} alt = "add to playlist" width= "34" height="34"/>
                                Add to Playlist
                            </button>
                            <button className="action-btn">More <img src = {ArrowDown} alt = "more" width="34" height="34"/></button>
                        </div>
                    </div>
                </div>
                <div className="VideoFromThisChannel">
                    {recommendedVideos.slice(0,5).map((video) => (
                        <div key = {video.id} className="RecomendVideo" onClick={()=> navigate(`/video/${video.id}`)}
                        style={{cursor : "pointer"}}>
                            <img src = {video.thumbnailUrl} alt={video.title}/>
                            <div>
                                <p>{video.title}</p>
                                <p>{video.channelName}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div channelName="aboutAvtor">
                <div className="firstInfo">
                    <p>
                        {formatTime(currentTime.views)} • {currentVideo.publishedAt};
                    </p>
                    <p>
                        {currentVideo.title}
                        <span>Show more
                            <button className="action-btn1">
                                <img src = {ArrowDown} alt = "more" width="24" height="14"/>
                            </button>
                        </span>
                    </p>
                </div>
            </div>
            <div className="yt-rec-container">
                <h2 className="yt-title">Reommend</h2>
                <div className="yt-cards">
                    {recommendedVideos.map((video)=>(
                        <div key={video.id}
                        className="yt-card"
                        onClick={()=>navigate(`/video/${video.id}`)}
                        style={{cursor:"pointer"}}>
                            <img src = {video.thumbnailUrl} alt={video.title} className="yt-thumbail"/>
                            <div className="yt-info">
                                <div className="yt-channel-info">
                                    <img src={video.thumbnailUrl} alt={video.channelName} className="yt-avatar"/>
                                    <div>
                                        <p className="yt-video-title">{video.title}</p>
                                        <p className="yt-channel">{video.channelName}</p>
                                    </div>
                                </div>
                                <p className="yt-meta">
                                    {formatViews(video.views)} • {video.publishedAt}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

}
