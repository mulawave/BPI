"use client";

import { useState, useEffect } from "react";
import { FiX, FiBookOpen, FiPlay, FiCheck, FiLock } from "react-icons/fi";
import { BookOpen, Award, Clock, PlayCircle, CheckCircle, Trophy, Star, Target } from "lucide-react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";

interface TrainingCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewType = 'courses' | 'mycourses' | 'course-detail' | 'lesson' | 'badges';

export default function TrainingCenterModal({ isOpen, onClose }: TrainingCenterModalProps) {
  const [currentView, setCurrentView] = useState<ViewType>('courses');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<any[]>([]);

  const { data: courses, refetch: refetchCourses } = api.trainingCenter.getCourses.useQuery();
  const { data: myProgress } = api.trainingCenter.getMyProgress.useQuery();
  const { data: courseDetail, refetch: refetchCourseDetail } = api.trainingCenter.getCourseById.useQuery(
    { courseId: selectedCourseId! },
    { enabled: !!selectedCourseId }
  );
  const { data: badges } = api.trainingCenter.getMyBadges.useQuery();

  const enrollMutation = api.trainingCenter.enrollInCourse.useMutation({
    onSuccess: () => {
      refetchCourses();
      toast.success("Enrolled successfully!");
    },
  });

  const updateProgressMutation = api.trainingCenter.updateProgress.useMutation({
    onSuccess: (data: { progressPercentage: number }) => {
      refetchCourses();
      refetchCourseDetail();
      toast.success("✅ Lesson marked as complete!");
      if (data.progressPercentage === 100) {
        toast.success("🎉 Congratulations! Course completed!");
      }
    },
  });

  const submitQuizMutation = api.trainingCenter.submitQuiz.useMutation({
    onSuccess: (data: { success: boolean; score: number }) => {
      if (data.success) {
        toast.success(`Quiz Passed! Score: ${data.score}%`);
      } else {
        toast.error(`Quiz Failed! Score: ${data.score}%`);
      }
      if (data.success && selectedCourseId && selectedLessonId) {
        updateProgressMutation.mutate({
          courseId: selectedCourseId,
          lessonId: selectedLessonId,
          completed: true,
        });
      }
    },
  });

  const currentLesson = courseDetail?.lessons?.find((l: any) => l.id === selectedLessonId);
  const completedLessons = (courseDetail?.userProgress?.completedLessons as string[]) || [];

  if (!isOpen) return null;

  const categories = [
    { value: 'all', label: 'All Courses', icon: BookOpen },
    { value: 'basics', label: 'Basics', icon: Star },
    { value: 'referral', label: 'Referral', icon: Target },
    { value: 'finance', label: 'Finance', icon: Trophy },
  ];

  const difficultyColors = {
    beginner: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    intermediate: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    advanced: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-bpi-dark-card">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white shadow-lg">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                <FiBookOpen className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Training Center</h1>
                <p className="text-cyan-100 text-sm">Learn, Grow, and Earn with BPI Academy</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <FiX className="w-7 h-7" />
            </button>
          </div>
          
          {/* Navigation */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
            {[
              { id: 'courses' as ViewType, label: 'All Courses', icon: BookOpen },
              { id: 'mycourses' as ViewType, label: 'My Courses', icon: PlayCircle },
              { id: 'badges' as ViewType, label: 'Badges & Achievements', icon: Trophy },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setCurrentView(id);
                  setSelectedCourseId(null);
                }}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg transition-all whitespace-nowrap ${
                  currentView === id
                    ? 'bg-white text-teal-600 shadow-lg font-semibold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-180px)] overflow-y-auto p-6">
        {/* All Courses */}
        {currentView === 'courses' && !selectedCourseId && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses?.map((course: any) => (
                <div
                  key={course.id}
                  className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => {
                    setSelectedCourseId(course.id);
                    setCurrentView('course-detail');
                  }}
                >
                  {course.thumbnailUrl && (
                    <div className="h-48 bg-gradient-to-br from-teal-500 to-blue-600 relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                      <div className="absolute bottom-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColors[course.difficulty as keyof typeof difficultyColors]}`}>
                          {course.difficulty}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{course.description}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.estimatedHours}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <PlayCircle className="w-4 h-4" />
                        <span>{course.lessons.length} lessons</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Detail */}
        {currentView === 'course-detail' && selectedCourseId && courseDetail && !selectedLessonId && (
          <div className="max-w-5xl mx-auto space-y-6">
            <button
              onClick={() => {
                setSelectedCourseId(null);
                setCurrentView('courses');
              }}
              className="text-cyan-600 hover:underline mb-4"
            >
              ← Back to courses
            </button>
            
            <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl p-8 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-3">{courseDetail.title}</h2>
                  <p className="text-cyan-100 mb-4">{courseDetail.description}</p>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{courseDetail.estimatedHours} hours</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{courseDetail.lessons?.length} lessons</span>
                    </div>
                  </div>
                </div>
                {!courseDetail.userProgress ? (
                  <button
                    onClick={() => enrollMutation.mutate({ courseId: selectedCourseId })}
                    disabled={enrollMutation.isPending}
                    className="px-6 py-3 bg-white text-teal-600 rounded-lg hover:shadow-lg transition-all font-semibold"
                  >
                    {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                ) : (
                  <div className="text-center bg-white/20 rounded-lg p-4">
                    <div className="text-3xl font-bold">{Math.round(courseDetail.userProgress.progress)}%</div>
                    <div className="text-xs">Progress</div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">Course Content</h3>
              {courseDetail.lessons?.map((lesson: any, index: number) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const isLocked = !courseDetail.userProgress && index > 0;
                
                return (
                  <div
                    key={lesson.id}
                    className={`bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-lg p-4 flex items-center gap-4 ${
                      isLocked ? 'opacity-50' : 'hover:shadow-md cursor-pointer'
                    } transition-all`}
                    onClick={() => {
                      if (!isLocked) {
                        setSelectedLessonId(lesson.id);
                        setCurrentView('lesson');
                      }
                    }}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                    }`}>
                      {isLocked ? <FiLock /> : isCompleted ? <FiCheck /> : <FiPlay />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{lesson.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {lesson.estimatedMinutes} min
                        {lesson.quizQuestions && ' • Quiz included'}
                      </p>
                    </div>
                    {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lesson View */}
        {currentView === 'lesson' && selectedLessonId && currentLesson && (
          <div className="max-w-4xl mx-auto space-y-6">
            <button
              onClick={() => {
                setSelectedLessonId(null);
                setCurrentView('course-detail');
              }}
              className="text-cyan-600 hover:underline mb-4"
            >
              ← Back to course
            </button>

            <div className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">{currentLesson.title}</h2>
              
              {currentLesson.videoUrl && (
                <div className="aspect-video bg-gray-900 rounded-lg mb-6 flex items-center justify-center">
                  <PlayCircle className="w-16 h-16 text-white opacity-50" />
                </div>
              )}

              <div className="prose dark:prose-invert max-w-none mb-8" dangerouslySetInnerHTML={{ __html: currentLesson.content }} />

              {currentLesson.quizQuestions && (
                <div className="border-t border-bpi-border dark:border-bpi-dark-accent pt-6">
                  <h3 className="text-xl font-semibold text-foreground mb-4">Lesson Quiz</h3>
                  <div className="space-y-4">
                    {(currentLesson.quizQuestions as any[]).map((q: any, qIndex: number) => (
                      <div key={qIndex} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <p className="font-medium text-foreground mb-3">{q.question}</p>
                        <div className="space-y-2">
                          {q.options.map((option: string, oIndex: number) => (
                            <label key={oIndex} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`q${qIndex}`}
                                value={oIndex}
                                onChange={(e) => {
                                  const newAnswers = [...quizAnswers];
                                  newAnswers[qIndex] = parseInt(e.target.value);
                                  setQuizAnswers(newAnswers);
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-foreground">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (selectedCourseId && selectedLessonId) {
                        submitQuizMutation.mutate({
                          courseId: selectedCourseId,
                          lessonId: selectedLessonId,
                          answers: quizAnswers,
                        });
                      }
                    }}
                    disabled={submitQuizMutation.isPending}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    {submitQuizMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                </div>
              )}

              {!currentLesson.quizQuestions && (
                <button
                  onClick={() => {
                    if (selectedCourseId && selectedLessonId) {
                      updateProgressMutation.mutate({
                        courseId: selectedCourseId,
                        lessonId: selectedLessonId,
                        completed: true,
                      });
                    }
                  }}
                  disabled={updateProgressMutation.isPending || completedLessons.includes(selectedLessonId)}
                  className={`px-6 py-3 rounded-lg transition-all font-semibold flex items-center gap-2 justify-center ${
                    completedLessons.includes(selectedLessonId)
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:shadow-lg hover:scale-105'
                  }`}
                >
                  {updateProgressMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Marking Complete...
                    </>
                  ) : completedLessons.includes(selectedLessonId) ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Completed
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Mark as Complete
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* My Courses */}
        {currentView === 'mycourses' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-foreground">My Enrolled Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProgress?.map((enrollment: any) => (
                <div
                  key={enrollment.id}
                  className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedCourseId(enrollment.courseId);
                    setCurrentView('course-detail');
                  }}
                >
                  <h3 className="text-lg font-bold text-foreground mb-2">{enrollment.course.title}</h3>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-teal-600">{Math.round(enrollment.progressPercentage)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all"
                        style={{ width: `${enrollment.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                  {enrollment.isCompleted && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Trophy className="w-5 h-5" />
                      <span className="text-sm font-semibold">Completed!</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {currentView === 'badges' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Badges & Achievements</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {badges?.map((badge: any) => (
                <div
                  key={badge.id}
                  className={`text-center p-6 rounded-xl border-2 transition-all ${
                    badge.unlocked
                      ? 'bg-gradient-to-br from-teal-500 to-cyan-600 border-transparent text-white shadow-lg'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                  }`}
                >
                  <div className={`text-5xl mb-3 ${badge.unlocked ? '' : 'opacity-30 grayscale'}`}>{badge.icon}</div>
                  <p className="font-semibold">{badge.name}</p>
                  {!badge.unlocked && <p className="text-xs mt-1">Locked</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
