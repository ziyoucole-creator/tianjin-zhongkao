import { useEffect, useState, useRef, useMemo, type ReactNode } from 'react'
import {
  Card, Button, Typography, Space, Progress, Tag, Row, Col,
  Input, Modal, Result, message, Badge, theme
} from 'antd'
import {
  LeftOutlined, RightOutlined, ClockCircleOutlined,
  CheckOutlined, CloseOutlined, SendOutlined, ExclamationCircleOutlined,
  FlagOutlined, FlagFilled, HourglassOutlined
} from '@ant-design/icons'
import type { Question, AnswerState } from '../../types'

const { Text, Paragraph } = Typography
const { TextArea } = Input

export const SUBJECT_COLORS: Record<number, string> = {
  1: '#f5222d', 2: '#1677ff', 3: '#52c41a', 4: '#722ed1',
  5: '#fa8c16', 6: '#13c2c2', 7: '#eb2f96'
}

export interface ExamConfig {
  subjectNames: Record<number, string>

  // Data
  selectedSubjectIds: number[]
  questions: Record<number, Question[]>
  answers: Record<number, AnswerState>
  flaggedQuestions: Set<number>
  currentSubjectIndex: number
  currentQuestionIndex: number

  // Timer
  timerDisplay: string
  timerColor: string
  timerWarning: boolean
  showTimer: boolean

  // Actions
  onSubmitAnswer: (questionId: number, answer: string) => Promise<void>
  onGoNext: () => void
  onGoPrev: () => void
  onGoToQuestion: (subjectIndex: number, questionIndex: number) => void
  onToggleFlag: (questionId: number) => void
  onFinish: () => void

  // Configuration
  showImmediateFeedback: boolean
  emptyMessage?: string
  emptyActionLabel?: string
  emptyActionPath?: string
  onNavigate?: (path: string) => void
}

