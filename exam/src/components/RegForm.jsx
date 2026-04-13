import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { NavLink } from 'react-router-dom';
import './RegStyle.css';

 export function RegForm()
{
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const { setUserData } = useContext(UserContext);
    const navigate = useNavigate();

    const handleSubmit = (e) =>
    {
        e.preventDefault();
        if (password !== repeatPassword)
        {
            alert('Passwords do not match');
            return;
        }
        if (!name || !email || !password)
        {
            alert('Please fill all fields');
            return;
        }
        setUserData({ name, email, password });
        navigate('/login');
    };

    return (
        <div className='container'>
            <div className='LoginForm'>
                <div className='h1Form'>
                    <h1>CREATE AN ACCOUNT</h1>
                </div>
                <Form onSubmit={handleSubmit}>
                    <div className='row'>
                        <FloatingLabel className="mb-3">
                            <Form.Control
                                className='inputs'
                                type="text"
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </FloatingLabel>
                        <FloatingLabel className="mb-3">
                            <Form.Control
                                className='inputs'
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </FloatingLabel>
                    </div>
                    <div className="row">
                        <FloatingLabel>
                            <Form.Control
                                className='inputs'
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </FloatingLabel>
                        <FloatingLabel>
                            <Form.Control
                                className='inputs'
                                type="password"
                                placeholder="Repeat password"
                                value={repeatPassword}
                                onChange={(e) => setRepeatPassword(e.target.value)}
                            />
                        </FloatingLabel>
                    </div>
                    <div className='bottomRow'>
                        <div className='socialIcons'>
                            <img src="./public/fb.png" alt="" />
                            <img src="./public/gog.png" alt="" />
                            <img src="./public/twit.png" alt="" />
                            <img src="./public/apple.png" alt="" />
                        </div>
                        <Button className='signinButton' type="submit">Register</Button>
                    </div>
                    <NavLink to="/login" className="createAccountLink">Already have an account? Log in</NavLink>
                </Form>
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