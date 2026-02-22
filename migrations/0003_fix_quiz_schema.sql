-- Drop old quiz_questions table and recreate with JSON options
DROP TABLE IF EXISTS quiz_questions;

CREATE TABLE quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_text TEXT NOT NULL,
  options TEXT NOT NULL,  -- JSON string: {"a":"...", "b":"...", "c":"...", "d":"..."}
  correct_answer TEXT NOT NULL CHECK(correct_answer IN ('a', 'b', 'c', 'd')),
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Add sample question for testing
INSERT INTO quiz_questions (question_text, options, correct_answer)
VALUES (
  'من هو أفضل لاعب في العالم حالياً؟',
  '{"a":"ليونيل ميسي","b":"كريستيانو رونالدو","c":"كيليان مبابي","d":"إيرلينج هالاند"}',
  'a'
);
