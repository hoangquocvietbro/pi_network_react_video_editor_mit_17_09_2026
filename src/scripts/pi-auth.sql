-- SQL Migration Script for Pi Network Authentication
-- Cập nhật User Table theo đúng schema mới

-- 1. Thêm các cột mới cho định danh Pi
ALTER TABLE users ADD COLUMN pi_uid VARCHAR(255);
ALTER TABLE users ADD COLUMN username VARCHAR(255);

-- (Optionally) Nếu bảng có dữ liệu cũ cần dọn dẹp trước khi drop các cột nullable:
-- DELETE FROM users; 

-- 2. Thêm chỉ mục/ràng buộc cho pi_uid
CREATE UNIQUE INDEX idx_users_pi_uid ON users(pi_uid);

-- 3. Xóa các cột liên quan tới hệ thống đăng nhập cũ
ALTER TABLE users DROP COLUMN IF EXISTS email;
ALTER TABLE users DROP COLUMN IF EXISTS name;
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
ALTER TABLE users DROP COLUMN IF EXISTS verification_token;
ALTER TABLE users DROP COLUMN IF EXISTS reset_password_token;
ALTER TABLE users DROP COLUMN IF EXISTS reset_password_expires;
