import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import ReportDownloadPage from '../page';
import '@testing-library/jest-dom';

// Mock next/navigation
const mockUseParams = vi.fn(() => ({
  tenantKey: 'test-tenant',
  reportName: 'test-report',
}));

vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
}));

// Mock the iblai web-containers module
vi.mock('@iblai/iblai-js/web-containers', () => ({
  AnalyticsReportDownload: vi.fn(({ platform_key, report_name }) => (
    <div data-testid="analytics-report-download">
      <span data-testid="platform-key">{platform_key}</span>
      <span data-testid="report-name">{report_name}</span>
    </div>
  )),
}));

describe('ReportDownloadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({
      tenantKey: 'test-tenant',
      reportName: 'test-report',
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<ReportDownloadPage />);
    expect(container).toBeTruthy();
  });

  it('renders the AnalyticsReportDownload component', () => {
    const { getByTestId } = render(<ReportDownloadPage />);
    expect(getByTestId('analytics-report-download')).toBeInTheDocument();
  });

  it('passes tenantKey as platform_key from route params', () => {
    const { getByTestId } = render(<ReportDownloadPage />);
    expect(getByTestId('platform-key')).toHaveTextContent('test-tenant');
  });

  it('passes reportName as report_name from route params', () => {
    const { getByTestId } = render(<ReportDownloadPage />);
    expect(getByTestId('report-name')).toHaveTextContent('test-report');
  });

  it('passes different tenantKey and reportName from params', () => {
    mockUseParams.mockReturnValue({
      tenantKey: 'acme-corp',
      reportName: 'monthly-sales',
    });

    const { getByTestId } = render(<ReportDownloadPage />);
    expect(getByTestId('platform-key')).toHaveTextContent('acme-corp');
    expect(getByTestId('report-name')).toHaveTextContent('monthly-sales');
  });

  it('renders wrapper div with correct classes', () => {
    const { container } = render(<ReportDownloadPage />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('h-full', 'overflow-hidden');
  });
});
