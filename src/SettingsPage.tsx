import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import SiteTable from "./components/SiteTable";

export default function Settings() {
  return (
    <>
      <Box sx={{ p: 5 }}>
        <Typography variant="h4" sx={{ pb: 3 }}>
          Settings
        </Typography>
        <SiteTable />
      </Box>
    </>
  );
}
