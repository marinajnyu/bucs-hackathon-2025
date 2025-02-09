chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "translate") {
        let transformedText = await sendToBackend(message.text, message.tone);
        sendResponse({ translatedText: transformedText });
    }
    return true;
});

async function sendToBackend(text, tone) {
    const API_URL = "http://localhost:5001/translate";

    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, tone })
    });

    const data = await response.json();
    return data.translatedText;
}
