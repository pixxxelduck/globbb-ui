import "../../Blocks/Logotype/Logotype.css";
import FormStyles from "../../Blocks/Form/Form.module.css";
import Buttons from "../../Blocks/Buttons/Buttons.module.css";
import styles from "./SignUp.module.css";

function SignUp() {
  return (
    <>
      <div className={styles.SignUp}>
        <div className={styles.Picture}></div>
        <div className={styles.Content}>
          <div className="Logotype"></div>
          <form className={[FormStyles.Form, styles.Form].join(" ")}>
            <h1>How can we introduce you?</h1>
            <p>
              Enter your username and email address and we'll send you a
              one-time magic link. By clicking the link below, you will
              automatically link your data to your email.
            </p>
            <div className={FormStyles.Field}>
              <input type="text" placeholder="username" />
            </div>
            <div className={FormStyles.Field}>
              <input type="text" placeholder="your@mail.com" disabled={true} />
            </div>
            <div className={Buttons.Group}>
              <button className={Buttons.BigButton} theme="sage">
                Link email with Globbb
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default SignUp;
