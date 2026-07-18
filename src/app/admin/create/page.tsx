'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export default function CreateQuiz() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number>(10); // Default 10 minutes
  const [pasteText, setPasteText] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleParse = () => {
    if (!pasteText.trim()) {
      setError('Please paste some text first.');
      return;
    }
    setError('');

    const lines = pasteText.split('\n');
    const parsedQuestions: Question[] = [];
    let currentQuestion: Question | null = null;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Check for question (e.g. "1. What is...", "Q2: Who is...")
      const qMatch = line.match(/^\s*(?:Q|Question)?\s*\d+[\.\:\)\-]\s*(.+)$/i);
      if (qMatch) {
        if (currentQuestion) {
          parsedQuestions.push(currentQuestion);
        }
        currentQuestion = {
          id: Math.random().toString(36).substring(2, 8).toUpperCase(),
          text: qMatch[1].trim(),
          options: [],
          correctAnswer: 0,
        };
        continue;
      }

      // Check for option (e.g. "A) option", "b. another option", "C: option")
      const optMatch = line.match(/^\s*([A-E]|[a-e])[\.\:\)]\s*(.+)$/);
      if (optMatch && currentQuestion) {
        currentQuestion.options.push(optMatch[2].trim());
        continue;
      }

      // Check for correct answer (e.g. "Answer: A", "Correct Answer: B", "Ans: C")
      const ansMatch = line.match(/(?:correct\s+)?ans(?:wer)?\s*[\:\-\=]\s*([A-E]|[a-e])/i);
      if (ansMatch && currentQuestion) {
        const letter = ansMatch[1].toUpperCase();
        const index = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3, E=4
        currentQuestion.correctAnswer = index;
        continue;
      }

      // Fallback: If line starts with bullet "-" or "*" and we have a current question
      const bulletMatch = line.match(/^\s*[\-\*]\s*(.+)$/);
      if (bulletMatch && currentQuestion) {
        currentQuestion.options.push(bulletMatch[1].trim());
        continue;
      }

      // If it's just a general line, and we have a question but no options yet, append to question text
      if (currentQuestion && currentQuestion.options.length === 0) {
        currentQuestion.text += ' ' + line;
      }
    }

    if (currentQuestion) {
      parsedQuestions.push(currentQuestion);
    }

    if (parsedQuestions.length === 0) {
      setError('Could not parse any questions. Make sure questions start with numbers (e.g. "1. Question") and options start with letters (e.g. "A) Option").');
    } else {
      setQuestions(parsedQuestions);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Math.random().toString(36).substring(2, 8).toUpperCase(),
        text: 'New Question',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
      },
    ]);
  };

  const handleUpdateQuestionText = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].text = text;
    setQuestions(updated);
  };

  const handleUpdateOptionText = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = text;
    setQuestions(updated);
  };

  const handleAddOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.push(`Option ${String.fromCharCode(65 + updated[qIndex].options.length)}`);
    setQuestions(updated);
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) {
      alert('Questions must have at least 2 options.');
      return;
    }
    updated[qIndex].options.splice(optIndex, 1);
    // If the correct answer index is out of bounds, reset to 0
    if (updated[qIndex].correctAnswer >= updated[qIndex].options.length) {
      updated[qIndex].correctAnswer = 0;
    }
    setQuestions(updated);
  };

  const handleSetCorrectAnswer = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].correctAnswer = optIndex;
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSaveQuiz = async () => {
    if (!title.trim()) {
      setError('Please enter a quiz title.');
      window.scrollTo(0, 0);
      return;
    }
    if (questions.length === 0) {
      setError('Please add or parse at least one question.');
      window.scrollTo(0, 0);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          duration,
          questions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/admin');
      } else {
        setError(data.error || 'Failed to save quiz.');
        window.scrollTo(0, 0);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while saving the quiz.');
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="mb-4">
        <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--primary)', textDecoration: 'none', marginBottom: '1rem', fontWeight: 600 }}>
          &larr; Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '2rem' }}>Create Timed Quiz</h1>
        <p>Set timing, paste your ChatGPT questions, review, and publish.</p>
      </div>

      {error && (
        <div className="card badge-danger mb-4 animate-fade-in" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--border-radius-md)' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Basic Settings */}
      <div className="card mb-4" style={{ padding: '2rem' }}>
        <h2 className="mb-4" style={{ fontSize: '1.4rem' }}>1. Quiz Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Quiz Title</label>
            <input
              type="text"
              placeholder="e.g. Science Midterm Chapter 3"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              <span>Quiz Timer (Minutes)</span>
              <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>0 = Unlimited</span>
            </label>
            <input
              type="number"
              min="0"
              className="input"
              value={duration}
              onChange={(e) => setDuration(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
        </div>
      </div>

      {/* Paste ChatGPT Content */}
      {questions.length === 0 && (
        <div className="card mb-4">
          <h2 className="mb-2" style={{ fontSize: '1.4rem' }}>2. Paste Questions from ChatGPT</h2>
          <p className="mb-4" style={{ fontSize: '0.9rem' }}>
            Copy-paste output from ChatGPT. Make sure questions are numbered (e.g. 1, 2) and options start with letters (e.g. A, B).
          </p>
          <div className="form-group">
            <textarea
              className="textarea"
              placeholder={`Example format:
1. What is the color of the sky?
A) Blue
B) Red
C) Green
D) Yellow
Answer: A

2. Which planet is closest to the sun?
a) Venus
b) Earth
c) Mercury
d) Mars
Correct Answer: c`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              style={{ minHeight: '220px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleParse} className="btn btn-secondary">
              Parse pasted text
            </button>
            <button onClick={handleAddQuestion} className="btn btn-outline">
              Create manually
            </button>
          </div>
        </div>
      )}

      {/* Editor & Preview */}
      {questions.length > 0 && (
        <div>
          <div className="flex-between mb-4">
            <h2 style={{ fontSize: '1.4rem' }}>2. Review & Edit Questions ({questions.length})</h2>
            <button onClick={() => setQuestions([])} className="btn btn-outline btn-sm">
              Paste Different Text
            </button>
          </div>

          {questions.map((question, qIndex) => (
            <div key={question.id} className="card mb-4" style={{ padding: '2rem', borderLeft: '4px solid var(--primary)' }}>
              <div className="flex-between mb-2">
                <span className="badge badge-primary">Question {qIndex + 1}</span>
                <button
                  onClick={() => handleRemoveQuestion(qIndex)}
                  className="btn btn-outline btn-sm"
                  style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  Delete Question
                </button>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  className="input"
                  value={question.text}
                  onChange={(e) => handleUpdateQuestionText(qIndex, e.target.value)}
                  style={{ fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Options:</span>
                {question.options.map((option, optIndex) => (
                  <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={question.correctAnswer === optIndex}
                      onChange={() => handleSetCorrectAnswer(qIndex, optIndex)}
                      style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                      title="Mark as correct answer"
                    />
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', width: '20px' }}>
                      {String.fromCharCode(65 + optIndex)})
                    </span>
                    <input
                      type="text"
                      className="input"
                      value={option}
                      onChange={(e) => handleUpdateOptionText(qIndex, optIndex, e.target.value)}
                      style={{ flex: 1, padding: '0.5rem 0.75rem' }}
                    />
                    <button
                      onClick={() => handleRemoveOption(qIndex, optIndex)}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}
                      title="Remove Option"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button onClick={() => handleAddOption(qIndex)} className="btn btn-outline btn-sm">
                  + Add Option
                </button>
              </div>
            </div>
          ))}

          <div className="flex-center mb-4" style={{ gap: '1rem' }}>
            <button onClick={handleAddQuestion} className="btn btn-outline">
              + Add Question Manually
            </button>
            <button
              onClick={handleSaveQuiz}
              disabled={saving}
              className="btn btn-primary"
              style={{ minWidth: '150px' }}
            >
              {saving ? 'Saving...' : 'Publish Quiz'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
