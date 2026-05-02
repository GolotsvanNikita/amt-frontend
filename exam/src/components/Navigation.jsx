import React, { useEffect, useState } from 'react';
import './Navigation.css';
import { Link, useNavigate } from "react-router-dom";

export function Navigation() {
    const [avatarUrl, setAvatarUrl] = useState("/ava.png");
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const loadProfile = async () => {
            const token =
                localStorage.getItem("token") ||
                localStorage.getItem("authToken") ||
                localStorage.getItem("jwt") ||
                sessionStorage.getItem("token") ||
                "";

            if (!token) return;

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/account/profile`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();

                    if (data.avatarUrl) {
                        setAvatarUrl(data.avatarUrl);
                    }
                }
            } catch (err) {
                console.error("Failed to load navigation profile:", err);
            }
        };

        loadProfile();

        const handleProfileUpdate = () => loadProfile();
        window.addEventListener("profileUpdated", handleProfileUpdate);

        return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();

        const trimmedQuery = searchQuery.trim();

        if (!trimmedQuery) return;

        navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    };

    return (
        <nav className='navContainer'>
            <div className='nav-left'>
                <Link to='/'>
                    <img src="/logo.png" alt="logo" className='logo' />
                </Link>
            </div>

            <div className='nav-center'>
                <form className='inputNav' onSubmit={handleSearch}>
                    <div className='combine'>
                        <input
                            type="text"
                            placeholder='Search'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        <button type="submit" className='search'>
                            <img src="/search.png" alt="search" />
                        </button>
                    </div>

                    <button type="button" className='mic'>
                        <img src="/mic.png" alt="mic" />
                    </button>
                </form>
            </div>

            <div className='nav-right'>
                <div className='buttons'>
                    <Link to="/upload" className='kvadrat'>
                        <img src="/kvadrat.svg" alt="kvadrat" />
                    </Link>

                    <a href="#" className='bell'>
                        <img src="/Bell.svg" alt="ring" />
                    </a>

                    <Link to="/my-account" className='ava'>
                        <img
                            src={avatarUrl}
                            alt="ava"
                            className="user-avatar"
                            onError={(e) => e.currentTarget.src = "/ava.png"}
                        />
                    </Link>
                </div>
            </div>
        </nav>
    );
}