import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import StyledButton from "../StyledButton";
import TextField from "@mui/material/TextField";
import Slider from '@mui/material/Slider';
import {
  style,
  Data,
  SiteMetaData,
  StorageData,
  AddSiteModalProps
} from './constants';

export default function AddSiteModal({ open, rowDataLength, handleSetRowData, onClose }: AddSiteModalProps) {

  // STATES 
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [timeLimit, setTimeLimit] = useState(0); 

  // HANDLERS

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleTimeLimitChange = (event: Event, value: number | number[]) => {
    const numericValue = Array.isArray(value) ? value[0] : value; 
    const valueInSeconds = numericValue * 60; 
    console.log("VALUE IN LIMIT CHANGE:", valueInSeconds);
    setTimeLimit(valueInSeconds as number);
  };


  // HELPER FUNCS

  const addNewSite = (siteUrl: string, siteMetaData: SiteMetaData): void => {

    const newSiteRow: Data = {
      id: rowDataLength + 1,
      siteUrl,
      message: siteMetaData.message,
      time: timeLimit, 
      unlocks: siteMetaData.unlocks,
      totalVisits: siteMetaData.totalVisits,
    };

    handleSetRowData(newSiteRow); 

    chrome.storage.local.get("sites", (data: { [siteUrl: string]: any }) => {
      // Retrieve existing sites or initialize as empty object
      const sites = data.sites || {};
      sites[siteUrl] = siteMetaData;
      console.log("Sites:", JSON.stringify(sites));
      chrome.storage.local.set({ sites }, () => {
        // Data has been successfully saved, close the popup
        console.log("Inside set");
        onClose();
      });
    });
  };

  function getBaseURL(url: string): string {
    try {
        const parsedURL = new URL(url);
        return `${parsedURL.protocol}//${parsedURL.hostname}`;
    } catch (e) {
        console.error('Invalid URL', e);
        return "";
    }
  }

  const generateRegexPattern = (site: string): string => {
    // Escape special characters for regex
    const escapedSite = site.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return `^${escapedSite}.*$`;
  };
  return (
    <div>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add new site
          </Typography>
          <Stack spacing={2} sx={{ pt: 2, pb: 2 }}>
            <TextField
              id="outlined-basic"
              label="URL"
              variant="outlined"
              onChange={handleUrlChange}
            />
            <TextField
              id="outlined-multiline-flexible"
              label="Message"
              multiline
              maxRows={4}
              onChange={handleMessageChange}
            />
            <Stack spacing={1}>
              <Typography>Daily Time Limit</Typography>
              <Slider
                aria-label="Daily Time Limit"
                defaultValue={30}
                valueLabelDisplay="auto"
                onChange={handleTimeLimitChange}
                shiftStep={30}
                step={5}
                marks
                min={0}
                max={60}
              />
            </Stack>

          </Stack>

          <StyledButton
            variant="contained"
            onClick={() => {
              const baseURL = getBaseURL(url);
              addNewSite(baseURL, {
                message,
                time: timeLimit,
                blocked: false,
                unlocks: 0,
                totalVisits: 0,
                pattern: generateRegexPattern(baseURL),
              });
            }}
            sx={{ mt: 2 }}
          >
            Save
          </StyledButton>
        </Box>
      </Modal>
    </div>
  );
}
