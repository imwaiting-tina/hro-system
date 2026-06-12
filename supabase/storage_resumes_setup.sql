-- ============================================================
-- 简历文件存储 Bucket 创建
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 1. 创建 storage bucket（需在 Supabase Dashboard → Storage 手动创建）
-- Bucket 名称: resumes
-- 公开访问: 否（通过 signed URL 访问）
-- 文件大小限制: 10MB
-- 允许的 MIME 类型: application/pdf, image/png, image/jpeg, image/jpg

-- 2. Storage RLS 策略（执行以下 SQL 后生效）
-- 允许认证用户上传
CREATE POLICY "允许认证用户上传简历文件"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes' AND auth.role() = 'authenticated');

-- 允许认证用户读取简历文件
CREATE POLICY "允许认证用户读取简历文件"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'resumes');

-- 允许认证用户删除自己上传的文件
CREATE POLICY "允许认证用户删除简历文件"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'resumes' AND auth.role() = 'authenticated');

-- 3. 清理旧策略（可选，如果有冲突）
-- DROP POLICY IF EXISTS "允许认证用户上传简历文件" ON storage.objects;
-- DROP POLICY IF EXISTS "允许认证用户读取简历文件" ON storage.objects;
-- DROP POLICY IF EXISTS "允许认证用户删除简历文件" ON storage.objects;
