
import './ThemePage.css';
import React, {use, useEffect, useMemo, useState} from 'react';

/*
  Временный мок только один.
  Потом просто заменяешь `const data = mockThemesResponse`
  на реальный fetch("/api/themes")
*/

const mockThemesResponse = {
  featuredTheme: {
    id: 6,
    title: "ANIME",
    type: "achievement",
    description:
      'You got the Anime Theme for the "5 videos watched" achievement. Click "apply" to activate the theme or "watch later" to activate the theme later.',
    previewUrl:
      "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?q=80&w=1200&auto=format&fit=crop",
    status: "available",
    achievementCode: "videos_5_watched",
  },
  sections: [
    {
      id: "all",
      title: "All themes",
      items: [
        {
          id: 1,
          title: "Cybersport",
          type: "default",
          previewUrl:
            "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
          status: "available",
        },
        {
          id: 2,
          title: "Geometry",
          type: "default",
          previewUrl:
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
          status: "applied",
        },
        {
          id: 3,
          title: "Tokyo Drift",
          type: "default",
          previewUrl:
            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
          status: "locked",
        },
        {
          id: 4,
          title: "Butterfly",
          type: "default",
          previewUrl:
            "https://images.unsplash.com/photo-1444464666168-49d633b86797?q=80&w=1200&auto=format&fit=crop",
          status: "available",
        },
      ],
    },
    {
      id: "achievement",
      title: "Achievement",
      items: [
        {
          id: 5,
          title: "Game",
          type: "achievement",
          previewUrl:
            "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
          status: "available",
          achievementCode: "games_10_played",
        },
        {
          id: 6,
          title: "Anime",
          type: "achievement",
          previewUrl:
            "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?q=80&w=1200&auto=format&fit=crop",
          status: "available",
          achievementCode: "videos_5_watched",
        },
        {
          id: 7,
          title: "Space",
          type: "achievement",
          previewUrl:
            "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200&auto=format&fit=crop",
          status: "locked",
          achievementCode: "space_achievement",
        },
        {
          id: 8,
          title: "Cybersport",
          type: "achievement",
          previewUrl:
            "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
          status: "available",
          achievementCode: "cybersport_achievement",
        },
      ],
    },
    {
      id: "pro",
      title: "Amtlis Pro themes",
      items: [
        {
          id: 9,
          title: "Rockstyle",
          type: "pro",
          previewUrl:
            "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop",
          status: "locked",
        },
        {
          id: 10,
          title: "Snakes",
          type: "pro",
          previewUrl:
            "https://images.unsplash.com/photo-1531386151447-fd76ad50012f?q=80&w=1200&auto=format&fit=crop",
          status: "available",
        },
        {
          id: 11,
          title: "Butterfly",
          type: "pro",
          previewUrl:
            "https://images.unsplash.com/photo-1444464666168-49d633b86797?q=80&w=1200&auto=format&fit=crop",
          status: "available",
        },
        {
          id: 12,
          title: "Tokyo Drift",
          type: "pro",
          previewUrl:
            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
          status: "locked",
        },
      ],
    },
  ],
};

function getThemeStatusLabel(status){
  switch(status){
    case "applied":
      return "Applied";
    case "locked":
      return "Locked";
    case "watch_later":
      return "Watch Later";
    default:
      return " ";
  }
}

