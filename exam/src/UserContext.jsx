import { createContext, useState } from 'react';

export const UserContext = createContext();

 export function UserProvider({ children })
{
    const [userData, setUserData] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <UserContext.Provider value={{ userData, setUserData, isLoggedIn, setIsLoggedIn }}>
            {children}
        </UserContext.Provider>
    );
}