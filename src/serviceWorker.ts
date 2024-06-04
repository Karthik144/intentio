interface SiteMetaData {
  message: string;
  time: number; // Total allowed time in minutes 
  blocked: boolean;
  unlocks: number;
  totalVisits: number;
  unlockMsgs?: string[];
  startTime?: number; // Time when the user started the session
  accumulatedTime?: number; // Accumulated time spent on the site in seconds
  pattern?: string; // Regex pattern for the site
}

interface StorageData {
  sites: { [key: string]: SiteMetaData };
}

let timers: { [key: number]: NodeJS.Timeout } = {};
let currentSite: string | "";
let currentExpression: RegExp | null = null;  
let currentMessage: string | "";


// Check if the site is blocked before the user navigates to it 
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  console.log("INSIDE ON BEFFORE NAV"); 
  if (details.frameId === 0 && details.url) {
    console.log("INSIDE BEFORE NAV IF STATEMENT"); 
    findMatchingSite(details.url).then((matchedSite) => {
      console.log("INSIDE FIND MATCHING SITE THEN"); 
      if (matchedSite) {
        console.log("INSIDE MATCH SITE IF STATEMENT"); 
        chrome.storage.local.get("sites", (data) => {
          const siteData = data.sites[matchedSite];
          currentSite = matchedSite;
          currentMessage = siteData.message;
          currentExpression = new RegExp(siteData.pattern || generateRegexPattern(matchedSite));

          if (siteData.blocked) {
            console.log("INSIDE SITE DATA BLOCKED"); 
            updateTotalVisits(matchedSite);
            redirectToBlockedPage(matchedSite, currentMessage, details.tabId);
          }
        });
      }
    });
  }
}, { url: [{ schemes: ["http", "https"] }] });

chrome.webNavigation.onCompleted.addListener((details) => {
  console.log("INSIDE ON COMPLETED"); 
  if (details.frameId === 0 && details.url) {
    console.log("INSIDE ON COMPLETED FIRST IF"); 
    findMatchingSite(details.url).then((matchedSite) => {
      console.log("INSIDE FIND MATCHING SITE THEN"); 
      console.log("MATCHED SITE ON COMPLETE:", matchedSite); 
      if (matchedSite) {
        console.log("INSIDE MATCHED SITE IF"); 
        chrome.storage.local.get("sites", (data) => {
          const siteData = data.sites[matchedSite];
          currentSite = matchedSite;
          currentMessage = siteData.message;
          currentExpression = new RegExp(siteData.pattern || generateRegexPattern(matchedSite));

          if (siteData.blocked) {
            console.log("ON COMPLETED BLOCKED IF STATEMENT"); 
            updateTotalVisits(matchedSite);
            redirectToBlockedPage(matchedSite, currentMessage, details.tabId);
          } else {
            console.log("ON COMPLTED ELSE MAIN")
            const remainingTime = calculateRemainingTime(siteData);
            if (remainingTime <= 0) {
              console.log("INSIDE ON COMPLETED REMAINING TIME LESS THAN OR EQUAL TO 0"); 
              updateBlockedStatus(matchedSite);
              redirectToBlockedPage(matchedSite, currentMessage, details.tabId);
            } else {
              console.log("INSIDE ELSE STATEMENT - CALL START TIMER"); 
              startTimer(matchedSite, details.tabId, remainingTime);
            }
          }
        });
      }
    });
  }
}, { url: [{ schemes: ["http", "https"] }] });

chrome.tabs.onActivated.addListener(activeInfo => {
  console.log("INSIDE ON ACTIVATED");

  if (activeInfo.tabId) {
    chrome.tabs.get(activeInfo.tabId, tab => {
      if (tab && tab.url) {
        findMatchingSite(tab.url).then((matchedSite) => {
          if (matchedSite) {
            chrome.storage.local.get("sites", (data) => {
              const siteData = data.sites[matchedSite];
              currentSite = matchedSite;
              currentMessage = siteData.message;
              currentExpression = new RegExp(siteData.pattern || generateRegexPattern(matchedSite));
              
              console.log("URL INSIDE ACTIVATED:", tab.url);
              console.log("PATTERN INSIDE ON ACTIVATED:", currentExpression);

              if (siteData.blocked) {
                // If the site is blocked, redirect the user
                redirectToBlockedPage(matchedSite, currentMessage, activeInfo.tabId);
              } else {
                // Start or restart the timer for the site
                startTimer(matchedSite, activeInfo.tabId, calculateRemainingTime(siteData));
              }
            });
          } else {
            // User has switched away from time-bound site
            // Stop the timer and update accumulated time
            if (timers[activeInfo.tabId]) {
              currentSite = '';
              currentExpression = null;
              currentMessage = '';
              clearTimeout(timers[activeInfo.tabId]);
              updateAccumulatedTime(activeInfo.tabId);
              delete timers[activeInfo.tabId];
            }
          }
        });
      }
    });
  }
});


