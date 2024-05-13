import React from 'react';
import Typography from '@mui/material/Typography'; 
import Box from '@mui/material/Box'; 
import Stack from '@mui/material/Stack'; 
import StyledButton from './components/StyledButton'; 

export default function App() {

  const openSettingsPage = () => {
    chrome.tabs.create({ 'url': chrome.runtime.getURL('settings.html') });
  };


  return (
    <>
      <Box sx={{ pl: 3, width: 350, height: 200 }}> 

        {/* Title & Message */}
        <Stack sx={{ pt: 3 }}> 
          <Typography variant="h4">Intentio</Typography>
          <Typography variant="h6" color="grey">Focus is about saying no</Typography>
        </Stack>

        <Box sx={{ pt: 2, pb: 2 }}> 
          <Typography variant="body1">You've said no 10 times so far. Keep going 🚀</Typography>
          <StyledButton onClick={openSettingsPage} variant="contained" sx={{ mt: 2 }}>Settings</StyledButton>
        </Box> 
      </Box> 
    </>
  )
}