export function ThemePage(){
  const [themesData, setThemesData] = useState({
    featuredTheme: null,
    sections: [],
  })
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    loadThemes();
  }, []);
  const loadThemes = async () =>{
    try{
      setLoading(true);
      // ===== БУДЕТ НА БЭКЕ =====
      // const response = await fetch("/api/themes");
      // if (!response.ok) {
      //   throw new Error("Failed to fetch themes");
      // }
      // const data = await response.json();

      // ===== ПОКА МОК =====
      const data = mockThemesResponse;
      setThemesData(data);
    }catch(error){
      console.error("Failed to load themes:", error);
    }finally{
      setLoading(false);
    }
  }
  const handleApplyTheme = async (themeId) => {
    try {
      // ===== БУДЕТ НА БЭКЕ =====
      // const response = await fetch(`/api/themes/${themeId}/apply`, {
      //   method: "POST",
      // });
      // if (!response.ok) {
      //   throw new Error("Failed to apply theme");
      // }
      // const result = await response.json();

      setThemesData((prev) => ({
        ...prev,
        featuredTheme:
          prev.featuredTheme?.id === themeId
            ? { ...prev.featuredTheme, status: "applied" }
            : prev.featuredTheme,
        sections: prev.sections.map((section) => ({
          ...section,
          items: section.items.map((item) =>
            item.id === themeId ? { ...item, status: "applied" } : item
          ),
        })),
      }));
    } catch (error) {
      console.error("Failed to apply theme:", error);
    }
  };

  const handleWatchLater = async (themeId) => {
    try {
      // ===== БУДЕТ НА БЭКЕ =====
      // const response = await fetch(`/api/themes/${themeId}/watch-later`, {
      //   method: "POST",
      // });
      // if (!response.ok) {
      //   throw new Error("Failed to save theme for later");
      // }
      // const result = await response.json();

      setThemesData((prev) => ({
        ...prev,
        featuredTheme:
          prev.featuredTheme?.id === themeId
            ? { ...prev.featuredTheme, status: "watch_later" }
            : prev.featuredTheme,
        sections: prev.sections.map((section) => ({
          ...section,
          items: section.items.map((item) =>
            item.id === themeId ? { ...item, status: "watch_later" } : item
          ),
        })),
      }));
    } catch (error) {
      console.error("Failed to save theme for later:", error);
    }
  };

  const handleThemeClick = (themeId) =>{
    console.log("theme menu click:" , themeId);
  };

  const filteredSections = useMemo(()=>{
    const value = search.trim().toLowerCase();
    if(!value) return themesData.sections;
    return themesData.sections
    .map((section)=>({
      ...section, items:section.items.filter((item)=>item.title.toLowerCase().includes(value))
    }))
    .filter((section)=>section.items.lenght > 0);
  }, [search,themesData.sections]);

  const featuredTheme = themesData.featuredTheme;

  return(
    <div className='themes-page'>
        <header className='themes-header'>
            <div className='themes-search-wrapper'>
            <input 
              type = "text"
              className='themes-search'
              placeholder='Search'
              value = {search}
              onChange = {(e) => setSearch(e.target.value)}
            />
            <button className='themes-search-icon' type='button' aria-label='Search'>⌕</button>
            </div>
            <div className='themes-header-actions'>
                <button className='icon-btn' type='button' aria-label='Apps'>◫</button>
                <button className='icon-btn' type='button' aria-label="Notifications">🔔</button>
                <button className='avatar-btn' type ='button' aria-label="Profile"><span className='avatar-dot'></span></button>
            </div>
        </header>
        {loading ? (
          <div className='themes-loading'>Loading themes...</div>
        ):(
          <>
            {featuredTheme&&(
              <section className='featured-theme'>
                <div className='featured-theme-image-wrap'>
                  <img src = {featuredTheme.previewUrl} alt={featuredTheme.title} className='featured-theme-image'></img>
                </div>
                <div className='featured-theme-content'>
                    <span className='featured-theme-category'>{featuredTheme.type?.toUpperCase()}</span>
                    <h1 className='featured-theme-title'>{featuredTheme.title}</h1>
                    <p className='featured-theme-description'>{featuredTheme.description}</p>
                    <div className='featured-theme-actions'>
                      <button className='primary-btn' type = 'button' onClick={()=>handleApplyTheme(featuredTheme.id)} disabled={featuredTheme.status === "locked"}>
                        Apply
                      </button>
                      <button className='secondary-btn' type='button' onClick={()=>handleWatchLater(featuredTheme.id)} disabled ={featuredTheme.status === "locked"}>
                        Watch Later</button>
                    </div>
                </div>
              </section>
            )}
            <div className='themes-sections'>
              {filteredSections.map((section)=>(
                <section className='themes-section' key = {section.id}>
                  <div className='themes-section-tip'>
                    <h2 className='themes-section-title'>{section.title}</h2>
                  </div>
                  <div className='themes-grid'>
                      {section.items.map((item)=>(
                        <article className='theme-card' key={item.id}>
                          <div className='theme-card-image-wrap'>
                            <img src={item.previewUrl} alt={item.title} className='theme-card-image'/>
                            {item.status !== "available" && (<span className={`theme-card-badge theme-card-badge--${item.status}`}>{getThemeStatusLabel(item)}</span>
                            )}
                          </div>
                          <div className='theme-card-footer'>
                            <span className='theme-card-title'>{item.title}</span>
                            <button className='theme-card-menu' type='button' onClick={()=>handlyThemeMenuClick(item.id)} aria-label={`Open menu for ${item.title}`}>
                              ⋮
                            </button>
                          </div>
                        </article>
                      ))}
                  </div>
                </section>
              ))}
              {!filteredSections.length && (
                <div className='themes-empty'>Nothing found</div>
              )}
            </div>
          </>
        )
        }
    </div>
  )
}