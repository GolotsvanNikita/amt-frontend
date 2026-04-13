import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Carousel from "react-bootstrap/Carousel";
import './MainPage.css';
import {Link} from "react-router-dom";

export function MainPage()
{
    return (
        <div className="mainPage">
            <div className='ads'>
                <div className="topContent">
                    <h2>ВЕДИ МЕНЕ В ХРАМ</h2>
                    <p>(TAKE ME TO CHURCH УКРАЇНСЬКОЮ)</p>
                </div>
                <div className="bottomContent">
                    <Link to="/video"><button>WATCH</button></Link>
                    <p>Enleo • 5M views • 6 day ago</p>
                    <div className="carousel" style={{ flex: 1 }}>
                        <Carousel data-bs-theme="dark">
                            <Carousel.Item>
                                <img
                                    className="d-block w-100"
                                    src="../public/s1.jpg"
                                    alt="First slide"
                                    style={{ width: "100%", objectFit: "cover", height: '140px', borderRadius: '20px'}}
                                />
                            </Carousel.Item>
                            <Carousel.Item>
                                <img
                                    className="d-block w-100"
                                    src="../public/s2.jpg"
                                    alt="Second slide"
                                    style={{ width: "100%", objectFit: "cover", position: "relative", height: '140px', borderRadius: '20px' }}
                                />
                            </Carousel.Item>
                            <Carousel.Item>
                                <img
                                    className="d-block w-100"
                                    src="../public/s3.jpg"
                                    alt="Third slide"
                                    style={{ width: "100%", objectFit: "cover", position: "relative", height: '140px', borderRadius: '20px' }}
                                />
                            </Carousel.Item>
                        </Carousel>
                    </div>
                </div>
            </div>
            <div className='categoryBtns'>
                <button className='frts'>All</button>
                <button className='another'>Music</button>
                <button className='another'>Jams</button>
                <button className='another'>Podcast</button>
                <button className='another'>Comedy</button>
                <button className='another'>Live</button>
                <button className='another'>Selena Gomez</button>
                <button className='another'>Manga</button>
                <button className='another'>Games shows</button>
                <button className='another'>Spiderman</button>
            </div>

            <div className="videoSection">
                <h3>Top 10 on this week</h3>
                <div className="videoGrid">
                    <div className="videoCard">
                        <img src="../public/1v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>Вакуумная упаковка cloth simulation с лого в Cinema 4D</h4>
                            <p>SKYQТ</p>
                            <span>1.2K views • 1 year ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/2v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>Daði Freyr (Daði & Gagnamagnið) - Think About Things (Official Video)</h4>
                            <p>Daði Freyr</p>
                            <span>45M views • 3 years ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/3v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>Before Your Very Eyes...Atoms for Peace - MAMA JAMMA (Live cover)</h4>
                            <p>Skinway</p>
                            <span>6M views • 1 days ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/4v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>Rush E</h4>
                            <p>Skinway</p>
                            <span>6M views • 1 months ago</span>
                        </div>
                    </div>
                </div>
            </div>
            <hr className="sectionDivider" />

            <div className="videoSection">
                <h3>Continue Watching</h3>
                <div className="videoGrid">
                    <div className="videoCard">
                        <img src="../public/5v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>C4D 2023 Tutorial: Abstract Flowers with Hair, Dynamics and Redshift</h4>
                            <p>Friends of Maha</p>
                            <span>2.7K views • 8 months ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/6v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>Loreen - Tattoo (Acoustic)</h4>
                            <p>Loreen</p>
                            <span>2.2M views • 4 weeks ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/7v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>3D Text Typography With Adobe Illustrator | Adobe Illustrator</h4>
                            <p>XUYU Design Tutorials</p>
                            <span>2.4K views • 1 year ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/8v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>pirates of the Caribbean(guitar-robot)</h4>
                            <p>Demin Vladimir</p>
                            <span>2.6M views • 3 years ago</span>
                        </div>
                    </div>
                </div>
            </div>
            <hr className="sectionDivider" />

            <div className="videoSection">
                <h3>Popular</h3>
                <div className="videoGrid">
                    <div className="videoCard">
                        <img src="../public/9v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>Take Care</h4>
                            <p>Boisvert</p>
                            <span>4.6M views • 3 years ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/10v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>Five Nights At Freddy's | Official Teaser</h4>
                            <p>Universal Pictures</p>
                            <span>21M views • 2 weeks ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/11v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>I used "deep fakes" to fix the Lion King</h4>
                            <p>onlyj</p>
                            <span>44M views • 3 years ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/12v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>BABYMETAL // CATCH ME IF YOU CAN</h4>
                            <p>KuroKitsuneSama</p>
                            <span>6M views • 1 year ago</span>
                        </div>
                    </div>
                </div>
            </div>
            <hr className="sectionDivider" />

            <div className="videoSection">
                <h3>All Video</h3>
                <div className="videoGrid">
                    <div className="videoCard">
                        <img src="../public/13v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>If Arctic Monkeys wrote Sweater Weather</h4>
                            <p>Bored Ramone</p>
                            <span>1.6M views • 1 year ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/14v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>Joji - SMITHEREENS Full Album (Pacific Coast Highway)</h4>
                            <p>Joji</p>
                            <span>645M views • 6 months ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/15v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>Daft Punk - Something About Us (Official Video)</h4>
                            <p>Daft Punk</p>
                            <span>81M views • 14 years ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/16v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>in NEO TOKYO ⚫ ELECTRONICS FANTASTICOS!</h4>
                            <p>ELECTRONICS FANTASTICOS!</p>
                            <span>12M views • 2 years ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/17v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>Sinematik Video Estetik | Cinematic Video Aesthetic | Beautiful Sunset</h4>
                            <p>Damai Yakuza</p>
                            <span>2.8K views • 2 months ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/18v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>Blockhead - The Music Scene</h4>
                            <p>Ninja Tune</p>
                            <span>16M views • 13 years ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/19v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>Takashi Ito - Thunder</h4>
                            <p>neu skyin</p>
                            <span>35K views • 3 years ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/20v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>Crumb - Locket [Official Video]</h4>
                            <p>Crumb The Band</p>
                            <span>4M views • 5 years ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/21v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>another rainy day in sweden ~ nordic</h4>
                            <p>lofi mix</p>
                            <span>639K views • 3 months ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/22v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>Peter Tscherkassky - Outer Space</h4>
                            <p>Index Edition</p>
                            <span>92K views • 4 years ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/23v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>CINEMATIC ALAM</h4>
                            <p>widarri ar</p>
                            <span>571K views • 5 years ago</span>
                        </div>
                    </div>
                    <div className="videoCard">
                        <img src="../public/24v.png" alt="Video thumbnail" />
                        <div className="videoInfo">
                            <h4>The hardest piece I've ever played on guitar...</h4>
                            <p>Brandon Acker</p>
                            <span>1.2M views • 3 years ago</span>
                        </div>
                    </div>
                </div>
            </div>
         </div>
    );
}