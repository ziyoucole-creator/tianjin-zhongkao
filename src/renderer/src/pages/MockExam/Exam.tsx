import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Space, Typography, message } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { useMockExamStore } from '../../stores/useMockExamStore'
import { useAppStore } from '../../stores/useAppStore'
import QuestionExam from '../../components/Exam/QuestionExam'

const { Paragraph } = Typography

export default function MockExamExam() {
  const navigate = useNavigate()
  const subjects = useAppStore((s) => s.subjects)

  const selectedSubjectIds = useMockExamStore((s) => s.selectedSubjectIds)
  const questions = useMockExamStore((s) => s.questions)
  const currentSubjectIndex = useMockExamStore((s) => s.currentSubjectIndex)
  const currentQuestionIndex = useMockExamStore((s) => s.currentQuestionIndex)
  const answers = useMockExamStore((s) => s.answers)
  const timeRemaining = useMockExamStore((s) => s.timeRemaining)
  const flaggedQuestions = useMockExamStore((s) => s.flaggedQuestions)
  const submitAnswer = useMockExamStore((s) => s.submitAnswer)
  const goToNext = useMockExamStore((s) => s.goToNext)
  const goToPrev = useMockExamStore((s) => s.goToPrev)
  const goToQuestion = useMockExamStore((s) => s.goToQuestion)
  const toggleFlag = useMockExamStore((s) => s.toggleFlag)
  const tick = useMockExamStore((s) => s.tick)
  const finishExam = useMockExamStore((s) => s.finishExam)

  const [timeUpModalOpen, setTimeUpModalOpen] = useState(false)

  // Countdown tick
  useEffect(() => {
    const timer = setInterval(() => tick(), 1000)
    return () => clearInterval(timer)
  }, [tick])

  // Auto-submit on time up
  useEffect(() => {
    if (timeRemaining <= 0 && useMockExamStore.getState().step === 'exam') {
      setTimeUpModalOpen(true)
    }
  }, [timeRemaining])

  const timeStr = useMemo(() => {
    const h = Math.floor(Math.max(0, timeRemaining) / 3600)
    const m = Math.floor((Math.max(0, timeRemaining) % 3600) / 60)
    const s = Math.max(0, timeRemaining) % 60
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [timeRemaining])

  const timerColor = timeRemaining < 300 ? '#ff4d4f' : timeRemaining < 900 ? '#faad14' : '#1677ff'

  const subjectNames: Record<number, string> = {}
  for (const s of subjects) {
    subjectNames[s.id] = s.name
  }

  const handleSubmitAnswer = async (questionId: number, answer: string) => {
    await submitAnswer(questionId, answer)
  }

  const doFinish = async () => {
    try {
      await finishExam()
      navigate('/mockexam/report')
    } catch (err) {
      message.error('生成报告失败')
    }
  }

  return (
    <>
      <QuestionExam
        subjectNames={subjectNames}
        selectedSubjectIds={selectedSubjectIds}
        questions={questions}
        answers={answers}
        flaggedQuestions={flaggedQuestions}
        currentSubjectIndex={currentSubjectIndex}
        currentQuestionIndex={currentQuestionIndex}
        timerDisplay={timeStr}
        timerColor={timerColor}
        timerWarning={timeRemaining < 300}
        showTimer
        onSubmitAnswer={handleSubmitAnswer}
        onGoNext={goToNext}
        onGoPrev={goToPrev}
        onGoToQuestion={goToQuestion}
        onToggleFlag={toggleFlag}
        onFinish={doFinish}
        showImmediateFeedback
        emptyMessage="没有找到题目"
        emptyActionLabel="返回设置"
        emptyActionPath="/mockexam"
        onNavigate={navigate}
      />

      {/* Time up modal — specific to mock exam */}
      <Modal
        title={<Space><ClockCircleOutlined style={{ color: '#ff4d4f' }} />考试时间已到</Space>}
        open={timeUpModalOpen}
        onOk={doFinish}
        okText="查看报告"
        closable={false}
        maskClosable={false}
      >
        <Paragraph>模拟考试时间已用完，系统将自动提交你的答案并生成报告。</Paragraph>
      </Modal>
    </>
  )
}
