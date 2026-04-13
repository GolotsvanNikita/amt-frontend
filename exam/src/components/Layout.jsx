import { Navigation } from './Navigation';
import { SideMenu } from './SideMenu';
import { Outlet } from 'react-router-dom';

export function Layout()
{
    return (
        <div className="app">
            <Navigation />
            <div className="layout">
                <SideMenu />
                <main className="mainContent">
                    <Outlet />
                </main>
            </div>
        </div>
    ); 
}