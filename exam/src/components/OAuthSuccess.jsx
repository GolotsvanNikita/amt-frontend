import { useEffect } from "react";
import { useNavigate} from "react-router-dom";
import "./OAuthSuccess.css";

export function OAuthSuccess(){
    const navigate = useNavigate();

    useEffect(()=>{
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if(token){
            localStorage.setItem('token' , token);
            localStorage.setItem('authToken', token);
            localStorage.setItem('jwt', token);
            localStorage.setItem('accessToken', token);
        }
        navigate('/',{replace:true});
    }, [navigate]);

    return (
        <div className="oauth-success-page">
            <div className="oauth-success-card">
                <div className="oauth-success-spiner">
                    <h2 className="oauth-success-title">Signing you in...</h2>
                    <p className="oauth-success-text">Please wait a momemnt.</p>
                </div>
            </div>
        </div>
    )
}