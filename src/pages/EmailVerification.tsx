import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle2, XCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EmailVerification() {
  const navigate = useNavigate();
  const { user, refreshRole } = useAuth();
  const { toast } = useToast();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    setUserEmail(user.email || '');
    checkEmailVerification();
  }, [user, navigate]);

  const checkEmailVerification = async () => {
    setIsChecking(true);
    try {
      // Get fresh user data from Supabase
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw error;
      }

      if (currentUser) {
        const verified = !!currentUser.email_confirmed_at;
        setIsVerified(verified);

        if (verified) {
          // Email is verified, refresh role and redirect
          await refreshRole();
          toast({
            title: 'Email Verified!',
            description: 'Your email has been verified successfully.',
          });
          
          // Small delay for user to see the success message
          setTimeout(() => {
            navigate('/profile-completion', { replace: true });
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error('Error checking email verification:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check email verification status',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const resendVerificationEmail = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Verification Email Sent!',
        description: 'Please check your email inbox and spam folder.',
      });
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend verification email',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleContinue = async () => {
    if (isVerified) {
      await refreshRole();
      navigate('/profile-completion', { replace: true });
    } else {
      await checkEmailVerification();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-2">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            {isVerified ? (
              <CheckCircle2 className="w-10 h-10 text-success" />
            ) : isVerified === false ? (
              <XCircle className="w-10 h-10 text-destructive" />
            ) : (
              <Mail className="w-10 h-10 text-primary" />
            )}
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">
              {isVerified 
                ? 'Email Verified!' 
                : isVerified === false 
                ? 'Email Not Verified'
                : 'Verify Your Email'}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isVerified
                ? 'Your email has been successfully verified. Redirecting...'
                : isVerified === false
                ? 'Please verify your email address to continue'
                : 'We sent a verification email to your inbox'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Address Display */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground mb-1">Email Address</p>
            <p className="text-lg font-semibold break-all">{userEmail}</p>
          </div>

          {/* Verification Status */}
          {isVerified !== null && (
            <Alert className={isVerified ? 'bg-success/10 border-success' : 'bg-destructive/10 border-destructive'}>
              <div className="flex items-start gap-3">
                {isVerified ? (
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                )}
                <AlertDescription className={isVerified ? 'text-success' : 'text-destructive'}>
                  {isVerified ? (
                    <div>
                      <p className="font-semibold mb-1">✓ Email Verified Successfully</p>
                      <p className="text-sm">You can now complete your profile and access the system.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold mb-1">✗ Email Not Yet Verified</p>
                      <p className="text-sm">Please click the verification link in your email to continue.</p>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Instructions */}
          {isVerified === false && (
            <div className="space-y-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">What to do next:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>Check your email inbox for a message from us</li>
                <li>Look in your spam/junk folder if you don't see it</li>
                <li>Click the verification link in the email</li>
                <li>Come back here and click "Check Verification Status"</li>
              </ol>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={checkEmailVerification}
              disabled={isChecking || isVerified === true}
              variant={isVerified ? 'outline' : 'default'}
              className="flex-1"
              size="lg"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check Verification Status
                </>
              )}
            </Button>

            {isVerified === false && (
              <Button
                onClick={resendVerificationEmail}
                disabled={isResending}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Email
                  </>
                )}
              </Button>
            )}

            {isVerified && (
              <Button
                onClick={handleContinue}
                className="flex-1"
                size="lg"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={resendVerificationEmail}
                disabled={isResending}
                className="text-primary hover:underline font-medium"
              >
                resend verification email
              </button>
            </p>
          </div>

          {/* Sign Out Option */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/auth');
              }}
              className="text-sm"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

