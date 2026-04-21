import { createBrowserRouter } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Agents } from "./pages/Agents";
import { Analytics } from "./pages/Analytics";
import { Conversations } from "./pages/Conversations";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { AuthCallback } from "./pages/AuthCallback";
import { ViewMembers } from "./pages/ViewMembers";
import { AddMember } from "./pages/AddMember";
import { MemberDetails } from "./pages/MemberDetails";

export const router = createBrowserRouter([
  // Public landing page
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/auth/callback",
    Component: AuthCallback,
  },
  // Protected app routes under /dashboard
  {
    path: "/dashboard",
    Component: MainLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "agents", Component: Agents },
      { path: "analytics", Component: Analytics },
      { path: "conversations", Component: Conversations },
      { path: "settings", Component: Settings },
      { path: "members", Component: ViewMembers },
      { path: "members/add", Component: AddMember },
      { path: "members/:id", Component: MemberDetails },
    ],
  },
]);
