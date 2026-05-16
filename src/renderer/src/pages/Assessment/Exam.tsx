import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { useAssessmentStore } from '../../stores/useAssessmentStore'
import { useAppStore } from '../../stores/useAppStore'
import QuestionExam from '../../components/Exam/QuestionExam'

export default function AssessmentExam() {
  const navigate = useNavigate()
  const subjects = useAppStore((s) => s.subjects)

  const selectedSubjectIds = useAssessmentStore((s) => s.selectedSubjectIds)
  const questions = useAssessmentStore((s) => s.questions)
  const currentSubjectIndex = useAssessmentStore((s) => s.currentSubjectIndex)
  const currentQuestionIndex = useAssessmentStore((s) => s.currentQuestionIndex)
  const answers = useAssessmentStore((s) => s.answers)
  const startTime = useAssessmentStore((s) => s.startTime)
  const flaggedQuestions = useAssessmentStore((s) => s.flaggedQuestions)
  const submitAnswer = useAssessmentStore((s) => s.submitAnswer)
  const goToNext = useAssessmentStore((s) => s.goToNext)
  const goToPrev = useAssessmentStore((s) => s.goToPrev)
  const goToQuestion = useAssessmentStore((s) => s.goToQuestion)
  const toggleFlag = useAssessmentStore((s) => s.toggleFlag)
  const finishAssessment = useAssessmentStore((s) => s.finishAssessment)

  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startTime) return
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime])

  const elapsedStr = useMemo(() => {
    const m = Math.floor(elapsed / 60)
    const s = elapsed % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [elapsed])

  const subjectNames: Record<number, string> = {}
  for (const s of subjects) {
    subjectNames[s.id] = s.name
  }

  const handleSubmitAnswer = async (questionId: number, answer: string) => {
    await submitAnswer(questionId, answer)
  }

  const handleFinish = async () => {
    try {
      await finishAssessment()
      navigate('/assessment/report')
    } catch (err) {
      message.error('生成报告失败')
    }
  }

  return (
    <QuestionExam
      subjectNames={subjectNames}
      selectedSubjectIds={selectedSubjectIds}
      questions={questions}
      answers={answers}
      flaggedQuestions={flaggedQuestions}
      currentSubjectIndex={currentSubjectIndex}
      currentQuestionIndex={currentQuestionIndex}
      timerDisplay={elapsedStr}
      timerColor="#1677ff"
      timerWarning={false}
      showTimer
      onSubmitAnswer={handleSubmitAnswer}
      onGoNext={goToNext}
      onGoPrev={goToPrev}
      onGoToQuestion={goToQuestion}
      onToggleFlag={toggleFlag}
      onFinish={handleFinish}
      showImmediateFeedback
      emptyMessage="没有找到题目"
      emptyActionLabel="返回评估设置"
      emptyActionPath="/assessment"
      onNavigate={navigate}
    />
  )
}
