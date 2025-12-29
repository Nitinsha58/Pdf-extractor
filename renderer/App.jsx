import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/landing"
import QuestionView from "./pages/questionView"
import Concept from "./pages/concept"
import Chapter from "./pages/chapter"
import Classes from "./pages/classes"
import Subject from "./pages/subject"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/view" element={<QuestionView />} />
        <Route path="/concept" element={<Concept />} />
        <Route path="/chapter" element={<Chapter />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/subject" element={<Subject />} />
      </Routes>
    </BrowserRouter>
  );
}
