import { useState, useContext } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { UserContext } from '../UserContext';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import './LoginForm.css';

export function FormFloatingBasicExample() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState('');
    const [error, setError] = useState('');

    const { setUserData, setIsLoggedIn } = useContext(UserContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedEmail || !password) {
            setError('Please fill all fields');
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: trimmedEmail,
                    password,
                }),
            });

            const data = await response.json();

            localStorage.setItem('token', data.token);

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            setUserData({
                id: data.user?.id,
                name: data.user?.name || '',
                email: data.user?.email || trimmedEmail,
                token: data.token || null,
                provider: 'email',
            });

            setIsLoggedIn(true);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialAuth = async (provider) => {
        setError('');
        setSocialLoading(provider);

        try {
            window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/${provider}`;
        } catch (err) {
            setError(err.message || `${provider} login failed`);
        } finally {
            setSocialLoading('');
        }
    };

    return (
        <div className='reg-page'>
            <div className='reg-shell'>
                <div className='reg-form-card'>
                    <button
                        className='reg-back-btn'
                        type='button'
                        aria-label='Back'
                        onClick={() => navigate(-1)}
                    >
                        ←
                    </button>

                    <div className='reg-title-wrap'>
                        <h1 className='reg-title'>
                            GET SOME
                            <br />
                            FELICITY WITH
                            <br />
                            AMTLIS
                        </h1>
                    </div>

                    <Form onSubmit={handleSubmit} className='reg-form'>
                        <div className='reg-single-row'>
                            <Form.Control
                                className='reg-input reg-input-single'
                                type='email'
                                placeholder='Email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading || !!socialLoading}
                            />
                        </div>

                        <div className='reg-single-row reg-password-wrap'>
                            <Form.Control
                                className='reg-input reg-input-single'
                                type='password'
                                placeholder='Password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading || !!socialLoading}
                            />
                            <NavLink to='/forgot-password' className='reg-forgot-link'>
                                Forgot your password?
                            </NavLink>
                        </div>

                        {error && <div className='reg-error'>{error}</div>}

                        <div className='reg-bottom-row'>
                            <div className='reg-social-icons'>
                                <button
                                    type='button'
                                    className='reg-social-btn'
                                    onClick={() => handleSocialAuth('facebook')}
                                    disabled={loading || !!socialLoading}
                                >
                                    <img src='/fb.png' alt='Facebook' />
                                </button>

                                <button
                                    type='button'
                                    className='reg-social-btn'
                                    onClick={() => handleSocialAuth('google')}
                                    disabled={loading || !!socialLoading}
                                >
                                    <img src='/gog.png' alt='Google' />
                                </button>

                                <button
                                    type='button'
                                    className='reg-social-btn'
                                    onClick={() => handleSocialAuth('twitter')}
                                    disabled={loading || !!socialLoading}
                                >
                                    <img src='/twit.png' alt='Twitter' />
                                </button>

                                <button
                                    type='button'
                                    className='reg-social-btn'
                                    onClick={() => handleSocialAuth('apple')}
                                    disabled={loading || !!socialLoading}
                                >
                                    <img src='/apple.png' alt='Apple' />
                                </button>
                            </div>

                            <Button
                                className='reg-submit-btn'
                                type='submit'
                                disabled={loading || !!socialLoading}
                            >
                                {loading ? 'Loading...' : 'Sign In'}
                            </Button>
                        </div>

                        {socialLoading && (
                            <div className='reg-bottom-text'>
                                Connecting with {socialLoading}...
                            </div>
                        )}

                        {!socialLoading && (
                            <>
                                <div className='reg-bottom-text'>Welcome to AMTLIS</div>

                                <NavLink to='/register' className='reg-login-link reg-login-link-visible'>
                                    Create an account
                                </NavLink>
                            </>
                        )}
                    </Form>
                </div>

                <div className='reg-gallery'>
                    <img src='/1.jpg' alt='gallery 1' />
                    <img src='/2.jpg' alt='gallery 2' />
                    <img src='/3.jpg' alt='gallery 3' />
                    <img src='/4.jpg' alt='gallery 4' />
                    <img src='/5.jpg' alt='gallery 5' />
                    <img src='/6.jpg' alt='gallery 6' />
                    <img src='/7.jpg' alt='gallery 7' />
                    <img src='/8.jpg' alt='gallery 8' />
                </div>
            </div>
        </div>
    );
}