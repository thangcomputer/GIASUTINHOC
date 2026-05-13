/**
 * Tiện ích: ngữ cảnh bài học cho AI, checklist thực hành, flashcard ôn nhanh.
 * Checklist lưu localStorage theo lessonId + stepIndex.
 */

export function checklistStorageKey(lessonId, stepIndex) {
  return `giasu_practice_checklist_${lessonId}_${stepIndex}`;
}

export function loadChecklistState(lessonId, stepIndex, itemCount) {
  try {
    const raw = localStorage.getItem(checklistStorageKey(lessonId, stepIndex));
    if (!raw) return Array.from({ length: itemCount }, () => false);
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return Array.from({ length: itemCount }, () => false);
    while (arr.length < itemCount) arr.push(false);
    return arr.slice(0, itemCount);
  } catch {
    return Array.from({ length: itemCount }, () => false);
  }
}

export function saveChecklistState(lessonId, stepIndex, states) {
  try {
    localStorage.setItem(checklistStorageKey(lessonId, stepIndex), JSON.stringify(states));
  } catch {
    /* ignore */
  }
}

/** Mục checklist: CMS `practiceChecklist` hoặc suy từ mục tiêu / bullet */
export function getPracticeChecklist(step) {
  const raw = step?.practiceChecklist;
  if (Array.isArray(raw) && raw.length) {
    return raw.map((s) => String(s).trim()).filter(Boolean).slice(0, 8);
  }
  const lo = (step?.learningObjectives || []).filter(Boolean).map(String);
  if (lo.length) return lo.slice(0, 6);
  const sb = (step?.summaryBullets || []).filter(Boolean).map(String);
  if (sb.length) return sb.slice(0, 6).map((b) => `Thực hành: ${b}`);
  const title = step?.title || 'module này';
  return [
    `Làm lại thao tác chính trong video của «${title}».`,
    'Mở phần mềm liên quan và thử một lần không xem mẫu.',
    'Nếu lỗi: ghi lại thông báo hoặc chụp màn hình rồi hỏi AI (nút bên dưới).',
  ];
}

/** Flashcard: CMS `flashcards` hoặc suy từ bullet / mục tiêu */
export function getFlashcards(step, lessonTitle) {
  const raw = step?.flashcards;
  if (Array.isArray(raw) && raw.length) {
    return raw
      .map((c) => ({
        front: String(c?.front || '').trim(),
        back: String(c?.back || '').trim(),
      }))
      .filter((c) => c.front && c.back)
      .slice(0, 10);
  }
  const bullets = [
    ...(step?.summaryBullets || []),
    ...(step?.learningObjectives || []),
  ]
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set();
  const cards = [];
  const tip = String(step?.tip || '').trim();
  for (const b of bullets) {
    const key = b.slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    const backParts = [b];
    if (tip) backParts.push(`Mẹo: ${tip.slice(0, 280)}${tip.length > 280 ? '…' : ''}`);
    backParts.push(`Khóa: ${lessonTitle || '—'}`);
    cards.push({
      front: b.length > 96 ? `${b.slice(0, 93)}…` : b,
      back: backParts.join('\n\n').slice(0, 700),
    });
    if (cards.length >= 8) break;
  }
  return cards;
}

/**
 * Văn bản gửi kèm API chat (lessonContext) — ngắn gọn, tiếng Việt.
 */
export function buildLessonAiContextText(lesson, stepIndex) {
  if (!lesson?.steps?.length) return '';
  const i = Math.max(0, Math.min(Number(stepIndex) || 0, lesson.steps.length - 1));
  const step = lesson.steps[i];
  if (!step) return '';
  const lines = [];
  lines.push(`Khóa: ${lesson.title} (id: ${lesson.id})`);
  if (lesson.category) lines.push(`Danh mục: ${lesson.category}`);
  lines.push(`Module ${i + 1}/${lesson.steps.length}: ${step.title || '—'}`);
  if (step.tip) lines.push(`Mẹo: ${step.tip}`);
  if (Array.isArray(step.learningObjectives) && step.learningObjectives.length) {
    lines.push('Mục tiêu:');
    step.learningObjectives.slice(0, 6).forEach((o, k) => lines.push(`  ${k + 1}. ${o}`));
  }
  if (Array.isArray(step.summaryBullets) && step.summaryBullets.length) {
    lines.push('Ôn nhanh:');
    step.summaryBullets.slice(0, 8).forEach((b) => lines.push(`  • ${b}`));
  }
  if (step.exercise) {
    const ex = String(step.exercise).replace(/\s+/g, ' ').trim();
    lines.push(`Bài tập / thực hành (trích): ${ex.slice(0, 500)}${ex.length > 500 ? '…' : ''}`);
  }
  return lines.join('\n').slice(0, 2800);
}
