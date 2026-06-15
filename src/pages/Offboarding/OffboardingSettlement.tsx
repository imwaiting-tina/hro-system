import React, { useEffect, useState, useMemo } from 'react';
import {
  Card, Typography, Descriptions, Button, Space, Badge, Tag,
  Table, Statistic, Row, Col, Divider, InputNumber, Input, message,
  Modal, Result, Alert, Steps
} from 'antd';
import {
  ArrowLeftOutlined, DollarOutlined, CalculatorOutlined,
  CheckCircleOutlined, FileTextOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore, canEdit } from '../../stores/authStore';
import supabase from '../../utils/supabase';
import type { OffboardingCase, OffboardingHandoverItem, OffboardingSettlement } from '../../types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const OffboardingSettlementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [caseData, setCaseData] = useState<OffboardingCase | null>(null);
  const [items, setItems] = useState<OffboardingHandoverItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 结算表单参数
  const [monthlySalary, setMonthlySalary] = useState<number>(0);
  const [serviceYears, setServiceYears] = useState<number>(0);
  const [finalSalary, setFinalSalary] = useState<number>(0);
  const [unusedAnnualLeave, setUnusedAnnualLeave] = useState<number>(0);
  const [compensation, setCompensation] = useState<number>(0);
  const [settlementBy, setSettlementBy] = useState('');

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: caseResult } = await supabase
        .from('offboarding_cases')
        .select('*, employees!inner(name, employee_no, department, position, monthly_salary, entry_date)')
        .eq('id', id)
        .single();

      if (caseResult) {
        setCaseData({
          ...caseResult,
          employee_name: caseResult.employees?.name || '',
          employee_department: caseResult.employees?.department || '',
          employee_position: caseResult.employees?.position || '',
          employee_no: caseResult.employees?.employee_no || '',
        });

        // 预设值
        const ms = caseResult.employees?.monthly_salary || 0;
        setMonthlySalary(ms);
        setFinalSalary(ms); // 应发工资默认等于月薪

        // 计算司龄
        if (caseResult.employees?.entry_date) {
          const entryDate = dayjs(caseResult.employees.entry_date);
          const lastDay = caseResult.last_working_day ? dayjs(caseResult.last_working_day) : dayjs();
          const years = lastDay.diff(entryDate, 'year', true);
          setServiceYears(Math.round(years * 10) / 10);
        }

        // 如果有已保存的结算数据，回填
        if (caseResult.settlement_data) {
          const sd = caseResult.settlement_data as OffboardingSettlement;
          setMonthlySalary(sd.monthly_salary || 0);
          setFinalSalary(sd.final_salary || 0);
          setUnusedAnnualLeave(sd.unused_annual_leave_days || 0);
          setCompensation(sd.compensation_amount || 0);
          setServiceYears(sd.service_years || 0);
        }
      }

      // 加载交接项
      const { data: itemResult } = await supabase
        .from('offboarding_handover_items')
        .select('*')
        .eq('case_id', id)
        .order('sort_order');

      if (itemResult) setItems(itemResult);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  // 计算结算金额
  const settlementCalc = useMemo(() => {
    const annualLeaveComp = monthlySalary > 0 ? Math.round((monthlySalary / 21.75) * unusedAnnualLeave * 100) / 100 : 0;
    // N+1 经济补偿金：司龄(取整向上) * 月薪 + 1个月代通知金
    const nPlusOne = monthlySalary > 0 ? Math.round((Math.ceil(serviceYears) * monthlySalary + monthlySalary) * 100) / 100 : 0;
    const total = Math.round((finalSalary + annualLeaveComp + nPlusOne + compensation) * 100) / 100;

    return { annualLeaveComp, nPlusOne, total };
  }, [monthlySalary, finalSalary, unusedAnnualLeave, serviceYears, compensation]);

  // 执行结算
  const handleSettle = () => {
    Modal.confirm({
      title: '确认执行结算',
      content: (
        <div>
          <Paragraph>结算总额：<Text strong style={{ fontSize: 18, color: '#f5222d' }}>¥{settlementCalc.total.toLocaleString()}</Text></Paragraph>
          <Paragraph type="secondary">结算后将更新离职单状态为"已结算"，操作不可撤销。</Paragraph>
        </div>
      ),
      onOk: async () => {
        const settlementData: OffboardingSettlement = {
          final_salary: finalSalary,
          unused_annual_leave_days: unusedAnnualLeave,
          annual_leave_compensation: settlementCalc.annualLeaveComp,
          service_years: serviceYears,
          monthly_salary: monthlySalary,
          n_plus_one: settlementCalc.nPlusOne,
          compensation_amount: compensation,
          total_settlement: settlementCalc.total,
        };

        const { error } = await supabase
          .from('offboarding_cases')
          .update({
            status: 'settled',
            settlement_data: settlementData,
            settlement_by: user?.id,
            settled_at: new Date().toISOString(),
            compensation_amount: compensation,
          })
          .eq('id', id);

        if (error) {
          message.error('结算失败：' + error.message);
          return;
        }
        message.success('结算完成！');
        fetchData();
      },
    });
  };

  // 关闭流程
  const handleClose = () => {
    Modal.confirm({
      title: '确认关闭离职流程',
      content: '关闭后离职单将归档，不可再修改。',
      onOk: async () => {
        await supabase
          .from('offboarding_cases')
          .update({ status: 'closed' })
          .eq('id', id);
        message.success('离职流程已关闭');
        fetchData();
      },
    });
  };

  const confirmedCount = items.filter((i) => i.status === 'confirmed').length;
  const allHandoverDone = items.length > 0 && confirmedCount === items.length;

  if (loading) return null;

  if (!caseData) {
    return (
      <Card>
        <Result status="404" title="离职单不存在"
          extra={<Button onClick={() => navigate('/offboarding/list')}>返回列表</Button>} />
      </Card>
    );
  }

  const isSettled = caseData.status === 'settled' || caseData.status === 'closed';
  const isClosed = caseData.status === 'closed';

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/offboarding/list')}>
          返回列表
        </Button>
      </div>

      {/* 员工信息 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={4} size="small">
          <Descriptions.Item label="员工">{caseData.employee_name}</Descriptions.Item>
          <Descriptions.Item label="工号">{caseData.employee_no}</Descriptions.Item>
          <Descriptions.Item label="部门">{caseData.employee_department}</Descriptions.Item>
          <Descriptions.Item label="职位">{caseData.employee_position}</Descriptions.Item>
          <Descriptions.Item label="最后工作日">
            {caseData.last_working_day ? dayjs(caseData.last_working_day).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="司龄">{serviceYears} 年</Descriptions.Item>
          <Descriptions.Item label="交接进度">
            {items.length > 0
              ? `${confirmedCount}/${items.length} 项已确认`
              : '暂无交接项'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Badge
              status={isClosed ? 'success' : isSettled ? 'processing' : 'warning'}
              text={isClosed ? '已关闭' : isSettled ? '已结算' : '交接中'}
            />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 交接未完成警告 */}
      {!allHandoverDone && !isSettled && (
        <Alert
          message="交接未完成"
          description={`还有 ${items.length - confirmedCount} 项交接未确认，建议完成所有交接后再执行结算。`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 结算计算器 */}
      <Card
        title={<Space><CalculatorOutlined />离职结算计算</Space>}
        style={{ marginBottom: 16 }}
      >
        <Row gutter={24}>
          <Col span={12}>
            {!isSettled ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>月薪（元）</Text>
                  <InputNumber
                    style={{ width: '100%', marginTop: 4 }}
                    value={monthlySalary}
                    onChange={(v) => setMonthlySalary(v || 0)}
                    min={0}
                    precision={2}
                    prefix="¥"
                    placeholder="员工月薪"
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>司龄（年）</Text>
                  <InputNumber
                    style={{ width: '100%', marginTop: 4 }}
                    value={serviceYears}
                    onChange={(v) => setServiceYears(v || 0)}
                    min={0}
                    precision={1}
                    placeholder="入职至今的年数"
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>应发工资（元）</Text>
                  <InputNumber
                    style={{ width: '100%', marginTop: 4 }}
                    value={finalSalary}
                    onChange={(v) => setFinalSalary(v || 0)}
                    min={0}
                    precision={2}
                    prefix="¥"
                    placeholder="最后一个月应发工资"
                  />
                </div>
              </>
            ) : caseData.settlement_data && (
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="月薪">¥{monthlySalary.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="司龄">{serviceYears} 年</Descriptions.Item>
                <Descriptions.Item label="应发工资">¥{finalSalary.toLocaleString()}</Descriptions.Item>
              </Descriptions>
            )}
          </Col>
          <Col span={12}>
            {!isSettled ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>未休年假（天）</Text>
                  <InputNumber
                    style={{ width: '100%', marginTop: 4 }}
                    value={unusedAnnualLeave}
                    onChange={(v) => setUnusedAnnualLeave(v || 0)}
                    min={0}
                    max={30}
                    placeholder="未休年假天数"
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>额外补偿金（元）</Text>
                  <InputNumber
                    style={{ width: '100%', marginTop: 4 }}
                    value={compensation}
                    onChange={(v) => setCompensation(v || 0)}
                    min={0}
                    precision={2}
                    prefix="¥"
                    placeholder="额外协商补偿金"
                  />
                </div>
              </>
            ) : caseData.settlement_data && (
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="未休年假">{caseData.settlement_data.unused_annual_leave_days} 天</Descriptions.Item>
                <Descriptions.Item label="额外补偿金">¥{compensation.toLocaleString()}</Descriptions.Item>
              </Descriptions>
            )}
          </Col>
        </Row>

        <Divider />

        {/* 计算结果 */}
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="未休年假折算"
              value={settlementCalc.annualLeaveComp}
              precision={2}
              prefix="¥"
              suffix={`(${unusedAnnualLeave}天 × ¥${monthlySalary > 0 ? Math.round(monthlySalary / 21.75 * 100) / 100 : 0}/天)`}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="N+1 经济补偿金"
              value={settlementCalc.nPlusOne}
              precision={2}
              prefix="¥"
              suffix={`(${Math.ceil(serviceYears)}+1) × ¥${monthlySalary.toLocaleString()}`}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="应发工资"
              value={finalSalary}
              precision={2}
              prefix="¥"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="结算总额"
              value={settlementCalc.total}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322', fontSize: 28 }}
            />
          </Col>
        </Row>

        <Divider />

        {/* 操作按钮 */}
        {!isSettled && user && canEdit(user.role) && (
          <Space size="middle">
            <Button
              type="primary"
              size="large"
              icon={<DollarOutlined />}
              onClick={handleSettle}
            >
              确认结算
            </Button>
            {!allHandoverDone && (
              <Text type="secondary">⚠ 建议完成交接后再结算</Text>
            )}
          </Space>
        )}

        {isSettled && !isClosed && user && canEdit(user.role) && (
          <Space size="middle">
            <Alert
              message="结算已完成"
              description={`结算总额：¥${settlementCalc.total.toLocaleString()}，操作人：${user.display_name}`}
              type="success"
              showIcon
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleClose}
            >
              关闭流程，归档
            </Button>
          </Space>
        )}

        {isClosed && (
          <Result
            status="success"
            title="离职流程已完成"
            subTitle={`结算总额：¥${settlementCalc.total.toLocaleString()}，流程已关闭归档`}
          />
        )}
      </Card>

      {/* 交接项一览 */}
      {items.length > 0 && (
        <Card title="交接清单确认" size="small">
          <Table
            dataSource={items}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
              { title: '序号', width: 60, render: (_: any, __: any, i: number) => i + 1 },
              {
                title: '类型', dataIndex: 'item_type', width: 100,
                render: (t: string) => (
                  <Tag color={t === 'asset' ? '#1890ff' : t === 'knowledge' ? '#722ed1' : '#13c2c2'}>
                    {t === 'asset' ? '资产' : t === 'knowledge' ? '知识' : '财务'}
                  </Tag>
                ),
              },
              { title: '内容', dataIndex: 'description' },
              {
                title: '状态', dataIndex: 'status', width: 100,
                render: (s: string) => (
                  s === 'confirmed'
                    ? <Badge status="success" text="已确认" />
                    : <Badge status="default" text="待确认" />
                ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
};

export default OffboardingSettlementPage;
