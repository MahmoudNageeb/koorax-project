-- Add mahmoudtrek170@gmail.com as admin
-- Password: mti1642009 (hashed with SHA-256)
-- Hash: 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8

INSERT OR IGNORE INTO users (name, email, password_hash, email_verified, is_admin, points)
VALUES ('Mahmoud Trek', 'mahmoudtrek170@gmail.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 1, 1, 0);

-- Make TN@gmail.com also admin if not already
UPDATE users SET is_admin = 1, email_verified = 1 WHERE email = 'TN@gmail.com';
