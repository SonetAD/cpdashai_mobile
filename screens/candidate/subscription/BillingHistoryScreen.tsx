import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Rect } from 'react-native-svg';
import { useGetBillingHistoryQuery, useGetMySubscriptionQuery, useCheckSubscriptionStatusQuery, Invoice } from '../../../services/api';
import { useAlert } from '../../../contexts/AlertContext';
import LogoWhite from '../../../assets/images/logoWhite.svg';

interface BillingHistoryScreenProps {
  onBack?: () => void;
}

// Back arrow icon
const BackArrowIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke="#1F2937" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Invoice icon
const InvoiceIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="2" width="16" height="20" rx="2" stroke="#2563EB" strokeWidth={2} />
    <Path d="M8 6h8M8 10h8M8 14h4" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// Download icon
const DownloadIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 10l5 5 5-5M12 15V3" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// External link icon
const ExternalLinkIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="#6B7280" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Empty state icon
const EmptyInvoiceIcon = () => (
  <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="2" width="16" height="20" rx="2" stroke="#D1D5DB" strokeWidth={1.5} />
    <Path d="M8 6h8M8 10h8M8 14h4" stroke="#D1D5DB" strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

// Format currency
const formatCurrency = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  });
  return formatter.format(amount / 100); // Stripe amounts are in cents
};

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Get status badge color
const getStatusColor = (status: string): { bg: string; text: string } => {
  switch (status.toLowerCase()) {
    case 'paid':
      return { bg: '#ECFDF5', text: '#059669' };
    case 'open':
      return { bg: '#FEF3C7', text: '#D97706' };
    case 'void':
    case 'uncollectible':
      return { bg: '#FEF2F2', text: '#DC2626' };
    case 'draft':
      return { bg: '#F3F4F6', text: '#6B7280' };
    default:
      return { bg: '#F3F4F6', text: '#6B7280' };
  }
};

interface InvoiceCardProps {
  invoice: Invoice;
  onViewInvoice: (url: string) => void;
  onDownloadPdf: (url: string) => void;
}

// Credit card icon
const CreditCardIcon = ({ brand }: { brand: string }) => {
  const brandColor = brand.toLowerCase() === 'visa' ? '#1A1F71' :
                     brand.toLowerCase() === 'mastercard' ? '#EB001B' :
                     brand.toLowerCase() === 'amex' ? '#006FCF' : '#6B7280';
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={brandColor} strokeWidth={2} />
      <Path d="M2 10h20" stroke={brandColor} strokeWidth={2} />
    </Svg>
  );
};

