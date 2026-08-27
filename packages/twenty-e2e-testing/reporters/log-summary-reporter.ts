import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

class LogSummaryReporter implements Reporter {
  private passed: string[] = [];
  private failed: string[] = [];
  private authenticationDuration = 0;
  private testDuration = 0;

  onTestEnd(test: TestCase, result: TestResult): void {
    const name = test.titlePath().join(' › ');
    const projectName = test.parent.project()?.name ?? '';

    if (projectName.startsWith('setup-')) {
      this.authenticationDuration += result.duration;
    } else {
      this.testDuration += result.duration;
    }

    if (result.status === 'passed') {
      this.passed.push(name);
      return;
    }

    if (result.status === 'failed' || result.status === 'timedOut') {
      this.failed.push(name);
    }
  }

  onEnd(): void {
    const passedSet = new Set(this.passed);
    const failedSet = new Set(this.failed);
    const flaky: string[] = [];

    for (const testName of passedSet) {
      if (failedSet.has(testName)) {
        flaky.push(testName);
      }
    }

    const uniquePassed = this.passed.filter(
      (testName) => !flaky.includes(testName),
    );
    const uniqueFailed = this.failed.filter(
      (testName) => !flaky.includes(testName),
    );

    console.log('\n=== Playwright summary ===');
    if (uniquePassed.length) {
      console.log('Passed:');
      uniquePassed.forEach((testName) => console.log(`  ✅ ${testName}`));
    }
    if (uniqueFailed.length) {
      console.log('Failed:');
      uniqueFailed.forEach((testName) => console.log(`  ❌ ${testName}`));
    }
    if (flaky.length) {
      console.log('Flaky:');
      flaky.forEach((testName) => console.log(`  ⚠️  ${testName}`));
    }
    console.log(
      JSON.stringify({
        event: 'mercado-publico-playwright-timings',
        timingsMs: {
          authentication: this.authenticationDuration,
          tests: this.testDuration,
        },
      }),
    );
  }
}

export default LogSummaryReporter;
