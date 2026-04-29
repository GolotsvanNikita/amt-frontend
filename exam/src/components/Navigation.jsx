import React from 'react';
import './Navigation.css';
import {Link} from "react-router-dom";

 export function Navigation()
{
    return(
        <nav className='navContainer'>
            <Link to='/'><img src="/logo.png" alt="logo" className='logo'/></Link>
            <div className='inputNav'>
                <div className='combine'>
                    <input type="text" placeholder='Search'/>
                    <button className='search'><img src="/search.png" alt="search"/></button>
                </div>
                <button className='mic'><img src="/mic.png" alt="mic"/></button>
            </div>
            <div className='buttons'>
                <Link to="/upload" className='kvadrat'><img src="/kvadrat.svg" alt="kvadrat"/></Link>
                <a href="#" className='bell'><img src="/Bell.svg" alt="ring"/></a>
                <Link to="/my-account" className='ava'>
                    <img src="/ava.png" alt="ava"/>
                </Link>
            </div>
        </nav>
    );
}