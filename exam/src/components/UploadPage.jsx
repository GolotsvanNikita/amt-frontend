import React, { useMemo, useState } from "react";
import "./UploadPage.css";

const API_BASE = import.meta.env.VITE_API_URL;

function getToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt") ||
        ""
    );
}

export function UploadPage() {
    const [uploadType, setUploadType] = useState("video");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const videoPreview = useMemo(() => {
        return videoFile ? URL.createObjectURL(videoFile) : "";
    }, [videoFile]);

    const thumbnailPreview = useMemo(() => {
        return thumbnailFile ? URL.createObjectURL(thumbnailFile) : "";
    }, [thumbnailFile]);

    async function handleSubmit(e) {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!title.trim()) {
            setError("Please enter a title.");
            return;
        }

        if (!videoFile) {
            setError("Please choose a video file.");
            return;
        }

        try {
            setLoading(true);

            const token = getToken();

            const formData = new FormData();
            formData.append("type", uploadType);
            formData.append("title", title.trim());
            formData.append("description", description.trim());
            formData.append("category", category.trim());
            formData.append("video", videoFile);

            if (thumbnailFile) {
                formData.append("thumbnail", thumbnailFile);
            }

            const endpoint =
                uploadType === "reel"
                    ? `${API_BASE}/api/reels/upload`
                    : `${API_BASE}/api/video/upload`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            });

            const text = await response.text();
            let data = null;

            try {
                data = text ? JSON.parse(text) : null;
            } catch {
                data = text;
            }

            console.log("UPLOAD RESPONSE:", {
                status: response.status,
                ok: response.ok,
                data,
            });

            if (!response.ok) {
                throw new Error(data?.message || data || "Upload failed.");
            }

            setMessage(`${uploadType === "reel" ? "Reel" : "Video"} uploaded successfully.`);
            setTitle("");
            setDescription("");
            setCategory("");
            setVideoFile(null);
            setThumbnailFile(null);
        } catch (err) {
            console.error("UPLOAD ERROR:", err);
            setError(err.message || "Upload failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="uploadPage">
            <div className="uploadPage-card">
                <div className="uploadPage-header">
                    <div>
                        <h1>Upload content</h1>
                        <p>Add a new video or short reel to your channel.</p>
                    </div>

                    <div className="uploadPage-switch">
                        <button
                            type="button"
                            className={uploadType === "video" ? "active" : ""}
                            onClick={() => setUploadType("video")}
                        >
                            Video
                        </button>

                        <button
                            type="button"
                            className={uploadType === "reel" ? "active" : ""}
                            onClick={() => setUploadType("reel")}
                        >
                            Reel
                        </button>
                    </div>
                </div>

                <form className="uploadForm" onSubmit={handleSubmit}>
                    <div className="uploadGrid">
                        <div className="uploadLeft">
                            <label className="uploadField">
                                <span>Title</span>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter title"
                                />
                            </label>

                            <label className="uploadField">
                                <span>Description</span>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tell viewers about your content"
                                />
                            </label>

                            <label className="uploadField">
                                <span>Category</span>
                                <input
                                    type="text"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="Music, Gaming, Education..."
                                />
                            </label>

                            <label className="fileBox">
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                                />

                                <div className="fileBox-content">
                                    <strong>Choose {uploadType === "reel" ? "reel" : "video"} file</strong>
                                    <p>{videoFile ? videoFile.name : "MP4, MOV, WEBM"}</p>
                                </div>
                            </label>

                            <label className="fileBox">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                                />

                                <div className="fileBox-content">
                                    <strong>Choose thumbnail</strong>
                                    <p>{thumbnailFile ? thumbnailFile.name : "JPG, PNG, WEBP"}</p>
                                </div>
                            </label>

                            {error && <div className="uploadAlert error">{error}</div>}
                            {message && <div className="uploadAlert success">{message}</div>}

                            <button className="uploadSubmit" type="submit" disabled={loading}>
                                {loading ? "Uploading..." : `Upload ${uploadType}`}
                            </button>
                        </div>

                        <div className="uploadPreview">
                            <h2>Preview</h2>

                            <div className={`previewFrame ${uploadType === "reel" ? "reel" : ""}`}>
                                {videoPreview ? (
                                    <video src={videoPreview} controls />
                                ) : thumbnailPreview ? (
                                    <img src={thumbnailPreview} alt="Thumbnail preview" />
                                ) : (
                                    <div className="emptyPreview">
                                        <span>▶</span>
                                        <p>No file selected</p>
                                    </div>
                                )}
                            </div>

                            <div className="previewInfo">
                                <h3>{title || "Your title will appear here"}</h3>
                                <p>{description || "Description preview..."}</p>

                                <div className="previewMeta">
                                    <span>{uploadType === "reel" ? "Reel" : "Video"}</span>
                                    {category && <span>{category}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}