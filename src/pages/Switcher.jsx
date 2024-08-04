import { createContext, useContext, useState } from "react";
import styles from "./forms/AuthForm.module.css";
import TodoStyles from "./Todo.module.css";

export const SwitcherContext = createContext();

function Switcher({ children, propValues }) {
  const [currentForm, setCurrentForm] = useState("");
  const [formProps, setFormProps] = useState(propValues ?? []);
  return (
    <SwitcherContext.Provider
      value={{ currentForm, setCurrentForm, formProps, setFormProps }}
    >
      {children}
    </SwitcherContext.Provider>
  );
}

function Switch() {
  const { currentForm, setCurrentForm, formProps } =
    useContext(SwitcherContext);

  return (
    <>
      <div
        className={[
          styles["form-option"],
          styles["update-form-option"] ?? TodoStyles["update-form-option"],
        ].join(" ")}
      >
        {formProps.map((prop) => (
          <div
            key={prop.form}
            className={[
              styles["option-box"],
              styles[`${prop.form}-box`] ?? TodoStyles[`${prop.form}-box`],
              styles[`info-update-option-box`] ??
                TodoStyles[`info-update-option-box`],
              styles[currentForm === prop.form ? "active" : "inactive"],
            ].join(" ")}
            onClick={(e) => setCurrentForm((_) => prop.form)}
          >
            <h2
              className={[
                styles[`${prop.form}-heading`] ??
                  TodoStyles[`${prop.form}-heading`],
                styles["option-heading"],
              ].join(" ")}
            >
              {prop.text}
            </h2>
          </div>
        ))}
      </div>
    </>
  );
}

Switcher.Switch = Switch;

export default Switcher;
