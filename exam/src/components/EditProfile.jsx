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
            name: data?.name || data?.displayName || data?.fullName || "User",
            username: data?.username || data?.userName || data?.login || "user",
            about: data?.about || data?.bio || data?.description || "",
            color: normalizeHexColor(data?.color || "#B26E6E"),
            avatar: data?.avatar || data?.avatarUrl || data?.profileImage || "/ava.png",
            bannerUrl: data?.bannerUrl || data?.banner || data?.backgroundImage || "/backimage.jpg"
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
            } catch {
                data = null;
            }

            if (!response.ok) {
                const message =
                    data?.message ||
                    data?.error ||
                    `Request failed: ${response.status}`;
                throw new Error(message);
            }

            return data;
        },
        [authHeaders]
    );

    const trySaveProfile = useCallback(
        async (payload) => {
            const candidates = [
                { url: `${apiBaseUrl}/api/account/profile`, methods: ["PUT", "POST", "PATCH"] },
                { url: `${apiBaseUrl}/api/account/profile/update`, methods: ["POST", "PUT", "PATCH"] },
                { url: `${apiBaseUrl}/api/account/update-profile`, methods: ["POST", "PUT", "PATCH"] },
                { url: `${apiBaseUrl}/api/profile/update`, methods: ["POST", "PUT", "PATCH"] },
                { url: `${apiBaseUrl}/api/account/edit-profile`, methods: ["POST", "PUT", "PATCH"] }
            ];

            let lastError = null;

            for (const candidate of candidates) {
                for (const method of candidate.methods) {
                    try {
                        return await fetchJson(candidate.url, {
                            method,
                            body: JSON.stringify(payload)
                        });
                    } catch (err) {
                        lastError = err;
                        const message = String(err?.message || "");

                        const retryable =
                            message.includes("404") ||
                            message.includes("405") ||
                            message.includes("Method Not Allowed") ||
                            message.includes("Not Found");

                        if (!retryable) {
                            throw err;
                        }
                    }
                }
            }

            throw lastError || new Error("Failed to save profile");
        },
        [apiBaseUrl, fetchJson]
    );

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            if (!token) {
                throw new Error("No auth token found");
            }

            const data = await fetchJson(`${apiBaseUrl}/api/account/profile`);
            const normalized = normalizeProfile(data);

            setProfile(normalized);
            setForm({
                displayName: normalized.name,
                username: normalized.username,
                about: normalized.about,
                color: normalized.color,
                avatar: normalized.avatar,
                bannerUrl: normalized.bannerUrl
            });

            setAvatarPreview(normalized.avatar);
            setBannerPreview(normalized.bannerUrl);
        } catch (err) {
            console.error("Failed to load profile:", err);
            setError(err?.message || "Failed to load profile");
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl, fetchJson, normalizeProfile, token]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        return () => {
            if (avatarPreview && avatarPreview.startsWith("blob:")) {
                URL.revokeObjectURL(avatarPreview);
            }

            if (bannerPreview && bannerPreview.startsWith("blob:")) {
                URL.revokeObjectURL(bannerPreview);
            }
        };
    }, [avatarPreview, bannerPreview]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));

        setSuccess("");
    };

    const handleColor = (color) => {
        setForm((prev) => ({
            ...prev,
            color: normalizeHexColor(color)
        }));

        setSuccess("");
    };

    const handleColorBlur = () => {
        setForm((prev) => ({
            ...prev,
            color: normalizeHexColor(prev.color)
        }));
    };

    const handleAvatarSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);

        if (avatarPreview && avatarPreview.startsWith("blob:")) {
            URL.revokeObjectURL(avatarPreview);
        }

        setAvatarPreview(previewUrl);

        setForm((prev) => ({
            ...prev,
            avatarFile: file
        }));

        setSuccess("");
    };

    const handleBannerSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);

        if (bannerPreview && bannerPreview.startsWith("blob:")) {
            URL.revokeObjectURL(bannerPreview);
        }

        setBannerPreview(previewUrl);

        setForm((prev) => ({
            ...prev,
            bannerFile: file
        }));

        setSuccess("");
    };

    const uploadFileIfNeeded = async (file, type = "avatar") => {
        if (!file) return null;

        const formData = new FormData();
        formData.append("file", file);

        const uploadCandidates = [
            `${apiBaseUrl}/api/account/upload-${type}`,
            `${apiBaseUrl}/api/account/${type}/upload`,
            `${apiBaseUrl}/api/account/upload`
        ];

        let lastError = null;

        for (const url of uploadCandidates) {
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: token
                        ? {
                              Authorization: `Bearer ${token}`
                          }
                        : {},
                    body: formData
                });

                let data = null;
                try {
                    data = await response.json();
                } catch {
                    data = null;
                }

                if (!response.ok) {
                    throw new Error(data?.message || `Failed to upload ${type}: ${response.status}`);
                }

                return data?.url || data?.fileUrl || data?.path || null;
            } catch (err) {
                lastError = err;
            }
        }

        throw lastError || new Error(`Failed to upload ${type}`);
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            if (!token) {
                throw new Error("No auth token found");
            }

            let avatarUrl = form.avatar || profile.avatar;
            let bannerUrl = form.bannerUrl || profile.bannerUrl;

            if (form.avatarFile) {
                const uploadedAvatar = await uploadFileIfNeeded(form.avatarFile, "avatar");
                if (uploadedAvatar) {
                    avatarUrl = uploadedAvatar;
                }
            }

            if (form.bannerFile) {
                const uploadedBanner = await uploadFileIfNeeded(form.bannerFile, "banner");
                if (uploadedBanner) {
                    bannerUrl = uploadedBanner;
                }
            }

            const payload = {
                name: form.displayName?.trim() || "User",
                username: form.username?.trim() || profile.username,
                about: form.about?.trim() || "",
                color: normalizeHexColor(form.color),
                avatar: avatarUrl,
                bannerUrl: bannerUrl
            };

            const responseData = await trySaveProfile(payload);

            const normalized = normalizeProfile({
                ...payload,
                ...responseData
            });

            setProfile(normalized);
            setForm((prev) => ({
                ...prev,
                displayName: normalized.name,
                username: normalized.username,
                about: normalized.about,
                color: normalized.color,
                avatar: normalized.avatar,
                bannerUrl: normalized.bannerUrl,
                avatarFile: undefined,
                bannerFile: undefined
            }));

            setAvatarPreview(normalized.avatar);
            setBannerPreview(normalized.bannerUrl);
            setSuccess("Profile saved successfully");

            if (typeof setUserData === "function") {
                setUserData((prev) => ({
                    ...prev,
                    name: normalized.name,
                    username: normalized.username,
                    avatar: normalized.avatar
                }));
            }
        } catch (err) {
            console.error("Failed to save profile:", err);
            setError(err?.message || "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading profile...</div>;
    }

    return (
        <div className="edit-page">
            <div
                className="edit-banner"
                style={{ backgroundImage: `url(${bannerPreview || "/backimage.jpg"})` }}
            >
                <input
                    ref={bannerFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleBannerSelect}
                />

                <div className="edit-banner-inner">
                    <div className="edit-avatar">
                        <img src={avatarPreview || "/ava.png"} alt={form.username || "avatar"} />

                        <input
                            ref={avatarFileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleAvatarSelect}
                        />

                        <button
                            type="button"
                            className="edit-avatar-btn"
                            onClick={() => avatarFileInputRef.current?.click()}
                        >
                            ✎
                        </button>
                    </div>
                </div>
            </div>

            <div className="edit-container">
                <div className="edit-main">
                    <div className="edit-card">
                        <div className="edit-header">
                            <h2>{form.displayName || profile.name}</h2>
                            <p>@{form.username || profile.username}</p>
                        </div>

                        <div className="edit-body">
                            <label>DISPLAY NAME</label>
                            <input
                                type="text"
                                name="displayName"
                                value={form.displayName}
                                onChange={handleChange}
                            />

                            <label>USERNAME</label>
                            <input
                                type="text"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                            />

                            <label>ABOUT ME</label>
                            <textarea
                                name="about"
                                value={form.about}
                                onChange={handleChange}
                                placeholder="Tell something about you"
                            />

                            <label>CHOOSE PROFILE COLOR</label>

                            <div className="color-picker-wrap">
                                <input
                                    ref={colorInputRef}
                                    type="color"
                                    className="native-color-input"
                                    value={normalizeHexColor(form.color)}
                                    onChange={(e) => handleColor(e.target.value)}
                                />

                                <div
                                    className="color-area"
                                    onClick={() => colorInputRef.current?.click()}
                                    title="Choose color"
                                ></div>

                                <div
                                    className="hue-bar"
                                    onClick={() => colorInputRef.current?.click()}
                                    title="Choose color"
                                ></div>

                                <div className="color-code-row">
                                    <div className="color-pen">✎</div>

                                    <input
                                        type="text"
                                        className="color-code"
                                        name="color"
                                        value={form.color || ""}
                                        onChange={handleChange}
                                        onBlur={handleColorBlur}
                                    />

                                    <div
                                        className="color-preview"
                                        style={{ background: normalizeHexColor(form.color) }}
                                    ></div>
                                </div>

                                <div className="color-row">
                                    {presetColors.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            className={`color-box ${normalizeHexColor(form.color) === c ? "active" : ""}`}
                                            style={{ background: c }}
                                            onClick={() => handleColor(c)}
                                            aria-label={c}
                                        />
                                    ))}
                                </div>
                            </div>

                            {error ? <div className="form-error">{error}</div> : null}
                            {success ? <div className="form-success">{success}</div> : null}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="save-btn"
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save Change"}
                    </button>
                </div>

                <div className="edit-side">
                    <div className="edit-card small">
                        <p>More profile with special subscriptions</p>
                        <button type="button" className="pro-btn">
                            Subscribe to Amtlis Pro
                        </button>
                    </div>

                    <div className="edit-card small">
                        <p>Your opportunities with a subscriptions to Amtlis Pro</p>

                        <label>PROFILE THEME</label>
                        <div className="theme-row">
                            <button type="button" className="theme yellow" aria-label="yellow theme"></button>
                            <button type="button" className="theme gray" aria-label="gray theme"></button>
                        </div>

                        <div className="side-group">
                            <label>PROFILE ANIMATED BANNER</label>
                            <button
                                type="button"
                                className="outline-btn"
                                onClick={() => bannerFileInputRef.current?.click()}
                            >
                                Add animated banner
                            </button>
                        </div>

                        <div className="side-group">
                            <label>PROFILE ANIMATED AVATAR</label>
                            <button
                                type="button"
                                className="outline-btn"
                                onClick={() => avatarFileInputRef.current?.click()}
                            >
                                Add animated avatar
                            </button>
                        </div>

                        <div className="side-group">
                            <label>AVATAR DECORATION</label>
                            <button type="button" className="outline-btn">
                                Change Decoration
                            </button>
                        </div>

                        <div className="side-group">
                            <label>BANNER IMAGE</label>
                            <button
                                type="button"
                                className="outline-btn"
                                onClick={() => bannerFileInputRef.current?.click()}
                            >
                                Change banner
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}