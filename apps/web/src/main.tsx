import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ThemeUIProvider } from "theme-ui";
import App from "./App";
import { store } from "./store";
import { theme } from "./theme";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeUIProvider theme={theme}>
        <App />
      </ThemeUIProvider>
    </Provider>
  </StrictMode>,
);
