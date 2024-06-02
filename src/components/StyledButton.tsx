import Button, { ButtonProps } from "@mui/material/Button";
import { styled } from "@mui/material/styles";

const StyledButton = styled(Button)<ButtonProps>(() => ({
  backgroundColor: "black",
  borderRadius: "10px",
  "&:hover": {
    backgroundColor: "#333",
  },
  textTransform: "none",
}));

export default StyledButton;
