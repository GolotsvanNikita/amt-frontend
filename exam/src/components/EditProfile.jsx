import React, { useState, useEffect, useRef, useMemo, useContext, useCallback } from "react";
import "./EditProfile.css";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";

const DEFAULT_PROFILE = {
    name: "User",
    username: "user",
    about: "",
    color: "#B26E6E",
    avatar: "/ava.png",
    bannerUrl: "/backimage.jpg"
};

export function EditProfile() {
    const navigate = useNavigate();
    const { userData, setUserData } = useContext(UserContext);

    const token =
        userData?.token ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt") ||
        "";

    const apiBaseUrl = import.meta.env.VITE_API_URL;

    const [profile, setProfile] = useState(DEFAULT_PROFILE);

    const [form, setForm] = useState({
        displayName: "",
        username: "",
        about: "",
        color: "#B26E6E",
        avatar: "",
        bannerUrl: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [avatarPreview, setAvatarPreview] = useState("");
    const [bannerPreview, setBannerPreview] = useState("");

    const colorInputRef = useRef(null);
    const avatarFileInputRef = useRef(null);
    const bannerFileInputRef = useRef(null);

    const authHeaders = useMemo(() => {
        const headers = {
            "Content-Type": "application/json"
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return headers;
    }, [token]);

    const presetColors = [
        "#F1F1F1",
        "#ECE66A",
        "#6A87DC",
        "#C10000",
        "#FF9214",
        "#B26E6E",
        "#DCDCDC",
        "#EFEFEF"
    ];

    const normalizeHexColor = (value) => {
        const raw = String(value || "").trim().toUpperCase();
        if (!raw) return "#B26E6E";

        const withHash = raw.startsWith("#") ? raw : `#${raw}`;

        if (/^#[0-9A-F]{6}$/.test(withHash)) {
            return withHash;
        }

        return "#B26E6E";
    };

    const normalizeProfile = useCallback((data) => {
        return {
            name: data?.name || data?.displayName || "User",
            username: data?.username || data?.userName || "user",
            about: data?.about || data?.bio || "",
            color: normalizeHexColor(data?.color || "#B26E6E"),
            avatar: data?.avatar || data?.avatarUrl || "/ava.png",
            bannerUrl: data?.bannerUrl || data?.banner || "/backimage.jpg"
        };
    }, []);

    const fetchJson = useCallback(
        async (url, options = {}) => {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...authHeaders,
                    ...(options.headers || {})
                }
            });

            let data = null;
            try {
                data = await response.json();
            } catch {}

            if (!response.ok) {
                throw new Error(data?.message || `Request failed: ${response.status}`);
            }

            return data;
        },
        [authHeaders]
    );

    // 🔥 ФИКС 405
    const saveProfile = async (payload) => {
        try {
            return await fetchJson(`${apiBaseUrl}/api/account/profile`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });
        } catch (err) {
            if (String(err?.message || "").includes("405")) {
                return await fetchJson(`${apiBaseUrl}/api/account/profile`, {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
            }
            throw err;
        }
    };

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await fetchJson(`${apiBaseUrl}/api/account/profile`);
            const normalized = normalizeProfile(data);

            setProfile(normalized);
            setForm({
                displayName: normalized.name,
                username: normalized.username,
                about: normalized.about,
                color: normalized.color
            });

            setAvatarPreview(normalized.avatar);
            setBannerPreview(normalized.bannerUrl);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl, fetchJson, normalizeProfile]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleColor = (color) => {
        setForm((prev) => ({
            ...prev,
            color: normalizeHexColor(color)
        }));
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const payload = {
                name: form.displayName,
                username: form.username,
                about: form.about,
                color: normalizeHexColor(form.color),
                avatar: avatarPreview,
                bannerUrl: bannerPreview
            };

            const responseData = await saveProfile(payload);

            const updated = normalizeProfile({
                ...payload,
                ...responseData
            });

            setProfile(updated);
            setSuccess("Saved successfully");

            setUserData?.((prev) => ({
                ...prev,
                name: updated.name,
                username: updated.username,
                avatar: updated.avatar
            }));
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="edit-page">
            <div
                className="edit-banner"
                style={{ backgroundImage: `url(${bannerPreview})` }}
            >
                <div className="edit-banner-inner">
                    <div className="edit-avatar">
                        <img src={avatarPreview} alt="" />
                    </div>
                </div>
            </div>

            <div className="edit-container">
                <div className="edit-main">
                    <div className="edit-card">
                        <div className="edit-header">
                            <h2>{form.displayName}</h2>
                            <p>@{form.username}</p>
                        </div>

                        <div className="edit-body">
                            <label>DISPLAY NAME</label>
                            <input
                                name="displayName"
                                value={form.displayName}
                                onChange={handleChange}
                            />

                            <label>USERNAME</label>
                            <input
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                            />

                            <label>ABOUT</label>
                            <textarea
                                name="about"
                                value={form.about}
                                onChange={handleChange}
                            />

                            <label>COLOR</label>

                            <input
                                type="color"
                                value={form.color}
                                onChange={(e) => handleColor(e.target.value)}
                            />

                            <div className="color-row">
                                {presetColors.map((c) => (
                                    <button
                                        key={c}
                                        style={{ background: c }}
                                        onClick={() => handleColor(c)}
                                    />
                                ))}
                            </div>

                            {error && <div className="form-error">{error}</div>}
                            {success && <div className="form-success">{success}</div>}
                        </div>
                    </div>

                    <button
                        className="save-btn"
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}