const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onViewInvoice, onDownloadPdf }) => {
  const statusColors = getStatusColor(invoice.status);
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
      }}
    >
      <View style={{ padding: 16 }}>
        {/* Header Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
              Invoice {invoice.number || `#${invoice.id.slice(-8)}`}
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              {formatDate(invoice.created)}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: statusColors.bg,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: statusColors.text, textTransform: 'capitalize' }}>
              {invoice.status}
            </Text>
          </View>
        </View>

        {/* Total Amount */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#2563EB' }}>
            {formatCurrency(invoice.total, invoice.currency)}
          </Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
            {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
          </Text>
        </View>

        {/* Payment Method */}
        {invoice.paymentMethod && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8 }}>
            <CreditCardIcon brand={invoice.paymentMethod.brand} />
            <Text style={{ fontSize: 13, color: '#374151', marginLeft: 8, textTransform: 'capitalize' }}>
              {invoice.paymentMethod.brand} **** {invoice.paymentMethod.last4}
            </Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }}>
              {invoice.paymentMethod.expMonth}/{invoice.paymentMethod.expYear}
            </Text>
          </View>
        )}

        {/* Expandable Details */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setExpanded(!expanded);
          }}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#2563EB' }}>
            {expanded ? 'Hide Details' : 'Show Details'}
          </Text>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ marginLeft: 4, transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
            <Path d="M6 9l6 6 6-6" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        {expanded && (
          <View style={{ marginBottom: 12 }}>
            {/* Line Items */}
            {invoice.lineItems && invoice.lineItems.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' }}>
                  Items
                </Text>
                {invoice.lineItems.map((item, index) => (
                  <View key={item.id || index} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: index < invoice.lineItems.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, color: '#374151' }}>{item.description}</Text>
                      {item.quantity > 1 && (
                        <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Qty: {item.quantity}</Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#1F2937' }}>
                      {formatCurrency(item.amount, item.currency)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Subtotal, Tax, Discount, Total */}
            <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 13, color: '#6B7280' }}>Subtotal</Text>
                <Text style={{ fontSize: 13, color: '#374151' }}>{formatCurrency(invoice.subtotal, invoice.currency)}</Text>
              </View>
              {invoice.discount !== null && invoice.discount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, color: '#059669' }}>Discount</Text>
                  <Text style={{ fontSize: 13, color: '#059669' }}>-{formatCurrency(invoice.discount, invoice.currency)}</Text>
                </View>
              )}
              {invoice.tax !== null && invoice.tax > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>Tax</Text>
                  <Text style={{ fontSize: 13, color: '#374151' }}>{formatCurrency(invoice.tax, invoice.currency)}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, marginTop: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>Total</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#2563EB' }}>{formatCurrency(invoice.total, invoice.currency)}</Text>
              </View>
              {invoice.amountDue > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ fontSize: 13, color: '#DC2626' }}>Amount Due</Text>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#DC2626' }}>{formatCurrency(invoice.amountDue, invoice.currency)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {invoice.invoiceUrl && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onViewInvoice(invoice.invoiceUrl!);
              }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#EFF6FF',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
              }}
              activeOpacity={0.7}
            >
              <ExternalLinkIcon />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#2563EB', marginLeft: 6 }}>
                View
              </Text>
            </TouchableOpacity>
          )}
          {invoice.invoicePdf && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onDownloadPdf(invoice.invoicePdf!);
              }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F3F4F6',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
              }}
              activeOpacity={0.7}
            >
              <DownloadIcon />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#2563EB', marginLeft: 6 }}>
                PDF
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default function BillingHistoryScreen({ onBack }: BillingHistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [lastInvoiceId, setLastInvoiceId] = useState<string | undefined>(undefined);
  const [hasMoreData, setHasMoreData] = useState(true);

  const { showAlert } = useAlert();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useGetBillingHistoryQuery({ limit: 10 });

  // Get subscription queries for refresh
  const { refetch: refetchSubscription } = useGetMySubscriptionQuery();
  const { refetch: refetchSubscriptionStatus } = useCheckSubscriptionStatusQuery();

  // Update invoices when data changes
  React.useEffect(() => {
    if (data?.billingHistory?.invoices) {
      setAllInvoices(data.billingHistory.invoices);
      setHasMoreData(data.billingHistory.hasMore);
      if (data.billingHistory.invoices.length > 0) {
        setLastInvoiceId(data.billingHistory.invoices[data.billingHistory.invoices.length - 1].id);
      }
    }
  }, [data]);

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      // Refresh all data
      await Promise.all([
        refetch(),
        refetchSubscription(),
        refetchSubscriptionStatus(),
      ]);
      setLastInvoiceId(undefined);
    } catch (err) {
      console.error('Error refreshing billing history:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchSubscription, refetchSubscriptionStatus]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack?.();
  };

  const handleViewInvoice = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showAlert({
          type: 'error',
          title: 'Unable to Open',
          message: 'Could not open the invoice. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (err) {
      console.error('Error opening invoice URL:', err);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while opening the invoice.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const handleDownloadPdf = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showAlert({
          type: 'error',
          title: 'Unable to Download',
          message: 'Could not download the PDF. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while downloading the PDF.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <InvoiceCard
      invoice={item}
      onViewInvoice={handleViewInvoice}
      onDownloadPdf={handleDownloadPdf}
    />
  );

  const renderEmptyState = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
      <EmptyInvoiceIcon />
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937', marginTop: 16, marginBottom: 8 }}>
        No Invoices Yet
      </Text>
      <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 40 }}>
        Your billing history will appear here once you make a payment.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMoreData) return null;
    if (loadingMore) {
      return (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#2563EB" />
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }} edges={['top']}>
      {/* Blue Header */}
      <LinearGradient
        colors={['#437EF4', '#3B71E0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LogoWhite width={48} height={48} />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: 'white' }}>
              Billing History
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.85)', marginTop: 2 }}>
              View your past invoices
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Back Navigation Section */}
      <View
        style={{
          backgroundColor: '#F3F4F6',
          paddingHorizontal: 20,
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <BackArrowIcon />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937', marginLeft: 8 }}>
            Billing History
          </Text>
        </TouchableOpacity>
        {data?.billingHistory?.totalCount !== undefined && data.billingHistory.totalCount > 0 && (
          <View
            style={{
              backgroundColor: '#EFF6FF',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              marginLeft: 'auto',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#2563EB' }}>
              {data.billingHistory.totalCount} {data.billingHistory.totalCount === 1 ? 'invoice' : 'invoices'}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={{ color: '#6B7280', marginTop: 16, fontSize: 15 }}>
            Loading billing history...
          </Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}>
          <View
            style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 16,
              padding: 20,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#991B1B', marginBottom: 8 }}>
              Unable to Load Billing History
            </Text>
            <Text style={{ fontSize: 14, color: '#DC2626', marginBottom: 16 }}>
              We couldn't fetch your billing history. Please check your internet connection and try again.
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                refetch();
              }}
              style={{
                backgroundColor: '#DC2626',
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 20,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={allInvoices}
          renderItem={renderInvoice}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 24,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2563EB']}
              tintColor="#2563EB"
            />
          }
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
        />
      )}
    </SafeAreaView>
  );
}
