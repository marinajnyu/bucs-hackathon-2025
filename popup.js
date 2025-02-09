document.getElementById("apply-tone").addEventListener("click", function () {
    let selectedTone = document.getElementById("tone-selector").value;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { tone: selectedTone });
    });

    console.log("Sent tone change request:", selectedTone); // Debugging log
});
