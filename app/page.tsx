'use client';
/**
 * Login page = the upstream `demo.tsx` for the modern-animated-sign-in block,
 * wired to the real backend:
 * - submit → Firebase email sign-in (+ ensureUser) → /dashboard
 * - Google button → Firebase signInWithPopup (server-verified)
 * - forgot password → /forgot-password
 * Role chips were intentionally dropped (user decision): first-time
 * sign-ins default to the library's "Parent" role; existing users keep
 * their stored role.
 */
import { useState, ChangeEvent, FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { Ripple, AuthTabs, TechOrbitDisplay } from '@/components/ui/modern-animated-sign-in';
import { auth } from '@/lib/firebase';
import { ensureUser } from '@/lib/data';

type FormData = {
  email: string;
  password: string;
};

interface OrbitIcon {
  component: () => ReactNode;
  className: string;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
  reverse?: boolean;
}

const iconsArray: OrbitIcon[] = [
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.21st.dev/assets/mirror/34/34826e5b3315daadf4fa15f723a3c1d5ba4a89277bfd94e22ac4d7d3d54338c5.svg'
        alt='HTML5'
        unoptimized
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    duration: 20,
    delay: 20,
    radius: 100,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.21st.dev/assets/mirror/36/36b7d94b657d571d3f94042acbf6a4c86a5301a222f83f4b4583ad2acf6e297d.svg'
        alt='CSS3'
        unoptimized
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    duration: 20,
    delay: 10,
    radius: 100,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.21st.dev/assets/mirror/c9/c9191199f4049920c2fc19035b8a6664f37f4689fcd9e8434e786097e78863f0.svg'
        alt='TypeScript'
        unoptimized
      />
    ),
    className: 'size-[50px] border-none bg-transparent',
    radius: 210,
    duration: 20,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.21st.dev/assets/mirror/06/0656ff65fc8eeacda5c78d7f9ffe91ec1eb919db64f56e0b7dcd460af4bbd36c.svg'
        alt='JavaScript'
        unoptimized
      />
    ),
    className: 'size-[50px] border-none bg-transparent',
    radius: 210,
    duration: 20,
    delay: 20,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.21st.dev/assets/mirror/f8/f8cec54589553807eb603bcaf4e056aa090196211698b056542e3cc62a2f3448.svg'
        alt='TailwindCSS'
        unoptimized
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    duration: 20,
    delay: 20,
    radius: 150,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.21st.dev/assets/mirror/d9/d9435c4ede7133b376c0173a80226bb3856729366707cd96e9a66e39448d0288.svg'
        alt='Nextjs'
        unoptimized
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    duration: 20,
    delay: 10,
    radius: 150,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.21st.dev/assets/mirror/58/5825b649c8c04dec13ecf01d0182401bd0ec71789d2fa06224866d882cd1515f.svg'
        alt='React'
        unoptimized
      />
    ),
    className: 'size-[50px] border-none bg-transparent',
    radius: 270,
    duration: 20,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.21st.dev/assets/mirror/d3/d37c2bf1a1d4f10aeffb224e44da672cb8b9510f6e5a2e24b61758262995805e.svg'
        alt='Figma'
        unoptimized
      />
    ),
    className: 'size-[50px] border-none bg-transparent',
    radius: 270,
    duration: 20,
    delay: 60,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.21st.dev/assets/mirror/71/717a57ea97bf7e86de721dab3e68afac66332a10676d5c9abce4ae6a5a9c9983.svg'
        alt='Git'
        unoptimized
      />
    ),
    className: 'size-[50px] border-none bg-transparent',
    radius: 320,
    duration: 20,
    delay: 20,
    path: false,
    reverse: false,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const goToForgotPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    router.push('/forgot-password');
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>, name: keyof FormData) => {
    const value = event.target.value;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  function mapAuthError(code?: string): string {
    if (code === 'auth/invalid-credential') return 'Invalid email or password.';
    if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
    if (code === 'auth/user-disabled') return 'This account has been disabled.';
    if (code === 'auth/too-many-requests') return 'Too many failed attempts. Please try again later.';
    if (code === 'auth/operation-not-allowed') return 'Google sign-in is not enabled for this project.';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return '';
    if (code === 'auth/unauthorized-domain') return 'This domain is not authorized for Google sign-in.';
    return 'Sign-in failed. Please try again.';
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!auth) {
      setError('Authentication service unavailable. Please try again.');
      return;
    }
    setLoading(true);
    try {
      const email = formData.email.trim();
      await signInWithEmailAndPassword(auth, email, formData.password);
      await ensureUser(email); // first-time users default to the library role
      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setError(mapAuthError(code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    if (!auth) {
      setError('Authentication service unavailable. Please try again.');
      return;
    }
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const email = result.user.email;
      if (!email) throw { code: 'auth/user-not-found' };
      await ensureUser(email);
      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setError(mapAuthError(code));
    } finally {
      setLoading(false);
    }
  };

  const formFields = {
    header: 'Welcome back',
    subHeader: 'Sign in to your account',
    errorField: error || undefined,
    fields: [
      {
        label: 'Email',
        required: true,
        type: 'email' as const,
        placeholder: 'Enter your email address',
        onChange: (event: ChangeEvent<HTMLInputElement>) => handleInputChange(event, 'email'),
      },
      {
        label: 'Password',
        required: true,
        type: 'password' as const,
        placeholder: 'Enter your password',
        onChange: (event: ChangeEvent<HTMLInputElement>) => handleInputChange(event, 'password'),
      },
    ],
    submitButton: loading ? 'Signing in…' : 'Sign in',
    textVariantButton: 'Forgot password?',
  };

  return (
    <main className='flex max-lg:justify-center bg-white text-foreground'>
      {/* Left Side */}
      <span className='relative flex flex-col justify-center w-1/2 max-lg:hidden overflow-hidden'>
        <Ripple mainCircleSize={100} />
        <TechOrbitDisplay iconsArray={iconsArray} />
      </span>

      {/* Right Side */}
      <span className='w-1/2 h-[100dvh] flex flex-col justify-center items-center max-lg:w-full max-lg:px-[10%]'>
        <AuthTabs
          formFields={formFields}
          goTo={goToForgotPassword}
          handleSubmit={handleSubmit}
          onGoogleClick={handleGoogleSignIn}
        />
      </span>
    </main>
  );
}
