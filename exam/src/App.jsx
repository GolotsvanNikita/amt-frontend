import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, UserContext } from './UserContext';
import { useContext, useEffect } from 'react'; 
import { RegForm } from './components/RegForm';
import { FormFloatingBasicExample } from './components/LoginForm';
import { MainPage } from './components/MainPage';
import { AuthorPage } from './components/AuthorPage';
import { Layout } from './components/Layout';
import { VideoAndComments } from './components/VideoAndComments';
import { MyAccount } from './components/MyAccount';
import { EditProfile } from './components/EditProfile';
import { ThemePage } from './components/ThemePage';
import { ReelsPage } from './components/ReelsPage';
import { FullReels } from './components/ReelDetailsPage';
import { ReelCommentsPage } from './components/ReelCommentsPage';
import './App.css';

function TokenInterceptor() {
    const context = useContext(UserContext);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get('token');

        if (token) {
            localStorage.setItem('token', token);
            if (context && context.setIsLoggedIn) {
                context.setIsLoggedIn(true);
            } else {

                window.location.reload();
            }

            // Очищаем адресную строку от токена, чтобы было красиво
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [context]);

    return null; 
}

function ProtectedRoute({ children }) {
    const { isLoggedIn } = useContext(UserContext);
    
    const hasTokenInUrl = new URLSearchParams(window.location.search).has('token');

    return (isLoggedIn || hasTokenInUrl) ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <UserProvider>
            <BrowserRouter>
                <TokenInterceptor />
                
                <Routes>
                    <Route path="/register" element={<RegForm />} />
                    <Route path="/login" element={<FormFloatingBasicExample />} />

                    {/* Маршрут oauth-success удален! */}

                    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route index element={<MainPage />} />

                        <Route path="video" element={<VideoAndComments />} />
                        <Route path="video/:id" element={<VideoAndComments />} />

                        <Route path="channel/:channelId" element={<AuthorPage />} />
                        <Route path="my-account" element={<MyAccount />} />
                        <Route path="edit-profile" element={<EditProfile />} />
                        <Route path="theme-page" element={<ThemePage />} />

                        <Route path="reels-page" element={<ReelsPage />} />
                        <Route path="reels-page/:id" element={<FullReels />} />
                        <Route path="reels-page/:id/comments" element={<ReelCommentsPage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/register" />} />
                </Routes>
            </BrowserRouter>
        </UserProvider>
    );
}

export default App;
