import { Link } from "react-router-dom";
import Logotype from "../../Blocks/Logotype";
import styles from "./Landing.module.css";
import { primary, secondary } from "../../Blocks/Buttons/Buttons.module.css";

function Landing() {
  return (
    <div className={styles.Landing}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.row}>
            <Logotype />
            <div className={styles.slogan}>
              a project tracking calendar. For people, not for companies.
            </div>
          </div>
          <div className={styles.row}>
            <Link className={secondary} to="/signup">
              Create an Account
            </Link>
            <Link className={primary} to="/signin">
              Log In
            </Link>
            {/* <Button variant="secondary" to="/signup">
              Create an Account
            </Button> */}
            {/* <Button to="/signin">Log In</Button> */}
          </div>
        </div>
        <div className={styles.lead}></div>
        <div className={styles.arrowRed}></div>
        <div className={styles.about}></div>
        <div className={styles.arrowBlue}></div>
        <div className={styles.callToAction}>
          <div className={styles.left}></div>
          <div className={styles.actions}>
            <div className={styles.column}>
              <div className={styles.bigText}>Turn chaos into a game</div>
              <Link className={styles.bigButton} to="/signup" />
            </div>
            <div className={styles.column} style={{ gap: "0.5rem" }}>
              <div className={styles.text}>or</div>
              <Link className={secondary} to="/signin">
                Log In
              </Link>
              <div className={styles.text}>to pick up where you left off</div>
            </div>
          </div>
          <div className={styles.right}></div>
        </div>
        <div className={styles.footer}></div>
      </div>
    </div>
  );
}

export default Landing;