chrome.tabs.onRemoved.addListener((tabId) => {
  console.log("INSIDE ON REMOVED"); 
  if (timers[tabId]) {
    console.log("INSIDE ON REMOVED IF STATEMENT"); 
    currentSite = ''; 
    currentExpression = null;
    currentMessage = ''; 
    clearTimeout(timers[tabId]);
    updateAccumulatedTime(tabId);
    delete timers[tabId];
  }
});

function calculateRemainingTime(siteData: SiteMetaData): number {
  console.log("INSIDE ")
  console.log("SITE DATA:", siteData); 
  const accumulatedTime = siteData.accumulatedTime || 0;
  return siteData.time - accumulatedTime;
}

function startTimer(site: string, tabId: number, timeLimit: number) {
  console.log("INSIDE START TIMER METHOD"); 

  if (timers[tabId]) {
    clearTimeout(timers[tabId]);
  }

  chrome.storage.local.get("sites", (data) => {
    const sites = data.sites || {};
    const siteData = sites[site] || {};
    siteData.startTime = Date.now();
    chrome.storage.local.set({ sites });
  });

  // If time limit (converted to millseconds) reached, update the status and redirect the user 
  timers[tabId] = setTimeout(() => {
    handleTimeLimitReached(site, currentMessage, tabId);
  }, timeLimit * 1000);
}

function generateRegexPattern(site: string): string {
  // Escape special characters for regex
  const escapedSite = site.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  return `^${escapedSite}.*$`;
}

function handleTimeLimitReached(site: string, message: string, tabId: number) {
  console.log("HANDLE TIME LIMIT REACHED"); 
  console.log("TIMERS:", timers[tabId]); 
  
  if (timers[tabId]) {
    updateBlockedStatus(site);
    redirectToBlockedPage(site, message, tabId);
  }
}

function redirectToBlockedPage(site: string, message: string, tabId: number) {
  console.log("REDIRECT TO BLOCKED PAGE CALLED"); 
  const urlAndMessage = { url: site, message: message };
  chrome.storage.local.set({ blockedSite: urlAndMessage }, () => {
    chrome.tabs.update(tabId, {
      url: chrome.runtime.getURL("blocked.html"),
    });
  });
}

function updateTotalVisits(site: string) {
  console.log("UPDATE TOTAL VISITS CALLED ON:", site); 
  chrome.storage.local.get("sites", (data) => {
    const sites = data.sites || {};
    if (sites[site]) {
      sites[site].totalVisits = (sites[site].totalVisits || 0) + 1;
      chrome.storage.local.set({ sites });
    }
  });
}

function addRegexPattern(site: string): string {
  const pattern = generateRegexPattern(site); 

  chrome.storage.local.get("sites", (data) => {
    const sites = data.sites || {};
    if (!sites[site].pattern) {
      sites[site].pattern = pattern; 
      chrome.storage.local.set({ sites });
    }
  });
  
  return pattern;
}


async function findMatchingSite(url: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("sites", (data) => {
      const sites = data.sites || {};
      console.log("SITES IN FIND MATCHING SITE:", sites);

      // Check if the sites object has properties
      const siteKeys = Object.keys(sites);
      console.log("SITE KEYS:", siteKeys);
      if (siteKeys.length === 0) {
        console.log("No sites found in storage.");
        resolve(null);
        return;
      }

      // Iterate through the site keys array
      for (const site of siteKeys) {

        if (!site) {
          continue;
        }

        const siteData = sites[site];
        const pattern = new RegExp(siteData.pattern || generateRegexPattern(site));

        if (pattern.test(url)) {
          resolve(site);
          return;
        }
      }

      resolve(null);
    });
  });
}
function updateBlockedStatus(site: string) {
  console.log("UPDATE BLOCKED STATUS CALLED ON:", site); 
  chrome.storage.local.get("sites", (data) => {
    const sites = data.sites || {};
    if (sites[site]) {
      sites[site].blocked = true;
      chrome.storage.local.set({ sites });
    }
  });
}

function updateAccumulatedTime(tabId: number) {
  console.log("UPDATE ACCUMULATED TIME"); 
  chrome.storage.local.get("sites", (data) => {
    if (currentSite && data.sites[currentSite]) {
      const siteData = data.sites[currentSite];
      const now = Date.now();
      const elapsedTime = siteData.startTime ? (now - siteData.startTime) / 1000 : 0;
      console.log("ELAPSED TIMES:", elapsedTime); 
      siteData.accumulatedTime = (siteData.accumulatedTime || 0) + elapsedTime;
      chrome.storage.local.set({ sites: data.sites });
    }
  });
}

export {};
