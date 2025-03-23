import { useState } from "react";
import { Link } from "react-router-dom";
import Form from "../../Blocks/Form";
import Logotype from "../../Blocks/Logotype";
import PendingButton from "../../Blocks/PendingButton";
import styles from "./SignUp.module.css";

function SignUp() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  };

  return (
    <>
      <div className={styles.SignUp}>
        <div className={styles.Picture}></div>
        <div className={styles.Content}>
          <Logotype theme="sage" variant="primary-50" />
          <Form className={styles.Form} theme="sage">
            <h1>How can we introduce you?</h1>
            <p>
              Enter your email address and username and we'll send you a
              one-time magic link. By clicking the link below, you will
              automatically link your data to your email.
            </p>
            <Form.Field>
              <input
                type="text"
                placeholder="your@mail.com"
                disabled={isLoading}
              />
            </Form.Field>
            <Form.Field>
              <input type="text" placeholder="username" disabled={isLoading} />
            </Form.Field>
            <Form.Group>
              <PendingButton
                theme="sage"
                mod="big"
                pending={isLoading}
                onClick={handleLoadingClick}
              >
                Link email with Globbb
              </PendingButton>
            </Form.Group>
            {!isLoading && (
              <Form.Group>
                Already have an account? <Link to="/signin">Log In</Link>
              </Form.Group>
            )}
          </Form>
        </div>
      </div>
    </>
  );
}

export default SignUp;
