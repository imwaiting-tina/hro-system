-- 清理招聘管理所有测试数据
DELETE FROM notifications WHERE interview_id IS NOT NULL;
DELETE FROM offers;
DELETE FROM job_applications;
DELETE FROM interviews;
DELETE FROM resumes;
DELETE FROM recruitment_requests;
DELETE FROM approval_records;