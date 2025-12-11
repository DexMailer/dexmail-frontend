'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEvmAddress, useIsSignedIn, useSignInWithEmail, useVerifyEmailOTP, useSignOut } from "@coinbase/cdp-hooks";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, loginWithWallet } = useAuth();
  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { signOut } = useSignOut();
  const {
    address,
    isConnected,
    isConnecting,
    isSigning,
    isAuthenticating,
    connectWallet,
    disconnect,
    signMessage
  } = useWallet();

  const [useWalletAuth, setUseWalletAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authComplete, setAuthComplete] = useState(false);
  const [error, setError] = useState('');

  // Coinbase embedded wallet states
  const [embeddedEmail, setEmbeddedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpFlowId, setOtpFlowId] = useState<string | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isFinishingEmbedded, setIsFinishingEmbedded] = useState(false);
  const [embeddedComplete, setEmbeddedComplete] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');

  const handleWalletConnect = async () => {
    try {
      setError('');
      await connectWallet();
    } catch (error) {
      setError('Failed to connect wallet');
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleWalletAuth = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setError('');

      // Get challenge from auth service
      const challenge = await authService.getChallenge(email);

      // Sign the challenge
      const signature = await signMessage(challenge.nonce);

      // Login with wallet using auth context
      await loginWithWallet(email, address, signature);

      setAuthComplete(true);

      toast({
        title: "Login Successful",
        description: "Welcome back to DexMail!",
      });

      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleTraditionalLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password, undefined, 'traditional');

      toast({
        title: "Login Successful",
        description: "Welcome back to DexMail!",
      });

      router.push('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetWalletConnection = () => {
    disconnect();
    setAuthComplete(false);
    setError('');
  };

  const resetEmbeddedFlow = () => {
    setEmbeddedEmail('');
    setOtpCode('');
    setOtpFlowId(null);
    setIsOtpSent(false);
    setIsSendingOtp(false);
    setIsVerifyingOtp(false);
    setIsFinishingEmbedded(false);
    setEmbeddedComplete(false);
    setError('');
  };

  const handleEmbeddedSignOut = async () => {
    try {
      await signOut();
      resetEmbeddedFlow();
      toast({
        title: "Signed out",
        description: "You can now sign in with a different email.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      setError(message);
      toast({
        title: "Sign out failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleSendOtp = async () => {
    if (!embeddedEmail.trim()) {
      setError('Please enter your email to receive a code');
      return;
    }

    setError('');
    setIsSendingOtp(true);

    try {
      const result = await signInWithEmail({ email: embeddedEmail.trim() });
      setOtpFlowId(result.flowId);
      setIsOtpSent(true);
      setDialogTitle('OTP Sent');
      setDialogDescription('Check your email for the 6-digit code to continue.');
      setDialogOpen(true);
      toast({
        title: "Check your email",
        description: "We sent a 6-digit code to continue.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(message);
      toast({
        title: "OTP send failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpFlowId || !otpCode.trim()) {
      setError('Enter the 6-digit code to continue');
      return;
    }
    setIsVerifyingOtp(true);
    setError('');
    try {
      await verifyEmailOTP({ flowId: otpFlowId, otp: otpCode.trim() });
      setDialogTitle('Email Verified');
      setDialogDescription('Your email is verified. Signing you in...');
      setDialogOpen(true);
      toast({
        title: "Verified",
        description: "Email verified. Signing you in...",
      });
      // Proceed to login
      await handleEmbeddedLogin();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid or expired code';
      setError(message);
      toast({
        title: "Verification failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleEmbeddedLogin = async () => {
    if (!isSignedIn) {
      setError('Please complete the sign-in process first');
      return;
    }
    if (!evmAddress) {
      setError('Wallet address unavailable. Try signing in again.');
      return;
    }

    setIsFinishingEmbedded(true);
    setError('');
    try {
      // Login with embedded wallet - using auth context
      await login(embeddedEmail, evmAddress, evmAddress, 'wallet');
      setEmbeddedComplete(true);
      setDialogTitle('Login Successful');
      setDialogDescription('Welcome back to DexMail! Redirecting you to your inbox.');
      setDialogOpen(true);
      toast({
        title: "Login successful",
        description: "Welcome back to DexMail!",
      });
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to login';
      setError(message);
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsFinishingEmbedded(false);
    }
  };

  return (
    <div className="text-center space-y-8">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            {dialogDescription && (
              <DialogDescription>{dialogDescription}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full" onClick={() => setDialogOpen(false)}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Illustration */}
      <div className="relative h-64 w-full">
        <Image
          src="/illustrations/login.svg"
          alt="Login to DexMail"
          width={320}
          height={320}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {/* Content */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
          Welcome Back
        </h1>
        <p className="text-slate-600 leading-relaxed px-4">
          Sign in to access your secure email and crypto features.
        </p>
      </div>

      {/* Login Form */}
      <div className="space-y-6">
        {/* Wallet Connection Option */}
        <div className="flex items-center space-x-3 justify-start px-1">
          <Checkbox
            id="use-wallet"
            checked={useWalletAuth}
            onCheckedChange={(checked) => {
              setUseWalletAuth(checked as boolean);
              if (!checked) {
                resetWalletConnection();
              } else {
                resetEmbeddedFlow();
              }
              setError('');
            }}
          />
          <Label htmlFor="use-wallet" className="text-sm font-medium text-slate-700">
            Sign in with external wallet instead of Coinbase
          </Label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {!useWalletAuth ? (
            // Coinbase Embedded Wallet Login
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-left">
              {!isSignedIn ? (
                // Step 1: Email input and OTP sending
                <>
                  <div className="space-y-2">
                    <Label htmlFor="embedded-email" className="text-slate-700 font-medium">
                      Email for Coinbase sign-in
                    </Label>
                    <Input
                      id="embedded-email"
                      type="email"
                      placeholder="you@example.com"
                      className="h-12 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-slate-400 text-slate-900 placeholder:text-slate-500"
                      value={embeddedEmail}
                      onChange={(e) => {
                        setEmbeddedEmail(e.target.value);
                        if (error === 'Please enter your email to receive a code') {
                          setError('');
                        }
                      }}
                      disabled={isOtpSent}
                      required
                    />
                    <Button
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || isOtpSent || !embeddedEmail.trim()}
                      className="w-full h-11 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-full"
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending code...
                        </>
                      ) : (
                        'Send OTP'
                      )}
                    </Button>
                  </div>

                  {/* Step 2: OTP verification */}
                  {isOtpSent && !isSignedIn && (
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="embedded-otp" className="text-slate-700 font-medium">
                        Enter 6-digit code
                      </Label>
                      <Input
                        id="embedded-otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="123456"
                        className="h-12 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-slate-400 text-slate-900 placeholder:text-slate-500"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        required
                      />
                      <Button
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || isFinishingEmbedded}
                        className="w-full h-11 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-full"
                      >
                        {isVerifyingOtp || isFinishingEmbedded ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isVerifyingOtp ? 'Verifying...' : 'Signing in...'}
                          </>
                        ) : (
                          'Verify & Sign In'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : !embeddedComplete ? (
                // Step 3: Signing in (auto-triggered after verification)
                <div className="text-center space-y-3 py-4">
                  <Loader2 className="mx-auto h-10 w-10 text-brand-blue animate-spin" />
                  <p className="text-sm font-medium text-slate-900">
                    Signing you in...
                  </p>
                </div>
              ) : (
                // Step 4: Success message
                <div className="text-center space-y-3">
                  <CheckCircle className="mx-auto h-10 w-10 text-brand-blue" />
                  <p className="text-sm font-medium text-slate-900">
                    Signed in with Coinbase embedded wallet!
                  </p>
                  <p className="text-xs text-slate-600">
                    Redirecting you to your inbox...
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Wallet Signature Authentication
            <div className="space-y-4">
              {!isConnected ? (
                // Wallet Connection
                <div className="text-center space-y-3">
                  <div className="p-6 bg-slate-50 rounded-2xl">
                    <Wallet className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-sm font-medium text-slate-600 mb-4">
                      Connect your wallet to continue
                    </p>
                    <ConnectButton.Custom>
                      {({
                        account,
                        chain,
                        openAccountModal,
                        openChainModal,
                        openConnectModal,
                        authenticationStatus,
                        mounted,
                      }) => {
                        const ready = mounted && authenticationStatus !== 'loading';
                        const connected =
                          ready &&
                          account &&
                          chain &&
                          (!authenticationStatus ||
                            authenticationStatus === 'authenticated');

                        return (
                          <Button
                            onClick={connected ? openAccountModal : openConnectModal}
                            disabled={!ready}
                            className="w-full h-12 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-full"
                          >
                            {!ready ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                              </>
                            ) : connected ? (
                              'Wallet Connected'
                            ) : (
                              'Connect Wallet'
                            )}
                          </Button>
                        );
                      }}
                    </ConnectButton.Custom>
                  </div>
                </div>
              ) : !authComplete ? (
                // Signature Authentication
                <div className="space-y-4">
                  <div className="text-center space-y-3">
                    <div className="p-6 bg-brand-blue/10 rounded-2xl">
                      <CheckCircle className="mx-auto h-8 w-8 text-brand-blue mb-3" />
                      <p className="text-sm font-medium text-slate-900 mb-2">
                        Wallet Connected
                      </p>
                      <p className="text-xs text-slate-600 mb-4">
                        Address: {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                    </div>
                  </div>

                  {/* Email field for external wallet */}
                  <div className="text-left space-y-2">
                    <Label htmlFor="wallet-email" className="text-slate-700 font-medium">
                      DexMail Email Address
                    </Label>
                    <Input
                      id="wallet-email"
                      type="email"
                      placeholder="your-email@dexmail.app"
                      className="h-12 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-slate-400 text-slate-900 placeholder:text-slate-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    onClick={handleWalletAuth}
                    disabled={isSigning || isAuthenticating || !email.trim() || !email.endsWith('@dexmail.app')}
                    className="w-full h-12 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-full"
                  >
                    {isSigning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing...
                      </>
                    ) : isAuthenticating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign to Login'
                    )}
                  </Button>
                  {(!email.trim() || (email.trim() && !email.endsWith('@dexmail.app'))) && (
                    <p className="text-xs text-amber-600 mt-2">
                      {!email.trim()
                        ? "Please enter your email address first"
                        : "Email must end with @dexmail.app"}
                    </p>
                  )}
                </div>
              ) : (
                // Authentication Complete
                <div className="text-center space-y-4">
                  <div className="p-6 bg-brand-blue/10 rounded-2xl">
                    <CheckCircle className="mx-auto h-12 w-12 text-brand-blue mb-4" />
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      Signed In Successfully!
                    </p>
                    <p className="text-xs text-slate-600 mb-3">
                      Authenticated with wallet signature
                    </p>
                    <div className="bg-slate-100 p-2 rounded-lg space-y-1">
                      <p className="text-xs text-slate-500">
                        Email: <span className="font-mono">{email}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Wallet: <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!useWalletAuth && (
          <div className="space-y-4">
            <Button
              onClick={handleTraditionalLogin}
              disabled={isLoading}
              className="w-full h-12 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-brand-blue hover:text-brand-blue-hover font-medium">
                Sign up
              </Link>
            </div>
          </div>
        )}

        {/* Sign up link */}
        {!authComplete && !embeddedComplete && (
          <div className="text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-blue hover:text-brand-blue-hover font-medium">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}