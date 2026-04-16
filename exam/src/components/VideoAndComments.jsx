import { useLocation, useParams } from "react-router-dom";
import { YouTubeCustomPlayer } from "./VideoPage";

export function VideoAndComments() {
    const { id } = useParams();
    const location = useLocation();

    return (
        <div className="videoPage">
            <YouTubeCustomPlayer
                routeVideoId={id}
                initialVideo={location.state?.video || null}
            />

            <div style={{ marginTop: "20px" }}>
                <h3>Comments</h3>
                <p>Comments will be available soon</p>
            </div>
        </div>
    );
}