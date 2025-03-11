import { Link } from "react-router-dom";
import Form from "../../Blocks/Form/Form.module.css";
import Buttons from "../../Blocks/Buttons/Buttons.module.css";
import Logotype from "../../Blocks/Logotype";
import styles from "./SignIn.module.css";

function SignIn() {
  return (
    <>
      <div className={styles.SignIn}>
        <div className={styles.Picture}></div>
        <div className={styles.Content}>
          <Logotype theme="kobi" variant="primary-50" />
          <form className={[Form.Form, styles.Form].join(" ")} theme="kobi">
            <h1>Introduce yourself, please</h1>
            <p>
              Enter your email address, and we will send you a one-time magic
              link to log in. By clicking the link below, you will automatically
              gain access to page with your projects.
            </p>
            <div className={Form.Field}>
              <input type="text" placeholder="your@mail.com" />
            </div>
            <div className={Buttons.Group}>
              <button className={Buttons.BigButton} theme="kobi">
                Send a magic link
              </button>
            </div>
            <p className={Form.Group}>
              New? <Link to="/signup">Create an Account</Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}

export default SignIn;
