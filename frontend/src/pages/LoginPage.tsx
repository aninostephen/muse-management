import { type FormEvent, useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import {
  BarChart3,
  KeyRound,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from '../providers/RouterProvider';
import { useThemeMode } from '../providers/ThemeProvider';

export function LoginPage() {
  const { login } = useAuth();
  const { navigate } = useRouter();
  const { mode, toggleMode } = useThemeMode();

  const [email, setEmail] = useState('admin@musemanagement.com');
  const [password, setPassword] = useState('Admin@123');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: email.trim(),
        password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to authenticate. Please check your credentials and ensure the backend server is running.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@musemanagement.com');
    setPassword('Admin@123');
    setErrorMessage(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px',
        background:
          mode === 'dark'
            ? 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 45%), #0b0f19'
            : 'radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 45%), #f8fafc',
      }}
    >
      {/* Top Bar */}
      <Stack
        direction="horizontal"
        justify="between"
        align="center"
        width="100%"
      >
        <Stack direction="horizontal" gap={2} align="center">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              color: '#ffffff',
            }}
          >
            <BarChart3 size={20} />
          </div>
          <Stack direction="vertical" gap={0}>
            <Heading level={3}>Muse Management</Heading>
            <Text type="supporting">Infloww Agency Analytics Platform</Text>
          </Stack>
        </Stack>

        <Button
          label={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
          variant="ghost"
          size="sm"
          icon={mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          onClick={toggleMode}
        />
      </Stack>

      {/* Center Login Card */}
      <Stack
        direction="vertical"
        align="center"
        justify="center"
        width="100%"
        paddingBlock={6}
      >
        <Card width="100%" maxWidth={440} padding={6} elevation="med">
          <form onSubmit={handleSubmit}>
            <Stack direction="vertical" gap={4}>
              {/* Header */}
              <Stack direction="vertical" gap={1.5}>
                <Stack
                  direction="horizontal"
                  justify="between"
                  align="center"
                >
                  <Badge
                    variant="info"
                    label="JWT Protected"
                    icon={<ShieldCheck size={13} />}
                  />
                  <Badge variant="neutral" label="Infloww OpenAPI v1.4" />
                </Stack>
                <Heading level={1}>Agency Portal Sign In</Heading>
                <Text type="supporting">
                  Authenticate with your agency administrator credentials to
                  access real-time creator, chatter, revenue, and tracking-link
                  analytics.
                </Text>
              </Stack>

              {/* Error Banner */}
              {errorMessage && (
                <Banner
                  status="error"
                  title="Authentication Failed"
                  description={errorMessage}
                  isDismissable
                  onDismiss={() => setErrorMessage(null)}
                />
              )}

              {/* Form Fields */}
              <Stack direction="vertical" gap={3}>
                <TextInput
                  label="Administrator Email"
                  type="email"
                  value={email}
                  onChange={(val) => setEmail(val)}
                  placeholder="admin@musemanagement.com"
                  isRequired
                  width="100%"
                  startIcon={<Mail size={16} />}
                  autoComplete="email"
                  onEnter={() => void handleSubmit()}
                />

                <TextInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(val) => setPassword(val)}
                  placeholder="Enter your password"
                  isRequired
                  width="100%"
                  startIcon={<Lock size={16} />}
                  autoComplete="current-password"
                  onEnter={() => void handleSubmit()}
                />
              </Stack>

              {/* Submit Button */}
              <Button
                label="Sign In to Dashboard"
                type="submit"
                variant="primary"
                size="lg"
                width="100%"
                isLoading={isSubmitting}
                icon={<KeyRound size={16} />}
              />

              <Divider label="Demo Credentials" />

              {/* Demo Quick-Fill Card */}
              <Card variant="muted" padding={3}>
                <Stack direction="vertical" gap={2}>
                  <Stack
                    direction="horizontal"
                    justify="between"
                    align="center"
                  >
                    <Stack direction="vertical" gap={0.5}>
                      <Text type="label" weight="semibold">
                        Default Agency Admin
                      </Text>
                      <Text type="code">admin@musemanagement.com</Text>
                      <Text type="supporting">Password: Admin@123</Text>
                    </Stack>
                    <Button
                      label="Auto-Fill"
                      variant="secondary"
                      size="sm"
                      icon={<Sparkles size={14} />}
                      onClick={handleFillDemo}
                    />
                  </Stack>
                </Stack>
              </Card>
            </Stack>
          </form>
        </Card>
      </Stack>

      {/* Footer Guardrail Note */}
      <Stack direction="horizontal" justify="center" align="center">
        <Text type="supporting">
          Strictly Read-Only Infloww API Integration • Zero Credentials Exposed
          to Client
        </Text>
      </Stack>
    </div>
  );
}
