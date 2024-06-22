import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import StyledButton from "./StyledButton";
import TextField from "@mui/material/TextField";

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  borderRadius: 4,
  boxShadow: 24,
  p: 4,
};

interface SiteMetaData {
  message: string;
  time: number; // Total allowed time in seconds 
  blocked: boolean;
  unlocks: number;
  totalVisits: number;
  totalVisitsWhenBlocked: number; 
  unlockMsgs?: string[];
  startTime?: number; // Time when the user started the session
  accumulatedTime?: number; // Accumulated time spent on the site in seconds
  pattern?: string; // Regex pattern for the site
}

interface StorageData {
  sites: { [key: string]: SiteMetaData };
}

interface UnlockModalProps {
  open: boolean;
  onClose: () => void;
  siteUrl: string;
}

export default function UnlockModal({
  open,
  onClose,
  siteUrl,
}: UnlockModalProps) {
  const [message, setMessage] = useState("");

  const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleSaveButtonPressed: React.MouseEventHandler<
    HTMLButtonElement
  > = async (event) => {
    await updateUnlockCount(siteUrl);
    await saveUnlockMsgs(siteUrl);
    await unblockSite(siteUrl); 
    window.location.href = siteUrl;
  };

  function updateUnlockCount(site: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(
        "sites",
        (data: { sites?: { [key: string]: SiteMetaData } }) => {

          const sites = data.sites || {};

          const typedSites = sites as { [key: string]: SiteMetaData };

          if (typedSites[site]) {
            typedSites[site].unlocks += 1;
          }
          // Save the updated sites data back to storage
          chrome.storage.local.set({ sites: typedSites }, () => {
            resolve();
          });
        }
      );
    });
  }

  function saveUnlockMsgs(site: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(
        "sites",
        (data: { sites?: { [key: string]: SiteMetaData } }) => {
          const sites = data.sites || {};

          const typedSites = sites as { [key: string]: SiteMetaData };

          if (typedSites[site]) {
            // If unlockMsgs exists, then just append newest message
            if (typedSites[site]?.unlockMsgs) {
              typedSites[site].unlockMsgs!.push(message);
            } else {
              typedSites[site].unlockMsgs = [message]; // Otherwise, just instantiate the array with the message
            }
          }
          // Save the updated sites data back to storage
          chrome.storage.local.set({ sites: typedSites }, () => {
            resolve();
          });
        }
      );
    });
  }

  function unblockSite(site: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(
        "sites",
        (data: { sites?: { [key: string]: SiteMetaData } }) => {

          const sites = data.sites || {};

          const typedSites = sites as { [key: string]: SiteMetaData };

          if (typedSites[site]) {
            typedSites[site].blocked = false;
          } else {
            // Handle case when the site does not exist
            return reject(new Error(`Site ${site} not found in storage`));
          }

          // Save the updated sites data back to storage
          chrome.storage.local.set({ sites: typedSites }, () => {
            resolve();
          });
        }
      );
    });
  }

  return (
    <div>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h5" component="h2">
            Why are you unlocking this site?
          </Typography>
          <Stack spacing={2} sx={{ pt: 2, pb: 2 }}>
            <TextField
              id="outlined-multiline-flexible"
              label="Point & Call"
              multiline
              rows={4}
              maxRows={4}
              onChange={handleMessageChange}
            />
          </Stack>

          <StyledButton
            variant="contained"
            onClick={handleSaveButtonPressed}
            sx={{ mt: 2 }}
          >
            Save
          </StyledButton>
        </Box>
      </Modal>
    </div>
  );
}
