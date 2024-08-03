import { createContext, useContext, useState } from "react";
import styles from "./AuthForm.module.css";

const SwitcherContext = createContext();

function SwitcherProvider({ children }) {
  const [currentForm, setCurrentForm] = useState("");
  return (
    <SwitcherContext.Provider value={{ currentForm, setCurrentForm }}>
      {children}
    </SwitcherContext.Provider>
  );
}

function Switcher({ children }) {
  return <SwitcherProvider.Provider>{children}</SwitcherProvider.Provider>;
}

function Switch() {
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

Switcher.Switch = Switch;

export default Switcher;
