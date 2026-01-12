# Autonomous Optimization Architecture

## Automation Levels

System oferuje **trzy poziomy autonomii** - możesz wybrać jak bardzo AI ma być samodzielny:

### Level 1: FULL AUTONOMOUS (Recommended)

```yaml
# Config dla Full Auto Mode
autonomous_mode: true
confidence_threshold: 0.85  # AI wykonuje akcje jeśli confidence > 85%

# Human approval required tylko dla:
human_approval_required:
  - budget_change_percentage > 20%
  - new_campaign_creation: true
  - pause_campaign_if_daily_spend > 5000
  - major_strategy_change: true

# Limity bezpieczeństwa:
guardrails:
  max_daily_adjustments: 50
  max_budget_reallocation_per_day: 30%
  max_single_budget_increase: 50%
  min_campaign_runtime_before_pause: 72h  # 3 days

# Alert thresholds:
alerts:
  roas_drop_percentage: 20
  cpa_increase_percentage: 25
  zero_conversions_hours: 48
```

**Manager widzi:**
- ✅ Post-factum report: co AI zrobił
- ⚠️ Approval requests: high-impact actions wymagające zgody
- 🔔 Real-time alerts: trendy i anomalie
- 📊 Big picture: overall performance

**Manager interweniuje tylko gdy:**
- AI prosi o approval (duże zmiany >20% budżetu)
- Coś wymaga strategic decision (nowa strategia kampanii)
- Weekly strategy review (co wtorek, 30 min)

**Typowy dzień managera:**
```
09:00 - Check dashboard (5 min)
        ✅ AI zrobił 12 akcji overnight
        ✅ 2 kampanie paused (low ROAS)
        ✅ 3 budgets increased (winners)
        ✅ Overall ROAS: 3.4x → 3.6x ⬆️

10:30 - Approve major change (2 min)
        ⚠️ AI wants to increase TikTok budget by 40%
        Review reasoning → Click "Approve"

14:00 - Review alert (3 min)
        🔴 Meta competition increased
        AI already adjusted bids
        Just monitoring

18:00 - Quick check (2 min)
        All green, AI handling everything
```

**Time investment: 15-20 min/dzień**

---

### Level 2: SEMI-AUTONOMOUS

```yaml
autonomous_mode: partial

# Human approval required dla KAŻDEJ akcji:
human_approval_required:
  - all_budget_changes: true
  - all_campaign_status_changes: true
  - all_bid_adjustments: true
  - all_targeting_changes: true

# AI proponuje, manager zatwierdza
approval_timeout: 4h  # Auto-reject po 4h
```

**Manager widzi:**
- 📋 Queue of pending approvals
- 🤖 AI recommendations z reasoning
- ⏰ Priority ranking (urgent first)

**Typowy dzień:**
```
09:00 - Review 15 AI recommendations (30 min)
        Click Approve/Reject for each

14:00 - Check new recommendations (20 min)

18:00 - Final review (15 min)
```

**Time investment: 1-2h/dzień**

---

### Level 3: ADVISORY ONLY

```yaml
autonomous_mode: false

# AI tylko analizuje i sugeruje
# Manager wykonuje akcje ręcznie
```

**Manager widzi:**
- 💡 AI suggestions w dashboardzie
- 📊 Analysis reports
- ⚠️ Alerts o problemach

**Manager robi:**
- Wszystko manualnie
- Loguje się do każdej platformy
- Wykonuje zmiany sam

**Time investment: 4-5h/dzień** (niewiele lepiej niż bez narzędzia)

---

## Continuous Monitoring & Autonomous Decision Loop

### System działa 24/7 w pętli:

