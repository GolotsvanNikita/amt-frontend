function getToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt") ||
        ""
    );
}

export async function saveWatchProgress(payload) {
    const token = getToken();

    if (!token) {
        console.warn("SAVE HISTORY SKIPPED: no token");
        return;
    }

    const fixedPayload = {
        videoId: payload.videoId,
        title: payload.title || "",
        thumbnailUrl: payload.thumbnailUrl || "",
        channelName: payload.channelName || "",
        durationSeconds: Math.floor(Number(payload.durationSeconds || 0)),
        lastPositionSeconds: Math.floor(Number(payload.lastPositionSeconds || 0)),
    };

    console.log("SAVE HISTORY PAYLOAD:", fixedPayload);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/history/progress`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fixedPayload),
    });

    const text = await response.text();

    console.log("SAVE HISTORY RESPONSE:", {
        status: response.status,
        body: text,
    });

    if (!response.ok) {
        console.error("SAVE HISTORY FAILED:", {
            status: response.status,
            body: text,
            payload: fixedPayload,
        });

        return null;
    }

    return text ? JSON.parse(text) : null;
}