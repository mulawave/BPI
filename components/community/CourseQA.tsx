"use client";

import React, { useState } from "react";
import { api } from "../../client/trpc";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { 
  MessageCircle, 
  ThumbsUp, 
  CheckCircle,
  Send,
  Pin,
  Shield
} from "lucide-react";

interface CourseQAProps {
  courseId: string;
  lessonId?: string;
}

export default function CourseQA({ courseId, lessonId }: CourseQAProps) {
  const [newQuestion, setNewQuestion] = useState("");
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [showAnswerForm, setShowAnswerForm] = useState<Record<string, boolean>>({});

  const utils = api.useUtils();
  const { data: questions, isLoading } = api.trainingCenter.getCourseQuestions.useQuery({ courseId });

  const askMutation = api.trainingCenter.askQuestion.useMutation({
    onSuccess: async () => {
      setNewQuestion("");
      await utils.trainingCenter.getCourseQuestions.invalidate();
    },
  });

  const answerMutation = api.trainingCenter.answerQuestion.useMutation({
    onSuccess: async (_: any, variables: any) => {
      setAnswerText({ ...answerText, [variables.questionId]: "" });
      setShowAnswerForm({ ...showAnswerForm, [variables.questionId]: false });
      await utils.trainingCenter.getCourseQuestions.invalidate();
    },
  });

  const handleAskQuestion = () => {
    if (newQuestion.trim()) {
      askMutation.mutate({ courseId, lessonId, question: newQuestion });
    }
  };

  const handleSubmitAnswer = (questionId: string) => {
    const answer = answerText[questionId];
    if (answer?.trim()) {
      answerMutation.mutate({ questionId, answer });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ask Question Form */}
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          Ask a Question
        </h3>
        <textarea
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="What would you like to know about this course?"
          className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg mb-3 min-h-[100px] bg-background text-foreground"
        />
        <Button
          onClick={handleAskQuestion}
          disabled={!newQuestion.trim() || askMutation.isPending}
          className="w-full sm:w-auto"
        >
          <Send className="w-4 h-4 mr-2" />
          {askMutation.isPending ? "Posting..." : "Post Question"}
        </Button>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Questions & Answers ({questions?.length || 0})
        </h3>

        {questions && questions.length > 0 ? (
          questions.map((question: any) => (
            <Card key={question.id} className="p-5">
              {/* Question Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {question.user.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{question.user.name}</span>
                    {question.isPinned && (
                      <Pin className="w-3 h-3 text-orange-600" />
                    )}
                    {question.isAnswered && (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    )}
                  </div>
                  <p className="text-foreground mb-2">{question.question}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                    <button className="flex items-center gap-1 hover:text-blue-600">
                      <ThumbsUp className="w-3 h-3" />
                      {question.upvotes}
                    </button>
                  </div>
                </div>
              </div>

              {/* Answers */}
              {question.answers && question.answers.length > 0 && (
                <div className="ml-13 space-y-3 mb-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                  {question.answers.map((answer: any) => (
                    <div key={answer.id} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
                          {answer.user.name?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{answer.user.name}</span>
                            {answer.isByModerator && (
                              <span className="flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                <Shield className="w-3 h-3" />
                                Moderator
                              </span>
                            )}
                            {answer.isAccepted && (
                              <span className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Accepted
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground">{answer.answer}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>{new Date(answer.createdAt).toLocaleDateString()}</span>
                            <button className="flex items-center gap-1 hover:text-blue-600">
                              <ThumbsUp className="w-3 h-3" />
                              {answer.upvotes}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Answer Form */}
              {showAnswerForm[question.id] ? (
                <div className="ml-13 mt-3">
                  <textarea
                    value={answerText[question.id] || ""}
                    onChange={(e) => setAnswerText({ ...answerText, [question.id]: e.target.value })}
                    placeholder="Write your answer..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg mb-2 min-h-[80px] bg-background text-foreground"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitAnswer(question.id)}
                      disabled={!answerText[question.id]?.trim() || answerMutation.isPending}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Submit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAnswerForm({ ...showAnswerForm, [question.id]: false })}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAnswerForm({ ...showAnswerForm, [question.id]: true })}
                  className="ml-13 text-sm text-blue-600 hover:underline"
                >
                  Answer this question
                </button>
              )}
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-muted-foreground">No questions yet. Be the first to ask!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
