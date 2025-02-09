chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action == "changeTone") {
    let pageContent = document.body.innerText;
    
    //integrate API later
    let newContent = pageContent.replace(/\bhello\b/g, "hey");
    document.body.innerText = newContent;

    sendResponse({ status: "success" });
  }
});