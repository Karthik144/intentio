import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import UnlockButton from "./components/UnlockButton";
import UnlockModal from "./components/UnlockModal"; 

export default function BlockedPage() {

  const [openModal, setOpenModal] = useState(false);
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  useEffect(() => {
    // Apply background color to the body
    document.body.style.backgroundColor = "#5AB2FF";

    // Cleanup function to reset the background color
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#FFFFFF",
        textAlign: "center",
      }}
    >
      <Stack spacing={10} alignItems="center" justifyContent="center">
        <Typography variant="h1">This site has been blocked.</Typography>

        <Typography variant="h4">
          LinkedIn is not for doers. So stop using it!
        </Typography>

        <UnlockButton onClick={handleOpenModal}/>

      </Stack>

      <UnlockModal open={openModal} onClose={handleCloseModal} />
    </div>
  );
}
