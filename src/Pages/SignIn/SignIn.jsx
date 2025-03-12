import { useState } from "react";
import { Link } from "react-router-dom";
import Form from "../../Blocks/Form";
import Logotype from "../../Blocks/Logotype";
import PendingButton from "../../Blocks/PendingButton";
import styles from "./SignIn.module.css";

function SignIn() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  };

  return (
    <>
      <div className={styles.SignIn}>
        <div className={styles.Picture}></div>
        <div className={styles.Content}>
          <Logotype theme="kobi" variant="primary-50" />
          <Form theme="kobi" className={styles.Form} disabled={isLoading}>
            <h1>Introduce yourself, please</h1>
            <p>
              Enter your email address, and we will send you a one-time magic
              link to log in. By clicking the link below, you will automatically
              gain access to page with your projects.
            </p>
            <Form.Field>
              <input
                type="mail"
                placeholder="your@mail.com"
                disabled={isLoading}
              />
            </Form.Field>
            <Form.Group>
              <PendingButton
                theme="kobi"
                size="big"
                pending={isLoading}
                onClick={handleLoadingClick}
              >
                Send a magic link
              </PendingButton>
            </Form.Group>
            {!isLoading && (
              <Form.Group>
                New? <Link to="/signup">Create an Account</Link>
              </Form.Group>
            )}
          </Form>
        </div>
      </div>
    </>
  );
}

export default SignIn;
