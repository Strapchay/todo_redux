import { cloneElement, createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { HiXMark } from "react-icons/hi2";
import { useOutsideClick } from "./hooks/useOutsideClick";

const ModalContext = createContext();

function Modal({ children }) {
  const [openName, setOpenName] = useState("");
  const close = () => {
    setOpenName("");
  };
  const open = setOpenName;
  return (
    <ModalContext.Provider
      value={{
        open,
        close,
        openName,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

function Overlay({ children }) {
  return (
    <div className="fixed w-full bg-transparent top-0 z-50 h-[100vh] left-0 backdrop-blur">
      {children}
    </div>
  );
}

function StyledModal({ children, refObj }) {
  return (
    <div
      ref={refObj}
      className="pointer-events-none origin fixed left-[50%] top-[50%] max-h-[90vh] min-h-[70vh] w-[70%] translate-x-[-50%] translate-y-[-50%] transform overflow-y-auto px-4 py-[1rem]  transition-all"
    >
      {children}
    </div>
  );
}

function ModalCloseButton({ close }) {
  return (
    <button
      onClick={close}
      className="absolute right-7 top-0 translate-y-[-10px] translate-x-8 rounded border-none bg-none p-2 transition-all hover:bg-slate-50"
    >
      <HiXMark size={30} />
    </button>
  );
}

function Open({ children, opens: opensWindowName, click = true }) {
  const { open } = useContext(ModalContext);
  if (click)
    return cloneElement(children, { onClick: () => open(opensWindowName) });
  if (!click) open(opensWindowName);
}

function Window({ children, name }) {
  const { openName, close } = useContext(ModalContext);
  const ref = useOutsideClick(close);
  if (name != openName) return null;
  return createPortal(
    <Overlay>
      <StyledModal refObj={ref}>
        {/* <ModalCloseButton close={close} /> */}
        <div className="flex items-center justify-center">
          {cloneElement(children, { onCloseModal: close })}
        </div>
      </StyledModal>
    </Overlay>,
    document.body,
  );
}

Modal.Open = Open;
Modal.Window = Window;

export default Modal;
