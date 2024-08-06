import { useCallback, useContext, useEffect, useState } from "react";
import { AppContext } from "../ProtectedRoute";

export function useScreens() {
  const { mobileScreen, setMobileScreen } = useContext(AppContext);
  const [gridWidthAndColumnWidth, setGridWidthAndColumnWidth] = useState({
    width: 320,
    columnWidth: 160,
    columnCount: 2,
  });

  const updateGridSize = useCallback(() => {
    if (window.matchMedia("(min-width: 1001px").matches) {
      setGridWidthAndColumnWidth({
        width: 320,
        columnWidth: 160,
        columnCount: 2,
      });
    }
    if (
      window.matchMedia("(min-width: 801px) and (max-width: 1000px)").matches
    ) {
      setGridWidthAndColumnWidth((v) => ({
        columnCount: 2,
        width: 250,
        columnWidth: 125,
      }));
    }
    if (window.matchMedia("(max-width: 800px)").matches) {
      setGridWidthAndColumnWidth({
        columnCount: 1,
        width: 155,
        columnWidth: 152,
      });
    }
    if (
      window.matchMedia("(min-width: 466px) and (max-width: 650px)").matches
    ) {
      setGridWidthAndColumnWidth((v) => ({
        ...v,
        width: 195,
        columnWidth: 195,
      }));
      if (mobileScreen.active)
        setMobileScreen((v) => ({ ...v, active: false, default: false }));
    }
    if (window.matchMedia("(max-width: 465px)").matches) {
      setGridWidthAndColumnWidth((v) => ({
        columnCount: 3,
        width: 445,
        columnWidth: 145,
      }));
      if (!mobileScreen.active)
        setMobileScreen((v) => ({ ...v, default: true, active: true }));
    }
    if (window.matchMedia("(max-width: 350px)").matches) {
      setGridWidthAndColumnWidth((v) => ({
        columnCount: 2,
        width: 300,
        columnWidth: 145,
      }));
      if (!mobileScreen.active)
        setMobileScreen((v) => ({ ...v, active: true, default: true }));
    }
  }, [mobileScreen, setMobileScreen]);

  useEffect(() => {
    updateGridSize();
  }, [updateGridSize]);

  useEffect(() => {
    window.addEventListener("resize", updateGridSize);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener("resize", updateGridSize);
    };
  }, [updateGridSize]);

  return { gridWidthAndColumnWidth };
}
