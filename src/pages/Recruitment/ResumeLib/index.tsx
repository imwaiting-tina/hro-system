import React, { useEffect, useState, useRef } from 'react';
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select, message,
  Typography, Card, Upload, Descriptions, Progress, Popconfirm, Alert
} from 'antd';
import type { UploadFile } from 'antd';
import {
  PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  UploadOutlined, SearchOutlined, FilePdfOutlined,
  FileImageOutlined, InboxOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuthStore, canEdit } from '../../../stores/authStore';
import supabase from '../../../utils/supabase';
import type { ResumeStatus } from '../../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const statusMap: Record<ResumeStatus, { label: string; color: string }> = {
  new:                { label: '新收',       color: 'blue' },
  screening:          { label: '筛选中',     color: 'processing' },
  interviewing_first:  { label: '一面中',     color: 'orange' },
  interviewing_second: { label: '二面中',     color: 'orange' },
  interviewing_final:   { label: '终面中',     color: 'volcano' },
  pending_offer:       { label: '待发Offer',  color: 'purple' },
  offered:            { label: '已发Offer',   color: 'geekblue' },
  accepted:           { label: '已接受',     color: 'success' },
  rejected:           { label: '不录取',     color: 'error' },
  withdrawn:          { label: '候选人放弃', color: 'default' },
};

// 简历解析工具函数
const parseResumeText = (text: string) => {
  const result: Record<string, string> = {};

  // 姓名：常见模式
  const namePatterns = [
    /姓\s*名[：:]\s*([^\n]{2,4})/,
    /候选人[：:]\s*([^\n]{2,4})/,
    /^([^\n]{2,4})\n/,
  ];
  for (const p of namePatterns) {
    const m = text.match(p);
    if (m) { result.candidate_name = m[1].trim(); break; }
  }

  // 性别
  const genderMatch = text.match(/性\s*别[：:]\s*([男女])/);
  if (genderMatch) result.gender = genderMatch[1];

  // 电话
  const phoneMatch = text.match(/(?:电话|手机|联系方式|Tel|Phone|Mobile)[：:\s]*([\d\-]{11,13})/i)
    || text.match(/(1[3-9]\d{9})/);
  if (phoneMatch) result.phone = phoneMatch[1].replace(/[\s\-]/g, '');

  // 邮箱
  const emailMatch = text.match(/(?:邮箱|E-?mail|Email)[：:\s]*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i)
    || text.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) result.email = emailMatch[1];

  // 学历
  const eduMatch = text.match(/(?:学历|最高学历|教育程度)[：:\s]*(博士|硕士|本科|大专|高中|中专)/);
  if (eduMatch) result.highest_education = eduMatch[1];

  // 毕业院校
  const schoolMatch = text.match(/(?:毕业院校|学校|院校|大学)[：:\s]*([^\n]{3,30})/);
  if (schoolMatch) result.school = schoolMatch[1].trim();

  // 专业
  const majorMatch = text.match(/(?:专业|主修)[：:\s]*([^\n]{2,30})/);
  if (majorMatch) result.major = majorMatch[1].trim();

  // 毕业年份
  const yearMatch = text.match(/(?:毕业时间|毕业年份)[：:\s]*(\d{4})/);
  if (yearMatch) result.graduation_year = yearMatch[1];

  // 期望薪资
  const salaryMatch = text.match(/(?:期望薪资|期望月薪|薪资要求|期望薪酬)[：:\s]*(\d[\d,.]*[kKw万]?)/i);
  if (salaryMatch) {
    const s = salaryMatch[1].toLowerCase();
    if (s.includes('k')) result.expected_salary = String(parseFloat(s) * 1000);
    else if (s.includes('万')) result.expected_salary = String(parseFloat(s) * 10000);
    else result.expected_salary = s.replace(/[,，]/g, '');
  }

  return result;
};

const ResumeLibPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  // 批量上传相关
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parseResults, setParseResults] = useState<any[]>([]);
  const [parseStep, setParseStep] = useState<'upload' | 'review'>('upload');
  const pdfWorkerRef = useRef<any>(null);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from('resumes').select('*').order('created_at', { ascending: false });
    if (searchText) {
      query = query.or(`candidate_name.ilike.%${searchText}%,phone.ilike.%${searchText}%,email.ilike.%${searchText}%`);
    }
    const { data: result, error } = await query;
    if (!error && result) setData(result);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [searchText]);

  // 初始化 PDF.js worker
  useEffect(() => {
    const initPdfWorker = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        pdfWorkerRef.current = pdfjs;
      } catch (e) {
        console.warn('PDF.js worker init failed:', e);
      }
    };
    initPdfWorker();
  }, []);

  // 解析 PDF 文本
  const extractPdfText = async (file: File): Promise<string> => {
    if (!pdfWorkerRef.current) {
      throw new Error('PDF 解析引擎未就绪');
    }
    const pdfjs = pdfWorkerRef.current;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  // 批量上传处理
  const handleBatchUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    setUploading(true);
    const results: any[] = [];

    for (const file of fileList) {
      try {
        const originFile = file.originFileObj as File;
        if (!originFile) continue;

        const fileName = `${Date.now()}_${originFile.name}`;
        let fileUrl = '';
        let extractedText = '';

        // 上传到 Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, originFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // 如果 bucket 不存在，跳过上传但继续解析
          if (uploadError.message.includes('not found') || uploadError.message.includes('bucket')) {
            message.warning('Storage bucket "resumes" 未创建，文件将不上传存储，仅解析内容');
          }
        } else {
          const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(fileName);
          fileUrl = urlData.publicUrl;
        }

        // 解析文件内容
        const fileType = originFile.type;
        if (fileType === 'application/pdf') {
          extractedText = await extractPdfText(originFile);
        } else if (fileType.startsWith('image/')) {
          // 图片文件：尝试用简单方式提取（文件名作为提示）
          extractedText = `[图片简历] 文件名: ${originFile.name}`;
        } else {
          extractedText = `[不支持的文件类型] ${fileType}`;
        }

        // 从文本中提取字段
        const parsedFields = parseResumeText(extractedText);

        results.push({
          fileName: originFile.name,
          fileUrl,
          extractedText: extractedText.substring(0, 500),
          parsedFields,
          status: 'success',
        });
      } catch (err: any) {
        results.push({
          fileName: (file.originFileObj as File)?.name || file.name,
          fileUrl: '',
          extractedText: '',
          parsedFields: {},
          status: 'error',
          error: err.message,
        });
      }
    }

    setParseResults(results);
    setParseStep('review');
    setUploading(false);
  };

  // 确认导入解析结果
  const confirmImport = async () => {
    const inserts = parseResults
      .filter((r) => r.status === 'success')
      .map((r) => ({
        candidate_name: r.parsedFields.candidate_name || r.fileName.replace(/\.(pdf|png|jpe?g)$/i, ''),
        gender: r.parsedFields.gender || null,
        phone: r.parsedFields.phone || null,
        email: r.parsedFields.email || null,
        highest_education: r.parsedFields.highest_education || null,
        school: r.parsedFields.school || null,
        major: r.parsedFields.major || null,
        expected_salary: r.parsedFields.expected_salary ? parseFloat(r.parsedFields.expected_salary) : null,
        source: 'other' as const,
        source_detail: '批量上传',
        resume_file_url: r.fileUrl || null,
        resume_text: r.extractedText || null,
        status: 'new' as const,
        created_by: user?.id,
      }));

    if (inserts.length === 0) {
      message.warning('没有可导入的简历');
      return;
    }

    const { error } = await supabase.from('resumes').insert(inserts);
    if (error) {
      message.error('导入失败: ' + error.message);
      return;
    }

    message.success(`成功导入 ${inserts.length} 份简历`);
    setUploadModalVisible(false);
    setFileList([]);
    setParseResults([]);
    setParseStep('upload');
    fetchData();
  };

  // 单个简历提交
  const handleSubmit = async (values: any) => {
    const payload = { ...values, created_by: editingRecord?.created_by || user?.id };
    if (editingRecord) {
      await supabase.from('resumes').update(payload).eq('id', editingRecord.id);
      message.success('更新成功');
    } else {
      await supabase.from('resumes').insert({ ...payload, status: 'new' });
      message.success('录入成功');
    }
    setModalVisible(false);
    form.resetFields();
    setEditingRecord(null);
    fetchData();
  };

  // 批量删除
  const handleBatchDelete = async () => {
    Modal.confirm({
      title: '确认批量删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除选中的 ${selectedRowKeys.length} 份简历吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const { error } = await supabase.from('resumes').delete().in('id', selectedRowKeys as string[]);
        if (error) {
          message.error('删除失败: ' + error.message);
        } else {
          message.success(`成功删除 ${selectedRowKeys.length} 份简历`);
          setSelectedRowKeys([]);
          fetchData();
        }
      },
    });
  };

  // 单条删除
  const handleDelete = async (record: any) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除 ${record.candidate_name} 的简历吗？`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await supabase.from('resumes').delete().eq('id', record.id);
        message.success('已删除');
        fetchData();
      },
    });
  };

  const handleStatusChange = async (id: string, newStatus: ResumeStatus) => {
    await supabase.from('resumes').update({ status: newStatus }).eq('id', id);
    message.success('状态已更新');
    fetchData();
  };

  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const columns = [
    { title: '候选人', dataIndex: 'candidate_name', width: 100 },
    { title: '性别', dataIndex: 'gender', width: 60 },
    { title: '电话', dataIndex: 'phone', width: 130 },
    { title: '邮箱', dataIndex: 'email', width: 180, ellipsis: true },
    { title: '学历', dataIndex: 'highest_education', width: 80 },
    { title: '毕业院校', dataIndex: 'school', width: 140, ellipsis: true },
    { title: '专业', dataIndex: 'major', width: 120, ellipsis: true },
    {
      title: '来源',
      dataIndex: 'source',
      width: 100,
      render: (v: string) => {
        const sourceLabels: Record<string, string> = {
          boss_zhipin: 'Boss直聘',
          internal_referral: '内部推荐',
          email: '邮件投递',
          other: '其他',
        };
        return sourceLabels[v] || v;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: ResumeStatus) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.label}</Tag>
      ),
    },
    {
      title: '日期',
      dataIndex: 'created_at',
      width: 110,
      render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      width: 280,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />}
            onClick={() => { setSelectedRecord(record); setDetailVisible(true); }}>
            详情
          </Button>
          {canEdit(user!.role) && (
            <>
              <Button size="small" icon={<EditOutlined />}
                onClick={() => { setEditingRecord(record); form.setFieldsValue(record); setModalVisible(true); }}>
                编辑
              </Button>
              <Popconfirm
                title="确定删除此简历？"
                onConfirm={() => handleDelete(record)}
                okText="删除"
                cancelText="取消"
              >
                <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'new' && canEdit(user!.role) && (
            <Button size="small" type="primary"
              onClick={() => handleStatusChange(record.id, 'interviewing_first')}>
              推送至一面
            </Button>
          )}
          {record.status === 'pending_offer' && canEdit(user!.role) && (
            <Button size="small" type="primary" style={{ background: '#722ed1', borderColor: '#722ed1' }}
              onClick={() => { window.location.href = '/hro-system/recruitment/offer'; }}>
              发送Offer
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={2}>简历库</Title>
        <Text type="secondary">管理所有候选人简历，支持批量上传 PDF/图片自动识别字段</Text>
      </div>

      <Card>
        <div className="table-toolbar">
          <Space>
            <Input.Search
              placeholder="搜索候选人姓名/电话/邮箱"
              style={{ width: 300 }}
              onSearch={setSearchText}
              allowClear
            />
            {selectedRowKeys.length > 0 && (
              <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>
                批量删除 ({selectedRowKeys.length})
              </Button>
            )}
          </Space>
          {canEdit(user!.role) && (
            <Space>
              <Button icon={<UploadOutlined />} onClick={() => {
                setUploadModalVisible(true);
                setParseStep('upload');
                setFileList([]);
                setParseResults([]);
              }}>
                批量上传
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                setEditingRecord(null);
                form.resetFields();
                setModalVisible(true);
              }}>
                录入简历
              </Button>
            </Space>
          )}
        </div>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* 批量上传弹窗 */}
      <Modal
        title="批量上传简历"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setFileList([]);
          setParseResults([]);
          setParseStep('upload');
        }}
        width={750}
        footer={
          parseStep === 'upload' ? [
            <Button key="cancel" onClick={() => setUploadModalVisible(false)}>取消</Button>,
            <Button key="upload" type="primary" loading={uploading}
              onClick={handleBatchUpload} disabled={fileList.length === 0}>
              开始解析
            </Button>,
          ] : [
            <Button key="back" onClick={() => { setParseStep('upload'); setParseResults([]); }}>
              返回重选
            </Button>,
            <Button key="cancel" onClick={() => setUploadModalVisible(false)}>取消</Button>,
            <Button key="import" type="primary" onClick={confirmImport}>
              确认导入
            </Button>,
          ]
        }
      >
        {parseStep === 'upload' ? (
          <div>
            <Alert
              message="支持 PDF、PNG、JPG 格式"
              description={
                <span>
                  PDF 文件将自动解析文本并提取候选人信息（姓名、电话、邮箱、学历、学校等）。
                  图片文件上传后将保存为附件，字段信息需手动补充。<br />
                  <Text type="secondary">提示：文件将上传至云端存储，单文件最大 10MB</Text>
                </span>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Dragger
              multiple
              fileList={fileList}
              beforeUpload={(file) => {
                const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');
                if (!isValidType) {
                  message.error(`${file.name} 格式不支持，仅支持 PDF 和图片`);
                  return Upload.LIST_IGNORE;
                }
                const isLt10M = file.size / 1024 / 1024 < 10;
                if (!isLt10M) {
                  message.error(`${file.name} 超过 10MB 限制`);
                  return Upload.LIST_IGNORE;
                }
                setFileList((prev) => [...prev, {
                  uid: file.name + Date.now(),
                  name: file.name,
                  status: 'done',
                  originFileObj: file as any,
                } as UploadFile]);
                return false; // 阻止自动上传
              }}
              onRemove={(file) => {
                setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
              }}
              accept=".pdf,.png,.jpg,.jpeg"
              showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 PDF / PNG / JPG 格式，可一次选择多个文件
              </p>
            </Dragger>
            {fileList.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>已选择 {fileList.length} 个文件：</Text>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  {fileList.map((f) => (
                    <li key={f.uid}>
                      {f.name.startsWith('pdf') || f.name.toLowerCase().endsWith('.pdf')
                        ? <FilePdfOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                        : <FileImageOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                      }
                      {f.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div>
            <Alert
              message={`解析完成：${parseResults.filter((r) => r.status === 'success').length}/${parseResults.length} 个文件成功`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {parseResults.map((result, idx) => (
                <Card
                  key={idx}
                  size="small"
                  title={
                    <Space>
                      {result.status === 'success'
                        ? <Tag color="green">成功</Tag>
                        : <Tag color="red">失败</Tag>
                      }
                      <Text>{result.fileName}</Text>
                    </Space>
                  }
                  style={{ marginBottom: 12 }}
                >
                  {result.status === 'success' ? (
                    <Descriptions column={3} size="small" bordered>
                      <Descriptions.Item label="姓名">
                        {result.parsedFields.candidate_name || <Text type="secondary">未识别</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="性别">
                        {result.parsedFields.gender || <Text type="secondary">-</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="电话">
                        {result.parsedFields.phone || <Text type="secondary">未识别</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="邮箱">
                        {result.parsedFields.email || <Text type="secondary">未识别</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="学历">
                        {result.parsedFields.highest_education || <Text type="secondary">未识别</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="毕业院校">
                        {result.parsedFields.school || <Text type="secondary">未识别</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="专业">
                        {result.parsedFields.major || <Text type="secondary">未识别</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="期望薪资">
                        {result.parsedFields.expected_salary
                          ? `¥${result.parsedFields.expected_salary}`
                          : <Text type="secondary">未识别</Text>}
                      </Descriptions.Item>
                    </Descriptions>
                  ) : (
                    <Text type="danger">{result.error}</Text>
                  )}
                </Card>
              ))}
            </div>
            <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
              未识别的字段可在导入后通过"编辑"功能手动补充。导入后状态默认为"新收"。
            </Text>
          </div>
        )}
      </Modal>

      {/* 录入/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑简历' : '录入简历'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="candidate_name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space size="large">
            <Form.Item name="gender" label="性别">
              <Select options={[{ label: '男', value: '男' }, { label: '女', value: '女' }]} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="phone" label="电话" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="邮箱">
              <Input />
            </Form.Item>
          </Space>
          <Space size="large">
            <Form.Item name="highest_education" label="最高学历">
              <Select options={[
                { label: '博士', value: '博士' }, { label: '硕士', value: '硕士' },
                { label: '本科', value: '本科' }, { label: '大专', value: '大专' },
              ]} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="school" label="毕业院校">
              <Input style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="major" label="专业">
              <Input style={{ width: 200 }} />
            </Form.Item>
          </Space>
          <Form.Item name="source" label="简历来源">
            <Select options={[
              { label: 'Boss直聘', value: 'boss_zhipin' },
              { label: '内部推荐', value: 'internal_referral' },
              { label: '邮件投递', value: 'email' },
              { label: '其他', value: 'other' },
            ]} />
          </Form.Item>
          <Form.Item name="expected_salary" label="期望薪资">
            <Input prefix="¥" type="number" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal title="简历详情" open={detailVisible} onCancel={() => setDetailVisible(false)}
        footer={null} width={600}>
        {selectedRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="姓名">{selectedRecord.candidate_name}</Descriptions.Item>
            <Descriptions.Item label="性别">{selectedRecord.gender || '-'}</Descriptions.Item>
            <Descriptions.Item label="电话">{selectedRecord.phone}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{selectedRecord.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="学历">{selectedRecord.highest_education || '-'}</Descriptions.Item>
            <Descriptions.Item label="毕业院校">{selectedRecord.school || '-'}</Descriptions.Item>
            <Descriptions.Item label="专业">{selectedRecord.major || '-'}</Descriptions.Item>
            <Descriptions.Item label="来源">{selectedRecord.source}</Descriptions.Item>
            <Descriptions.Item label="期望薪资">{selectedRecord.expected_salary ? `¥${selectedRecord.expected_salary}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[selectedRecord.status as ResumeStatus]?.color}>
                {statusMap[selectedRecord.status as ResumeStatus]?.label}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ResumeLibPage;
