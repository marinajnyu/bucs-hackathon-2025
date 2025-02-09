chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchTone") {
      console.log("Background: Received fetchTone request for tone:", request.tone);
      
      // Handle the OpenAI API call in a separate async function
      processWithOpenAI(request, sender)
        .then(modifiedText => {
          sendResponse({ modifiedText });
        })
        .catch(error => {
          console.error("Background: Error processing request:", error);
          sendResponse({ modifiedText: "Error processing request." });
        });
  
      return true; // Keep the message channel open for the async response
    }
    return false;
  });
  
  async function processWithOpenAI(request, sender) {
    const apiKey = "PUT KEY HERE"; 
    const openaiEndpoint = "https://api.openai.com/v1/chat/completions";
  
    try {
      const response = await fetch(openaiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a tone-changing assistant." },
            { role: "user", content: `Rewrite this in a ${request.tone} tone:\n\n${request.text}` }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }
  
      const data = await response.json();
      console.log("Background: OpenAI response:", data);
  
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content.trim();
      } else {
        throw new Error("No valid response from OpenAI");
      }
    } catch (error) {
      console.error("Background: OpenAI API error:", error);
      throw error; // Re-throw to be handled by the caller
    }
  }
  
  // Optional: Handle any cleanup when the extension is installed or updated
  chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed/updated");
  });
  
  // Optional: Handle messages from external sources if needed
  chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    // Handle external messages if your extension needs to
    return false;
  });
