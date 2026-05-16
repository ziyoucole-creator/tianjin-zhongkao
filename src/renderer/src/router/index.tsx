import { createHashRouter } from 'react-router-dom'
import Home from '../pages/Home'
import AssessmentStart from '../pages/Assessment/Start'
import AssessmentExam from '../pages/Assessment/Exam'
import AssessmentReport from '../pages/Assessment/Report'
import MockExamSetup from '../pages/MockExam/Setup'
import MockExamExam from '../pages/MockExam/Exam'
import MockExamReport from '../pages/MockExam/Report'
import ExercisePage from '../pages/Exercise'
import ErrorBookPage from '../pages/ErrorBook'
import ProgressPage from '../pages/Progress'
import ScraperPage from '../pages/Scraper'
import CurriculumPage from '../pages/Curriculum'
import SettingsPage from '../pages/Settings'
import AppLayout from '../components/Layout/AppLayout'

const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'assessment', element: <AssessmentStart /> },
      { path: 'assessment/exam', element: <AssessmentExam /> },
      { path: 'assessment/report', element: <AssessmentReport /> },
      { path: 'mockexam', element: <MockExamSetup /> },
      { path: 'mockexam/exam', element: <MockExamExam /> },
      { path: 'mockexam/report', element: <MockExamReport /> },
      { path: 'exercise', element: <ExercisePage /> },
      { path: 'errorbook', element: <ErrorBookPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'scraper', element: <ScraperPage /> },
      { path: 'curriculum', element: <CurriculumPage /> },
      { path: 'settings', element: <SettingsPage /> }
    ]
  }
])

export default router
