interface SiteMetaData {
  message: string;
  time: number; // Total allowed time in seconds 
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
let currentSite: string = "";
let currentExpression: RegExp | null = null;
let currentMessage: string = "";


chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  console.log("Inside onBeforeNavigate");

  if (details.frameId === 0 && details.url) {
    console.log("Navigating to:", details.url);
    const matchedSite = await findMatchingSite(details.url);
    if (matchedSite) {
      console.log("Matched site:", matchedSite);
      chrome.storage.local.get("sites", async (data) => {
        const siteData = data.sites[matchedSite];
        setGlobalVars(matchedSite, siteData.message); 
        currentExpression = new RegExp(siteData.pattern || generateRegexPattern(matchedSite));

        const today = new Date();
        const startTime = siteData.startTime || 0;

        if (!isSameDate(startTime, today) && siteData.blocked) {
          console.log("Not the same date, unblocking site");
          await updateBlockedStatus(matchedSite, false);
        } else if (siteData.blocked) {
          console.log("Site is blocked, redirecting to blocked page");
          updateTotalVisits(matchedSite);
          redirectToBlockedPage(matchedSite, currentMessage, details.tabId);
        }
      });
    }
  }
}, { url: [{ schemes: ["http", "https"] }] });

chrome.webNavigation.onCompleted.addListener(async (details) => {
  console.log("Inside onCompleted");

  if (details.frameId === 0 && details.url) {
    console.log("Completed navigation to:", details.url);

    const matchedSite = await findMatchingSite(details.url);
    if (matchedSite) {
      console.log("Matched site:", matchedSite);
      chrome.storage.local.get("sites", async (data) => {
        const siteData = data.sites[matchedSite];
        setGlobalVars(matchedSite, siteData.message); 
        currentExpression = new RegExp(siteData.pattern || generateRegexPattern(matchedSite));

        const today = new Date();
        const startTime = siteData.startTime || 0;

        if (!isSameDate(startTime, today) && siteData.blocked) {
          console.log("Not the same date, unblocking site and starting timer");
          await updateBlockedStatus(matchedSite, false);
          await startTimer(matchedSite, details.tabId, calculateRemainingTime(siteData));
        } else if (siteData.blocked) {
          console.log("Site is blocked, redirecting to blocked page");
          updateTotalVisits(matchedSite);
          redirectToBlockedPage(matchedSite, currentMessage, details.tabId);
        } else {
          console.log("Site is not blocked, starting timer");
          const remainingTime = calculateRemainingTime(siteData);
          if (remainingTime <= 0) {
            console.log("Remaining time <= 0, blocking site");
            await updateBlockedStatus(matchedSite, true);
            redirectToBlockedPage(matchedSite, currentMessage, details.tabId);
          } else {
            await startTimer(matchedSite, details.tabId, remainingTime);
          }
        }
      });
    }
  }
}, { url: [{ schemes: ["http", "https"] }] });

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log("Inside onActivated");

  if (activeInfo.tabId) {
    chrome.tabs.get(activeInfo.tabId, async (tab) => {
      if (tab && tab.url) {

        const matchedSite = await findMatchingSite(tab.url);

        if (matchedSite) {
          chrome.storage.local.get("sites", async (data) => {
            const siteData = data.sites[matchedSite];
            currentSite = matchedSite;
            currentMessage = siteData.message;
            currentExpression = new RegExp(siteData.pattern || generateRegexPattern(matchedSite));

            console.log("Activated URL:", tab.url);
            console.log("Activated pattern:", currentExpression);

            const today = new Date();
            const startTime = siteData.startTime || 0;
            console.log("Start time:", startTime);

            if (!isSameDate(startTime, today) && siteData.blocked) {
              console.log("Not the same date, unblocking site and starting timer");
              await updateBlockedStatus(matchedSite, false);
              await startTimer(matchedSite, activeInfo.tabId, calculateRemainingTime(siteData));
            } else if (siteData.blocked) {
              redirectToBlockedPage(matchedSite, currentMessage, activeInfo.tabId);
            } else {
              await startTimer(matchedSite, activeInfo.tabId, calculateRemainingTime(siteData));
            }
          });
        } else {
              // User has switched away from time-bound site
              // Stop the timer and update accumulated time
              cleanUp(activeInfo.tabId); 
        }
      }
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  console.log("Inside onRemoved");
  cleanUp(tabId); 
});

function calculateRemainingTime(siteData: SiteMetaData): number {
  const accumulatedTime = siteData.accumulatedTime || 0;
  return siteData.time - accumulatedTime;
}

async function startTimer(site: string, tabId: number, timeLimit: number) {
  console.log("Starting timer for:", site);

  if (timers[tabId]) {
    clearTimeout(timers[tabId]);
  }

  chrome.storage.local.get("sites", (data) => {
    const sites = data.sites || {};
    const siteData = sites[site] || {};
    siteData.startTime = Date.now();
    chrome.storage.local.set({ sites });
  });

  timers[tabId] = setTimeout(async () => {
    await handleTimeLimitReached(site, currentMessage, tabId);
  }, timeLimit * 1000);
}

function generateRegexPattern(site: string): string {
  const escapedSite = site.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  return `^${escapedSite}.*$`;
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

async function handleTimeLimitReached(site: string, message: string, tabId: number) {
  console.log("Time limit reached for:", site);

  if (timers[tabId]) {
    await updateBlockedStatus(site, true);
    redirectToBlockedPage(site, message, tabId);
  }
}

function redirectToBlockedPage(site: string, message: string, tabId: number) {
  console.log("Redirecting to blocked page for:", site);
  const urlAndMessage = { url: site, message: message };
  chrome.storage.local.set({ blockedSite: urlAndMessage }, () => {
    chrome.tabs.update(tabId, {
      url: chrome.runtime.getURL("blocked.html"),
    });
  });
}

function updateTotalVisits(site: string) {
  console.log("Updating total visits for:", site);

  chrome.storage.local.get("sites", (data) => {
    const sites = data.sites || {};
    if (sites[site]) {
      sites[site].totalVisits = (sites[site].totalVisits || 0) + 1;
      chrome.storage.local.set({ sites });
    }
  });
}

function isSameDate(timestamp: number, date: Date): boolean {
  const givenDate = new Date(timestamp);
  return (
    givenDate.getFullYear() === date.getFullYear() &&
    givenDate.getMonth() === date.getMonth() &&
    givenDate.getDate() === date.getDate()
  );
}

async function findMatchingSite(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get("sites", (data) => {
      const sites = data.sites || {};
      const siteKeys = Object.keys(sites);

      if (siteKeys.length === 0) {
        console.log("No sites found in storage.");
        resolve(null);
        return;
      }

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

async function updateBlockedStatus(site: string, status: boolean) {
  console.log("Updating blocked status for:", site);
  const data = await getLocalStorageData("sites");
  const sites = data.sites || {};
  if (sites[site]) {
    sites[site].blocked = status;
    await setLocalStorageData({ sites });
  }
}

function getLocalStorageData(key: string): Promise<any> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (data) => {
      resolve(data);
    });
  });
}

function setLocalStorageData(data: any): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
}

function setGlobalVars(site: string, message: string){
  currentSite = site;
  currentMessage = message;
}

function cleanUp(tabId: number){
  if (timers[tabId]) {
    setGlobalVars('', ''); 
    currentExpression = null;
    clearTimeout(timers[tabId]);
    updateAccumulatedTime(tabId);
    delete timers[tabId];
  }
}

export {}