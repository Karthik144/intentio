import Button, { ButtonProps } from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const StyledAddButton = styled(Button)<ButtonProps>(() => ({
  backgroundColor: "white",
  width: "350px",
  height: "50px",
  color: "black",
  borderRadius: "10px",
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#f0f0f0", 
  },
}));

interface AddButtonProps {
  onClick: () => void;
}

export default function UnlockButton({ onClick }: AddButtonProps) {
  return (
    <>
      <StyledAddButton onClick={onClick}>
        <Typography variant="h6">Take the easy way out...</Typography>
      </StyledAddButton>
    </>
  );
}
