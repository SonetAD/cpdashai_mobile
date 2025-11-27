import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import TalentPartnerLayout from '../../../components/layouts/TalentPartnerLayout';

interface ReportsScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

// Report Card Component
interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  formats: ('PDF' | 'CSV' | 'XLSX')[];
  downloadCount?: number;
  lastGenerated?: string;
  onDownload: (format: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  description,
  icon,
  formats,
  downloadCount,
  lastGenerated,
  onDownload,
}) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (format: string) => {
    setDownloading(format);
    await onDownload(format);
    setTimeout(() => setDownloading(null), 1500);
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'PDF':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' };
      case 'CSV':
        return { bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD' };
      case 'XLSX':
        return { bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' };
    }
  };

  return (
    <View
      className="bg-white rounded-3xl p-5 mb-4"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      {/* Header */}
      <View className="flex-row items-start mb-4">
        <View
          className="rounded-2xl p-3 mr-4"
          style={{
            backgroundColor: '#437EF415',
          }}
        >
          {icon}
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 text-lg font-bold mb-1">{title}</Text>
          <Text className="text-gray-500 text-sm leading-5">{description}</Text>
        </View>
      </View>

      {/* Stats */}
      {(downloadCount !== undefined || lastGenerated) && (
        <View className="flex-row mb-4 pb-4 border-b border-gray-100">
          {downloadCount !== undefined && (
            <View className="flex-1">
              <Text className="text-gray-400 text-xs mb-1">Downloads</Text>
              <Text className="text-gray-900 text-sm font-bold">{downloadCount}</Text>
            </View>
          )}
          {lastGenerated && (
            <View className="flex-1">
              <Text className="text-gray-400 text-xs mb-1">Last Generated</Text>
              <Text className="text-gray-900 text-sm font-bold">{lastGenerated}</Text>
            </View>
          )}
        </View>
      )}

      {/* Download Buttons */}
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {formats.map((format) => {
          const colors = getFormatColor(format);
          const isDownloading = downloading === format;

          return (
            <TouchableOpacity
              key={format}
              onPress={() => handleDownload(format)}
              disabled={isDownloading}
              className="rounded-xl px-5 py-2.5 flex-row items-center"
              style={{
                backgroundColor: colors.bg,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: isDownloading ? 0.7 : 1,
              }}
              activeOpacity={0.7}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                  <Path
                    d="M12 3 L12 16 M12 16 L7 11 M12 16 L17 11"
                    stroke={colors.text}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M3 17 L3 19 C3 20.1046 3.89543 21 5 21 L19 21 C20.1046 21 21 20.1046 21 19 L21 17"
                    stroke={colors.text}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}
              <Text
                className="font-bold text-xs"
                style={{ color: colors.text }}
              >
                {isDownloading ? 'Downloading...' : format}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Quick Stats Card
const QuickStatsCard = () => {
  return (
    <View
      className="rounded-3xl p-6 mb-6"
      style={{
        shadowColor: '#437EF4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
        backgroundColor: '#437EF4',
      }}
    >
      <Text className="text-white text-xl font-bold mb-4">Export Center</Text>
      <Text className="text-white/90 text-sm mb-6">
        Download insights fast—all exports generated instantly
      </Text>

      <View className="flex-row justify-between">
        <View className="flex-1">
          <Text className="text-white/80 text-xs mb-1">Total Reports</Text>
          <Text className="text-white text-2xl font-bold">156</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white/80 text-xs mb-1">This Month</Text>
          <Text className="text-white text-2xl font-bold">24</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white/80 text-xs mb-1">Avg. Speed</Text>
          <Text className="text-white text-2xl font-bold">2.3s</Text>
        </View>
      </View>
    </View>
  );
};

export default function ReportsScreen({
  activeTab = 'reports',
  onTabChange,
}: ReportsScreenProps) {
  const handleDownload = async (reportName: string, format: string) => {
    console.log(`Downloading ${reportName} as ${format}`);
    // Simulate download
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  return (
    <TalentPartnerLayout
      title="Reports & Analytics"
      subtitle="Export your data anytime"
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="px-6 pt-4">
          {/* Quick Stats */}
          <QuickStatsCard />

          {/* Reports Section */}
          <Text className="text-gray-900 text-xl font-bold mb-4">Available Reports</Text>

          {/* Cohort Performance Report */}
          <ReportCard
            title="Cohort Performance Report"
            description="Comprehensive analysis of candidate cohort performance, readiness scores, and engagement metrics"
            icon={
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 22H21M5 18V12C5 11.45 5.45 11 6 11H8C8.55 11 9 11.45 9 12V18M11 18V7C11 6.45 11.45 6 12 6H14C14.55 6 15 6.45 15 7V18M17 18V4C17 3.45 17.45 3 18 3H20C20.55 3 21 3.45 21 4V18"
                  stroke="#437EF4"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            formats={['PDF', 'CSV', 'XLSX']}
            downloadCount={42}
            lastGenerated="2h ago"
            onDownload={(format) => handleDownload('Cohort Performance', format)}
          />

          {/* Talent Pipeline Report */}
          <ReportCard
            title="Talent Pipeline Analytics"
            description="Track candidate journey from application to hire with detailed funnel analysis"
            icon={
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9.75 3.104v5.714a2.09 2.09 0 01-.659 1.5L3 16.5M14.25 3.104v5.714a2.09 2.09 0 001.659 1.5L21 16.5"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M12 21V16.5M12 3V8.5"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            formats={['PDF', 'XLSX']}
            downloadCount={28}
            lastGenerated="5h ago"
            onDownload={(format) => handleDownload('Talent Pipeline', format)}
          />

          {/* Employer Onboarding Report */}
          <ReportCard
            title="Employer Onboarding Report"
            description="Track employer engagement, job postings, and candidate matching success rates"
            icon={
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M8 22H16C20 22 22 20 22 16V8C22 4 20 2 16 2H8C4 2 2 4 2 8V16C2 20 4 22 8 22Z"
                  stroke="#F59E0B"
                  strokeWidth={2}
                />
                <Path
                  d="M15.5 9.75C16.19 10.45 16.19 11.55 15.5 12.25L12.56 15.19C11.86 15.88 10.76 15.88 10.06 15.19L8.5 13.63"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            }
            formats={['PDF', 'CSV']}
            downloadCount={18}
            lastGenerated="1d ago"
            onDownload={(format) => handleDownload('Employer Onboarding', format)}
          />

          {/* First 90-Day Performance */}
          <ReportCard
            title="First 90-Day Performance Report"
            description="Monitor new hire performance, engagement signals, and early success indicators"
            icon={
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="9" stroke="#8B5CF6" strokeWidth={2} />
                <Path
                  d="M12 7V12L15 15"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            }
            formats={['PDF', 'CSV']}
            downloadCount={35}
            lastGenerated="3h ago"
            onDownload={(format) => handleDownload('90-Day Performance', format)}
          />

          {/* ROI Report */}
          <ReportCard
            title="ROI & Cost Analysis"
            description="Financial impact analysis, cost per hire, and recruitment ROI metrics"
            icon={
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth={2} />
                <Path
                  d="M12 6V12M12 12V18M12 12H18M12 12H6"
                  stroke="#DC2626"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            }
            formats={['PDF', 'XLSX']}
            downloadCount={15}
            lastGenerated="1d ago"
            onDownload={(format) => handleDownload('ROI Analysis', format)}
          />

          {/* Diversity & Inclusion Report */}
          <ReportCard
            title="Diversity & Inclusion Metrics"
            description="Track diversity hiring goals, inclusion metrics, and demographic insights"
            icon={
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 2C6.38 2 4.25 4.13 4.25 6.75C4.25 9.32 6.26 11.4 8.88 11.49C9.12 11.49 9.13 11.49 9.15 11.49C11.73 11.4 13.74 9.32 13.75 6.75C13.75 4.13 11.62 2 9 2Z"
                  fill="#EC4899"
                />
                <Path
                  d="M14.08 14.15C11.29 12.29 6.74 12.29 3.93 14.15C2.66 15 1.96 16.15 1.96 17.38C1.96 18.61 2.66 19.75 3.92 20.59C5.32 21.53 7.16 22 9 22C10.84 22 12.68 21.53 14.08 20.59"
                  stroke="#EC4899"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                <Circle cx="18" cy="8" r="3" stroke="#EC4899" strokeWidth={2} />
              </Svg>
            }
            formats={['PDF', 'CSV', 'XLSX']}
            downloadCount={22}
            lastGenerated="6h ago"
            onDownload={(format) => handleDownload('Diversity Metrics', format)}
          />
        </View>
      </ScrollView>
    </TalentPartnerLayout>
  );
}
