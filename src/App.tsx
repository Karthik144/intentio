import React, {useState, useEffect} from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import StyledButton from "./components/StyledButton";

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

export default function App() {

  const [totalVisits, setTotalVisits] = useState(0);

  const openSettingsPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
  };

  useEffect(() => {
    // Fetch data from Chrome storage
    chrome.storage.local.get("sites", (data) => {
      const sites = data.sites || {};
      let total = 0;

      // Calculate the total visits
      for (const site in sites) {
        if (sites[site].totalVisits) {
          total += sites[site].totalVisits;
        }
      }

      // Update the state with the total visits
      setTotalVisits(total);
    });
  }, []); 

  return (
    <>
      <Box sx={{ pl: 3, width: 350, height: 200 }}>
        {/* Title & Message */}
        <Stack sx={{ pt: 3 }}>
          <Typography variant="h4">Intentio</Typography>
          <Typography variant="h6" color="grey">
            Focus is about saying no
          </Typography>
        </Stack>

        <Box sx={{ pt: 2, pb: 2 }}>
          <Typography variant="body1">
            You've said no {totalVisits} times so far. Keep going 🚀
          </Typography>
          <StyledButton
            onClick={openSettingsPage}
            variant="contained"
            sx={{ mt: 2 }}
          >
            Settings
          </StyledButton>
        </Box>
      </Box>
    </>
  );
}
