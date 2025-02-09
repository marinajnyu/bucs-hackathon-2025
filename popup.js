document.getElementById("apply-tone").addEventListener("click", function() {
    let selectedTone = document.getElementById("tone-selector").value;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            function: changeTone,
            args: [selectedTone]
        });
    });
});

function changeTone(tone) {
    document.body.innerHTML = document.body.innerHTML.replace(/\bthe\b/g, "DA"); // Example change
}
