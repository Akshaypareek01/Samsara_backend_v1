import {
  buildOtpEmailContent,
  buildAlertEmailContent,
  buildActionEmailContent,
  buildAppLaunchResetEmailContent,
  APP_EMAIL_BRAND,
} from '../../../src/utils/emailTemplates.js';

describe('emailTemplates', () => {
  test('uses Samsara Wellness brand orange across OTP emails', () => {
    const { html } = buildOtpEmailContent({ otp: '123456', type: 'login', portal: 'trainer' });

    expect(html).toContain('#ed662e');
    expect(html).toContain('#c95520');
    expect(html).toContain('#fff4ef');
    expect(html).not.toContain('#845EDF');
    expect(html).not.toContain('#6B47C7');
  });

  test('renders brand name in Times with logo and light-mode meta', () => {
    const { html } = buildOtpEmailContent({ otp: '654321', type: 'registration', portal: 'company' });

    expect(html).toContain("font-family:'Times New Roman',Times,serif");
    expect(html).toContain('Samsara Wellness');
    expect(html).toContain('/assets/images/logo.jpeg');
    expect(html).toContain('name="color-scheme" content="light only"');
    expect(html).toContain('name="supported-color-schemes" content="light"');
    expect(html).toContain('@media (prefers-color-scheme: dark)');
    expect(html).toContain('class="email-header"');
    expect(html).toContain('bgcolor="#FFFFFF"');
  });

  test('booking alert emails use brand primary for info tone', () => {
    const { html } = buildAlertEmailContent({
      title: 'Booking confirmed',
      message: 'Your session is confirmed.',
      details: [{ label: 'Reference', value: 'BK-001' }],
      tone: 'info',
    });

    expect(html).toContain('#ed662e');
    expect(html).toContain('Booking confirmed');
  });

  test('action emails include brand colors and light-mode guard', () => {
    const { html } = buildActionEmailContent({ action: 'reset-password', token: 'test-token' });

    expect(html).toContain('#ed662e');
    expect(html).toContain('color-scheme: light only');
  });

  test('app launch email uses unified brand tokens', () => {
    expect(APP_EMAIL_BRAND.primary).toBe('#ed662e');

    const { html } = buildAppLaunchResetEmailContent({ recipientName: 'Alex' });

    expect(html).toContain('#ed662e');
    expect(html).toContain('rgba(237,102,46,0.28)');
    expect(html).not.toContain('#F97316');
  });
});
