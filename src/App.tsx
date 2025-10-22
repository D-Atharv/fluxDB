import { Routes, Route, Link } from "react-router-dom";
import TestIndexedDB from "./pages/TestIndexedDB";
import QueryRunner from "./pages/QueryRunner";

export default function App() {
  return (
    <div>
      <nav className="p-4 space-x-4 bg-gray-100">
        <Link to="/">TestIndexedDB</Link>
        <Link to="/queryrunner">QueryRunner</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>

      <Routes>
        <Route path="/" element={<TestIndexedDB />} />
        <Route path="/queryrunner" element={<QueryRunner />} />
        {/*<Route path="/dashboard" element={<Dashboard />} /> */}
        {/* 404 route */}
        <Route path="*" element={<h1>404: Page Not Found</h1>} />
      </Routes>
    </div>
  );
}
