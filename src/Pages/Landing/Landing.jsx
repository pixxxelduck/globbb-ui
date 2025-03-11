import { Link } from "react-router-dom";
import "./Landing.css";
import Logotype from "../../Blocks/Logotype";
import Buttons from "../../Blocks/Buttons/Buttons.module.css";

function Landing() {
  return (
    <>
      <div className="Landing">
        <div className="Landing__content">
          <div className="header__container">
            <div className="header">
              <Logotype />
              <div className="slogan">
                a project tracking calendar. For people, not for companies.
              </div>
            </div>
            <div className="buttons">
              <Link className={Buttons.Outline} to="/signup">
                Let's play
              </Link>
              <Link className={Buttons.Button} to="/signin">
                Sign in
              </Link>
            </div>
          </div>
          <div className="Landing__lead"></div>
          <div className="Landing__arrow-red"></div>
          <div className="Landing__about"></div>
          <div className="Landing__arrow-blue"></div>
          <div className="Landing__CTA">
            <div className="CTA__left"></div>
            <div className="CTA__actions">
              <div className="Actions__registration">
                <div className="Actions__slogan">Make Plans Happen</div>
                <Link className="Actions__registrationButton" to="/signup" />
              </div>
              <div className="Actions__login">
                <div className="Actions__text">or</div>
                <Link className={Buttons.Outline} to="/signin">
                  Sign in
                </Link>
                <div className="Actions__text">
                  to load work done previously
                </div>
              </div>
            </div>
            <div className="CTA__right"></div>
          </div>
          <div className="Landing__footer"></div>
        </div>
      </div>
    </>
  );
}

export default Landing;
