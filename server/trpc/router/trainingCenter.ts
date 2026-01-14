import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export const trainingCenterRouter = createTRPCRouter({
  getCourses: protectedProcedure.query(async ({ ctx }) => {
    const courses = await ctx.prisma.trainingCourse.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        TrainingLesson: {
          orderBy: { lessonOrder: 'asc' },
          select: { id: true, title: true, lessonOrder: true, estimatedMinutes: true },
        },
        _count: { select: { TrainingProgress: true } },
      },
    });

    // Keep backward-compatible shape expected by the UI
    return courses.map((course) => ({
      ...course,
      lessons: course.TrainingLesson,
      _count: {
        enrollments: course._count.TrainingProgress,
      },
    }));
  }),

  getCourseById: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Not authenticated");

      const course = await ctx.prisma.trainingCourse.findUnique({
        where: { id: input.courseId },
        include: {
          TrainingLesson: {
            orderBy: { lessonOrder: 'asc' },
          },
        },
      });

      if (!course) {
        throw new Error("Course not found");
      }

      const progress = await ctx.prisma.trainingProgress.findUnique({
        where: {
          userId_courseId: { userId, courseId: input.courseId },
        },
      });

      return { ...course, lessons: course.TrainingLesson, userProgress: progress };
    }),

  getMyProgress: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) throw new Error("Not authenticated");

    const enrollments = await ctx.prisma.trainingProgress.findMany({
      where: { userId },
      include: {
        TrainingCourse: {
          include: {
            TrainingLesson: true,
          },
        },
      },
    });

    // Keep backward-compatible shape expected by the UI
    return enrollments.map((enrollment) => ({
      ...enrollment,
      course: {
        ...enrollment.TrainingCourse,
        lessons: enrollment.TrainingCourse.TrainingLesson,
      },
    }));
  }),

  enrollInCourse: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Not authenticated");

      const existing = await ctx.prisma.trainingProgress.findUnique({
        where: {
          userId_courseId: { userId, courseId: input.courseId },
        },
      });

      if (existing) {
        return { success: true, message: "Already enrolled" };
      }

      await ctx.prisma.trainingProgress.create({
        data: {
          id: randomUUID(),
          userId,
          courseId: input.courseId,
        },
      });

      return { success: true, message: "Enrolled successfully" };
    }),

  updateProgress: protectedProcedure
    .input(z.object({
      courseId: z.string(),
      lessonId: z.string(),
      completed: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Not authenticated");

      const progress = await ctx.prisma.trainingProgress.findUnique({
        where: {
          userId_courseId: { userId, courseId: input.courseId },
        },
      });

      if (!progress) {
        throw new Error("Not enrolled in this course");
      }

      let completedLessons = (progress.completedLessons as string[]) || [];
      
      if (input.completed && !completedLessons.includes(input.lessonId)) {
        completedLessons.push(input.lessonId);
      } else if (!input.completed) {
        completedLessons = completedLessons.filter(id => id !== input.lessonId);
      }

      const course = await ctx.prisma.trainingCourse.findUnique({
        where: { id: input.courseId },
        include: { TrainingLesson: true },
      });

      const totalLessons = course?.TrainingLesson.length || 0;
      const progressPercentage = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0;
      const isCompleted = progressPercentage === 100;

      await ctx.prisma.trainingProgress.update({
        where: {
          userId_courseId: { userId, courseId: input.courseId },
        },
        data: {
          completedLessons,
          progress: progressPercentage,
          completedAt: isCompleted ? new Date() : null,
          lastAccessedAt: new Date(),
        },
      });

      return { success: true, message: "Progress updated", progressPercentage };
    }),

  submitQuiz: protectedProcedure
    .input(z.object({
      courseId: z.string(),
      lessonId: z.string(),
      answers: z.array(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      const lesson = await ctx.prisma.trainingLesson.findUnique({
        where: { id: input.lessonId },
      });

      if (!lesson?.quizQuestions) {
        return { success: false, score: 0, message: "No quiz available" };
      }

      const questions = lesson.quizQuestions as any[];
      let correct = 0;
      
      questions.forEach((q: any, index: number) => {
        if (q.correctAnswer === input.answers[index]) {
          correct++;
        }
      });

      const score = (correct / questions.length) * 100;
      const passed = score >= 70;

      return {
        success: passed,
        score,
        correct,
        total: questions.length,
        message: passed ? "Quiz passed!" : "Keep trying!",
      };
    }),

  getMyBadges: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) throw new Error("Not authenticated");

    const completedCourses = await ctx.prisma.trainingProgress.count({
      where: { 
        userId, 
        completedAt: { not: null } 
      },
    });

    const badges = [
      { id: 'first-course', name: 'First Steps', icon: '🎓', unlocked: completedCourses >= 1 },
      { id: 'quick-learner', name: 'Quick Learner', icon: '⚡', unlocked: completedCourses >= 3 },
      { id: 'dedicated', name: 'Dedicated Student', icon: '📚', unlocked: completedCourses >= 5 },
      { id: 'master', name: 'Master', icon: '🏆', unlocked: completedCourses >= 10 },
    ];

    return badges;
  }),
});
