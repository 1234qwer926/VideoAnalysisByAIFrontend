import { Navigate, useRoutes } from "react-router-dom"

import ProtectedRoute from "@/components/common/ProtectedRoute"

import AdminLayout from "@/layouts/AdminLayout"
import CandidateLayout from "@/layouts/CandidateLayout"

import AdminLogin from "@/pages/admin/AdminLogin"
import AdminForgotPassword from "@/pages/admin/AdminForgotPassword"
import AdminResetPassword from "@/pages/admin/AdminResetPassword"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import FormsList from "@/pages/admin/FormsList"
import FormBuilder from "@/pages/admin/FormBuilder"
import AssignmentList from "@/pages/admin/AssignmentList"
import AssignmentCreate from "@/pages/admin/AssignmentCreate"
import AssignmentUsers from "@/pages/admin/AssignmentUsers"
import ResultsList from "@/pages/admin/ResultsList"
import ResultDetail from "@/pages/admin/ResultDetail"

import CandidateLogin from "@/pages/candidate/CandidateLogin"
import CandidateDashboard from "@/pages/candidate/CandidateDashboard"
import CandidateAssignments from "@/pages/candidate/CandidateAssignments"
import CandidateResults from "@/pages/candidate/CandidateResults"
import ExamPage from "@/pages/candidate/ExamPage"
import ResultPage from "@/pages/candidate/ResultPage"

export default function AppRoutes() {
  const element = useRoutes([
    {
      path: "/",
      element: <Navigate to="/admin/login" replace />,
    },

    {
      path: "/admin/login",
      element: <AdminLogin />,
    },

    {
      path: "/admin/forgot-password",
      element: <AdminForgotPassword />,
    },

    {
      path: "/admin/reset-password",
      element: <AdminResetPassword />,
    },

    {
      path: "/candidate/login",
      element: <CandidateLogin />,
    },

    {
      path: "/admin",
      element: (
        <ProtectedRoute allowedRole="admin">
          <AdminLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="/admin/dashboard" replace />,
        },
        {
          path: "dashboard",
          element: <AdminDashboard />,
        },
        {
          path: "forms",
          element: <FormsList />,
        },
        {
          path: "forms/create",
          element: <FormBuilder />,
        },
        {
          path: "forms/:formId/edit",
          element: <FormBuilder />,
        },
        {
          path: "assignments",
          element: <AssignmentList />,
        },
        {
          path: "assignments/create",
          element: <AssignmentCreate />,
        },
        {
          path: "assignments/:assignmentId/edit",
          element: <AssignmentCreate />,
        },
        {
          path: "assignments/:assignmentId/users",
          element: <AssignmentUsers />,
        },
        {
          path: "results",
          element: <ResultsList />,
        },
        {
          path: "results/:resultId",
          element: <ResultDetail />,
        },
      ],
    },

    {
      path: "/candidate",
      element: (
        <ProtectedRoute allowedRole="candidate">
          <CandidateLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="/candidate/dashboard" replace />,
        },
        {
          path: "dashboard",
          element: <CandidateDashboard />,
        },
        {
          path: "assignments",
          element: <CandidateAssignments />,
        },
        {
          path: "results",
          element: <CandidateResults />,
        },
        {
          path: "exam/:token",
          element: <ExamPage />,
        },
        {
          path: "result/:resultId",
          element: <ResultPage />,
        },
      ],
    },

    {
      path: "*",
      element: <Navigate to="/admin/login" replace />,
    },
  ])

  return element
}
