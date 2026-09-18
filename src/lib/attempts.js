import { supabase } from "./supabase";

export async function startQuizAttempt({ quizType, category = null, citySlug = null }) {
  if (!supabase) throw new Error("Supabase nije konfiguriran.");
  const { data, error } = await supabase.rpc("start_quiz_attempt", {
    p_quiz_type: quizType,
    p_category: category,
    p_city_slug: citySlug,
  });
  if (error) throw error;
  return data;
}

export async function submitQuizAnswer(attemptId, questionId, answerIndex) {
  if (!supabase) throw new Error("Supabase nije konfiguriran.");
  const { data, error } = await supabase.rpc("submit_quiz_answer", {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_answer_index: answerIndex,
  });
  if (error) throw error;
  return data;
}

export async function finishQuizAttempt(attemptId) {
  if (!supabase) throw new Error("Supabase nije konfiguriran.");
  const { data, error } = await supabase.rpc("finish_quiz_attempt", {
    p_attempt_id: attemptId,
  });
  if (error) throw error;
  return data;
}
