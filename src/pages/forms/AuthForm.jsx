import styles from "./AuthForm.module.css";
import { useContext } from "react";
import RegisterForm from "./RegisterForm";
import LoginForm from "./LoginForm";
import { useEffect } from "react";
import ResetForm from "./ResetForm";
import Switcher, { SwitcherContext } from "../Switcher";

function AuthForm({ formType }) {
  const { currentForm, setCurrentForm } = useContext(SwitcherContext);
  const formsNotAcceptingSwitcher = ["reset", "reset_confirm"];
  useEffect(() => {
    setCurrentForm(formType);
  }, []);

  return (
    <div className={styles["login-container"]}>
      {!formsNotAcceptingSwitcher.includes(currentForm) && <Switcher.Switch />}
      {currentForm === "create" && <RegisterForm />}
      {currentForm === "login" && <LoginForm />}
      {formsNotAcceptingSwitcher.includes(currentForm) && <ResetForm />}
      {["create", "login"].includes(currentForm) && (
        <button
          onClick={() => setCurrentForm("reset")}
          className={styles["btn-reset"]}
        >
          Forgot Password?
        </button>
      )}
    </div>
  );
}

function FormSwitcher() {
  const { currentForm, setCurrentForm } = useContext(SwitcherContext);
  return (
    <>
      <div className={styles["form-option"]}>
        <div
          className={[
            styles["option-box"],
            styles["create-box"],
            styles[currentForm === "create" ? "active" : "inactive"],
          ].join(" ")}
          onClick={(e) => setCurrentForm((_) => "create")}
        >
          <h2 className={styles["option-heading"]}>Sign up</h2>
        </div>
        <div
          className={[
            styles["option-box"],
            styles["login-box"],
            styles[currentForm === "login" ? "active" : "inactive"],
          ].join(" ")}
          onClick={(e) => setCurrentForm((_) => "login")}
        >
          <h2 className={styles["option-heading"]}> Login</h2>
        </div>
      </div>
    </>
  );
}
export default AuthForm;
