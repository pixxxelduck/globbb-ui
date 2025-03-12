import Button from "../Button";
import Preloader from "../Preloader";

const PendingButton = ({ pending, onClick, children, ...props }) => (
  <Button disabled={pending} onClick={onClick} {...props}>
    {pending && (
      <Preloader theme={props.theme} variant="dark-50" width="40" height="25" />
    )}
    {pending ? "Processing..." : children}
  </Button>
);

export default PendingButton;
