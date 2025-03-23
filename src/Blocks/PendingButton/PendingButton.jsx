import Button from "../Button";
import { primary } from "../Buttons/Buttons.module.css";
import Preloader from "../Preloader";

const PendingButton = ({ pending, onClick, children, ...props }) => (
  <button className={primary} disabled={pending} onClick={onClick} {...props}>
    {pending && (
      <Preloader theme={props.theme} variant="dark-50" width="40" height="20" />
    )}
    {pending ? "Processing..." : children}
  </button>
  //   <Button disabled={pending} onClick={onClick} {...props}>
  //   {pending && (
  //     <Preloader theme={props.theme} variant="dark-50" width="40" height="20" />
  //   )}
  //   {pending ? "Processing..." : children}
  // </Button>
);

export default PendingButton;