export default function QuestionExam({
  subjectNames, selectedSubjectIds, questions, answers, flaggedQuestions,
  currentSubjectIndex, currentQuestionIndex,
  timerDisplay, timerColor, timerWarning, showTimer,
  onSubmitAnswer, onGoNext, onGoPrev, onGoToQuestion, onToggleFlag, onFinish,
  showImmediateFeedback, emptyMessage, emptyActionLabel, emptyActionPath, onNavigate
}: ExamConfig) {
  const { token } = theme.useToken()

  const [currentInput, setCurrentInput] = useState('')
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  const currentSubjectId = selectedSubjectIds[currentSubjectIndex]
  const currentQuestions = questions[currentSubjectId] || []
  const currentQuestion = currentQuestions[currentQuestionIndex] as Question | undefined
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined

  useEffect(() => {
    if (currentQuestion) {
      setCurrentInput(currentAnswer?.studentAnswer || '')
      setShowAnalysis(!!currentAnswer)
    }
  }, [currentSubjectIndex, currentQuestionIndex])

  const allQuestions = Object.values(questions).flat()
  const answeredCount = Object.keys(answers).length
  const totalQuestions = allQuestions.length
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  const currentGlobalIndex = useMemo(() => {
    let idx = 0
    for (let i = 0; i < currentSubjectIndex; i++) {
      const sid = selectedSubjectIds[i]
      idx += (questions[sid] || []).length
    }
    idx += currentQuestionIndex + 1
    return idx
  }, [currentSubjectIndex, currentQuestionIndex, selectedSubjectIds, questions])

  const handleSelectOption = async (option: string) => {
    if (!currentQuestion || currentAnswer) return
    setCurrentInput(option)
    setShowAnalysis(showImmediateFeedback)
    await onSubmitAnswer(currentQuestion.id, option)
  }

  const handleSubmitFillBlank = async () => {
    if (!currentQuestion || currentAnswer) return
    if (!currentInput.trim()) { message.warning('请先填写答案'); return }
    setShowAnalysis(showImmediateFeedback)
    await onSubmitAnswer(currentQuestion.id, currentInput.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentQuestion?.type === 'fill_blank' && !currentAnswer) {
      handleSubmitFillBlank()
    }
  }

  const handleFinishClick = () => {
    const unanswered = totalQuestions - answeredCount
    if (unanswered > 0) {
      setConfirmModalOpen(true)
    } else {
      onFinish()
    }
  }

  if (!currentQuestion || selectedSubjectIds.length === 0) {
    return (
      <Result
        status="warning"
        title={emptyMessage || '没有找到题目'}
        extra={emptyActionLabel && onNavigate && emptyActionPath ? (
          <Button onClick={() => onNavigate(emptyActionPath)}>{emptyActionLabel}</Button>
        ) : null}
      />
    )
  }

  const questionTypeLabel = currentQuestion.type === 'single_choice' ? '单选题'
    : currentQuestion.type === 'multiple_choice' ? '多选题' : '填空题'
  const diffLabel = { easy: '基础', medium: '中等', hard: '拔高' }
  const diffColor = { easy: 'green', medium: 'blue', hard: 'red' }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Tag color={SUBJECT_COLORS[currentSubjectId]} style={{ fontSize: 14, padding: '4px 8px' }}>
                {subjectNames[currentSubjectId] || `科目${currentSubjectId}`}
              </Tag>
              <Text type="secondary">第 {currentGlobalIndex}/{totalQuestions} 题</Text>
            </Space>
          </Col>
          <Col>
            <Space size="middle">
              {showTimer && (
                <Text strong style={{
                  fontSize: 22, fontVariantNumeric: 'tabular-nums', color: timerColor
                }}>
                  {timerWarning ? <HourglassOutlined spin /> : <ClockCircleOutlined />} {timerDisplay}
                </Text>
              )}
              <Progress type="circle" percent={progress} size={40}
                strokeColor={progress < 30 ? '#ff4d4f' : progress < 70 ? '#faad14' : '#52c41a'} />
              <Text type="secondary">已答 {answeredCount}/{totalQuestions}</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Subject tabs */}
      <div style={{ marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {selectedSubjectIds.map((sid, idx) => {
          const qs = questions[sid] || []
          const answered = qs.filter((q) => answers[q.id]).length
          return (
            <Tag key={sid} style={{
              cursor: idx <= currentSubjectIndex ? 'pointer' : 'not-allowed',
              padding: '4px 12px', fontSize: 13,
              border: idx === currentSubjectIndex ? `2px solid ${SUBJECT_COLORS[sid] || '#1677ff'}` : '1px solid #d9d9d9',
              opacity: idx > currentSubjectIndex ? 0.5 : 1,
              background: idx === currentSubjectIndex ? `${SUBJECT_COLORS[sid] || '#1677ff'}10` : '#fff'
            }}>
              {subjectNames[sid] || `科目${sid}`} {answered}/{qs.length}
            </Tag>
          )
        })}
      </div>

      <Row gutter={16} style={{ flex: 1 }}>
        {/* Question area */}
        <Col span={17}>
          <Card style={{ minHeight: 400 }}
            title={
              <Space>
                <Tag color={diffColor[currentQuestion.difficulty] || 'blue'}>
                  {diffLabel[currentQuestion.difficulty] || currentQuestion.difficulty}
                </Tag>
                <span style={{ fontSize: 12, color: '#999' }}>{questionTypeLabel}</span>
                {currentQuestion.year && <Tag color="orange">{currentQuestion.year}真题</Tag>}
              </Space>
            }
            extra={
              <Button type="text"
                icon={flaggedQuestions.has(currentQuestion.id) ? <FlagFilled style={{ color: '#faad14' }} /> : <FlagOutlined />}
                onClick={() => onToggleFlag(currentQuestion.id)}>
                {flaggedQuestions.has(currentQuestion.id) ? '已标记' : '标记'}
              </Button>
            }>
            <Paragraph style={{ fontSize: 16, lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 24 }}>
              {currentQuestion.content}
            </Paragraph>

            {currentQuestion.type === 'single_choice' && currentQuestion.options && (
              <div>
                {currentQuestion.options.map((opt, i) => {
                  const optionKey = String.fromCharCode(65 + i)
                  const isSelected = currentAnswer?.studentAnswer === optionKey
                  const isCorrectAnswer = currentAnswer?.correctAnswer === optionKey
                  let bgColor = '#fff'; let borderColor = '#d9d9d9'
                  if (isSelected && currentAnswer?.isCorrect) { bgColor = '#f6ffed'; borderColor = '#52c41a' }
                  else if (isSelected && currentAnswer?.isCorrect === false) { bgColor = '#fff2f0'; borderColor = '#ff4d4f' }
                  else if (showAnalysis && isCorrectAnswer) { bgColor = '#f6ffed'; borderColor = '#52c41a' }
                  return (
                    <div key={i} onClick={() => handleSelectOption(optionKey)}
                      style={{
                        padding: '12px 16px', marginBottom: 10, border: `1px solid ${borderColor}`,
                        borderRadius: token.borderRadius, background: bgColor,
                        cursor: currentAnswer ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 12
                      }}>
                      <Tag style={{ minWidth: 32, textAlign: 'center' }}>{optionKey}</Tag>
                      <span style={{ flex: 1 }}>{opt.substring(3)}</span>
                      {isSelected && currentAnswer?.isCorrect && <CheckOutlined style={{ color: '#52c41a' }} />}
                      {isSelected && currentAnswer?.isCorrect === false && <CloseOutlined style={{ color: '#ff4d4f' }} />}
                      {showAnalysis && isCorrectAnswer && !isSelected && <CheckOutlined style={{ color: '#52c41a' }} />}
                    </div>
                  )
                })}
              </div>
            )}

            {currentQuestion.type === 'fill_blank' && (
              <div>
                <TextArea rows={3} value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="请输入答案..." disabled={!!currentAnswer}
                  style={{ fontSize: 16, marginBottom: 12 }} />
                {!currentAnswer && (
                  <Button type="primary" onClick={handleSubmitFillBlank}>提交答案</Button>
                )}
              </div>
            )}

            {showAnalysis && (
              <Card size="small" style={{
                marginTop: 16, background: currentAnswer?.isCorrect ? '#f6ffed' : '#fff2f0',
                border: `1px solid ${currentAnswer?.isCorrect ? '#b7eb8f' : '#ffa39e'}`
              }}>
                <Text strong style={{ color: currentAnswer?.isCorrect ? '#52c41a' : '#ff4d4f' }}>
                  {currentAnswer?.isCorrect ? <><CheckOutlined /> 回答正确</> : <><CloseOutlined /> 回答错误</>}
                </Text>
                {currentAnswer?.isCorrect === false && (
                  <p>正确答案：<Text strong>{currentAnswer?.correctAnswer}</Text></p>
                )}
                {currentQuestion.analysis && (
                  <Paragraph style={{ color: '#666', marginBottom: 0 }}>{currentQuestion.analysis}</Paragraph>
                )}
              </Card>
            )}
          </Card>
        </Col>

        {/* Answer sheet */}
        <Col span={7}>
          <Card title="答题卡" size="small">
            {selectedSubjectIds.map((sid, sIdx) => {
              const qs = questions[sid] || []
              return (
                <div key={sid} style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 12, color: SUBJECT_COLORS[sid] }}>
                    {subjectNames[sid]}
                  </Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {qs.map((q, qIdx) => {
                      const ans = answers[q.id]
                      const isCurrent = sIdx === currentSubjectIndex && qIdx === currentQuestionIndex
                      const isFlagged = flaggedQuestions.has(q.id)
                      const canNavigate = sIdx <= currentSubjectIndex
                      return (
                        <Badge key={q.id}
                          color={isFlagged ? '#faad14' : ans?.isCorrect ? '#52c41a' : ans?.isCorrect === false ? '#ff4d4f' : undefined}
                          dot={!!ans && (ans.isCorrect === false || isFlagged)} offset={[-4, 4]}>
                          <div onClick={() => canNavigate && onGoToQuestion(sIdx, qIdx)}
                            title={isFlagged ? '已标记复查' : undefined}
                            style={{
                              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: 4, fontSize: 12, cursor: canNavigate ? 'pointer' : 'not-allowed',
                              background: isCurrent ? SUBJECT_COLORS[sid] || '#1677ff' :
                                isFlagged ? '#fffbe6' : ans ? (ans.isCorrect ? '#f6ffed' : '#fff2f0') : '#f5f5f5',
                              color: isCurrent ? '#fff' : '#333',
                              border: isCurrent ? `2px solid ${SUBJECT_COLORS[sid] || '#1677ff'}` :
                                isFlagged ? '1px solid #faad14' :
                                ans ? (ans.isCorrect ? '1px solid #b7eb8f' : '1px solid #ffa39e') : '1px solid #d9d9d9'
                            }}>
                            {ans ? (ans.isCorrect ? '✓' : '✗') : qIdx + 1}
                          </div>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            <Button type="primary" block size="large" icon={<SendOutlined />}
              onClick={handleFinishClick} style={{ height: 44 }}>
              交卷查看报告
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Bottom nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <Button size="large" icon={<LeftOutlined />} onClick={onGoPrev}
          disabled={currentSubjectIndex === 0 && currentQuestionIndex === 0}>上一题</Button>
        {currentAnswer && (
          <Button size="large" type="primary" icon={<RightOutlined />} onClick={onGoNext}
            disabled={currentSubjectIndex === selectedSubjectIds.length - 1 &&
              currentQuestionIndex === currentQuestions.length - 1}>下一题</Button>
        )}
      </div>

      {/* Confirm modal */}
      <Modal title={<Space><ExclamationCircleOutlined style={{ color: '#faad14' }} />确认交卷</Space>}
        open={confirmModalOpen} onCancel={() => setConfirmModalOpen(false)} onOk={onFinish}
        okText="确认交卷" cancelText="继续答题">
        <Paragraph>
          你还有 <Text strong style={{ color: '#ff4d4f' }}>{totalQuestions - answeredCount}</Text> 道题未作答，未作答的题目将计为错误。
        </Paragraph>
        <Paragraph>确定要交卷吗？</Paragraph>
      </Modal>
    </div>
  )
}
