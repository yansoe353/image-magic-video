
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UserGallery from "./pages/UserGallery";
import Login from "./components/Login";
import History from "./pages/History";
import BuyAccount from "./pages/BuyAccount";
import FAQ from "./pages/FAQ";
import Examples from "./pages/Examples";
import AddUser from "./components/AddUser";
import EditUser from "./components/EditUser";
import UserList from "./components/UserList";
import UserLimits from "./components/UserLimits";
import PurchaseCredits from "./components/PurchaseCredits";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Index />} />
        <Route path="/gallery" element={<UserGallery />} />
        <Route path="/login" element={<Login />} />
        <Route path="/history" element={<History />} />
        <Route path="/account" element={<BuyAccount />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/examples" element={<Examples />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/add-user" element={<AddUser />} />
        <Route path="/edit-user/:userId" element={<EditUser />} />
        <Route path="/user-limits/:userId" element={<UserLimits />} />
        <Route path="/purchase-credits" element={<PurchaseCredits />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
