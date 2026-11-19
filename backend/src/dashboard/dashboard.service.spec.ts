import { ChattersService } from '../chatters/chatters.service';
import { CreatorsService } from '../creators/creators.service';
import { EarningsService } from '../earnings/earnings.service';
import { InflowwService } from '../infloww/infloww.service';
import { TrackingLinksService } from '../tracking-links/tracking-links.service';
import { DashboardService } from './dashboard.service';

describe('Business Calculations & Data Accuracy (Phase 6 Verification)', () => {
  let inflowwServiceMock: Partial<InflowwService>;
  let creatorsService: CreatorsService;
  let chattersService: ChattersService;
  let earningsService: EarningsService;
  let trackingLinksService: TrackingLinksService;
  let dashboardService: DashboardService;

  beforeEach(() => {
    inflowwServiceMock = {
      clearCache: () => undefined,
      getAllCreatorsWithFallback: async () => ({
        allCreatorsScopeAvailable: true,
        creators: [
          {
            id: '101',
            name: 'Aria Vance',
            nickName: 'Aria',
            userName: 'ariavance',
            tagName: 'VIP',
            status: 'connected',
            platformPid: 5001,
            createdTime: '1760000000000',
          },
          {
            id: '102',
            name: 'Chloe Sterling',
            nickName: 'Chloe',
            userName: 'chloesterling',
            tagName: 'Top',
            status: 'connected',
            platformPid: 5002,
            createdTime: '1760000000000',
          },
        ],
      }),
      getEmployees: async () => [
        {
          employeeId: 901,
          employeeName: 'Alex Mercer',
          status: 'Activated',
          createdTime: '1760000000000',
        },
        {
          employeeId: 902,
          employeeName: 'Jordan Blake',
          status: 'Deactivated',
          createdTime: '1760000000000',
        },
      ],
      getAllCreatorsTransactions: async () => [
        {
          id: 'tx1',
          transactionId: 'of_tx_1',
          creatorId: '101',
          fanId: 'fan_1',
          fanName: 'Fan One',
          platformPid: 5001,
          createdTime: '1762000000000',
          type: 'Subscription',
          status: 'done',
          amount: '10000', // $100.00 in cents
          fee: '2000', // $20.00
          net: '8000', // $80.00
          currency: 'USD',
        },
        {
          id: 'tx2',
          transactionId: 'of_tx_2',
          creatorId: '101',
          fanId: 'fan_2',
          fanName: 'Fan Two',
          platformPid: 5001,
          createdTime: '1762086400000',
          type: 'Messages',
          tipSource: 'Chat',
          status: 'done',
          amount: '5000', // $50.00 in cents
          fee: '1000', // $10.00
          net: '4000', // $40.00
          currency: 'USD',
        },
        {
          id: 'tx3',
          transactionId: 'of_tx_3',
          creatorId: '102',
          fanId: 'fan_3',
          fanName: 'Fan Three',
          platformPid: 5002,
          createdTime: '1762086400000',
          type: 'Tips',
          tipSource: 'Chat',
          status: 'done',
          amount: '5000', // $50.00 in cents
          fee: '1000', // $10.00
          net: '4000', // $40.00
          currency: 'USD',
        },
      ],
      getAllCreatorsRefunds: async () => [
        {
          id: 'ref1',
          transactionId: 'of_tx_99',
          creatorId: '101',
          fanId: 'fan_9',
          paymentTime: '1762000000000',
          refundTime: '1762050000000',
          paymentStatus: 'undo',
          paymentAmount: 1000, // $10.00 in cents
          transactionType: 'tips',
          currency: 'USD',
        },
      ],
      getCreatorsFansCount: async () => [
        {
          platformPid: 5001,
          date: '2026-11-10',
          activeFans: 120,
          expiredFans: 30,
        },
        // Creator 102 (platformPid 5002) intentionally has no fan report row to test null preservation
      ],
      getCreatorsSubscriberCount: async () => [
        {
          platformPid: 5001,
          date: '2026-11-10',
          newSubscribers: 15,
          subscriberRenewals: 40,
        },
      ],
      getEmployeesSalesSummary: async () => [
        {
          employeeId: 901,
          date: '2026-11-10',
          platformPid: 5001,
          salesAmount: 9000, // $90.00
          ppvSalesAmount: 6000, // $60.00
          tipsSalesAmount: 3000, // $30.00
          directMessageSalesAmount: 6000,
          priorityMassMessageSalesAmount: 0,
          massMessageSalesAmount: 0,
          currency: 'USD',
        },
      ],
      getEmployeesChatSummary: async () => [
        {
          employeeId: 901,
          date: '2026-11-10',
          platformPid: 5001,
          directMessagesSent: 100,
          directPpvsSent: 20,
          goldenRatio: '20',
          ppvsUnlocked: 4,
          unlockRate: '20',
          fansChatted: 35,
          characterCount: 4200,
          responseTimeBasedOnClockedHours: 45000,
          responseTimeBasedOnScheduledHours: 50000,
        },
      ],
      getAllCreatorsLinks: async () => [
        {
          id: '3001',
          linkType: 'TRACKING',
          creatorId: '101',
          creatorName: 'Aria Vance',
          creatorUserName: 'ariavance',
          name: 'Instagram Bio Link',
          code: 'ig2026',
          clickCount: 200,
          subCount: 25,
          payingFansCount: 18,
          earningsGross: 45000, // $450.00
          earningsNet: 36000, // $360.00
          currency: 'USD',
          createdTime: '1761000000000',
        },
        {
          id: '2001',
          linkType: 'TRIAL',
          creatorId: '102',
          creatorName: 'Chloe Sterling',
          creatorUserName: 'chloesterling',
          name: 'VIP 7-Day Free Trial',
          code: 'vip7',
          subCount: 10,
          payingFansCount: 4,
          earningsGross: 10000, // $100.00
          earningsNet: 8000, // $80.00
          currency: 'USD',
          createdTime: '1761000000000',
        },
      ],
    };

    const svc = inflowwServiceMock as InflowwService;
    creatorsService = new CreatorsService(svc);
    chattersService = new ChattersService(svc);
    earningsService = new EarningsService(svc);
    trackingLinksService = new TrackingLinksService(svc);
    dashboardService = new DashboardService(
      svc,
      creatorsService,
      chattersService,
      earningsService,
      trackingLinksService,
    );
  });

  it('computes accurate Agency Overview KPIs from cents to dollars', async () => {
    const res = await dashboardService.getOverview({
      startDate: '2026-11-01',
      endDate: '2026-11-15',
    });

    // Total Gross: $100 + $50 + $50 = $200.00
    expect(res.kpis.totalRevenueGross).toBe(200);
    // Total Net: $80 + $40 + $40 = $160.00
    expect(res.kpis.totalRevenueNet).toBe(160);
    // Total Fees: $20 + $10 + $10 = $40.00
    expect(res.kpis.totalFees).toBe(40);
    // Total Refunds: $10.00
    expect(res.kpis.totalRefunds).toBe(10);
    // Connected Creators: 2 -> Avg Revenue per Creator = $200 / 2 = $100.00
    expect(res.kpis.totalCreators).toBe(2);
    expect(res.kpis.averageRevenuePerCreator).toBe(100);
    // Active Chatters: 1 Activated out of 2 total employees
    expect(res.kpis.activeChatters).toBe(1);
    expect(res.kpis.totalEmployees).toBe(2);
    // Total Active Fans: 120
    expect(res.kpis.totalFans).toBe(120);
    expect(res.kpis.totalTransactions).toBe(3);
  });

  it('distinguishes actual 0 from missing fan report data (null) in CreatorsService', async () => {
    const res = await creatorsService.getCreatorsList({
      startDate: '2026-11-01',
      endDate: '2026-11-15',
    });

    const aria = res.items.find((c) => c.id === '101')!;
    const chloe = res.items.find((c) => c.id === '102')!;

    expect(aria.totalEarningsGross).toBe(150);
    expect(aria.subscriptionRevenue).toBe(100);
    expect(aria.messagesRevenue).toBe(50);
    expect(aria.activeFans).toBe(120);

    // Chloe has no fan report row -> activeFans is null (NOT silently 0)
    expect(chloe.totalEarningsGross).toBe(50);
    expect(chloe.tipsRevenue).toBe(50);
    expect(chloe.activeFans).toBeNull();
  });

  it('computes verified chatter sales, unlock rate, golden ratio, and avg PPV value', async () => {
    const res = await chattersService.getChattersList({
      startDate: '2026-11-01',
      endDate: '2026-11-15',
    });

    const alex = res.items.find((e) => e.employeeId === 901)!;
    expect(alex.totalSales).toBe(90);
    expect(alex.ppvSales).toBe(60);
    expect(alex.tipsSales).toBe(30);
    // Unlock rate: 4 unlocked / 20 sent = 20%
    expect(alex.unlockRate).toBe(20);
    // Golden ratio: 20 PPVs / 100 DMs = 20%
    expect(alex.goldenRatio).toBe(20);
    // Average PPV sale value: $60 / 4 unlocked = $15.00
    expect(alex.averagePpvSaleValue).toBe(15);
  });

  it('computes tracking-link conversion rate and explicitly marks promotion cost & ROI as unavailable', async () => {
    const res = await trackingLinksService.getTrackingLinksAnalytics({
      startDate: '2026-11-01',
      endDate: '2026-11-15',
    });

    // Tracking clicks = 200, tracking subscribers = 25 -> CVR = 25 / 200 * 100 = 12.5%
    expect(res.summary.totalClicks).toBe(200);
    expect(res.summary.trackingSubscribers).toBe(25);
    expect(res.summary.trackingConversionRate).toBe(12.5);
    // Total new subscribers across TRACKING (25) + TRIAL (10) = 35
    expect(res.summary.totalNewSubscribers).toBe(35);
    // Total Gross Revenue = $450 + $100 = $550.00
    expect(res.summary.totalGrossRevenue).toBe(550);
    expect(res.summary.totalNetRevenue).toBe(440);
    // Promotion cost is not exposed in Infloww API -> must be null, never 0
    expect(res.summary.promotionCostAvailable).toBe(false);
    expect(res.summary.costPerSubscriber).toBeNull();
    expect(res.summary.roiPercentage).toBeNull();
  });
});
