chrome.tabs.onActivated.addListener((tab) => {
    console.log(tab); 

    chrome.tabs.get(tab.tabId, (currentTabData) => {

        // Always says status is loading, pendingUrl is "chrome://newtab/", and title is "New Tab"
        console.log("Current Tab Data:", currentTabData); // Why is this taking a long time to update?
        // Only after a reload does it work 

        if (currentTabData && currentTabData.url) {

            // Retrieve the dictionary of sites from storage 
            chrome.storage.local.get("sites", (data) => {

                if (data.sites) {

                    // Extract all the keys into an array 
                    const savedSites = Object.keys(data.sites); 

                    console.log("SAVED SITES:", savedSites); 

                    // Check if the current tab's url matches any of the saved sites 
                    if (savedSites.includes(currentTabData.url!)){

                        console.log("INSIDE IF STATEMENT"); 

                        chrome.tabs.update(tab.tabId, { url: chrome.runtime.getURL('blocked.html') });

                    }
                }
            })

            
        }
    })
}); 

export {}