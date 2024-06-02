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

interface AddSiteModalProps {
  open: boolean;
  onClose: () => void;
}

interface SiteMetaData {
  message: string;
  time: number;
  blocked: boolean;
  unlocks: number;
  totalVisits: number;
  unlockMsgs?: string[];
}

interface StorageData {
  sites: { [key: string]: SiteMetaData };
}

export default function AddSiteModal({ open, onClose }: AddSiteModalProps) {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const addNewSite = (key: string, value: SiteMetaData) => {
    chrome.storage.local.get("sites", (data: { [key: string]: any }) => {
      // Retrieve existing sites or initialize as empty object
      const sites = data.sites || {};
      sites[key] = value;
      console.log("Sites:", JSON.stringify(sites));
      chrome.storage.local.set({ sites }, () => {
        // Data has been successfully saved, close the popup
        console.log("Inside set");
        onClose();
      });
    });
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
          </Stack>

          <StyledButton
            variant="contained"
            onClick={() =>
              addNewSite(url, {
                message,
                time: 2,
                blocked: false,
                unlocks: 0,
                totalVisits: 0,
              })
            }
            sx={{ mt: 2 }}
          >
            Save
          </StyledButton>
        </Box>
      </Modal>
    </div>
  );
}
