import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/landing"
import QuestionView from "./pages/questionView"
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/view" element={<QuestionView />} />
      </Routes>
    </BrowserRouter>
  );
}
