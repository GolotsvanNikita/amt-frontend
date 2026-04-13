import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { NavLink } from 'react-router-dom';
import './LoginForm.css';

export function FormFloatingBasicExample()
{
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { userData, setIsLoggedIn } = useContext(UserContext);
    const navigate = useNavigate();

    const handleSubmit = (e) =>
    {
        e.preventDefault();
        if (userData && userData.email === email && userData.password === password)
        {
            setIsLoggedIn(true);
            navigate('/');
        }
        else
        {
            alert('Invalid credentials');
        }
    };

     return (
        <div className='container'>
            <div className='LoginForm'>
                <div className='h1Form'>
                    <h1>GET SOME FELICITY WITH <span>AMTLIS</span></h1>
                </div>
                <Form onSubmit={handleSubmit}>
                    <FloatingLabel className="mb-3">
                        <Form.Control
                            className='inputs'
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </FloatingLabel>
                    <div className="passwordWrapper">
                        <FloatingLabel>
                            <Form.Control
                                className='inputs'
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </FloatingLabel>
                        <a href="#" className="forgotLink">Forgot your password?</a>
                    </div>
                    <div className='bottomRow'>
                        <div className='socialIcons'>
                            <img src="./public/fb.png" alt="" />
                            <img src="./public/gog.png" alt="" />
                            <img src="./public/twit.png" alt="" />
                            <img src="./public/apple.png" alt="" />
                        </div>
                        <Button className='signinButton' type="submit">Sign In</Button>
                    </div>
                </Form>
                <NavLink to="/register" className="createAccountLink">Create an account</NavLink>
            </div>
            <div className='LoginFormImages'>
                <img src="./public/1.jpg" alt="" />
                <img src="./public/2.jpg" alt="" />
                <img src="./public/3.jpg" alt="" />
                <img src="./public/4.jpg" alt="" />
                <img src="./public/5.jpg" alt="" />
                <img src="./public/6.jpg" alt="" />
                <img src="./public/7.jpg" alt="" />
                <img src="./public/8.jpg" alt="" />
            </div>
        </div>
    );
}