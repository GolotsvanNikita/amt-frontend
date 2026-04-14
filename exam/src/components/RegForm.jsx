import { useState, useContext } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { UserContext } from '../UserContext';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import './RegStyle.css';

export function RegForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { setUserData } = useContext(UserContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedName || !trimmedEmail || !password || !repeatPassword) {
            setError('Please fill all fields');
            return;
        }

        if (password !== repeatPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setLoading(true);

            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: trimmedName,
                    email: trimmedEmail,
                    password,
                    repeatPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            setUserData({
                id: data.user?.id,
                name: data.user?.name || trimmedName,
                email: data.user?.email || trimmedEmail,
                token: data.token || null,
            });

            navigate('/login');
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
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
                            CREATE
                            <br />
                            AN ACCOUNT
                        </h1>
                    </div>

                    <Form onSubmit={handleSubmit} className='reg-form'>
                        <div className='reg-row'>
                            <Form.Control
                                className='reg-input'
                                type='text'
                                placeholder='Name'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                            />
                            <Form.Control
                                className='reg-input'
                                type='email'
                                placeholder='Email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className='reg-row'>
                            <Form.Control
                                className='reg-input'
                                type='password'
                                placeholder='Password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                            <Form.Control
                                className='reg-input'
                                type='password'
                                placeholder='Repeat password'
                                value={repeatPassword}
                                onChange={(e) => setRepeatPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div
                                style={{
                                    color: '#ff8080',
                                    fontSize: '12px',
                                    marginTop: '6px',
                                    marginBottom: '6px',
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <div className='reg-bottom-row'>
                            <div className='reg-social-icons'>
                                <img src='/fb.png' alt='Facebook' />
                                <img src='/gog.png' alt='Google' />
                                <img src='/twit.png' alt='Twitter' />
                                <img src='/apple.png' alt='Apple' />
                            </div>

                            <Button
                                className='reg-submit-btn'
                                type='submit'
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : 'Register'}
                            </Button>
                        </div>

                        <div className='reg-bottom-text'>Welcome to AMTLIS</div>

                        <NavLink to='/login' className='reg-login-link'>
                            Already have an account? Log in
                        </NavLink>
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