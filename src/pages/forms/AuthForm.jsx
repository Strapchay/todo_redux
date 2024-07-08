import styles from "./AuthForm.module.css";
import { useContext } from "react";
import RegisterForm from "./RegisterForm";
import LoginForm from "./LoginForm";
import { useEffect } from "react";
import { SwitcherContext } from "../Landing";

function AuthForm({ formType }) {
  const { currentForm, setCurrentForm } = useContext(SwitcherContext);

  useEffect(() => {
    setCurrentForm(formType);
  }, []);

  return (
    <div className={styles["login-container"]}>
      <FormSwitcher />
      {currentForm === "create" && <RegisterForm />}
      {currentForm === "login" && <LoginForm />}
      {currentForm === "reset" && <div>Reset Form</div>}
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
