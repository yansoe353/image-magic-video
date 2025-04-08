
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import Index from './pages/Index.tsx';
import History from './pages/History.tsx';
import NotFound from './pages/NotFound.tsx';
import Home from './pages/Home.tsx';
import Examples from './pages/Examples.tsx';
import UserGallery from './pages/UserGallery.tsx';
import BuyAccount from './pages/BuyAccount.tsx';
import FAQ from './pages/FAQ.tsx';
import OfflinePayment from './pages/OfflinePayment.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "create",
        element: <Index />,
      },
      {
        path: "history",
        element: <History />,
      },
      {
        path: "examples",
        element: <Examples />,
      },
      {
        path: "gallery",
        element: <UserGallery />,
      },
      {
        path: "buy-account",
        element: <BuyAccount />,
      },
      {
        path: "buy-credits",
        element: <OfflinePayment />,
      },
      {
        path: "faq",
        element: <FAQ />,
      }
    ]
  },
]);

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Failed to find the root element");
} else {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}
