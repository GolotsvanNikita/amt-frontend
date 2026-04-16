import { Link } from 'react-router-dom';
import './SideMenu.css';

 export function SideMenu()
{
    return (
        <aside className="sidebar">
            <nav className="sidebarSection">
                <ul className='firstSection'>
                    <li><img src="/home.png" alt="home"/><Link to="/"><span>Home</span></Link></li>
                    <Link to="/reels-page"><img src="/shorts.png" alt="shorts"/><span>Playme</span></Link>
                    <li><img src="/Group 185.png" alt="group"/><span>Subscriptions</span></li>
                    <li><img src="/Path.png" alt="path"/><span>Streamers</span></li>
                </ul>
                <hr/>
            </nav>
            <nav className="sidebarSection">
                <ul className='secondSection'>
                    <li><img src="/libra.png" alt="libra"/><span>Library</span></li>
                    <li><img src="/history.png" alt="history"/><span>History</span></li>
                    <li><img src="/playlists.png" alt="playlists"/><span>Playlists</span></li>
                    <li><img src="/heart.png" alt="heart"/><span>Favorite</span></li>
                </ul>
                <hr/>
            </nav>
            <div className="sidebarSection">
                <h4>Subscriptions</h4>
                <ul className="subscriptions">
                    <li><img src="/one.png" alt="ENLEO" className='imgS'/><Link to="/author"><span>ENLEO</span></Link></li>
                    <li><img src="/two.jpg" alt="Eve" className='imgS'/><span>Eve</span></li>
                    <li><img src="/three.jpg" alt="Konikva" className='imgS'/><span>Konikva</span></li>
                    <li><img src="/four.jpg" alt="Rob" className='imgS'/><span>Rob Scallon</span></li>
                    <li><img src="/five.jpg" alt="Nikolai" className='imgS'/><span>Nikolai Chaze</span></li>
                    <li className="showMore"><span>Show more</span><img src="/more.png" alt="more" className='more'/></li>
                    <hr/>
                </ul>
            </div>
            <div className="sidebarSection">
                <h4>Categories</h4>
                <ul className='categories'>
                    <li><img src="/Shape.png" alt="shape"/><span>Games</span></li>
                    <li><img src="/Shape.png" alt="shape"/><span>Podcast</span></li>
                    <li><img src="/Shape.png" alt="shape"/><span>Education</span></li>
                    <li><img src="/Shape.png" alt="shape"/><span>Music</span></li>
                    <li><img src="/Shape.png" alt="shape"/><span>Films</span></li>
                    <li><img src="/Shape.png" alt="shape"/><span>Mixed</span></li>
                    <li><img src="/Shape.png" alt="shape"/><span>Cybersport</span></li>
                    <hr/>
                </ul>
            </div>
            <div className="sidebarSection">
                <ul className='thirdSection'>
                    <li><img src="/settings.png" alt="settings"/><span>Settings</span></li>
                    <li><img src="/report.png" alt="report"/><span>Help</span></li>
                    <li><img src="/help.png" alt="help"/><span>Report history</span></li>
                    <li><img src="/feedback.png" alt="feedback"/><span>Send feedback</span></li>
                </ul>
            </div>
        </aside>
    );
}