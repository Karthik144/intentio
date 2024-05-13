import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Stack from '@mui/material/Stack';
import StyledButton from './StyledButton'; 
import TextField from '@mui/material/TextField';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: 4, 
  boxShadow: 24,
  p: 4,
};

interface AddSiteModalProps {
    open: boolean;
    onClose: () => void;
}

  
export default function AddSiteModal({ open, onClose }: AddSiteModalProps) {


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
            <Stack spacing={2} sx={{pt: 2, pb: 2}}>
                <TextField id="outlined-basic" label="URL" variant="outlined" />
                <TextField
                    id="outlined-multiline-flexible"
                    label="Message"
                    multiline
                    maxRows={4}
                />          
            </Stack>

            <StyledButton variant="contained" sx={{ mt: 2 }}>Save</StyledButton>
        </Box>
      </Modal>
    </div>
  );
}
