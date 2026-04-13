import React, { useState, useEffect, useRef } from "react";
import "./EditProfile.css";

export function EditProfile() {
    // заглушка под будущий бэк
    const [profile, setProfile] = useState({
        name: "User",
        username: "user",
        about: "",
        color: "#B26E6E",
        avatar: "/ava.png",
        bannerUrl: "/backimage.jpg"
    });

     const [form, setForm] = useState({
        displayName: "",
        about: "",
        color: "#B26E6E"
    });
 
    const colorInputRef = useRef(null);

    useEffect(() => {
        async function loadProfile() {
            try {
                // потом заменишь на API
                // const res = await fetch("/api/profile/me");
                // const data = await res.json();

                const data = {
                    name: "User",
                    username: "user",
                    about: "",
                    color: "#B26E6E",
                    avatar: "/ava.png",
                    bannerUrl: "/backimage.jpg"
                };

                setProfile(data);
                setForm({
                    displayName: data.name || "",
                    about: data.about || "",
                    color: (data.color || "#B26E6E").toUpperCase()
                });
            } catch (err) {
                console.error(err);
            }
        }

        loadProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleColor = (color) => {
        setForm((prev) => ({
            ...prev,
            color: color.toUpperCase()
        }));
    };

    const handleSubmit = async () => {
        try {
            console.log("SEND TO BACK:", form);

            await fetch("/api/profile/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(form)
            });

            alert("Saved");
        } catch (err) {
            console.error(err);
        }
    };

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

    return (
        <div className="edit-page">
            <div
                className="edit-banner"
                style={{ backgroundImage: `url(${profile.bannerUrl})` }}
            >
                <div className="edit-banner-inner">
                    <div className="edit-avatar">
                        <img src={profile.avatar} alt="" />
                        <button type="button" className="edit-avatar-btn">
                            ✎
                        </button>
                    </div>
                </div>
            </div>

            <div className="edit-container">
                <div className="edit-main">
                    <div className="edit-card">
                        <div className="edit-header">
                            <h2>{profile.name}</h2>
                            <p>@{profile.username}</p>
                        </div>

                        <div className="edit-body">
                            <label>DISPLAY NAME</label>
                            <input
                                type="text"
                                name="displayName"
                                value={form.displayName}
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
                                    value={form.color || "#B26E6E"}
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
                                    />

                                    <div
                                        className="color-preview"
                                        style={{ background: form.color || "#B26E6E" }}
                                    ></div>
                                </div>

                                <div className="color-row">
                                    {presetColors.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            className={`color-box ${form.color?.toUpperCase() === c ? "active" : ""}`}
                                            style={{ background: c }}
                                            onClick={() => handleColor(c)}
                                            aria-label={c}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="button" className="save-btn" onClick={handleSubmit}>
                        Save Change
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
                            <button type="button" className="outline-btn">
                                Add animated banner
                            </button>
                        </div>

                        <div className="side-group">
                            <label>PROFILE ANIMATED AVATAR</label>
                            <button type="button" className="outline-btn">
                                Add animated avatar
                            </button>
                        </div>

                        <div className="side-group">
                            <label>AVATAR DECORATION</label>
                            <button type="button" className="outline-btn">
                                Change Decoration
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}