```python
class AutonomousOptimizationEngine:
    def __init__(self):
        self.claude = ClaudeClient(model="claude-sonnet-4-20250514")
        self.monitoring_interval = 900  # 15 minutes

    async def run_forever(self):
        """Główna pętla - działa non-stop"""

        while True:
            try:
                # === STEP 1: DATA COLLECTION (15 min intervals) ===
                current_metrics = await self.collect_all_platform_data()

                # === STEP 2: AI ANALYSIS ===
                analysis = await self.claude_deep_analysis(current_metrics)

                # === STEP 3: ANOMALY & TREND DETECTION ===
                issues = self.detect_issues(analysis)

                if issues:
                    # === STEP 4: AI DECISION MAKING ===
                    decisions = await self.claude_decide_actions(
                        issues=issues,
                        context=current_metrics,
                        constraints=self.guardrails
                    )

                    # === STEP 5: CONFIDENCE FILTERING ===
                    high_confidence = [
                        d for d in decisions
                        if d['confidence'] >= 0.85
                    ]

                    # === STEP 6: EXECUTION (if Full Auto) ===
                    if self.config.autonomous_mode:
                        for decision in high_confidence:
                            if self.needs_approval(decision):
                                await self.request_approval(decision)
                            else:
                                await self.execute_action(decision)
                                await self.log_action(decision)
                    else:
                        # Semi-Auto or Advisory
                        await self.queue_for_approval(high_confidence)

                    # === STEP 7: NOTIFICATION ===
                    await self.notify_manager(
                        actions_taken=high_confidence,
                        analysis=analysis
                    )

                # === STEP 8: HOURLY OPTIMIZATION ===
                if self.is_hour_mark():
                    await self.run_optimization_cycle()

            except Exception as e:
                await self.alert_on_error(e)

            # === WAIT 15 MINUTES ===
            await asyncio.sleep(self.monitoring_interval)
```

### Co się dzieje w każdym 15-min cycle:

```
00:00 - Fetch data from all platforms
00:02 - Claude analyzes (parallel processing)
00:04 - Detect anomalies & trends
00:06 - Claude decides actions
00:08 - Execute high-confidence actions
00:09 - Update dashboard
00:10 - Send notifications (if needed)
00:12 - Log everything
00:15 - Sleep until next cycle
```

---

## Claude as Decision Engine - Deep Dive

### Decision Making Prompt Template

```python
DECISION_MAKING_PROMPT = """
You are an autonomous marketing budget optimizer with FULL CONTROL over campaigns.
You can pause campaigns, adjust budgets, reallocate spend, and create new campaigns.

Your goal: MAXIMIZE ROI while staying within constraints.

=== CURRENT STATE ===
{current_metrics_json}

=== HISTORICAL CONTEXT (7 days) ===
{historical_trends}

=== CONSTRAINTS ===
- Total daily budget: ${total_budget}
- Min ROAS target: {min_roas}
- Max single campaign budget: ${max_campaign_budget}
- Cannot pause campaigns with spend < {min_runtime_hours}h

=== YOUR DECISION FRAMEWORK ===

**CRITICAL ACTIONS (Confidence > 0.90):**
1. PAUSE campaign if:
   - ROAS < 1.5 for 3+ consecutive days
   - Zero conversions for 48+ hours
   - CPA > target by 50%+

2. REDUCE BUDGET by 30-50% if:
   - ROAS 1.5-2.0 with declining trend
   - CPA > target by 25-50%
   - Ad fatigue signals (CTR dropped 30%+)

**OPPORTUNITY ACTIONS (Confidence > 0.85):**
3. INCREASE BUDGET by 20-40% if:
   - ROAS > 4.0 with stable/rising trend
   - CPA < target by 30%+
   - Impression share < 70% (room to scale)

4. REALLOCATE BUDGET:
   - Move from underperformers to winners
   - Maintain total spend constant
   - Prioritize platforms with highest ROAS

**MONITORING (Confidence 0.70-0.85):**
5. WATCH CLOSELY if:
   - ROAS 2.0-3.0 with volatility
   - Recent changes made (<48h ago)
   - External factors detected (competition, seasonality)

=== OUTPUT FORMAT ===
Return JSON with this EXACT structure:

{
  "timestamp": "ISO-8601",
  "overall_health": "EXCELLENT|GOOD|FAIR|POOR|CRITICAL",
  "immediate_actions": [
    {
      "action_id": "unique-id",
      "platform": "google_ads|meta_ads|tiktok_ads|...",
      "campaign_id": "platform-campaign-id",
      "campaign_name": "Campaign Name",
      "action_type": "PAUSE|REDUCE_BUDGET|INCREASE_BUDGET|REALLOCATE|CREATE",
      "current_state": {
        "budget": 1000,
        "spend_7d": 6800,
        "revenue_7d": 15300,
        "roas_7d": 2.25,
        "trend": "declining"
      },
      "proposed_change": {
        "new_budget": 500,
        "expected_impact": "Save $500/day, redeploy to winners"
      },
      "reasoning": "ROAS declined from 3.2 to 2.25 over 7 days...",
      "confidence": 0.92,
      "risk_level": "LOW|MEDIUM|HIGH",
      "estimated_impact": {
        "daily_savings": 500,
        "daily_opportunity_cost": 50
      }
    }
  ],
  "monitoring_items": [
    {
      "campaign_id": "...",
      "watch_metric": "ROAS|CPA|CTR|...",
      "alert_if": "drops below 2.5",
      "check_frequency": "hourly|4h|daily"
    }
  ],
  "budget_reallocation": {
    "total_moved": 2500,
    "from_campaigns": [
      {"id": "123", "amount": 1500},
      {"id": "124", "amount": 1000}
    ],
    "to_campaigns": [
      {"id": "456", "amount": 1500},
      {"id": "457", "amount": 1000}
    ]
  },
  "expected_outcomes": {
    "new_overall_roas": 3.8,
    "improvement_vs_current": "+15%",
    "daily_profit_increase": 2400
  },
  "risks_and_caveats": [
    "Market volatility may affect outcomes",
    "Competition levels changing"
  ]
}

=== CRITICAL RULES ===
1. NEVER exceed total daily budget
2. NEVER make changes without confidence >= 0.85
3. ALWAYS provide clear reasoning
4. ALWAYS estimate impact
5. PRESERVE winning campaigns - never touch if ROAS > 5.0

NOW ANALYZE AND DECIDE:
"""
```

