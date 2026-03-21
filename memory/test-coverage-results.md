---
name: Test Coverage Results 2026-03-21
description: Backend test coverage results showing 88% line coverage but 74.64% branch coverage below 80% threshold
type: reference
---

## Test Coverage Results - 2026-03-21

**Test Suite**: Backend (Jest)
**Date**: 2026-03-21

### Overall Coverage

| Metric | Coverage | Threshold | Status |
|--------|----------|-----------|--------|
| Statements | 88.38% | 80% | PASS |
| Branches | 74.64% | 80% | FAIL |
| Functions | 84.44% | 80% | PASS |
| Lines | 88.02% | 80% | PASS |

### Coverage by File

| File | Statements | Branches | Functions | Lines | Uncovered Lines |
|------|------------|----------|-----------|-------|-----------------|
| alarmController.ts | 52.94% | 50% | 33.33% | 52.94% | 24-30, 36-39 |
| deviceController.ts | 97.77% | 80% | 90.9% | 97.77% | 19 |
| statsController.ts | 57.89% | 37.5% | 66.66% | 57.89% | 22-29, 35-43 |
| alarmRoutes.ts | 100% | 100% | 100% | 100% | - |
| deviceRoutes.ts | 100% | 100% | 100% | 100% | - |
| statsRoutes.ts | 100% | 100% | 100% | 100% | - |
| services/index.ts | 100% | 100% | 100% | 100% | - |
| services/alarm/index.ts | 100% | 94.11% | 100% | 100% | 14 |
| services/stats/index.ts | 100% | 93.75% | 100% | 100% | 57 |
| utils/database.ts | 100% | 50% | 100% | 100% | 5 |
| utils/errors.ts | 100% | 80% | 100% | 100% | 27 |
| utils/index.ts | 100% | 100% | 100% | 100% | - |
| utils/redis.ts | 64.7% | 66.66% | 50% | 64.7% | 10-14, 19, 23 |
| utils/response.ts | 100% | 100% | 100% | 100% | - |

### Action Items

1. **alarmController.ts** - Add tests for acknowledgeAlarmHandler and resolveAlarmHandler (lines 24-39)
2. **statsController.ts** - Add tests for getOverviewStatsHandler and getTrendDataHandler (lines 22-43)
3. **utils/redis.ts** - Add tests for Redis utility functions (lines 10-23)

### Test Results Summary

- Test Suites: 9 passed, 9 total
- Tests: 75 passed, 75 total
- Duration: 2.717s
