import Button, { ButtonProps } from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';

const StyledAddButton = styled(Button)<ButtonProps>(() => ({
    backgroundColor: 'black',
    color: 'white', 
    borderRadius: '10px', 
    '&:hover': {
        backgroundColor: '#333', 
    }, 
    textTransform: 'none',
}));

interface AddButtonProps {
    onClick: () => void;
}

export default function AddButton({ onClick }: AddButtonProps) {
    return (
        <>
                <StyledAddButton onClick={onClick}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>Add</Typography>
                        <AddOutlinedIcon />
                    </Stack>
                </StyledAddButton>

        </>
    ); 
}