---

## Manager's Command Center (Cockpit)

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  🎯 MARKETING BUDGET OPTIMIZER - COMMAND CENTER                     │
│  Manager: John Doe | Last refresh: 2 minutes ago | Status: 🟢 ALL OK│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  💰 BUDGET OVERVIEW                                         │   │
│  │  Total Budget:    $50,000/day                               │   │
│  │  Allocated:       $48,500 (97%) ████████████████████░░      │   │
│  │  Spent Today:     $42,150 (84%) ████████████████░░░░░░      │   │
│  │  Reserve:         $1,500 (3%)   █░░░░░░░░░░░░░░░░░░░░       │   │
│  │                                                              │   │
│  │  📈 Performance:  ROAS 3.6x  (Target: 3.0x) ✅              │   │
│  │                   vs yesterday: +8% ⬆️                       │   │
│  │                   vs last week: +15% ⬆️                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🤖 AI ACTIVITY (Last 24 hours)                             │   │
│  │  Actions Taken: 18 ✅                                        │   │
│  │  Pending Approval: 2 ⏳                                      │   │
│  │  Monitoring: 5 campaigns 👁️                                 │   │
│  │                                                              │   │
│  │  Recent Actions:                                             │   │
│  │  • 09:15 - Paused "Meta - Winter Promo" (ROAS 1.3) ✅       │   │
│  │    Saved: $800/day | Confidence: 94%                         │   │
│  │                                                              │   │
│  │  • 10:30 - Increased "TikTok - Viral Ad" by 30% ✅          │   │
│  │    From $1,500 → $1,950 | ROAS: 5.2x                        │   │
│  │                                                              │   │
│  │  • 11:45 - Reallocated $2,500 Google → TikTok ✅            │   │
│  │    Expected impact: +$400/day profit                         │   │
│  │                                                              │   │
│  │  [View All Actions →]                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ⚠️ ALERTS & ATTENTION NEEDED                               │   │
│  │  🔴 HIGH PRIORITY (2)                                        │   │
│  │                                                              │   │
│  │  • Meta "Summer Campaign" - ROAS dropped to 1.8              │   │
│  │    ⏰ AI will pause in 3 hours if no improvement             │   │
│  │    [Override] [Approve Early Pause] [Extend Grace Period]    │   │
│  │                                                              │   │
│  │  • LinkedIn CPC increased 25% (competition spike)            │   │
│  │    AI adjusting bids automatically                           │   │
│  │    Current: $8.50 → $7.20 (optimizing down)                 │   │
│  │    [View Details]                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  💬 CHAT WITH AI (Natural Language Interface)               │   │
│  │  You: Why did you pause the Meta Winter campaign?           │   │
│  │                                                              │   │
│  │  🤖 AI: The Meta "Winter Promo" campaign showed declining   │   │
│  │  performance over 5 consecutive days:                        │   │
│  │  • ROAS dropped from 2.8 to 1.3 (-54%)                      │   │
│  │  • CPA increased from $35 to $68 (+94%)                     │   │
│  │  • Daily spend: $800 with only $1,040 revenue               │   │
│  │                                                              │   │
│  │  I reallocated the $800/day budget to:                       │   │
│  │  • TikTok "Viral Series" (+$500) - ROAS 5.2x                │   │
│  │  • Google "Brand Search" (+$300) - ROAS 4.8x                │   │
│  │                                                              │   │
│  │  Expected improvement: +$2,400/day in profit                 │   │
│  │  Confidence: 94% | Risk: LOW                                 │   │
│  │                                                              │   │
│  │  [Type your question or command...]                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Time Savings - Concrete Numbers

