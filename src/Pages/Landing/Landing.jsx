import "./Landing.css";
import Buttons from "../../Blocks/Buttons/Buttons.module.css";

function Landing() {
  return (
    <>
      <div className="Landing">
        <div className="Landing__content">
          <div className="header__container">
            <div className="header">
              <div className="logotype"></div>
              <div className="slogan">
                a project tracking calendar. For people, not for companies.
              </div>
            </div>
            <div className="buttons">
              <button className={Buttons.Outline}>Let's play</button>
              <button className={Buttons.Button}>Sign in</button>
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
                <div className="Actions__registrationButton"></div>
              </div>
              <div className="Actions__login">
                <div className="Actions__text">or</div>
                <button className={Buttons.Outline}>Sign in</button>
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