### BEFORE (Traditional Management)

```
Daily Activities:
├─ 08:00-10:00 (2h) - Download reports from 6+ platforms
│                     Google Ads, Meta, TikTok, LinkedIn...
├─ 10:00-11:00 (1h) - Merge data into Excel
│                     Fix formatting, currency conversion
├─ 11:00-12:30 (1.5h) - Analyze performance
│                       Calculate ROAS, ROI, CPA per campaign
├─ 13:00-14:00 (1h) - Make optimization decisions
│                     Which campaigns to pause/scale
├─ 14:00-15:30 (1.5h) - Execute changes across platforms
│                       Log into each platform, adjust budgets
├─ 15:30-16:30 (1h) - Document changes & communicate
│                     Update team, explain decisions
└─ 16:30-17:00 (0.5h) - Monitor for issues

Weekly Additional:
├─ 3h - Detailed performance reports for stakeholders
├─ 2h - Strategy planning meetings
└─ 2h - Troubleshooting issues

TOTAL: 25-30 hours/week (1 full-time position!)
```

### AFTER (With Marketing Budget Optimizer)

```
Daily Activities:
├─ 09:00-09:15 (15min) - Check dashboard
│                        Review AI actions overnight
│                        Approve any pending major changes
├─ 12:00-12:10 (10min) - Midday check
│                        Review alerts if any
└─ 18:00-18:05 (5min) - End of day review
                        Quick status check

Weekly Additional:
├─ 30min - Review AI performance report (auto-generated)
├─ 30min - Strategic planning (with AI insights)
└─ 15min - Stakeholder updates (dashboards auto-shared)

TOTAL: 3-4 hours/week (85-90% reduction!)

Manager can now focus on:
✅ Strategic planning
✅ Creative development
✅ Market research
✅ Team growth
✅ Actually growing the business!
```

### ROI na Time Savings

```
Assuming manager cost: $80,000/year

Time freed: 22 hours/week × 50 weeks = 1,100 hours/year
Value: $80,000 × (1,100 / 2,080) = $42,000/year

Plus:
+ Better decisions (AI analyzes 24/7)
+ Faster reactions (no human delay)
+ Reduced errors (no manual mistakes)
+ Happier manager (less tedious work)

Total value: $50,000-60,000/year in time + quality
```

## Related Documents

- [AI Integration](./03-ai-integration.md) - Prompty i use cases dla Claude
- [Business & ROI](./10-business.md) - Pełny kosztorys
